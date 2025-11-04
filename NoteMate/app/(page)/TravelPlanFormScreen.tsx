import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useDispatch } from "react-redux";
import { set } from "lodash";
import { setUserEndDate, setUserSchedule, setUserStartDate, setUserTravelDays } from "../../redux/inforUserTravel/inforUserTravelSlice";

const TravelPlanFormScreen = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showPicker, setShowPicker] = useState({ open: false, type: "start" });
  
  const dispatch = useDispatch()

  const handleOpenPicker = (type) => setShowPicker({ open: true, type });
  const handleClosePicker = () => setShowPicker({ ...showPicker, open: false });

  const handlePickDate = (date) => {
    if (showPicker.type === "start") {
      setStartDate(date);
      if (endDate && endDate < date) setEndDate(null);
    } else {
      setEndDate(date);
    }
    handleClosePicker();
  };

  const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10); // yyyy-mm-dd
};


  // const formatMoney = (moneyStr) => {
  //   // Loại bỏ ký tự không phải số
  //   let n = moneyStr.replace(/\D/g, "");
  //   if (!n) return "";
  //   // Định dạng lại
  //   return n.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  //   };

    // Tính số ngày, kể cả ngày bắt đầu và kết thúc (vd: 15/10-16/10 = 2 ngày)
  const getTripDays = (start, end) => {
    if (!start || !end) return 0;
    const ms = new Date(end).setHours(0,0,0,0) - new Date(start).setHours(0,0,0,0);
    return ms >= 0 ? Math.floor(ms / (1000 * 60 * 60 * 24)) + 1 : 0;
  };


  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
    };

   const goToHomeTypeScreen = () => {
  const numDays = getTripDays(startDate, endDate);
  const daysArr = [];

  for (let i = 0; i < numDays; i++) {
    daysArr.push({
      day: i + 1,
      date: addDays(startDate, i),
      activities: [],
    });
  }

  dispatch(setUserStartDate(formatDate(startDate)))
  dispatch(setUserEndDate(formatDate(endDate)))
  dispatch(setUserTravelDays(numDays))
  dispatch(setUserSchedule(daysArr));   
  router.push('HomeTypeScreen');
}


  return (
    <View style={styles.container}>
      <Text style={styles.header}>Kế hoạch chuyến đi</Text>

      {/* Chọn ngày bắt đầu */}
      <Text style={styles.label}>Ngày bắt đầu</Text>
      <TouchableOpacity style={styles.dateInput} onPress={() => handleOpenPicker("start")}>
        <Ionicons name="calendar-outline" size={22} color="#476de1" style={{ marginRight: 9 }} />
        <Text style={{ fontSize: 16, color: startDate ? "#223f6b" : "#b8b9bf" }}>
          {startDate ? formatDate(startDate) : "Chọn ngày bắt đầu"}
        </Text>
      </TouchableOpacity>

      {/* Chọn ngày kết thúc */}
      <Text style={styles.label}>Ngày kết thúc</Text>
      <TouchableOpacity
        style={styles.dateInput}
        onPress={() => handleOpenPicker("end")}
        disabled={!startDate}
      >
        <Ionicons name="calendar-outline" size={22} color="#476de1" style={{ marginRight: 9 }} />
        <Text style={{ fontSize: 16, color: endDate ? "#223f6b" : "#b8b9bf" }}>
          {endDate ? formatDate(endDate) : (startDate ? "Chọn ngày kết thúc" : "Chọn ngày bắt đầu trước")}
        </Text>
      </TouchableOpacity>

      {/* DateTimePickerModal (dùng chung cho 2 ô ngày) */}
      <DateTimePickerModal
        isVisible={showPicker.open}
        mode="date"
        date={showPicker.type === "start" ? (startDate || new Date()) : (endDate || startDate || new Date())}
        minimumDate={showPicker.type === "end" ? startDate || new Date() : new Date()}
        onConfirm={handlePickDate}
        onCancel={handleClosePicker}
        locale="vi"
        cancelTextIOS="Hủy"
        confirmTextIOS="Xác nhận"
        
      />

      {/* Hiển thị tổng số ngày đi chơi */}
      {(startDate && endDate) && (
        <View style={styles.daysBox}>
          <Ionicons name="timer-outline" size={28} color="#3479F6" style={{ marginRight: 10 }} />
          <View>
            <Text style={styles.daysMain}>
              {getTripDays(startDate, endDate)}
              <Text style={{ fontSize: 17, color: "#3479F6", fontWeight: "500" }}> ngày</Text>
            </Text>
            <Text style={styles.daysSub}>Tổng số ngày đi chơi</Text>
          </View>
        </View>
      )}


      {/* Nút submit */}
      <TouchableOpacity
        style={[ 
          styles.submitBtn,
          (!startDate || !endDate) && { opacity: 0.5 },
        ]}
        disabled={!startDate || !endDate }
        onPress={() => {
          goToHomeTypeScreen();
        }}
      >
        <Text style={styles.submitText}>Lưu kế hoạch</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 27, backgroundColor: "#f6f9ff" },
  header: {
    fontSize: 22, fontWeight: "bold", color: "#214bc7", alignSelf: "center",
    marginVertical: 30, letterSpacing: 0.5
  },
  label: { fontSize: 15, color: "#424b54", marginBottom: 8, marginTop: 24, fontWeight: "500" },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#dde5ef",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#adb9e2",
  },
  moneyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#c2dccb",
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginTop: 6,
    marginBottom: 32,
    elevation: 2,
    shadowColor: "#b3ddb9",
  },
  moneyInput: {
    flex: 1,
    fontSize: 16,
    color: "#167353",
    fontWeight: "bold",
  },
  moneySuffix: {
    marginLeft: 7,
    color: "#178a4c",
    fontWeight: "bold",
    fontSize: 15,
    letterSpacing: 1,
  },
  submitBtn: {
    marginTop: 25,
    backgroundColor: "#214bc7",
    padding: 15,
    borderRadius: 18,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#6a8cfb",
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16, letterSpacing: 1.1 },
  daysBox: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  marginTop: 32,
  marginBottom: 22,
  backgroundColor: "#eaf1fc",
  borderRadius: 16,
  paddingVertical: 20,
  paddingHorizontal: 22,
  elevation: 3,
  shadowColor: "#3479F6",
  shadowOffset: { width: 0, height: 4 },
  shadowRadius: 11,
  shadowOpacity: 0.13,
},
daysMain: {
  fontSize: 30,
  fontWeight: "bold",
  color: "#214bc7",
  lineHeight: 34,
},
daysSub: {
  fontSize: 14,
  color: "#476de1",
  fontWeight: "500",
  marginTop: 1,
},

});

export default TravelPlanFormScreen;
