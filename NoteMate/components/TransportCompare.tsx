import React, { useState } from "react";
import { View, Button, FlatList, Text, Alert } from "react-native";
import createDetailStyles from "../assets/styles/detail.styles";
import { useTheme } from "../contexts/ThemeContext";
const modes = ["drive", "walk", "bicycle", "transit"];
const GEOAPIFY_KEY = process.env.GEOAPIFY_KEY || "2ad8114410b44c76baf6c71f5ab23f3a";

const getRouteInfo = async (start, end, mode) => {
  if (!start || !end) return null;
  const url = `https://api.geoapify.com/v1/routing?waypoints=${start.lat},${start.lng}|${end.lat},${end.lng}&mode=${mode}&apiKey=${GEOAPIFY_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    // Kiểm tra kết quả API
    if (!data.features || !data.features[0] || !data.features[0].properties) {
      return { mode, duration: null, distance: null, error: "Không tìm thấy route" };
    }
    return {
      mode,
      duration: data.features[0].properties.time,
      distance: data.features[0].properties.distance,
    };
  } catch (err) {
    return { mode, duration: null, distance: null, error: "API lỗi" };
  }
};


const TransportCompare = ({ start, end }) => {
    const { colors } = useTheme();
  const styles = createDetailStyles(colors);
  const [results, setResults] = useState([]);
  const compareTransport = async () => {
  if (!start || !start.lat || !start.lng || !end || !end.lat || !end.lng) {
    Alert.alert("Bạn chưa chọn đầy đủ vị trí xuất phát/đích!");
    return;
  }
  const out = await Promise.all(modes.map(mode => getRouteInfo(start, end, mode)));
  console.log("Out: ",out);
  
  setResults(out);
};
  return (
    <View style={styles.compareContainer}>
      <Button title="So sánh phương tiện" onPress={compareTransport} />
      <FlatList
        data={results}
        keyExtractor={item => item.mode}
        renderItem={({item}) => (
          <View style={styles.transportRow}>
            <Text style={styles.mode}>{item.mode}</Text>
            <Text style={styles.time}>{(item.duration/60).toFixed(1)} phút</Text>
            <Text style={styles.distance}>{(item.distance/1000).toFixed(2)} km</Text>
          </View>
        )}
      />
    </View>
  );
};
export default TransportCompare;
