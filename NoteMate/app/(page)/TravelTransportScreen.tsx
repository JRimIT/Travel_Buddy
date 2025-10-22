import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { MaterialCommunityIcons, Ionicons, FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import { useDispatch } from "react-redux";
import { setUserFlightBudget, setUserTransportType } from "../../redux/inforUserTravel/inforUserTravelSlice";

const formatMoney = (val) => {
  const v = val.replace(/\D/g, "");
  if (!v) return "";
  return v.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const vehicles = [
  { key: "bike", icon: <Ionicons name="bicycle-outline" size={26} color="#33bc7f" />, label: "Xe máy" },
  { key: "car", icon: <MaterialCommunityIcons name="car" size={26} color="#3b6bb3" />, label: "Ô tô" },
  { key: "other", icon: <FontAwesome name="question" size={25} color="#ea5d4b" />, label: "Khác" },
];



const TravelTransportScreen = () => {
  const [flightBudget, setFlightBudget] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [customVehicle, setCustomVehicle] = useState("");

  const dispatch = useDispatch();

    const goToTripScheduleScreen = () => {
        dispatch(setUserFlightBudget(flightBudget ? formatMoney(flightBudget) : "0"));
        dispatch(setUserTransportType(selectedVehicle === "other" ? customVehicle : selectedVehicle));
    router.push('TripScheduleScreen');
    }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Thông Tin Di Chuyển Chuyến Du Lịch</Text>

      {/* Quỹ tiền máy bay (tùy chọn) */}
      <View style={styles.budgetBox}>
        <MaterialCommunityIcons name="airplane" size={28} color="#2f93e1" style={{ marginRight: 11 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.subLabel}>Quỹ tiền dành mua vé máy bay (nếu có)</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.moneyInput}
              placeholder="Nhập quỹ máy bay hoặc để trống"
              placeholderTextColor="#b8b8b8"
              keyboardType="number-pad"
              value={formatMoney(flightBudget)}
              onChangeText={t => setFlightBudget(t.replace(/\D/g, ""))}
              maxLength={12}
            />
            <Text style={styles.vndSuffix}>VNĐ</Text>
          </View>
        </View>
      </View>

      {/* Chọn phương tiện di chuyển (radio button đẹp) */}
      <Text style={styles.sectionLabel}>Chọn phương tiện di chuyển ở nơi du lịch</Text>
      <View style={styles.vehiclesRow}>
        {vehicles.map(v => (
          <TouchableOpacity
            key={v.key}
            style={[
              styles.vehicleBtn,
              selectedVehicle === v.key && styles.vehicleBtnActive,
            ]}
            onPress={() => { setSelectedVehicle(v.key); if (v.key !== "other") setCustomVehicle(""); }}
            activeOpacity={0.85}
          >
            {v.icon}
            <Text style={styles.vehicleText}>{v.label}</Text>
            {selectedVehicle === v.key && (
              <Ionicons name="checkmark-circle" size={18} color="#2f93e1" style={{ position: "absolute", top: 10, right: 8 }} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Nếu chọn "Khác" - nhập custom phương tiện */}
      {selectedVehicle === "other" && (
        <View style={styles.customBox}>
          <Text style={styles.subLabel}>Nhập phương tiện của bạn:</Text>
          <TextInput
            style={styles.customInput}
            placeholder="Ví dụ: Taxi nội địa, xe bus, xe điện..."
            placeholderTextColor="#bebebe"
            value={customVehicle}
            onChangeText={setCustomVehicle}
            maxLength={30}
          />
        </View>
      )}

      {/* Nút lưu */}
      <TouchableOpacity
        style={[
          styles.submitBtn,
          // Disable nếu phương tiện là "khác" nhưng chưa nhập tên
          (selectedVehicle === "other" && !customVehicle) && { opacity: 0.5 }
        ]}
        disabled={selectedVehicle === "other" && !customVehicle}
        onPress={() => {
          let vehicleShow = vehicles.find(v => v.key === selectedVehicle)?.label || customVehicle;
          if(selectedVehicle === "other") vehicleShow = customVehicle;
          goToTripScheduleScreen();
        }}
      >
        <Text style={styles.submitText}>Lưu thông tin di chuyển</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3fafd", padding: 26 },
  header: {
    fontSize: 22, fontWeight: "bold", color: "#2196f3", alignSelf: "center",
    marginVertical: 34, letterSpacing: 0.5
  },
  budgetBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 17,
    padding: 20,
    marginBottom: 22,
    elevation: 4,
    shadowColor: "#2196f3",
    shadowOpacity: 0.08,
  },
  subLabel: { color: "#12345a", fontSize: 15, fontWeight: "600", marginBottom: 7 },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.3,
    borderColor: "#cfe1ec",
    backgroundColor: "#f6fafd",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "ios" ? 12 : 2,
    marginBottom: 0,
  },
  moneyInput: {
    fontSize: 18,
    color: "#2196f3",
    fontWeight: "bold",
    flex: 1,
    backgroundColor: "transparent",
    paddingVertical: 7,
  },
  vndSuffix: {
    marginLeft: 7,
    color: "#178a4c",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  sectionLabel: {
    fontSize: 15, fontWeight: "600", color: "#3373da", marginTop: 16, marginBottom: 12
  },
  vehiclesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  vehicleBtn: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 19,
    marginHorizontal: 3,
    elevation: 2,
    borderWidth: 2,
    borderColor: "#d3dbe8",
    position: "relative"
  },
  vehicleBtnActive: {
    borderColor: "#3479F6",
    backgroundColor: "#e8f1ff",
    shadowColor: "#4dc5fa",
    elevation: 8,
  },
  vehicleText: { color: "#276ef1", fontWeight: "600", marginTop: 7, fontSize: 15 },
  customBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 13,
    paddingBottom: 5,
    marginBottom: 18,
    marginTop: 2,
    borderWidth: 1.3,
    borderColor: "#e9e9ef",
    elevation: 2,
  },
  customInput: {
    fontSize: 17,
    color: "#e05f49",
    fontWeight: "bold",
    marginTop: 7,
    paddingHorizontal: 5,
    backgroundColor: "#f5f8fa",
    borderRadius: 7,
    height: 36,
  },
  submitBtn: {
    marginTop: 10,
    backgroundColor: "#2196f3",
    padding: 16,
    borderRadius: 19,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#2196f3",
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 17, letterSpacing: 1.1 },
});

export default TravelTransportScreen;
