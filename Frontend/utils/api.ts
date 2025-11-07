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
        image: imageDataUrl           
      }),
    });
  
    const result = await response.json();

    if (!response.ok) {
      console.log("Server returned Error (status", response.status, "):", result);
      
      Alert.alert("Error", result.error || "Server returned error");
      return;
    }

    console.log("Response OK:", result);
    return result;

  } catch (error) {
    console.log("Error submitting schedule:", error);
    const errorMessage =
      error instanceof Error && error.message
        ? error.message
        : "Something went wrong. Please try again.";
    Alert.alert("Error", errorMessage);
  }
};

