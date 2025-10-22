import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import {
  MaterialCommunityIcons,
  FontAwesome,
  Feather,
  Ionicons,
} from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import {
  setUserChosenFlight,
  setUserFlightTicket,
} from "../../redux/inforUserTravel/inforUserTravelSlice";

const usdRate = 25000;

const MoveRoute = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chosenFlight, setChosenFlight] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const dispatch = useDispatch();
  const userFlightTicket = useSelector(
    (state:any) => state.inforUserTravel.userFlightTicket
  );
  const userChosenFlight = useSelector(
    (state:any) => state.inforUserTravel.userChosenFlight
  );
  const flightBudget = useSelector(
    (state:any) => state.inforUserTravel.userFlightBudget
  );
  const flightBudgetNumber = flightBudget
    ? parseInt(flightBudget.replace(/\./g, ""))
    : 0;
  const flightBudgetUSD = Math.round(flightBudgetNumber / usdRate);

  const userProvince = useSelector(
    (state:any) => state.inforUserTravel.userProvince
  );
  const fromEntityId = "DAD";
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
  const toEntityId = cityIATAMap[userProvince.name.trim()] || "SGN";

  // --------- API fetch function ----------
  const RAPIDAPI_KEY = "cef2578525mshc4105b66e0a5c49p181ee7jsn45dfb9a44da8";
  const RAPIDAPI_HOST = "flights-sky.p.rapidapi.com";

  const searchFlightsEverywhere = async (params) => {
    let url = `https://flights-sky.p.rapidapi.com/flights/search-everywhere?fromEntityId=${params.fromEntityId}`;
    if (params.toEntityId) url += `&toEntityId=${params.toEntityId}`;
    url += `&type=oneway&year=2025&month=10&adults=1&cabinClass=economy`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
      },
    });
    return await res.json();
  };

  // --------- Only fetch list one time, keep cache ---------
  useEffect(() => {
    // Nếu đã cache vé máy bay đúng destination, chỉ load local + set chosen
    if (
      userFlightTicket &&
      userFlightTicket.length > 0 &&
      (userFlightTicket[0]?.content?.outboundLeg?.destinationAirport?.skyCode === toEntityId ||
        userFlightTicket[0]?.content?.outboundLeg?.destinationAirport === toEntityId)
    ) {
      setFlights(userFlightTicket);
      setLoading(false);
      setChosenFlight(userChosenFlight || null);
    } else {
      setLoading(true);
      searchFlightsEverywhere({
        fromEntityId,
        toEntityId,
      }).then((res) => {
        
        console.log("toEntity: ", toEntityId);
        
        setFlights(res.data.flightQuotes.results || []);
        dispatch(setUserFlightTicket(res.data.flightQuotes.results));
        setLoading(false);
      });
    }
    // eslint-disable-next-line
  }, [fromEntityId, toEntityId, userFlightTicket, userChosenFlight]);

  // Nếu Redux state có chosen vé bay thì load vào state local khi quay lại tab
  useEffect(() => {
    setChosenFlight(userChosenFlight || null);
  }, [userChosenFlight]);

  // Vé đề xuất (lọc giá hợp với quỹ, biến về USD cho dữ liệu API)
  const filtered = flights.filter((f) => {
    const p = parseInt(f.content.rawPrice);
    return !isNaN(p) && p <= flightBudgetUSD;
  });
  // Vé suggest phù hợp nhất hoặc rẻ nhất
  const suggested =
    (filtered.length > 0 ? filtered : flights).reduce(
      (minF, f) =>
        parseInt(f.content.rawPrice) < parseInt(minF.content.rawPrice) ? f : minF,
      flights[0] || {}
    );

  // Xử lý chọn/xoá vé bay để sync Redux
  const handleChooseFlight = (flight) => {
    setChosenFlight(flight);
    setShowAll(false);
    dispatch(setUserChosenFlight(flight));
  };
  const handleResetChosenFlight = () => {
    setChosenFlight(null);
    dispatch(setUserChosenFlight(null));
  };

  // UI helper hiển thị vé bay
  const displayFlightCard = (flight, isSuggested = false) => {
    if (!flight) return null;
    const from = flight.content?.outboundLeg?.originAirport;
    const to = flight.content?.outboundLeg?.destinationAirport;
    const rawPrice = parseInt(flight.content?.rawPrice || 0);
    const priceVND = Math.round(rawPrice * usdRate);

    return (
      <View
        style={[
          styles.infoCard,
          isSuggested && {
            borderColor: "#21b7fa",
            borderWidth: 2,
            backgroundColor: "#f5fbff",
          },
        ]}
      >
        <MaterialCommunityIcons
          name="airplane"
          size={44}
          color="#1694d1"
          style={{ marginBottom: 10 }}
        />
        <Text style={styles.infoCardTitle}>
          {isSuggested ? "Vé máy bay đề xuất" : "Vé máy bay"}
        </Text>
        <Text style={styles.infoField}>
          <FontAwesome name="ticket" size={14} color="#f18701" /> Giá vé:{" "}
          <Text style={styles.boldText}>{priceVND.toLocaleString()} VNĐ</Text>
          <Text style={{ color: "#999", fontSize: 14 }}>  (~${rawPrice})</Text>
        </Text>
        <Text style={styles.infoField}>
          <Feather name="map-pin" size={14} color="#48c6ef" /> Điểm đến:{" "}
          <Text style={styles.boldText}>{to?.name || "?"}</Text>
        </Text>
        <Text style={styles.infoField}>
          <Feather name="clock" size={14} color="#64b8f6" /> Khởi hành:{" "}
          <Text style={styles.boldText}>
            {flight.content?.outboundLeg?.localDepartureDateLabel || "?"}
          </Text>
        </Text>
        <Text style={styles.infoField}>
          <Ionicons name="airplane-outline" size={16} color="#33bc7f" /> Mã
          chuyến:{" "}
          <Text style={{ fontWeight: "bold", color: "#318cff" }}>
            {flight?.id?.split("*").slice(-1)[0]}
          </Text>
        </Text>
        {isSuggested && filtered.length === 0 && (
          <Text style={{ color: "#ec8805", marginTop: 10 }}>
            Không có vé nào trong quỹ, đây là vé rẻ nhất hệ thống!
          </Text>
        )}
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.infoTabBox}>
      <Text
        style={{
          color: "#1da765",
          fontWeight: "700",
          fontSize: 16,
          marginVertical: 12,
        }}
      >
        Quỹ vé máy bay:{" "}
        {flightBudgetNumber ? flightBudgetNumber.toLocaleString() : "?"} VNĐ (~$
        {flightBudgetUSD})
      </Text>
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#4175fa"
          style={{ marginTop: 40 }}
        />
      ) : (
        <>
          {/* Card đề xuất chuyến phù hợp nhất */}
          {!chosenFlight && displayFlightCard(suggested, true)}
          {/* --- Nút chọn lại / hiển thị hết vé --- */}
          <TouchableOpacity
            style={{
              alignSelf: "center",
              marginVertical: 10,
              backgroundColor: "#e6eaff",
              padding: 10,
              borderRadius: 9,
              flexDirection: "row",
              alignItems: "center",
            }}
            onPress={() => setShowAll((s) => !s)}
          >
            <Ionicons
              name={showAll ? "chevron-up" : "chevron-down"}
              size={20}
              color="#1694d1"
            />
            <Text
              style={{
                marginLeft: 9,
                color: "#1694d1",
                fontWeight: "700",
                fontSize: 15,
              }}
            >
              {showAll ? "Thu gọn danh sách vé" : "Chọn lại chuyến bay khác"}
            </Text>
          </TouchableOpacity>
          {/* --- Render tất cả chuyến bay bằng .map(), không FlatList --- */}
          {showAll && (
            <>
              {flights.map((item, idx) => (
                <TouchableOpacity
                  key={item.id + idx}
                  onPress={() => handleChooseFlight(item)}
                >
                  {displayFlightCard(item, false)}
                </TouchableOpacity>
              ))}
              {flights.length === 0 && (
                <View style={{ alignItems: "center", marginTop: 40 }}>
                  <Ionicons
                    name="cloud-offline-outline"
                    size={48}
                    color="#aaa"
                  />
                  <Text style={{ marginTop: 18, color: "#333" }}>
                    Không tìm thấy chuyến bay
                  </Text>
                </View>
              )}
            </>
          )}
          {/* Card chuyến đã chọn */}
          {chosenFlight && (
            <View>
              {displayFlightCard(chosenFlight, true)}
              <TouchableOpacity
                style={{
                  alignSelf: "center",
                  padding: 10,
                  margin: 8,
                  borderRadius: 8,
                  backgroundColor: "#e4f5fc",
                }}
                onPress={handleResetChosenFlight}
              >
                <Ionicons name="arrow-back" size={18} color="#1274fa" />
                <Text
                  style={{
                    color: "#1274fa",
                    fontWeight: "bold",
                    marginLeft: 6,
                    fontSize: 15,
                  }}
                >
                  Quay về đề xuất hệ thống
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};

export default MoveRoute;

const styles = StyleSheet.create({
  // ...Giữ nguyên như cũ...
  infoTabBox: {
    flexGrow: 1,
    alignItems: "center",
    backgroundColor: "#f0f6ff",
    padding: 28,
    minHeight: 540,
    justifyContent: "flex-start",
  },
  infoCard: {
    padding: 28,
    borderRadius: 21,
    backgroundColor: "#fff",
    alignItems: "center",
    width: "100%",
    elevation: 7,
    shadowColor: "#91caff",
    shadowOpacity: 0.18,
    borderWidth: 1.2,
    borderColor: "#dae6f9",
    marginBottom: 15,
  },
  infoCardTitle: {
    fontWeight: "bold",
    fontSize: 21,
    color: "#2188ea",
    marginBottom: 6,
  },
  infoField: {
    color: "#446e9b",
    fontSize: 16,
    marginBottom: 5,
    marginTop: 2,
    fontWeight: "500",
  },
  boldText: { fontWeight: "bold" },
});

