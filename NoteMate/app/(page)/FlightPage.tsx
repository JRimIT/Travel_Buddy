// FlightPage.js hoặc FlightScreen.js (có thể truyền navigation params từ màn địa điểm)
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

const RAPIDAPI_KEY = "cef2578525mshc4105b66e0a5c49p181ee7jsn45dfb9a44da8";
const RAPIDAPI_HOST = "flights-sky.p.rapidapi.com";

const searchFlightsEverywhere = async ({
  fromEntityId,
  toEntityId ,
  type ,
  market,
    locale,
    currency,
  year,
  month,
  adults,
  cabinClass
}) => {
  console.log("Searching flights with params:", { fromEntityId, toEntityId, type, market, locale, currency, year, month, adults, cabinClass })
  

  let url = `https://flights-sky.p.rapidapi.com/flights/search-everywhere?fromEntityId=${fromEntityId}`;
  if (toEntityId) url += `&toEntityId=${toEntityId}`;
  url += `&type=oneway`;
  if (year) url += `&year=${year}`;
  if (month) url += `&month=${month}`;
  url += `&adults=${adults}&cabinClass=${cabinClass}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": RAPIDAPI_KEY,
      "X-RapidAPI-Host": RAPIDAPI_HOST
    }
  });
  return await res.json();
};

const FlightPage = ({ route, navigation }) => {
  const { fromEntityId, toEntityId, year, month, type, market, locale, currency, adults, cabinClass } = useLocalSearchParams();
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  // Gọi API searchFlightsEverywhere sử dụng các tham số này
  searchFlightsEverywhere({
    fromEntityId,
    toEntityId,
    year,
    month,
    type,
    market,
    locale,
    currency,
    adults,
    cabinClass
  }).then(res => {
    // xử lý và show dữ liệu
    console.log("Flight search results:", res.data?.flightQuotes.results);
    
    setFlights(res.data?.flightQuotes.results || []);
      setLoading(false);
  });
}, [fromEntityId, toEntityId, year, month]);

  return (
    <View style={flightStyles.page}>
      <View style={flightStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={flightStyles.backBtn}>
          <Ionicons name="arrow-back-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={flightStyles.title}>Kết quả chuyến bay</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4175fa" style={{marginTop:40}} />
      ) : (
        <FlatList
  data={flights}
  keyExtractor={(item, idx) => item.id + "-" + idx}
  renderItem={({ item }) => {
    // Các trường dữ liệu JSON
    const price = item.content.price;
    const rawPrice = item.content.rawPrice;
    const direct = item.content.direct;
    const dateLabel = item.content.outboundLeg.localDepartureDateLabel;
    const from = item.content.outboundLeg.originAirport;
    const to = item.content.outboundLeg.destinationAirport;

    // Nếu hãng có mã cuối id (ex: "*VU", "*VJ"...)
    const airlineCode = item.id.split("*").slice(-1)[0];
    // Xác định hãng theo mã nếu cần, VD: VJ = VietJet, VU = Vietravel...

    return (
      <View style={flightStyles.card}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="airplane-outline" size={28} color="#4175fa" style={{marginRight:8}}/>
          <Text style={flightStyles.name}>
            {from?.skyCode} → {to?.skyCode}  {direct && "• Thẳng"}
          </Text>
        </View>
        <Text style={flightStyles.info}>
          Ngày đi: {dateLabel}
        </Text>
        <Text style={flightStyles.price}>Giá: <Text style={{color:"#d91e18", fontWeight:"bold"}}>{price}</Text></Text>
        <Text style={flightStyles.info}>Sân bay: {from?.name} → {to?.name}</Text>
        <Text style={flightStyles.info}>Mã hãng: {airlineCode}</Text>
      </View>
    );
  }}
  ListEmptyComponent={
    <View style={{ alignItems: "center", marginTop: 40 }}>
      <Ionicons name="cloud-offline-outline" size={48} color="#aaa"/>
      <Text style={{marginTop:18, color:"#333"}}>Không tìm thấy chuyến bay</Text>
    </View>
  }
/>
        
      )}
    </View>
  );
};

export default FlightPage;

const flightStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f3f7fb" },
  header: { flexDirection:"row", alignItems:"center", backgroundColor:"#4175fa", padding:18, paddingTop:48, borderBottomLeftRadius:20, borderBottomRightRadius:20 },
  backBtn: { marginRight:12, backgroundColor:'#4175fa', padding:5, borderRadius:22 },
  title: { color:"#fff", fontSize:22, fontWeight:"600" },
  card: { backgroundColor:"#fff", borderRadius:18, margin:12, padding:16, elevation:4, shadowColor:"#628eeb", shadowOpacity:0.14, shadowOffset:{width:2,height:5}, shadowRadius:22 },
  cardTitle: { fontSize:18, fontWeight:"bold", color:"#4175fa" },
  cardInfo: { fontSize:15, color:"#333", marginTop:5 },
  cardPrice: { fontSize:16, color:"#d91e18", fontWeight:"bold", marginTop:5 },
  name: { fontWeight:"bold", fontSize:17, color:"#4175fa" },
  info: { fontSize:15, color:"#333", marginTop:2 },
  price: { fontSize:16, color:"#d91e18", fontWeight:"bold", marginTop:5 }
});



