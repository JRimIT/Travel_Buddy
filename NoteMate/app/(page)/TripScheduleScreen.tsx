import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome,
  Feather,
} from "@expo/vector-icons";
import { useSelector } from "react-redux";
import HotelTab from "../../components/RouteTabsSchedule/HotelTab";
import DaySchedule from "../../components/RouteTabsSchedule/DaySchedule";
import MoveTab from "../../components/RouteTabsSchedule/MoveTab";

const screenWidth = Dimensions.get("window").width;


const daysData = [
  {
    day: 1,
    date: "16/10/2025",
    activities: [
      { time: "08:00", name: "🌅 Đến sân bay Nội Bài" },
      { time: "12:00", name: "🍜 Thưởng thức bún chả" },
      { time: "15:00", name: "🏙️ Tham quan phố cổ" },
    ],
  },
  {
    day: 2,
    date: "17/10/2025",
    activities: [
      { time: "09:00", name: "☕ Cafe check-in sống ảo" },
      { time: "14:00", name: "🚴‍♂️ Lái xe quanh Hồ Tây" },
    ],
  },
];

const TripScheduleScreen = () => {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "days", title: "Lịch trình" },
    { key: "hotel", title: "Khách sạn" },
    { key: "move", title: "Di chuyển" },
    { key: "cost", title: "Quỹ tiền" },
  ]);
  const [days, setDays] = useState(daysData);
  const budgetHotel = useSelector((state:any) => state.inforUserTravel.userHotelBudget);
  const budgetFlight = useSelector((state:any) => state.inforUserTravel.userFlightBudget);
  const budgetFun = useSelector((state:any) => state.inforUserTravel.userFunBudget);


  
  const addActivity = (dayIdx) => {
    // Ở đây demo, thực tế nên mở Modal nhập time + name
    const newDays = [...days];
    newDays[dayIdx].activities.push({
      time: "20:00",
      name: "🛀 Thư giãn tại khách sạn",
    });
    setDays(newDays);
  };

  
  const renderDaySchedule = (d, idx) => (
    
    <DaySchedule/>
  );


  const DaysRoute = () => (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.sectionHeader}>Lịch trình từng ngày</Text>
      <DaySchedule/>
    </ScrollView>
  );

  
  const HotelRoute = () => (
   
    <HotelTab />
  );

  // Tab Di chuyển
  const MoveRoute = () => (

      <MoveTab/>
      
  );

  // Tab Quỹ tiền: card nổi và shadow vàng
  const CostRoute = () => (
    <ScrollView contentContainerStyle={styles.infoTabBox}>
      <View
        style={[
          styles.infoCard,
          { backgroundColor: "#fff6db", borderColor: "#ffecb3" },
        ]}
      >
        <MaterialCommunityIcons
          name="cash-multiple"
          size={37}
          color="#f4b400"
          style={{ marginBottom: 7 }}
        />
        <Text style={[styles.infoCardTitle, { color: "#b67c10" }]}>
          Quỹ chi tiêu
        </Text>
        <Text style={styles.infoField}>
          Khách sạn: <Text style={styles.boldText}>{budgetHotel} VNĐ</Text>
        </Text>
        <Text style={styles.infoField}>
          Vé máy bay: <Text style={styles.boldText}>
            {budgetFlight} VNĐ</Text>
        </Text>
        <Text style={styles.infoField}>
          Quỹ đi chơi: <Text style={styles.boldText}>{budgetFun} VNĐ</Text>
        </Text>
        <TouchableOpacity style={styles.resetBtn}>
          <Ionicons name="refresh-outline" size={17} color="#e53935" />
          <Text style={{ color: "#e53935", marginLeft: 7, fontWeight: "600" }}>
            Thiết lập lại
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderScene = SceneMap({
    days: DaysRoute,
    hotel: HotelRoute,
    move: MoveRoute,
    cost: CostRoute,
  });

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: screenWidth }}
      renderTabBar={(props) => (
        <TabBar
          {...props}
          scrollEnabled
          indicatorStyle={{
            backgroundColor: "#2188ea",
            height: 4,
            borderRadius: 3,
          }}
          style={{ backgroundColor: "#edf7ff", shadowOpacity: 0.07 }}
          activeColor="#2188ea"
          inactiveColor="#7a8dae"
        //   renderLabel={({ route, focused }) => (
        //     <Text
        //       style={{
        //         color: focused ? "#1694d1" : "#a1adc8",
        //         fontWeight: "bold",
        //         fontSize: 15,
        //       }}
        //     >
        //       {route.title}
        //     </Text>
        //   )}
        />
      )}
    />
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    color: "#2188ea",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 18,
    letterSpacing: 0.1,
  },
  dayCard: {
    backgroundColor: "#f8fcff",
    borderRadius: 22,
    padding: 21,
    marginBottom: 25,
    elevation: 7,
    shadowColor: "#1768e4",
    shadowOpacity: 0.19,
    shadowRadius: 14,
    borderWidth: 1,
    borderColor: "#c6e2ff",
  },
  dayHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  dayBadge: {
    backgroundColor: "#2188ea",
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 13,
    marginRight: 11,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  dayBadgeText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  dayLabel: { color: "#1694d1", fontWeight: "700", fontSize: 15 },
  dayDate: { color: "#607a9b", fontSize: 14, marginTop: 1 },
  circleAddBtn: {
    backgroundColor: "#28a52a",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 99,
    width: 38,
    height: 38,
    position: "absolute",
    right: 4,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 7,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 7,
    marginBottom: 2,
    shadowColor: "#baddff",
    elevation: 1,
  },
  timeBox: {
    flexDirection: "row",
    alignItems: "center",
    width: 66,
    backgroundColor: "#e8f3fb",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 9,
  },
  timeText: {
    color: "#3697f7",
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 6,
  },
  actText: { color: "#384655", fontSize: 15, fontWeight: "500" },

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

  editBtn: {
    flexDirection: "row",
    marginTop: 22,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#e8f1fa",
    alignItems: "center",
    elevation: 2,
  },
  resetBtn: {
    flexDirection: "row",
    marginTop: 25,
    alignItems: "center",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "#ffedf2",
    elevation: 2,
  },
});

export default TripScheduleScreen;
