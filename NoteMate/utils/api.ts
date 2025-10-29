import { Alert } from "react-native";
import { API_URL } from "../constants/api";

export const confirmSchedule = async (
  title,
  description,
  isPublic,
  budgets,
  days,
  hotelDefault,
  flightTicket,
  mainTransport,
  innerTransport,
  fromLocation,
  province,
  token,
  imageDataUrl,
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
        hotelDefault,
        flightTicket,
        image: imageDataUrl,
        mainTransport,
        innerTransport,
        fromLocation,
        province,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      Alert.alert("Lỗi", result.error || "Server returned error");
      return;
    }
    return result;
  } catch (error) {
    Alert.alert("Lỗi", "Không thể lưu lịch trình!");
  }
};
