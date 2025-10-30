import React, { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import axios from "axios";
import { API_URL } from "../../constants/api";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";

const iconMap = {
  "Xe máy": <Ionicons name="bicycle-outline" size={20} color="#49bb4b" />,
  "Ô tô": <MaterialCommunityIcons name="car" size={20} color="#1976d2" />,
  "Taxi": <Ionicons name="car-sport-outline" size={20} color="#eaa620" />,
  "Xe bus": <Ionicons name="bus" size={20} color="#37a6ce" />,
  "Xe đạp": <FontAwesome5 name="bicycle" size={20} color="#30bc3e" />,
  "Máy bay": <MaterialCommunityIcons name="airplane" size={20} color="#1593ed" />,
  "Tàu hỏa": <FontAwesome5 name="train" size={20} color="#8c39d2" />,
  "Xe khách": <Ionicons name="bus" size={20} color="#f2b122" />
  // ...thêm nếu cần
};

const MoveTabScreen = () => {
  const hotel = useSelector((state:any) => state.inforUserTravel.userInforHotel);
  const home = useSelector((state:any) => state.inforUserTravel.userHomeAddress);
  const playgrounds = useSelector((state:any) => state.inforUserTravel.userPlaygrounds || []);
  const mainTransport = useSelector((state:any) => state.inforUserTravel.userTransportMain); // "Máy bay", ...
  const innerTransport = useSelector((state:any) => state.inforUserTravel.userTransportType); // "Xe máy", ...
  const fromLocation = useSelector((state:any) => state.inforUserTravel.userCurrentLocation);

  // --- Ưu tiên dùng Home nếu có, fallback hotel ---
  const isHome = !!(home && home.lat && home.lon);
  const baseLocation = isHome
    ? { lat: Number(home.lat), lon: Number(home.lon), label: home.name || home.address || "Nhà của bạn" }
    : hotel && hotel.lat && hotel.lon
      ? { lat: Number(hotel.lat), lon: Number(hotel.lon), label: hotel.name || hotel.address_line1 || hotel.datasource?.raw?.name }
      : { lat: 0, lon: 0, label: "?" };

  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadedRef = useRef(false);
  useEffect(() => {
    if ((!isHome && !hotel) || playgrounds.length === 0 || !mainTransport || !innerTransport)
      return;
    if (loadedRef.current) return;
    setLoading(true);

    const pointData = isHome
      ? { home } // gửi thông tin home qua backend thay cho hotel
      : { hotel };

    axios.post(`${API_URL}/AI/transport-analysis`, {
      ...pointData,
      playgrounds,
      mainTransport,
      innerTransport,
      fromLocation
    })
      .then(res => setAiData(res.data))
      .catch(() => setAiData(null))
      .finally(() => { setLoading(false); loadedRef.current = true; });
  }, [hotel, home, playgrounds, mainTransport, innerTransport, fromLocation, isHome]);
  //console.log("aiData: ", aiData);
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.header}>Phương tiện và lộ trình chuyến đi</Text>
      <Text style={styles.vehicle}>
        {iconMap[mainTransport] || ""} Phương tiện chính: <Text style={{color:"#156ff4", fontWeight:"bold"}}>{mainTransport}</Text>
      </Text>
      <Text style={styles.vehicle}>
        {iconMap[innerTransport] || ""} Phương tiện nội thành: <Text style={{color:"#156ff4", fontWeight:"bold"}}>{innerTransport}</Text>
      </Text>
      <Text style={styles.sectionLabel}>
        Điểm xuất phát: <Text style={{fontWeight:"bold", color: isHome ? "#00b496" : "#156ff4"}}>{baseLocation.label}</Text>
      </Text>
      {loading && (
        <ActivityIndicator color="#2196f3" style={{marginVertical:18}} />
      )}
      {aiData && (
        <View>
          <Text style={styles.sectionLabel}>Chặng di chuyển chính:</Text>
          {aiData.mainLeg &&
            <View style={styles.mainLegCard}>
              <Text style={styles.legTitle}><Text style={{color:"#2176be"}}>{aiData.mainLeg.from}</Text> → <Text style={{color:"#218d69"}}>{aiData.mainLeg.to}</Text> ({aiData.mainLeg.transport})</Text>
              <Text style={styles.legInfo}>
                <Ionicons name="swap-vertical" size={16} color="#888" /> {aiData.mainLeg.distance}, 
                <Ionicons name="time-outline" size={16} color="#f2942e" /> {aiData.mainLeg.duration},
                <MaterialCommunityIcons name="cash" size={15} color="#14843e" /> {aiData.mainLeg.cost?.toLocaleString()} VNĐ
              </Text>
              {aiData.mainLeg.note && <Text style={styles.legNote}>{aiData.mainLeg.note}</Text>}
            </View>
          }
          <Text style={styles.sectionLabel}>Các chặng nội thành:</Text>
          <View style={styles.legList}>
            {aiData.legs?.map((leg, idx) => (
              <View key={idx} style={styles.legCard}>
                <Text style={styles.legTitle}>Chặng {idx+1}: <Text style={{color:"#2176be", fontWeight:"bold"}}>{leg.from}</Text> → <Text style={{color:"#218d69"}}>{leg.to}</Text> ({leg.transport})</Text>
                <Text style={styles.legInfo}>
                  <Ionicons name="swap-vertical" size={16} color="#888" /> {leg.distance}, 
                  <Ionicons name="time-outline" size={16} color="#f2942e" /> {leg.duration},
                  <MaterialCommunityIcons name="cash" size={15} color="#14843e" /> {leg.cost?.toLocaleString()} VNĐ
                </Text>
                {leg.note && <Text style={styles.legNote}>{leg.note}</Text>}
              </View>
            ))}
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryHead}>Tổng di chuyển:</Text>
            <Text style={styles.summary}>🛣 Tổng thời gian: <Text style={{fontWeight:"bold", color:"#1976d2"}}>{aiData.totalTime}</Text></Text>
            <Text style={styles.summary}>💸 Tổng chi phí: <Text style={{fontWeight:"bold", color:"#248a3b"}}>{aiData.totalCost?.toLocaleString()} VNĐ</Text></Text>
            {aiData.summary && <Text style={styles.summary}>{aiData.summary}</Text>}
          </View>
        </View>
      )}
      {!loading && !aiData && (
        <Text style={{ color: "#888", marginTop: 32, alignSelf: "center" }}>Chưa có dữ liệu lộ trình.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor:"#f8fafb" },
  container: { padding: 20, flexGrow:1 },
  header: { fontWeight:"bold", fontSize:19, color:"#1273d4", marginBottom:13, alignSelf:"center" },
  vehicle: { color:"#1676c1", fontWeight:"600", fontSize:16, marginBottom:6 },
  sectionLabel: { fontSize: 15, fontWeight: "600", color: "#3373da", marginTop: 12, marginBottom: 7 },
  mainLegCard: { marginBottom:14, backgroundColor:"#f7fafd", borderRadius:12, padding:12, shadowColor:"#ddd", elevation:2, borderLeftWidth:5, borderLeftColor:"#61b1e9" },
  legList: { marginTop: 5 },
  legCard: { marginBottom:12, backgroundColor:"#fff", borderRadius:12, padding:12, shadowColor:"#f2f2f2", elevation:2, borderLeftWidth:4, borderLeftColor:"#18a9ef" },
  legTitle: { fontSize:15, fontWeight:"bold", color:"#194a93" },
  legInfo: { fontSize:14, color:"#157f33", marginTop:2 },
  legNote: { color:"#795008", fontSize:13, fontStyle:"italic", marginTop:1 },
  summaryBox: { marginTop:18, backgroundColor:"#e5f6fb", borderRadius:13, padding:12, borderLeftWidth:5, borderLeftColor:"#17b1e7" },
  summaryHead: { fontWeight:"bold", fontSize:15, marginBottom:2, color:"#1a7ddd" },
  summary: { color:"#2d3748", marginTop:1 },
});

export default MoveTabScreen;
