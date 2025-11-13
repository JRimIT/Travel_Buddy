import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Modal, Alert, 
  FlatList, Dimensions, TextInput, ScrollView
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from "react-redux";
import MapView, { Marker } from 'react-native-maps';
import { setUserPlaygrounds } from "../../redux/inforUserTravel/inforUserTravelSlice";
import { API_URL } from "../../constants/api";
import { router } from "expo-router";

const GEOAPIFY_KEY = process.env.GEOAPIFY_KEY || "2ad8114410b44c76baf6c71f5ab23f3a";
const PAGE_SIZE = 10;

// ✅ Danh mục lọc
const CATEGORIES = [
  { id: "entertainment", name: "Giải trí", icon: "game-controller" },
  { id: "catering.restaurant", name: "Nhà hàng", icon: "restaurant" },
  { id: "leisure.park", name: "Công viên", icon: "leaf" },
  { id: "tourism.attraction", name: "Du lịch", icon: "camera" },
  { id: "commercial.shopping_mall", name: "Mua sắm", icon: "cart" },
  { id: "sport", name: "Thể thao", icon: "fitness" },
];

const PlaygroundTab = () => {
  const dispatch = useDispatch();
  const hotel = useSelector((state: any) => state.inforUserTravel.userInforHotel);
  const home = useSelector((state: any) => state.inforUserTravel.userHomeAddress);
  const playBudget = useSelector((state: any) => state.inforUserTravel.userFunBudget || "0");
  const reduxSelected = useSelector((state: any) => state.inforUserTravel.userPlaygrounds || []);
  const playBudgetNumber = Number((playBudget || "0").toString().replace(/\./g, "")) || 0;

  const baseLocation = home && home.lat && home.lon
    ? { latitude: Number(home.lat), longitude: Number(home.lon), label: home.name || home.address || "Nhà/Bạn chọn" }
    : hotel && hotel.lat && hotel.lon
      ? { latitude: Number(hotel.lat), longitude: Number(hotel.lon), label: hotel.name || hotel.formatted || "Khách sạn" }
      : null;

  const [playgrounds, setPlaygrounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chosen, setChosen] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalPlace, setModalPlace] = useState(null);
  const [aiDetail, setAIDetail] = useState("");
  const [aiLoading, setAILoading] = useState(false);
  const [mapMode, setMapMode] = useState(false);
  const [mapPlace, setMapPlace] = useState(null);
  const [page, setPage] = useState(1);
  const [allLoaded, setAllLoaded] = useState(false);

  // ✅ State tìm kiếm và lọc
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("entertainment");

  useEffect(() => {
    if (baseLocation && baseLocation.latitude && baseLocation.longitude) {
      setPlaygrounds([]);
      setPage(1);
      setAllLoaded(false);
      fetchPOIs(baseLocation.latitude, baseLocation.longitude, 1, true);
    }
  }, [baseLocation?.latitude, baseLocation?.longitude, selectedCategory]);

  useEffect(() => {
    setChosen((reduxSelected || []).map((p) => p._cardKey || p.place_id));
  }, [reduxSelected]);

  const fetchPOIs = async (lat, lon, pageNum, reset = false) => {
    if (reset) setLoading(true);
    const offset = (pageNum - 1) * PAGE_SIZE;
    const url = `https://api.geoapify.com/v2/places?categories=${selectedCategory}&filter=circle:${lon},${lat},4500&limit=${PAGE_SIZE}&offset=${offset}&apiKey=${GEOAPIFY_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const mapped = (data.features || []).map((item, idx) => ({
      ...item,
      image: item.properties?.preview?.source_url || null,
      price: parseInt(item.properties?.entrance_fee || Math.round(Math.random() * 120000 + 20000)),
      distance: getDistance(lat, lon, item.geometry.coordinates[1], item.geometry.coordinates[0]),
      _cardKey: item.properties?.place_id || (item.properties?.name + "-" + (offset + idx))
    }));
    if (mapped.length < PAGE_SIZE) setAllLoaded(true);
    setPlaygrounds(prev => reset ? mapped : [...prev, ...mapped]);
    if (reset) setLoading(false);
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1000) / 1000;
  };

  const toggleSelect = (key, item) => {
    let newChosen = [...chosen];
    let newRedux = reduxSelected ? [...reduxSelected] : [];
    if (!newChosen.includes(key)) {
      newChosen.push(key);
      newRedux.push(item);
    } else {
      newChosen = newChosen.filter(id => id !== key);
      newRedux = newRedux.filter(i => (i._cardKey || i.place_id) !== key);
    }
    setChosen(newChosen);
    dispatch(setUserPlaygrounds(newRedux));
  };

  const selectedPlaygrounds = playgrounds.filter(p => chosen.includes(p._cardKey));
  const totalCost = selectedPlaygrounds.reduce((sum, p) => sum + (p.price || 0), 0);
  const overBudget = playBudgetNumber > 0 && totalCost > playBudgetNumber;

  const openAIModal = async (poi) => {
    setModalPlace(poi);
    setModalVisible(true);
    setAIDetail("");
    setAILoading(true);
    try {
      const res = await fetch(`${API_URL}/AI/playground-details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: poi.properties.name, 
          address: poi.properties.address_line2 || "", 
          city: poi.properties.city || "" 
        }),
      });
      const data = await res.json();
      setAIDetail(data.details || "Không lấy được thông tin AI.");
    } catch {
      setAIDetail("Lỗi gọi AI.");
    } finally {
      setAILoading(false);
    }
  };

  const openMapWithPlace = (poi) => {
    setMapPlace(poi);
    setMapMode(true);
  };

  const handleLoadMore = () => {
    if (!allLoaded && !loading && baseLocation) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPOIs(baseLocation.latitude, baseLocation.longitude, nextPage);
    }
  };

  // ✅ Lọc theo tìm kiếm
  const filteredPlaygrounds = playgrounds.filter(item => 
    item.properties.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderCard = ({ item }) => {
    const { properties: p, image, distance, price, _cardKey } = item;
    const checked = chosen.includes(_cardKey);
    return (
      <View key={_cardKey} style={{
        backgroundColor: "#fffefa",
        borderRadius: 17,
        marginBottom: 18,
        padding: 16,
        shadowColor: "#ff78ca",
        shadowOpacity: 0.13,
        elevation: 2.5,
        borderWidth: checked ? 2 : 1,
        borderColor: checked ? "#ec407a" : "#eee"
      }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {image && <Image source={{ uri: image }} style={{ width: 55, height: 55, borderRadius: 13, marginRight: 11 }} />}
          <View style={{ flex: 1, marginRight: 7 }}>
            <Text style={{ fontSize: 17, fontWeight: "bold", color: "#ea408a" }}>{p.name}</Text>
            <Text numberOfLines={2} style={{ color: "#7d2150" }}>{p.address_line2}</Text>
            <Text style={{ color: "#627" }}>
              <Ionicons name="navigate" size={14} color="#95c" /> {distance} km từ {baseLocation.label || "vị trí"}
            </Text>
            <Text style={{ color: "#f49e1b", fontWeight: "bold" }}>
              <Ionicons name="cash-outline" size={15} color="#f49e1b" /> Vé: {price.toLocaleString()} VNĐ
            </Text>
          </View>
          <TouchableOpacity onPress={() => toggleSelect(_cardKey, item)} style={{
            marginLeft: 3, padding: 3, borderRadius: 11, backgroundColor: checked ? "#e94e94" : "#f5f5f5"
          }}>
            <Ionicons name={checked ? "checkbox" : "square-outline"} color={checked ? "#fff" : "#aaa"} size={26} />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: "row", marginTop: 10, flexWrap: "wrap" }}>
          <TouchableOpacity style={[styles.choseBtn, { backgroundColor: '#f6efff', borderColor: "#7e5cda" }]}
            onPress={() => openAIModal(item)}>
            <Ionicons name="information-circle-outline" size={19} color="#7754db" />
            <Text style={{ marginLeft: 7, color: "#7754db", fontWeight: "bold" }}>Chi tiết AI</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.choseBtn, { backgroundColor: '#e6f6ff', borderColor: "#29b6e9", marginLeft: 8 }]}
            onPress={() => openMapWithPlace(item)}>
            <Ionicons name="map-outline" size={19} color="#29b6e9" />
            <Text style={{ marginLeft: 7, color: "#29b6e9", fontWeight: "bold" }}>Bản đồ</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const ListHeaderComponent = (
    <View style={{ paddingTop: 10, paddingBottom: 3, marginBottom: 2 }}>
      {/* ✅ Thanh tìm kiếm */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: "#e0e0e0",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2
      }}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={{
            flex: 1,
            marginLeft: 10,
            fontSize: 16,
            color: "#333"
          }}
          placeholder="Tìm kiếm địa điểm..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText("")}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* ✅ Danh mục lọc */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 15 }}
        contentContainerStyle={{ paddingRight: 10 }}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 8,
              paddingHorizontal: 14,
              marginRight: 10,
              borderRadius: 20,
              backgroundColor: selectedCategory === cat.id ? "#ec407a" : "#f5f5f5",
              borderWidth: 1,
              borderColor: selectedCategory === cat.id ? "#ec407a" : "#e0e0e0"
            }}
            onPress={() => {
              setSelectedCategory(cat.id);
              setSearchText("");
            }}
          >
            <Ionicons 
              name={cat.icon as any} 
              size={18} 
              color={selectedCategory === cat.id ? "#fff" : "#666"} 
            />
            <Text style={{
              marginLeft: 6,
              fontSize: 14,
              fontWeight: "bold",
              color: selectedCategory === cat.id ? "#fff" : "#666"
            }}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={{ fontSize: 20, fontWeight: "bold", color: "#ec407a", marginBottom: 9 }}>
        Quỹ vui chơi đã đặt: <Text style={{ color: "#1eb183", fontWeight: "bold" }}>{playBudgetNumber.toLocaleString()} VNĐ</Text>
      </Text>
      <Text style={{ color: "#555", marginBottom: 7, fontSize: 14 }}>
        Số điểm đã chọn: {chosen.length} | Tổng chi phí:{" "}
        <Text style={{ fontWeight: "bold", color: (overBudget ? "#e53935" : "#14af59") }}>{totalCost.toLocaleString()} VNĐ</Text>
      </Text>
      {overBudget && (
        <Text style={{ color: "#e53935", fontWeight: "bold", fontSize: 16, marginBottom: 10 }}>
          <Ionicons name="warning" size={17} color="#e53935" /> Tổng chi phí đã vượt quá quỹ!
        </Text>
      )}
      {baseLocation &&
        <Text style={{ fontSize: 15, color: "#376bc6", margin: 7, marginBottom: 2 }}>
          <Ionicons name={home && home.lat ? "home-outline" : "business"} size={16} color="#6599e2" /> Địa điểm lấy cơ sở:{" "}
          <Text style={{ fontWeight: "bold" }}>{baseLocation.label}</Text>
        </Text>
      }
      <TouchableOpacity style={{
        alignSelf: "flex-start", flexDirection: "row", alignItems: "center", marginVertical: 5, backgroundColor: "#e9f6f9",
        borderRadius: 9, paddingVertical: 6, paddingHorizontal: 13, borderColor: "#8ad3e0", borderWidth: 1
      }}
        onPress={() => router.push("/AddressSelectHomeScreen")}
      >
        <Ionicons name="home-outline" size={17} color="#21c0df" />
        <Text style={{ color: "#1895bb", marginLeft: 7, fontWeight: "bold" }}>Thay đổi nơi ở (nhà/khác)</Text>
      </TouchableOpacity>
    </View>
  );

  const ListFooterComponent = (
    !allLoaded &&
    <TouchableOpacity
      style={{
        marginVertical: 8, alignSelf: "center", paddingHorizontal: 44, paddingVertical: 11, borderRadius: 10,
        backgroundColor: "#faf3ff", borderWidth: 1, borderColor: "#d0b0f7",
        flexDirection: "row", alignItems: "center"
      }}
      onPress={handleLoadMore}>
      {loading
        ? <ActivityIndicator size="small" color="#d15dec" />
        : <>
          <Ionicons name="add-circle-outline" size={21} color="#a875ff" />
          <Text style={{ marginLeft: 7, color: "#a875ff", fontWeight: "bold", fontSize: 16 }}>
            Xem thêm
          </Text>
        </>
      }
    </TouchableOpacity>
  );

  if (loading && playgrounds.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafd" }}>
        <ActivityIndicator size="large" color="#ec407a" />
        <Text style={{ marginTop: 10, color: "#666" }}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafd" }}>
      <View style={{
        position: "absolute", right: 15, top: 15, zIndex: 10,
        shadowColor: "#c6a7f9", elevation: 5
      }}>
        <TouchableOpacity
          style={{
            backgroundColor: overBudget ? "#c8c8c8" : "#EC407A",
            borderRadius: 22, paddingHorizontal: 22, paddingVertical: 9,
            flexDirection: "row", alignItems: "center",
            opacity: (overBudget || chosen.length === 0) ? 0.65 : 1
          }}
          onPress={() => {
            if (overBudget) {
              Alert.alert("Vượt quỹ!", "Bạn cần bỏ bớt khu vui chơi để phù hợp quỹ.");
              return;
            }
            if (chosen.length === 0) {
              Alert.alert("Chọn ít nhất 1 địa điểm!");
              return;
            }
            router.push("/TravelTransportScreen");
          }}
          disabled={overBudget || chosen.length === 0}
        >
          <Ionicons name="arrow-forward-circle" size={23} color="#fff" />
          <Text style={{
            color: "#fff",
            fontWeight: "bold",
            marginLeft: 7,
            fontSize: 16
          }}>Tiếp tục</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredPlaygrounds}
        renderItem={renderCard}
        keyExtractor={item => item._cardKey}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ paddingHorizontal: 13, paddingBottom: 110, paddingTop: 66 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: "center" }}>
            <Ionicons name="search-outline" size={60} color="#ccc" />
            <Text style={{ marginTop: 10, fontSize: 16, color: "#999" }}>
              Không tìm thấy địa điểm nào
            </Text>
          </View>
        }
      />

      {/* Modal AI info */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={{ backgroundColor: "rgba(0,0,0,0.16)", flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{
            width: "95%", backgroundColor: "#fff", borderRadius: 22, elevation: 16, maxHeight: "82%", paddingBottom: 7
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", padding: 19, borderBottomWidth: 1, borderColor: "#eee" }}>
              <Ionicons name="sparkles" size={23} color="#ec407a" />
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "#ec407a", marginLeft: 12, flex: 1 }}>
                {modalPlace?.properties?.name || "Chi tiết"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={27} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 18, maxHeight: Dimensions.get("window").height * 0.5 }}>
              {aiLoading
                ? <ActivityIndicator size="large" color="#ec407a" />
                : <Text style={{ fontSize: 16, color: "#2a2a2a", lineHeight: 23 }}>{aiDetail}</Text>}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Map */}
      <Modal visible={mapMode} transparent animationType="slide" onRequestClose={() => setMapMode(false)}>
        <View style={{ backgroundColor: "rgba(0,0,0,0.16)", flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{
            width: "97%", height: "60%", backgroundColor: "#fff", borderRadius: 22, elevation: 12, overflow: 'hidden'
          }}>
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                latitude: home?.lat ? Number(home.lat) : (hotel?.lat ? Number(hotel.lat) : 16.075),
                longitude: home?.lon ? Number(home.lon) : (hotel?.lon ? Number(hotel.lon) : 108.22),
                latitudeDelta: 0.03,
                longitudeDelta: 0.03
              }}>
              {home?.lat && home?.lon && (
                <Marker
                  coordinate={{ latitude: Number(home.lat), longitude: Number(home.lon) }}
                  pinColor="#ea4a9a"
                  title={home?.name || home?.address || "Nhà đã chọn"}
                />
              )}
              {hotel?.lat && hotel?.lon && (
                <Marker
                  coordinate={{ latitude: Number(hotel.lat), longitude: Number(hotel.lon) }}
                  pinColor="#1976d2"
                  title={hotel?.name || hotel?.formatted}
                  description="Khách sạn của bạn"
                />
              )}
              {mapPlace && (
                <Marker
                  coordinate={{
                    latitude: mapPlace.geometry.coordinates[1],
                    longitude: mapPlace.geometry.coordinates[0]
                  }}
                  title={mapPlace.properties.name}
                  pinColor="#70d"
                />
              )}
            </MapView>
            <View style={{ padding: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "#ea408a", fontWeight: "bold" }}>
                {home?.lat && home?.lon
                  ? `${home?.name || "Nhà"} → ${mapPlace?.properties?.name ?? ""}`
                  : `${hotel?.name || "Khách sạn"} → ${mapPlace?.properties?.name ?? ""}`
                }
                {"\n"}
                <Text style={{ color: "#3b327d" }}>Khoảng cách: {
                  mapPlace ? (
                    home?.lat && home?.lon
                      ? getDistance(Number(home.lat), Number(home.lon), mapPlace.geometry.coordinates[1], mapPlace.geometry.coordinates[0])
                      : getDistance(Number(hotel.lat), Number(hotel.lon), mapPlace.geometry.coordinates[1], mapPlace.geometry.coordinates[0])
                  ) : 0
                } km
                </Text>
              </Text>
              <TouchableOpacity onPress={() => setMapMode(false)}>
                <Ionicons name="close-circle" size={25} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  choseBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 9,
    paddingVertical: 7,
    paddingHorizontal: 15,
    minWidth: 85,
  },
});

export default PlaygroundTab;
