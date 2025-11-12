import { Alert } from "react-native";
import { API_URL } from "../constants/api";

export const confirmSchedule = async (
  title,
  description,
  isPublic,
  budgets,
  days,
  baseStay,
  hotelDefault,
  flightTicket,
  ticket,
  mainTransport,
  innerTransport,
  fromLocation,
  province,
  token,
  imageDataUrl,
  isHome,
  startDate,
  endDate
) => {
  try {
    const response = await fetch(`${API_URL}/tripSchedule/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
        isPublic,
        budget: budgets,
        days,
        baseStay,
        hotelDefault,
        flightTicket,
        ticket,
        image: imageDataUrl,
        mainTransport,
        innerTransport,
        fromLocation,
        province,
        baseStayType: isHome ? "home" : "hotel",
        startDate,
        endDate
      }),
    });

    const result = await response.json();


    if (!response.ok) {
      console.log("result.error: ", response);

      Alert.alert("Lỗi", result.error || "Server returned error");
      return;
    }
    return result;
  } catch (error) {
    Alert.alert("Lỗi", "Không thể lưu lịch trình!");
    return error;
  }
};