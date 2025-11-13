import React, { useState, useEffect } from "react";
import { View, Text, Button, ImageBackground, StyleSheet, Alert } from "react-native";
import * as Location from "expo-location";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import PROVINCES from "../../store/provinces";
import { useDispatch } from "react-redux";
import { setUserCurrentLocation, setUserProvince } from "../../redux/inforUserTravel/inforUserTravelSlice";

const FormScreen = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selected, setSelected] = useState(PROVINCES[0].code);
  const [bgImage, setBgImage] = useState(PROVINCES[0].image);
  const [userProvinceState, setUserProvinceState] = useState("");
  const dispatch = useDispatch();

  // Lấy tọa độ GPS hiện tại
  const getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Không có quyền vị trí",
          "Vui lòng cấp quyền cho ứng dụng truy cập vị trí trong Cài đặt."
        );
        console.log("Permission Denied:", status);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      console.log("Location received:", location);

      setCurrentLocation(location.coords);

      // Chuyển lat/lon thành địa chỉ (reverse geocode)
      let addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addresses.length > 0) {
        // Ưu tiên city, sau đó region
        setUserProvinceState(
          addresses[0].city ||
            addresses[0].region ||
            addresses[0].subregion ||
            ""
        );
      }
    } catch (err) {
      Alert.alert(
        "Không lấy được vị trí!",
        "Hãy đảm bảo bạn đã bật quyền truy cập vị trí và thiết bị có GPS."
      );
      console.log("Location Error:", err);
    }
  };

  const goToTravelPlanFormScreen = () => {
    // Lưu state vào Redux trước khi chuyển màn
    dispatch(setUserProvince(PROVINCES.find(p => p.code === selected) || ""));
    dispatch(
      setUserCurrentLocation(
        userProvinceState === "Mountain View"
          ? "Da Nang"
          : userProvinceState || "Da Nang"
      )
    );
    router.push("/TravelPlanFormScreen");
  };

  // Đổi background và lưu Redux khi chọn tỉnh/thành hoặc thay đổi vị trí
  useEffect(() => {
    const found = PROVINCES.find(p => p.code === selected);
    setBgImage(found?.image || PROVINCES[0].image);
    dispatch(setUserProvince(found || ""));
    dispatch(
      setUserCurrentLocation(
        userProvinceState === "Mountain View"
          ? "Da Nang"
          : userProvinceState || ""
      )
    );
    console.log("setUserProvince: ", found?.name || "");
    console.log(
      "currentLocation: ",
      userProvinceState === "Mountain View"
        ? "Da Nang"
        : userProvinceState
    );
  }, [selected, userProvinceState, dispatch]);

  return (
    <ImageBackground source={bgImage} style={styles.bg}>
      <View style={styles.overlay}>
        {/* Mục 1: Lấy vị trí hiện tại */}
        <Text style={styles.title}>Vị trí hiện tại</Text>
        {userProvinceState ? (
          <Text style={styles.info}>Đang ở: {userProvinceState}</Text>
        ) : null}

        {currentLocation ? (
          <Text style={styles.info}>
            Latitude: {currentLocation.latitude} | Longitude: {currentLocation.longitude}
          </Text>
        ) : (
          <Button title="Lấy vị trí của tôi" onPress={getLocation} />
        )}

        {/* Mục 2: Chọn địa điểm muốn tới */}
        <Text style={styles.title}>Chọn điểm đến</Text>
        <Picker
          selectedValue={selected}
          style={styles.picker}
          onValueChange={value => setSelected(value)}
        >
          {PROVINCES.map(p => (
            <Picker.Item label={p.name} value={p.code} key={p.code} />
          ))}
        </Picker>

        <Button title="Tiếp tục" onPress={goToTravelPlanFormScreen} />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1, width: "100%", height: "100%", overflow: "hidden" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginVertical: 15,
  },
  info: {
    color: "#fff",
    marginBottom: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 10,
    borderRadius: 10,
    fontSize: 16,
  },
  picker: {
    width: 230,
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.1)", // nền trắng mờ, trong suốt
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    paddingVertical: 5,
    marginBottom: 30,
  },
});

export default FormScreen;
