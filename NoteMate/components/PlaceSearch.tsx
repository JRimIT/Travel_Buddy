import React, { useState } from "react";
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import createHomeStyles from "../assets/styles/home.styles";
import { useTheme } from "../contexts/ThemeContext";
import { router } from "expo-router";

const GEOAPIFY_KEY =
  process.env.GEOAPIFY_KEY || "2ad8114410b44c76baf6c71f5ab23f3a";

const PlaceSearch = ({ onSelect }) => {
  const { colors } = useTheme();
  const styles = createHomeStyles(colors);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null); // ✅ Lưu thành phố đã chọn

  const fetchSuggestions = async (text) => {
    setQuery(text);
    if (text.length < 3) return setSuggestions([]);

    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${text}&apiKey=${GEOAPIFY_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    setSuggestions(data.features || []);
  };

  const handleOutsidePress = () => {
    setIsFocused(false);
    Keyboard.dismiss();
  };

  const pramsForFlight = (city) => {
    const cityIATAMap = {
      "Ho Chi Minh City": "SGN",
      "Ha Noi": "HAN",
      "Da Nang": "DAD",
      "Hai Phong": "HPH",
      "Can Tho": "VCA",
      "Nha Trang": "CXR",
      "Phu Quoc": "PQC",
      "Hue": "HUI",
      "Da Lat": "DLI",
      "Vinh": "VII",
      "Thanh Hoa": "THD",
      "Buon Ma Thuot": "BMV",
      "Pleiku": "PXU",
      "Dong Hoi": "VDH",
      "Tuy Hoa": "TBB",
      "Chu Lai": "VCL",
      "Rach Gia": "VKG",
      "Dien Bien Phu": "DIN",
      "Ca Mau": "CAH",
      "Con Dao": "VCS",
    };

    const toEntityId = cityIATAMap[city?.trim()] || "SGN";
    return {
      fromEntityId: "DAD",
      toEntityId,
      type: "oneway",
      year: "2025",
      month: "10",
      market: "VN",
      locale: "vi-VN",
      currency: "VND",
      adults: 1,
      cabinClass: "economy",
    };
  };

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Nhập địa điểm tới..."
          value={query}
          onChangeText={fetchSuggestions}
          style={styles.searchInput}
          onFocus={() => setIsFocused(true)}
        />

        {isFocused && query.length >= 3 && (
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.properties.place_id?.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  const cityName =
                    item.properties.city ||
                    item.properties.name ||
                    item.properties.formatted;

                  setSelectedCity(cityName); 
                  onSelect(item);
                  setIsFocused(false);
                  setQuery(cityName);
                }}
              >
                <Text style={styles.suggestionText}>
                  {item.properties.formatted}
                </Text>
              </TouchableOpacity>
            )}
            style={{
              backgroundColor: "#fff",
              borderRadius: 8,
              marginTop: 4,
              elevation: 4,
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
          />
        )}

        {/*  Nút chỉ hiện khi đã chọn thành phố */}
        {selectedCity && (
          <TouchableOpacity
            style={{
              backgroundColor: "#276ef1",
              marginTop: 10,
              borderRadius: 8,
              padding: 12,
              alignItems: "center",
            }}
            onPress={() =>
              router.push({
                pathname: "FlightPage",
                params: pramsForFlight(selectedCity),
              })
            }
          >
            <Text
              style={{ color: "#fff", fontWeight: "bold", fontSize: 15 }}
            >
              ✈️ Xem chuyến bay đến {selectedCity}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default PlaceSearch;
