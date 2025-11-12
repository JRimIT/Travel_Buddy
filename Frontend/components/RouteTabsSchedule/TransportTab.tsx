import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import trainData from "../../trains.json";
import busData from "../../bus.json";
import { useAuthStore } from '../../store/authStore';
import { setUserTicket, setUserChosenFlight } from "../../redux/inforUserTravel/inforUserTravelSlice"; // import action mới

const RAPIDAPI_KEY = "YOUR_RAPIDAPI_KEY";
const RAPIDAPI_HOST = "flights-sky.p.rapidapi.com";

// API gọi vé máy bay
const searchFlightsEverywhere = async (params: any) => {
  try {
    let url = `https://flights-sky.p.rapidapi.com/flights/search-everywhere?fromEntityId=${params.fromEntityId}`;
    if (params.toEntityId) url += `&toEntityId=${params.toEntityId}`;
    url += `&type=${params.type || "oneway"}`;
    if (params.year) url += `&year=${params.year}`;
    if (params.month) url += `&month=${params.month}`;
    url += `&adults=${params.adults || 1}&cabinClass=${params.cabinClass || "economy"}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
      },
    });
    const data = await res.json();
    return data?.data?.flightQuotes?.results || [];
  } catch (err) {
    console.error("Error fetching flights:", err);
    return [];
  }
};

const TransportTab = ({ tripId }: { tripId?: string }) => {
  const dispatch = useDispatch();
  const userToken = useAuthStore((state) => state.token);
  const mainTransportRaw = useSelector(
    (state: any) => state.inforUserTravel.userTransportMain
  );
  const fromLocation = useSelector(
    (state: any) => state.inforUserTravel.userLocation
  );
  const toProvince = useSelector(
    (state: any) => state.inforUserTravel.userProvince
  );
  const userStartDate = useSelector(
    (state: any) => state.inforUserTravel.userStartDate
  );

  const [loading, setLoading] = useState(true);
  const [transports, setTransports] = useState<any[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const transportType =
    mainTransportRaw === "plane"
      ? "flight"
      : mainTransportRaw === "train"
      ? "train"
      : mainTransportRaw === "bus"
      ? "bus"
      : mainTransportRaw;

  const cityToCode: { [key: string]: string } = {
    "Ha Noi": "HAN",
    Hanoi: "HAN",
    "Ho Chi Minh City": "SGN",
    "Da Nang": "DAD",
    Hue: "HUI",
    "Nha Trang": "CXR",
  };

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      const normalize = (str: string) =>
        str
          ?.normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/đ/g, "d")
          .replace(/Đ/g, "D")
          .replace(/\s+/g, "")
          .toLowerCase();

      if (transportType === "flight") {
        const fromCode = cityToCode[fromLocation?.name || fromLocation] || "HAN";
        const toCode = cityToCode[toProvince?.name || toProvince] || "SGN";
        const flightsData = await searchFlightsEverywhere({
          fromEntityId: fromCode,
          toEntityId: toCode,
          type: "oneway",
          market: "VN",
          locale: "vi-VN",
          currency: "VND",
          year: 2025,
          month: 11,
          adults: 1,
          cabinClass: "economy",
        });
        setTransports(flightsData);
      } else if (transportType === "train") {
        const updatedTrainData = trainData.map((t) => ({
          ...t,
          ngayDi: userStartDate || t.ngayDi,
          soGheTrong: Math.floor(Math.random() * 101),
        }));
        const filteredTrains = updatedTrainData.filter(
          (t) =>
            normalize(t.gaDi) === normalize(fromLocation?.name || fromLocation) &&
            normalize(t.gaDen) === normalize(toProvince?.name || toProvince)
        );
        setTransports(filteredTrains);
      } else if (transportType === "bus") {
        const updatedBusData = busData.map((b) => ({
          ...b,
          ngayDi: userStartDate || b.ngayDi,
          soGheTrong: Math.max(0, b.soGheTrong - Math.floor(Math.random() * 30)),
        }));
        const filteredBuses = updatedBusData.filter(
          (b) =>
            normalize(b.diemDi) === normalize(fromLocation?.name || fromLocation) &&
            normalize(b.diemDen) === normalize(toProvince?.name || toProvince)
        );
        setTransports(filteredBuses);
      }

      setLoading(false);
    };

    fetchData();
  }, [fromLocation, toProvince, transportType]);

  const handleSelectTicket = (item: any, id: string) => {
    setSelectedTicketId(id);
      dispatch(setUserTicket(item));
  };

  const renderCard = (item: any, idx: number) => {
    const ticketId = item.id || item.chuyenTau || item.soXe;
    const isSelected = selectedTicketId === ticketId;
    const cardStyle = [styles.card, isSelected && { borderColor: "#4175fa", borderWidth: 2 }];

    if (transportType === "flight") {
      const price = item.content.price;
      const direct = item.content.direct;
      const dateLabel = item.content.outboundLeg.localDepartureDateLabel;
      const from = item.content.outboundLeg.originAirport;
      const to = item.content.outboundLeg.destinationAirport;
      const airlineCode = item.id.split("*").slice(-1)[0];

      return (
        <TouchableOpacity
          style={cardStyle}
          onPress={() => handleSelectTicket(item, ticketId)}
        >
          <Text style={styles.name}>
            ✈️ {from?.skyCode} → {to?.skyCode} {direct && "• Thẳng"}
          </Text>
          <Text style={styles.info}>Ngày đi: {dateLabel}</Text>
          <Text style={styles.price}>Giá: {price}</Text>
          <Text style={styles.info}>
            Sân bay: {from?.name} → {to?.name}
          </Text>
          <Text style={styles.info}>Mã hãng: {airlineCode}</Text>
        </TouchableOpacity>
      );
    } else if (transportType === "train") {
      return (
        <TouchableOpacity
          style={cardStyle}
          onPress={() => handleSelectTicket(item, ticketId)}
        >
          <Text style={styles.name}>🚆 {item.chuyenTau}</Text>
          <Text style={styles.info}>Ngày đi: {item.ngayDi}</Text>
          <Text style={styles.info}>Khởi hành: {item.gioDi}</Text>
          <Text style={styles.info}>Đến: {item.gioDen}</Text>
          <Text style={styles.info}>Số ghế trống: {item.soGheTrong}</Text>
          <Text style={styles.info}>Ga: {item.gaDi} → {item.gaDen}</Text>
        </TouchableOpacity>
      );
    } else if (transportType === "bus") {
      return (
        <TouchableOpacity
          style={cardStyle}
          onPress={() => handleSelectTicket(item, ticketId)}
        >
          <Text style={styles.name}>🚌 {item.nhaXe}</Text>
          <Text style={styles.info}>Ngày đi: {item.ngayDi}</Text>
          <Text style={styles.info}>Khởi hành: {item.gioDi}</Text>
          <Text style={styles.info}>Loại xe: {item.loaiXe}</Text>
          <Text style={styles.info}>Số ghế trống: {item.soGheTrong}</Text>
          <Text style={styles.info}>
            Tuyến: {item.diemDi} → {item.diemDen}
          </Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Ionicons
          name="airplane-outline"
          size={26}
          color="#fff"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.title}>
          {transportType === "flight"
            ? "Vé máy bay"
            : transportType === "train"
            ? "Vé tàu hỏa"
            : "Vé xe khách"}
          : {fromLocation?.name || fromLocation} → {toProvince?.name || toProvince}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4175fa" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={transports}
          keyExtractor={(item, idx) => item.id || item.soXe || item.chuyenTau + "-" + idx}
          renderItem={({ item, index }) => renderCard(item, index)}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Ionicons name="cloud-offline-outline" size={48} color="#aaa" />
              <Text style={{ marginTop: 18, color: "#333" }}>
                Không tìm thấy chuyến đi
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default TransportTab;

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f3f7fb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4175fa",
    padding: 18,
    paddingTop: 48,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "600" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    margin: 12,
    padding: 16,
    elevation: 4,
    shadowColor: "#628eeb",
    shadowOpacity: 0.14,
    shadowOffset: { width: 2, height: 5 },
    shadowRadius: 22,
  },
  name: { fontWeight: "bold", fontSize: 17, color: "#4175fa" },
  info: { fontSize: 15, color: "#333", marginTop: 2 },
  price: { fontSize: 16, color: "#d91e18", fontWeight: "bold", marginTop: 5 },
});
