import React, { useState } from "react";
import { View, Text, Button, TouchableOpacity } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useDispatch } from "react-redux";
import {
  setUserStartDate,
  setUserEndDate,
  setUserTravelDays,
  setUserSchedule,
} from "../../redux/inforUserTravel/inforUserTravelSlice";
import { router } from "expo-router";

const SelectStartDateScreen = () => {
  const dispatch = useDispatch();

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const today = new Date();

  // ⭐ Format dd-mm-yyyy
  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // ⭐ Tính số ngày
  const getTripDays = (start, end) => {
    const s = new Date(start).setHours(0, 0, 0, 0);
    const e = new Date(end).setHours(0, 0, 0, 0);

    const diff = e - s;
    return diff >= 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) + 1 : 0;
  };

  // ⭐ Hàm thêm ngày
  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return formatDate(result); // trả về dd-mm-yyyy
  };

  const handleConfirm = () => {
    const formattedStart = formatDate(startDate);
    const formattedEnd = formatDate(endDate);

    const numDays = getTripDays(startDate, endDate);

    // Lưu Redux
    dispatch(setUserStartDate(formattedStart));
    dispatch(setUserEndDate(formattedEnd));
    dispatch(setUserTravelDays(numDays));

    router.push({
      pathname: "/TripScheduleScreen",
      params: { isDuplicated: true },
    });
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {/* Ngày bắt đầu */}
      <TouchableOpacity onPress={() => setShowStart(true)}>
        <Text style={{ fontSize: 18, marginBottom: 10 }}>
          Ngày bắt đầu: {formatDate(startDate)}
        </Text>
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
      <TouchableOpacity onPress={() => setShowEnd(true)} style={{ marginTop: 25 }}>
        <Text style={{ fontSize: 18 }}>
          Ngày kết thúc: {formatDate(endDate)}
        </Text>
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

      <Button title="Xác nhận" onPress={handleConfirm} />
    </View>
  );
};

export default SelectStartDateScreen;
