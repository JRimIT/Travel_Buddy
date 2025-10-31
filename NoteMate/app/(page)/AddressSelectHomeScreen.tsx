import React, { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Modal, Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { setUserHomeAddress } from "../../redux/inforUserTravel/inforUserTravelSlice";
import { useRouter } from "expo-router";
import MapView, { Marker } from 'react-native-maps';

const GEOAPIFY_KEY = process.env.GEOAPIFY_KEY || "2ad8114410b44c76baf6c71f5ab23f3a";

const AddressSelectHomeScreen = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const hotel = useSelector((state:any) => state.inforUserTravel.userInforHotel);
  const province = useSelector((state:any) => state.inforUserTravel.userProvince);
  const oldHome = useSelector((state:any) => state.inforUserTravel.userHomeAddress);

  const [address, setAddress] = useState(oldHome?.address || "");
  const [lat, setLat] = useState(oldHome?.lat || hotel?.lat || "");
  const [lon, setLon] = useState(oldHome?.lon || hotel?.lon || "");
  const [name, setName] = useState(oldHome?.name || hotel?.name || "");
  const [mapOpen, setMapOpen] = useState(false);
  const [choosingCoord, setChoosingCoord] = useState(
    lat && lon ? { latitude: Number(lat), longitude: Number(lon) }
      : (hotel?.lat && hotel?.lon ? { latitude: Number(hotel.lat), longitude: Number(hotel.lon) } : null)
  );
  const [reverseLoading, setReverseLoading] = useState(false);

  // Map zoom logic
  const [region, setRegion] = useState(() => {
    const defaultLat = province?.latitude || 16.075;
    const defaultLon = province?.longitude || 108.22;
    return {
      latitude: defaultLat,
      longitude: defaultLon,
      latitudeDelta: 0.035,
      longitudeDelta: 0.035,
    };
  });

  const mapRef = useRef(null);

  // Khi chọn vị trí trên bản đồ
  const onMapPress = async (event) => {
    const coordinate = event.nativeEvent.coordinate;
    setChoosingCoord(coordinate);
    setReverseLoading(true);
    try {
      const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${coordinate.latitude}&lon=${coordinate.longitude}&lang=vi&apiKey=${GEOAPIFY_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      const feat = data.features && data.features[0];
      if (feat) {
        setAddress(feat.properties.formatted || "");
        setName(feat.properties.name || feat.properties.address_line1 || "");
        setLat(coordinate.latitude.toString());
        setLon(coordinate.longitude.toString());
      } else {
        setAddress("");
        setName("");
        setLat(coordinate.latitude.toString());
        setLon(coordinate.longitude.toString());
      }
    } catch {
      setAddress("");
      setName("");
      setLat(coordinate.latitude.toString());
      setLon(coordinate.longitude.toString());
    }
    setReverseLoading(false);
    setMapOpen(false);
  };

  const handleSave = () => {
    if (!address && !name) {
      Alert.alert("Bạn cần nhập địa chỉ hoặc chọn trên bản đồ");
      return;
    }
    dispatch(setUserHomeAddress({ address, lat, lon, name }));
    router.push("/BudgetInputScreen");
  };

  // Nút zoom in/out
  const handleZoom = (type) => {
    if (!region) return;
    const ratio = type === "in" ? 0.6 : 1.5; // Zoom logic
    let newLatDelta = region.latitudeDelta * ratio;
    let newLonDelta = region.longitudeDelta * ratio;
    setRegion({
      ...region,
      latitudeDelta: Math.max(0.001, Math.min(newLatDelta, 10)),
      longitudeDelta: Math.max(0.001, Math.min(newLonDelta, 10)),
    });
    // Animate to new region
    mapRef.current?.animateToRegion({
      ...region,
      latitudeDelta: Math.max(0.001, Math.min(newLatDelta, 10)),
      longitudeDelta: Math.max(0.001, Math.min(newLonDelta, 10)),
    }, 350);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Thiết lập nơi ở tại điểm đến</Text>
      <Text style={styles.label}>Địa chỉ nhà/nơi ở</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập địa chỉ nhà hoặc nơi bạn muốn ở"
        value={address}
        onChangeText={setAddress}
        maxLength={80}
      />
      <Text style={styles.label}>Tên nơi ở (nhà/căn hộ/khác)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ví dụ: Nhà dì Hoa, Greenview Homestay..."
        value={name}
        onChangeText={setName}
        maxLength={40}
      />
      <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 12 }}>
        <TouchableOpacity
          style={styles.hotelBtn}
          onPress={() => setMapOpen(true)}
        >
          <Ionicons name="location" size={20} color="#fff" />
          <Text style={{ color: "#fff", marginLeft: 7, fontWeight: "bold" }}>Chọn nhà ở trên bản đồ</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Ionicons name="save" size={18} color="#fff" />
        <Text style={{ color: "#fff", marginLeft: 7, fontWeight: "bold", fontSize: 16 }}>Lưu & Tiếp tục</Text>
      </TouchableOpacity>

      {/* Modal chọn trên bản đồ */}
      <Modal visible={mapOpen} animationType="slide" transparent>
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.16)",
          justifyContent: "center", alignItems: "center"
        }}>
          <View style={{
            backgroundColor: "#fff", borderRadius: 18,
            width: "97%", height: Platform.OS === "ios" ? "65%" : "56%", overflow: "hidden"
          }}>
            <MapView
              style={{ flex: 1 }}
              ref={mapRef}
              region={region}
              onRegionChangeComplete={setRegion}
              initialRegion={region}
              onPress={onMapPress}
            >
              {choosingCoord &&
                <Marker coordinate={choosingCoord} pinColor="#ea4a9a" title="Vị trí đã chọn" />
              }
              {hotel?.lat && hotel?.lon &&
                <Marker coordinate={{ latitude: Number(hotel.lat), longitude: Number(hotel.lon) }}
                  pinColor="#1976d2"
                  title={hotel?.name || "Khách sạn"} />
              }
            </MapView>
            {/* Nút zoom */}
            <View style={{
              position: "absolute", right: 16, top: 14, flexDirection: "column", zIndex: 20
            }}>
              <TouchableOpacity onPress={()=>handleZoom("in")} style={styles.zoomBtn}>
                <Ionicons name="add-circle" size={30} color="#2196f3" />
              </TouchableOpacity>
              <TouchableOpacity onPress={()=>handleZoom("out")} style={styles.zoomBtn}>
                <Ionicons name="remove-circle" size={30} color="#2196f3" />
              </TouchableOpacity>
            </View>
            <View style={{
              flexDirection: "row", justifyContent: "space-between",
              alignItems: "center", padding: 9
            }}>
              <Text style={{ color: "#ea4a9a", fontWeight: "bold" }}>
                Chạm trên bản đồ để chọn vị trí nhà ở!
              </Text>
              <TouchableOpacity onPress={() => setMapOpen(false)}>
                <Ionicons name="close-circle" size={26} color="#888" />
              </TouchableOpacity>
            </View>
            {reverseLoading &&
              <View style={{
                position: "absolute", left: 0, right: 0, top: 0, bottom: 0,
                backgroundColor: "rgba(255,255,255,0.3)", justifyContent: "center", alignItems: "center"
              }}>
                <Ionicons name="sync" size={34} color="#4cb4e1" />
                <Text style={{ color: "#3ba9e7", marginTop: 7 }}>Đang lấy địa chỉ...</Text>
              </View>
            }
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6fcff", padding: 24 },
  header: { fontSize: 22, color: "#1578d4", fontWeight: "bold", marginBottom: 25, alignSelf: "center" },
  label: { fontWeight: "600", color: "#1978f1", marginTop: 9, marginBottom: 5, fontSize: 16 },
  input: { borderWidth: 1.2, borderColor: "#a2d7f7", borderRadius: 11, padding: 10, fontSize: 16, marginBottom: 13, color: "#122052", backgroundColor: "#f2fbff" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#1495ed", padding: 14, borderRadius: 13, marginTop: 27, elevation: 3 },
  hotelBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#43b6ed", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 15, marginRight: 8 },
  zoomBtn: { marginBottom: 11, backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 15, padding: 2 },
});
export default AddressSelectHomeScreen;
