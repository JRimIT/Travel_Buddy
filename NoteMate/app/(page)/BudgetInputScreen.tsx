import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSelector, useDispatch } from "react-redux";
import { setUserFunBudget, setUserHotelBudget } from "../../redux/inforUserTravel/inforUserTravelSlice";

const BudgetInputScreen = () => {
  const dispatch = useDispatch();
  const home = useSelector((state:any) => state.inforUserTravel.userHomeAddress);

  const [hotelBudget, setHotelBudget] = useState("");
  const [funBudget, setFunBudget] = useState("");

  // Nếu đã chọn nhà thì ẩn nhập khách sạn, nhập quỹ đi chơi luôn chuyển qua danh sách playgrounds
  const showHotelBudget = !home || !home.address;
  const totalBudget =
    showHotelBudget && hotelBudget && funBudget
      ? Number(hotelBudget.replace(/\D/g, "")) +
        Number(funBudget.replace(/\D/g, ""))
      : funBudget
      ? Number(funBudget.replace(/\D/g, ""))
      : null;

  const formatMoney = (val) => {
    const v = val.replace(/\D/g, "");
    if (!v) return "";
    return v.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleSubmit = () => {
    if (showHotelBudget) {
      dispatch(setUserHotelBudget(hotelBudget ? formatMoney(hotelBudget) : "0"));
    }
    dispatch(setUserFunBudget(funBudget ? formatMoney(funBudget) : "0"));
    router.push(showHotelBudget ? "ChooseHotelScreen" : "ChoosePlayGroundScreen");
    // Nếu đã chọn home, chuyển sang list playground, nếu chưa thì đi chọn khách sạn!
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Nhập Quỹ Chi Tiêu Chuyến Đi</Text>

      {showHotelBudget && (
        <View style={styles.budgetBox}>
          <MaterialCommunityIcons
            name="bed"
            size={26}
            color="#2196f3"
            style={{ marginRight: 10 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.subLabel}>Tiền có thể chi cho khách sạn</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.moneyInput}
                placeholder="Ví dụ: 1.000.000"
                placeholderTextColor="#b8b8b8"
                keyboardType="number-pad"
                value={formatMoney(hotelBudget)}
                onChangeText={(t) => setHotelBudget(t.replace(/\D/g, ""))}
                maxLength={12}
              />
              <Text style={styles.vndSuffix}>VNĐ</Text>
            </View>
          </View>
        </View>
      )}

      {/* Tiền đi chơi */}
      <View style={styles.budgetBox}>
        <Ionicons
          name="happy-outline"
          size={26}
          color="#4dc870"
          style={{ marginRight: 10 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.subLabel}>Tiền dành cho đi chơi, mua sắm</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.moneyInput}
              placeholder="Ví dụ: 1.200.000"
              placeholderTextColor="#b8b8b8"
              keyboardType="number-pad"
              value={formatMoney(funBudget)}
              onChangeText={(t) => setFunBudget(t.replace(/\D/g, ""))}
              maxLength={12}
            />
            <Text style={styles.vndSuffix}>VNĐ</Text>
          </View>
        </View>
      </View>

      {totalBudget !== null && (
        <View style={styles.totalBox}>
          <MaterialCommunityIcons
            name="cash-multiple"
            size={32}
            color="#f4b400"
            style={{ marginBottom: 9 }}
          />
          <Text style={styles.totalLabel}>Tổng quỹ dự kiến</Text>
          <Text style={styles.totalValue}>
            {formatMoney(totalBudget.toString())}{" "}
            <Text style={{ fontSize: 19, color: "#f4b400" }}>VNĐ</Text>
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.submitBtn,
          (showHotelBudget
            ? (!hotelBudget || !funBudget)
            : !funBudget) && { opacity: 0.5 },
        ]}
        disabled={showHotelBudget ? (!hotelBudget || !funBudget) : !funBudget}
        onPress={handleSubmit}
      >
        <Text style={styles.submitText}>Lưu quỹ chi tiêu</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f9ff", padding: 24 },
  header: {
    fontSize: 23,
    fontWeight: "bold",
    color: "#247ff7",
    alignSelf: "center",
    marginVertical: 32,
    letterSpacing: 0.5,
  },
  budgetBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 26,
    elevation: 4,
    shadowColor: "#2b51a9",
    shadowOpacity: 0.09,
  },
  subLabel: {
    color: "#1b2c50",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 7,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.3,
    borderColor: "#dbe4ea",
    backgroundColor: "#f8fafc",
    borderRadius: 13,
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
    paddingVertical: 8,
  },
  vndSuffix: {
    marginLeft: 7,
    color: "#178a4c",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  totalBox: {
    marginVertical: 32,
    backgroundColor: "#fffbea",
    borderRadius: 17,
    alignItems: "center",
    paddingVertical: 21,
    paddingHorizontal: 14,
    elevation: 2,
    shadowColor: "#f4b400",
    shadowOpacity: 0.11,
  },
  totalLabel: {
    color: "#cc8c1d",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 6,
    marginTop: 2,
  },
  totalValue: {
    fontWeight: "bold",
    fontSize: 27,
    color: "#cc8c1d",
    letterSpacing: 1.5,
    marginTop: 2,
  },
  submitBtn: {
    marginTop: 16,
    backgroundColor: "#2196f3",
    padding: 15,
    borderRadius: 19,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#247ff7",
  },
  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
    letterSpacing: 1.1,
  },
});

export default BudgetInputScreen;
