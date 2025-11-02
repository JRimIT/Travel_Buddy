import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  TouchableOpacity,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { setUserInforHotel } from "../../redux/inforUserTravel/inforUserTravelSlice";
import { router } from "expo-router";

const randomPrice = () => 900000 + Math.floor(Math.random() * 11) * 100000;
const GEOAPIFY_KEY = process.env.GEOAPIFY_KEY || "2ad8114410b44c76baf6c71f5ab23f3a";
const category = "accommodation.hotel";

const HotelTab = () => {
  const dispatch = useDispatch();
  const lat = useSelector((state:any) => state.inforUserTravel.userProvince.latitude);
  const lng = useSelector((state:any) => state.inforUserTravel.userProvince.longitude);
  const budget = useSelector((state:any) => state.inforUserTravel.userHotelBudget);
  const selectedHotel = useSelector((state:any) => state.inforUserTravel.userInforHotel);

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useOwnSelect, setUseOwnSelect] = useState(false);

  const hasHotelSelected = selectedHotel && selectedHotel.name;
  const budgetNumber = budget ? parseInt(budget.replace(/\./g, "")) : 0;

  useEffect(() => {
    setLoading(true);
    fetchHotelsWithPrice(lat, lng, category).then((data) => {
      setHotels(data);
      setLoading(false);
    });
  }, [lat, lng, category]);

  const fetchHotelsWithPrice = async (lat, lng, category) => {
    const url = `https://api.geoapify.com/v2/places?categories=${category}&filter=circle:${lng},${lat},2000&limit=12&apiKey=${GEOAPIFY_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.features || []).map((item) => ({
      ...item,
      price: randomPrice(),
    }));
  };
   // Nhấn xác nhận chọn
  const handleConfirmHotel = (hotel) => {
    dispatch(setUserInforHotel(hotel));
    Alert.alert("Đã lưu khách sạn vào lịch trình!");
  };

    // ĐIỀU HƯỚNG ĐẾN MAP ĐỂ TỰ CHỌN
  const goToMap = (properties) => {
    router.push({
      pathname: "MapScreen",
      params: {
        lat: properties.lat,
        lon: properties.lon,
        name: properties.name || properties.formatted,
        address: properties.address_line2 || "",
        phone: properties.contact?.phone || "",
        website: properties.website || "",
      },
    });
  };

  const hotelsFiltered = hotels.filter((h) => budgetNumber && h.price <= budgetNumber);

  // Google Map
  const openGgMap = (properties) => {
    const query = encodeURIComponent(properties.name || properties.formatted || "");
    const latlon = properties.lat && properties.lon
      ? `${properties.lat},${properties.lon}`
      : query;
    const url = `https://www.google.com/maps/search/?api=1&query=${latlon}`;
    Linking.openURL(url);
  };

  // Điều hướng sang MapScreen để tự chọn khách sạn
  const pressSelectBtn = () => {
    if (!useOwnSelect) {
      setUseOwnSelect((prev) => !prev);
      router.push("/AddressSelectHotelScreen");
    } else {
      setUseOwnSelect((prev) => !prev);
    }
  };

  // Đã chọn --> chỉ hiện hotel đã chọn + nút chọn lại
  if (hasHotelSelected) {
    return (
      <ScrollView contentContainerStyle={styles.infoTabBox}>
        <TouchableOpacity
          style={styles.ownSelectBtn}
          onPress={() => {
            Alert.alert(
              "Chọn lại khách sạn",
              "Bạn muốn chọn lại khách sạn khác?",
              [
                { text: "Huỷ", style: "cancel" },
                {
                  text: "Chọn lại",
                  style: "destructive",
                  onPress: () => {
                    dispatch(setUserInforHotel({}));
                    setUseOwnSelect(false);
                  },
                },
              ]
            );
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="reload-circle-outline" size={20} color="#2188ea" />
          <Text style={{ color: "#2188ea", fontWeight: "bold", marginLeft: 8, fontSize: 15 }}>
            Chọn lại khách sạn
          </Text>
        </TouchableOpacity>
        <Text style={styles.sectionHeader}>
          {useOwnSelect
            ? "Bạn đang tự chọn khách sạn, không lọc theo quỹ"
            : "Khách sạn bạn đã chọn"}
        </Text>
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="office-building-marker" size={45} color="#387be5" style={{ marginBottom: 8 }} />
          <Text style={styles.infoCardTitle}>{selectedHotel.name || selectedHotel.formatted}</Text>
          {selectedHotel.address_line2 && <Text style={styles.infoField}>{selectedHotel.address_line2}</Text>}
          <Text style={[styles.infoField, { color: "#21ac35", fontWeight: "bold" }]}>
            Giá phòng: {selectedHotel.price?.toLocaleString()} VNĐ
          </Text>
          {selectedHotel.contact?.phone && (
            <Text style={styles.infoField}>
              <Ionicons name="call" size={15} color="#37b878" /> SĐT:{" "}
              <Text style={{ fontWeight: "bold" }}>{selectedHotel.contact.phone}</Text>
            </Text>
          )}
          {selectedHotel.website && (
            <Text style={styles.infoField}>
              <Ionicons name="earth" size={15} color="#2b88f7" /> Website:{" "}
              <Text style={[styles.boldText, { color: "#247ff7" }]} onPress={() => Linking.openURL(selectedHotel.website)}>
                {selectedHotel.website}
              </Text>
            </Text>
          )}
          <View style={{ flexDirection: "row", marginTop: 12 }}>
            <TouchableOpacity
              style={[styles.choseBtn, { backgroundColor: "#ffe5d4", borderColor: "#e48b26" }]}
              onPress={() => openGgMap(selectedHotel)}
            >
              <Ionicons name="map-outline" size={17} color="#db7a13" />
              <Text style={{ marginLeft: 7, color: "#db7a13", fontWeight: "bold" }}>Xem Google Map</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Chưa chọn: hiển thị hoặc đề xuất theo quỹ, hoặc full, mỗi card có 2 nút (Map/xác nhận)
  return (
    <ScrollView contentContainerStyle={styles.infoTabBox}>
      <TouchableOpacity
        style={styles.ownSelectBtn}
        onPress={pressSelectBtn}
        activeOpacity={0.85}
      >
        <Ionicons
          name={!useOwnSelect ? "hand-left-outline" : "cash-outline"}
          size={20}
          color={!useOwnSelect ? "#15b698" : "#2188ea"}
        />
        <Text style={{
          color: !useOwnSelect ? "#12ad63" : "#2188ea",
          fontWeight: "bold",
          marginLeft: 8,
          fontSize: 15,
        }}>
          {!useOwnSelect
            ? "Tự chọn khách sạn bạn muốn"
            : "Lọc khách sạn theo quỹ"}
        </Text>
      </TouchableOpacity>
      <Text style={styles.sectionHeader}>
        {useOwnSelect
          ? "Bạn đang tự chọn khách sạn, không lọc theo quỹ"
          : budget
            ? `Khách sạn phù hợp với quỹ (${Number(budgetNumber).toLocaleString()} VNĐ)`
            : "Danh sách khách sạn xung quanh"}
      </Text>
      {loading ? (
        <Text style={{ textAlign: "center", color: "#aaa", marginTop: 26 }}>
          Đang tải khách sạn...
        </Text>
      ) : (useOwnSelect ? hotels : (budgetNumber ? hotelsFiltered : hotels)).map((item) => {
        const { properties, price } = item;
        return (
          <View key={properties.place_id} style={styles.infoCard}>
            <MaterialCommunityIcons name="office-building-marker" size={45} color="#387be5" style={{ marginBottom: 8 }} />
            <Text style={styles.infoCardTitle}>{properties.name || properties.formatted}</Text>
            {properties.address_line2 && <Text style={styles.infoField}>{properties.address_line2}</Text>}
            <Text style={[styles.infoField, { color: "#21ac35", fontWeight: "bold" }]}>
              Giá phòng: {price.toLocaleString()} VNĐ
            </Text>
            <View style={{ flexDirection: "row", marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.choseBtn, { backgroundColor: "#fbf1e1", borderColor: "#e0ba73" }]}
                onPress={() => goToMap(properties)}
              >
                <Ionicons name="map-outline" size={17} color="#d99c26" />
                <Text style={{ marginLeft: 7, color: "#dbb13e", fontWeight: "bold" }}>Xem trên bản đồ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.choseBtn, { backgroundColor: "#d1fff0", marginLeft: 8, borderColor: "#16d08d" }]}
                onPress={() => handleConfirmHotel({ ...properties, price })}
              >
                <Ionicons name="checkmark-circle-outline" size={17} color="#14b373" />
                <Text style={{ marginLeft: 7, color: "#14b373", fontWeight: "bold" }}>Xác nhận chọn</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    color: "#2188ea",
    fontSize: 19,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 18,
    letterSpacing: 0.1,
  },
  infoTabBox: {
    flexGrow: 1,
    alignItems: "center",
    backgroundColor: "#f0f6ff",
    padding: 28,
    minHeight: 540,
    justifyContent: "flex-start",
  },
  infoCard: {
    padding: 28,
    borderRadius: 21,
    backgroundColor: "#fff",
    alignItems: "flex-start",
    width: "100%",
    elevation: 7,
    shadowColor: "#91caff",
    shadowOpacity: 0.11,
    borderWidth: 1.2,
    borderColor: "#dae6f9",
    marginBottom: 18,
  },
  infoCardTitle: {
    fontWeight: "bold",
    fontSize: 19,
    color: "#2188ea",
    marginBottom: 6,
  },
  infoField: {
    color: "#446e9b",
    fontSize: 16,
    marginBottom: 5,
    marginTop: 2,
    fontWeight: "500",
  },
  boldText: { fontWeight: "bold" },
  showMapText: {
    marginTop: 7,
    color: "#248aea",
    fontSize: 14,
    fontStyle: "italic",
    opacity: 0.85,
  },
  noHotelBox: {
    alignItems: "center",
    marginTop: 26,
    backgroundColor: "#fff4f4",
    padding: 23,
    borderRadius: 14,
    elevation: 2,
    shadowColor: "#ff5959",
    shadowOpacity: 0.09,
  },
  ownSelectBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    paddingHorizontal: 17,
    paddingVertical: 9,
    backgroundColor: "#e3fbef",
    borderRadius: 19,
    marginBottom: 12,
    marginTop: 3,
    shadowColor: "#2188ea",
    elevation: 1.5,
  },
  choseBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 9,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
});

export default HotelTab;
