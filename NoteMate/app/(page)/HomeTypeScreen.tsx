import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import {
  resetUserHomeAddress,
  resetUserHotel,
  resetUserFunBudget,
  resetUserHotelBudget,
  resetUserPlaygrounds,
  resetAllTravelInputs
} from "../../redux/inforUserTravel/inforUserTravelSlice";

const HomeTypeScreen = () => {
  const [selected, setSelected] = useState(null); // "home", "hotel"
  const router = useRouter();
  const dispatch = useDispatch();

  const handlePress = (type) => setSelected(type);

  const handleContinue = () => {
    if (!selected) return;

    // Reset tất cả input liên quan trước khi đi flow mới
    dispatch(resetAllTravelInputs());

    // Sau đó đi theo nhánh Home hoặc Hotel  
    if (selected === "home") {
      router.push("/AddressSelectHomeScreen");
    } else {
      router.push("/BudgetInputScreen");
    }
  };

  return (
    <ImageBackground source={require('../../assets/background/bg_homeType.jpg')} style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>Chọn loại chỗ ở của bạn</Text>
        <View style={styles.optionsRow}>

          {/* Lựa chọn nhà ở */}
          <TouchableOpacity
            style={[
              styles.optionBox,
              selected === "home" && styles.optionSelected
            ]}
            onPress={() => handlePress("home")}
            activeOpacity={0.87}
          >
            <MaterialCommunityIcons name="home" size={48} color={selected === "home" ? "#3479F6" : "#777"} />
            <Text style={styles.optionTitle}>Nhà riêng / Đã có chỗ ở</Text>
            <Text style={styles.optionDesc}>Bạn đã có nhà riêng, ở nhà người thân hoặc nhà trọ.</Text>
          </TouchableOpacity>

          {/* Lựa chọn khách sạn/nhà nghỉ */}
          <TouchableOpacity
            style={[
              styles.optionBox,
              selected === "hotel" && styles.optionSelected
            ]}
            onPress={() => handlePress("hotel")}
            activeOpacity={0.87}
          >
            <Ionicons name="bed" size={46} color={selected === "hotel" ? "#3479F6" : "#777"} />
            <Text style={styles.optionTitle}>Khách sạn / Nhà nghỉ</Text>
            <Text style={styles.optionDesc}>Bạn muốn tìm phòng khách sạn, nhà nghỉ, hoặc homestay.</Text>
          </TouchableOpacity>
        </View>

        {/* Nút tiếp tục */}
        <TouchableOpacity
          disabled={!selected}
          style={[
            styles.continueBtn,
            { opacity: selected ? 1 : 0.4 }
          ]}
          onPress={handleContinue}
        >
          <Text style={styles.continueText}>Tiếp tục</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "bold", color: "#ffffffff", marginVertical: 28 },
  optionsRow: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: 38 },
  optionBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    alignItems: "center",
    padding: 24,
    flex: 1,
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: "#eee",
    elevation: 4,
    shadowColor: "#b3bcdf",
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 22,
    shadowOpacity: 0.12,
  },
  optionSelected: {
    borderColor: "#3479F6",
    backgroundColor: "#e8f1ff",
    elevation: 7,
    shadowColor: "#3479F6",
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#233",
    marginTop: 15,
    marginBottom: 6,
    textAlign: "center",
  },
  optionDesc: {
    color: "#546",
    fontSize: 14,
    textAlign: "center",
  },
  continueBtn: {
    marginTop: 50,
    padding: 16,
    backgroundColor: "#3479F6",
    borderRadius: 14,
    width: "80%",
    alignItems: "center",
    elevation: 4,
  },
  continueText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 1,
  }
});

export default HomeTypeScreen;
