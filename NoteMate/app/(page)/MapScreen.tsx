import React, { useState, useRef } from "react";
import MapView, { Marker, Callout } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { View, Text, Dimensions, TouchableOpacity, Image, Linking } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";

const GOOGLE_MAPS_KEY = "AIzaSyBOWUisngh3ZqtyWm8zKfVwUOYVOMouxhI"; // Thay bằng API Key thật

const MapScreen = () => {
  // Nhận params từ router, chú ý image có thể là mảng hoặc chuỗi
  const { lat, lon, name, address, phone, website, image } = useLocalSearchParams() || {};

  const latitude = parseFloat(Array.isArray(lat) ? lat[0] : lat);
  const longitude = parseFloat(Array.isArray(lon) ? lon[0] : lon);

  // Đảm bảo image luôn là chuỗi
  const imageSrc = image ? (Array.isArray(image) ? image[0] : image) : null;

  const [region, setRegion] = useState({
    latitude,
    longitude,
    latitudeDelta: 0.006,
    longitudeDelta: 0.006,
  });

  const mapRef = useRef(null);

  // Vị trí giả định của user (lấy real GPS nếu có)
  const userLocation = { latitude: 21.028511, longitude: 105.804817 };

  // Hàm phóng to thu nhỏ map
  const zoom = (delta) => {
    setRegion((prev) => ({
      ...prev,
      latitudeDelta: Math.max(0.001, prev.latitudeDelta * delta),
      longitudeDelta: Math.max(0.001, prev.longitudeDelta * delta),
    }));
  };

  const openWeb = (url) => {
    if (url) Linking.openURL(url);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f7f7fb" }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsCompass={true}
        provider="google"
      >
        {/* Vẽ route từ user -> marker */}
        {GOOGLE_MAPS_KEY && (
          <MapViewDirections
            origin={userLocation}
            destination={{ latitude, longitude }}
            apikey={GOOGLE_MAPS_KEY}
            strokeWidth={5}
            strokeColor="#276ef1"
            mode="DRIVING"
          />
        )}
        <Marker coordinate={{ latitude, longitude }}>
          <Callout tooltip>
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 16,
                width: 260,
                elevation: 8,
                shadowColor: "#bbb",
              }}
            >
              {/* Hiển thị ảnh nếu có */}
              {imageSrc && (
                <Image
                  source={{ uri: imageSrc }}
                  style={{
                    width: "100%",
                    height: 96,
                    borderRadius: 10,
                    marginBottom: 8,
                    backgroundColor: "#eee",
                  }}
                  resizeMode="cover"
                />
              )}
              <Text
                style={{
                  fontWeight: "bold",
                  color: "#276ef1",
                  fontSize: 16,
                  marginBottom: 4,
                }}
              >
                {name}
              </Text>
              {address && (
                <Text style={{ color: "#444", marginBottom: 4 }}>{address}</Text>
              )}
              {phone && <Text style={{ color: "#ff7b29" }}>SĐT: {phone}</Text>}
              {website && (
                <TouchableOpacity
                  onPress={() => openWeb(website)}
                  style={{ marginTop: 6, alignSelf: "flex-start" }}
                >
                  <Text
                    style={{
                      color: "#4B99F3",
                      textDecorationLine: "underline",
                    }}
                  >
                    Mở website
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Callout>
        </Marker>
      </MapView>

      {/* Nút phóng to/thu nhỏ ở góc phải */}
      <View
        style={{
          position: "absolute",
          right: 12,
          top: 80,
          zIndex: 99,
          backgroundColor: "#fff",
          borderRadius: 10,
          padding: 4,
          elevation: 6,
        }}
      >
        <TouchableOpacity onPress={() => zoom(0.5)} style={{ padding: 7 }}>
          <MaterialIcons name="zoom-in" size={27} color="#2876ee" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => zoom(2)} style={{ padding: 7 }}>
          <MaterialIcons name="zoom-out" size={27} color="#2876ee" />
        </TouchableOpacity>
      </View>
      {/* Nút nhanh chỉ đường sang Google Maps */}
      <TouchableOpacity
        onPress={() =>
          Linking.openURL(
            `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
          )
        }
        style={{
          position: "absolute",
          bottom: 35,
          left: 20,
          right: 20,
          backgroundColor: "#276ef1",
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          elevation: 10,
        }}
      >
        <Ionicons name="navigate" size={22} color="#fff" style={{ marginRight: 8 }} />
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
          Chỉ đường đến {name || "địa điểm này"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default MapScreen;
