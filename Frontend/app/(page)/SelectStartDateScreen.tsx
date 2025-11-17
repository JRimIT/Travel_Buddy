import React, { useState } from "react";
import { View, Text, Button, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useDispatch, useSelector } from "react-redux";
import {
  setUserStartDate,
  setUserEndDate,
  setUserTravelDays,
  setUserSchedule,
  setUserStartingPoint,
  setUserTransportMain,
} from "../../redux/inforUserTravel/inforUserTravelSlice";
import { router } from "expo-router";

const SelectStartDateScreen = () => {
  const dispatch = useDispatch();

  const userSchedule = useSelector(
    (state: any) => state.inforUserTravel.userSchedule
  ) || [];

  const userStartingPointRedux = useSelector(
    (state: any) => state.inforUserTravel.userStartingPoint
  );

  const userTransportRedux = useSelector(
    (state: any) => state.inforUserTravel.userTransportMain
  );

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [startPoint, setStartPoint] = useState(userStartingPointRedux || "");
  const [transport, setTransport] = useState(userTransportRedux || "plane");

  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const today = new Date();

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getTripDays = (start: Date, end: Date) => {
    const s = new Date(start).setHours(0, 0, 0, 0);
    const e = new Date(end).setHours(0, 0, 0, 0);
    const diff = e - s;
    return diff >= 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) + 1 : 0;
  };

  const handleConfirm = () => {
    if (!startPoint.trim()) {
      alert("Vui lòng điền điểm xuất phát!");
      return;
    }

    const startISO = startDate.toISOString().split("T")[0];
    const endISO = endDate.toISOString().split("T")[0];
    const numDays = getTripDays(startDate, endDate);

    if (userSchedule.length > 0) {
      const clonedSchedule = userSchedule.map((day, idx) => {
        const newDate = new Date(startDate);
        newDate.setDate(newDate.getDate() + idx);
        return {
          ...day,
          date: newDate.toISOString().split("T")[0],
          activities: [...day.activities],
        };
      });
      dispatch(setUserSchedule(clonedSchedule));
    }

    dispatch(setUserStartDate(startISO));
    dispatch(setUserEndDate(endISO));
    dispatch(setUserTravelDays(numDays));
    dispatch(setUserStartingPoint(startPoint.trim()));
    dispatch(setUserTransportMain(transport)); // lưu phương tiện

    router.push({
      pathname: "/TripScheduleScreen",
      params: { isDuplicated: true },
    });
  };

  return (
    <View style={styles.container}>
      {/* Ngày bắt đầu */}
      <TouchableOpacity onPress={() => setShowStart(true)}>
        <Text style={styles.label}>Ngày bắt đầu: {formatDate(startDate)}</Text>
      </TouchableOpacity>
      {showStart && (
        <DateTimePicker
          value={startDate}
          mode="date"
          minimumDate={today}
          onChange={(e, selected) => {
            setShowStart(false);
            if (selected) setStartDate(selected);
          }}
        />
      )}

      {/* Ngày kết thúc */}
      <TouchableOpacity onPress={() => setShowEnd(true)} style={{ marginTop: 20 }}>
        <Text style={styles.label}>Ngày kết thúc: {formatDate(endDate)}</Text>
      </TouchableOpacity>
      {showEnd && (
        <DateTimePicker
          value={endDate}
          mode="date"
          minimumDate={startDate}
          onChange={(e, selected) => {
            setShowEnd(false);
            if (selected) setEndDate(selected);
          }}
        />
      )}

      {/* Điểm xuất phát */}
      <Text style={{ fontSize: 18, marginTop: 20, marginBottom: 10 }}>Điểm xuất phát:</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập điểm xuất phát"
        value={startPoint}
        onChangeText={setStartPoint}
      />

      {/* Chọn phương tiện */}
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Chọn phương tiện:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={transport}
          onValueChange={(value) => setTransport(value)}
          style={styles.picker}
        >
          <Picker.Item label="Máy bay ✈️" value="plane" />
          <Picker.Item label="Tàu hỏa 🚆" value="train" />
          <Picker.Item label="Xe khách 🚌" value="bus" />
        </Picker>
      </View>

      <Button title="Xác nhận" onPress={handleConfirm} style={{ marginTop: 30 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  label: { fontSize: 18, marginBottom: 10 },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  pickerContainer: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 30,
  },
  picker: {
    width: "100%",
    color: "#000",
  },
});

export default SelectStartDateScreen;
