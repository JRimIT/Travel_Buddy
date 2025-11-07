import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import MapView, { Callout, Marker } from "react-native-maps";
import PROVINCES from "../../store/provinces";
import { useSelector } from "react-redux";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { setUserInforHotel } from "../../redux/inforUserTravel/inforUserTravelSlice";
import { router } from "expo-router";

const GEOAPIFY_KEY =
  process.env.GEOAPIFY_KEY || "2ad8114410b44c76baf6c71f5ab23f3a";

const AddressSelectHotelScreen = () => {
  const userProvince = useSelector(
    (state: any) => state.inforUserTravel.userProvince
  );
//  console.log("userProvince: ", userProvince);
 
  const DEFAULT_REGION = React.useMemo(() => {
    const found = PROVINCES.find((p) => p.name === userProvince.name);
    if (found) {
      return {
        latitude: found.latitude,
        longitude: found.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      };
    }
    return {
      latitude: 16.047079,
      longitude: 108.20623,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    };
  }, [userProvince]);

  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [region, setRegion] = useState(DEFAULT_REGION);
  const dispatch = useDispatch()

  // Fetch hotels by region change
  useEffect(() => {
    fetchHotels(region.latitude, region.longitude);
  }, [region]);

  // Fetch hotels with Geoapify
  async function fetchHotels(latitude, longitude) {
    const url = `https://api.geoapify.com/v2/places?categories=accommodation.hotel,accommodation.guest_house,accommodation.hostel&filter=circle:${longitude},${latitude},2500&limit=30&apiKey=${GEOAPIFY_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    // console.log("Hotel: ", data.features);

    setHotels(data.features || []);
  }

  // Select hotel marker
  const handleMarkerPress = (hotel) => {
    setSelectedHotel(hotel);
  };

  // ZOOM buttons
  const zoom = (delta) => {
    setRegion((prev) => ({
      ...prev,
      latitudeDelta: Math.max(0.001, prev.latitudeDelta * delta),
      longitudeDelta: Math.max(0.001, prev.longitudeDelta * delta),
    }));
  };

  const confirmBtn = () => {
    
    dispatch(setUserInforHotel(selectedHotel.properties))
    router.back()
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chọn khách sạn hoặc nhà nghỉ trên bản đồ</Text>
      <MapView
        style={{ flex: 1, borderRadius: 16 }}
        region={region}
        onRegionChangeComplete={setRegion}
      >
        {hotels.map((hotel, idx) => (
          <Marker
            key={hotel.properties.place_id || idx}
            coordinate={{
              latitude: hotel.properties.lat,
              longitude: hotel.properties.lon,
            }}
            title={hotel.properties.name}
            description={hotel.properties.address_line2}
            onPress={() => handleMarkerPress(hotel)}
            pinColor={
              selectedHotel &&
              selectedHotel.properties.place_id === hotel.properties.place_id
                ? "#3479F6"
                : "#008c54"
            }
          >
            <Callout tooltip>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{hotel.properties.name}</Text>
                <Text style={styles.calloutDesc}>
                  {hotel.properties.address_line2 || "Không có địa chỉ"}
                </Text>
                {/* Nút chỉ đường Google Maps */}
                <TouchableOpacity
                  style={{
                    marginTop: 8,
                    backgroundColor: "#3479F6",
                    borderRadius: 8,
                    padding: 8,
                  }}
                  onPress={() => {
                    const lat = hotel.properties.lat;
                    const lon = hotel.properties.lon;
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
                    Linking.openURL(url);
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    Chỉ đường trên Google Maps
                  </Text>
                </TouchableOpacity>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Nút zoom IN/OUT – Floating buttons dọc */}
      <View style={styles.zoomContainer}>
        <TouchableOpacity
          onPress={() => zoom(0.5)}
          activeOpacity={0.8}
          style={styles.zoomBtn}
        >
          <MaterialIcons name="zoom-in" size={28} color="#3479F6" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => zoom(2)}
          activeOpacity={0.8}
          style={styles.zoomBtn}
        >
          <MaterialIcons name="zoom-out" size={28} color="#3479F6" />
        </TouchableOpacity>
      </View>

      {/* Chi tiết khách sạn đã chọn */}
      {selectedHotel && (
        <View style={styles.infoBox}>
          <Ionicons
            name="business"
            size={40}
            color="#3479F6"
            style={{ marginBottom: 8 }}
          />
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 18,
              color: "#276ef1",
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            {selectedHotel.properties.name || "Không rõ tên"}
          </Text>
          <Text style={{ color: "#444", textAlign: "center", marginBottom: 6 }}>
            {selectedHotel.properties.address_line2 ||
              selectedHotel.properties.formatted}
          </Text>
          {selectedHotel.properties.contact?.phone && (
            <Text
              style={{ color: "#FF7B29", marginBottom: 4, textAlign: "center" }}
            >
              Điện thoại:{" "}
              <Text style={{ fontWeight: "bold" }}>
                {selectedHotel.properties.contact.phone}
              </Text>
            </Text>
          )}
          {selectedHotel.properties.website && (
            <Text
              style={{
                color: "#2366d1",
                marginBottom: 4,
                textAlign: "center",
                textDecorationLine: "underline",
              }}
              onPress={() => Linking.openURL(selectedHotel.properties.website)}
            >
              Trang web khách sạn
            </Text>
          )}
          <Text
            style={{
              color: "#888",
              fontSize: 13,
              textAlign: "center",
              marginTop: 3,
            }}
          >
            Quận/Huyện:{" "}
            {selectedHotel.properties.suburb ||
              selectedHotel.properties.quarter ||
              "-"}
            {" | "}
            Postcode: {selectedHotel.properties.postcode || "-"}
          </Text>
        </View>
      )}

      {/* Nút xác nhận địa chỉ */}
      <TouchableOpacity
        style={styles.confirmBtn}
        disabled={!selectedHotel}
        onPress={() => {
          confirmBtn();
        }}
      >
        <Text style={styles.confirmText}>Xác nhận địa chỉ</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eef4fe", padding: 12 },
  title: {
    fontWeight: "bold",
    fontSize: 19,
    color: "#2266cc",
    marginVertical: 14,
    textAlign: "center",
  },
  infoBox: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#b3bcdf",
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 22,
    shadowOpacity: 0.14,
  },
  confirmBtn: {
    backgroundColor: "#3479F6",
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    width: "100%",
    elevation: 2,
    opacity: 1,
  },
  confirmText: { color: "#fff", fontWeight: "bold", fontSize: 17 },
  calloutContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    width: 200,
    elevation: 5,
  },
  calloutTitle: {
    fontWeight: "bold",
    color: "#2266cc",
  },
  calloutDesc: {
    color: "#444",
    fontSize: 12,
  },
  zoomContainer: {
    position: "absolute",
    bottom: 30,
    right: 22,
    zIndex: 99,
    flexDirection: "column",
    backgroundColor: "transparent",
  },
  zoomBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 7,
  },
});

export default AddressSelectHotelScreen;
