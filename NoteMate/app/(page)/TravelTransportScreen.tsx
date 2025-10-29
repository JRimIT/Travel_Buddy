import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { MaterialCommunityIcons, Ionicons, FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { setUserFlightBudget, setUserTransportType, setUserTransportMain } from "../../redux/inforUserTravel/inforUserTravelSlice";
import axios from "axios";
import { API_URL } from "../../constants/api";
import { router } from "expo-router";

const formatMoney = (val) => {
  const v = val.replace(/\D/g, "");
  if (!v) return "";
  return v.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const mainTransports = [
  { key: "plane", icon: <MaterialCommunityIcons name="airplane" size={21} color="#41b1ff" />, label: "Máy bay" },
  { key: "train", icon: <FontAwesome5 name="train" size={20} color="#7c5efa" />, label: "Tàu hỏa" },
  { key: "bus", icon: <Ionicons name="bus" size={22} color="#ed881a" />, label: "Xe khách" },
];
const vehicles = [
  { key: "bike", icon: <Ionicons name="bicycle-outline" size={26} color="#33bc7f" />, label: "Xe máy" },
  { key: "car", icon: <MaterialCommunityIcons name="car" size={26} color="#3b6bb3" />, label: "Ô tô" },
  { key: "other", icon: <FontAwesome name="question" size={25} color="#ea5d4b" />, label: "Khác" },
];
const transportIcons = {
  "Máy bay": <MaterialCommunityIcons name="airplane" size={24} color="#41b1ff" />,
  "Tàu hỏa": <FontAwesome5 name="train" size={20} color="#7c5efa" />,
  "Xe khách": <Ionicons name="bus" size={22} color="#ed881a" />,
  "Taxi":  <Ionicons name="car-outline" size={22} color="#3682e2" />,
  "Xe máy": <Ionicons name="bicycle-outline" size={22} color="#33bc7f" />,
  "Ô tô": <MaterialCommunityIcons name="car" size={22} color="#3b6bb3" />,
  "Xe bus": <Ionicons name="bus" size={22} color="#2295BA" />,
  "Xe đạp": <FontAwesome5 name="bicycle" size={20} color="#30bc3e" />,
  "Xe điện": <Ionicons name="train-outline" size={22} color="#54c4fa" />,
};

const AISuggestGo = ({ goOptions, recommendGo, warningGo }) => (
  <View>
    <Text style={styles.sectionLabel}>Đề xuất phương tiện từ vị trí hiện tại đến nơi đến:</Text>
    {goOptions?.map((opt, i) => (
      <Text key={i} style={{color: !opt.possible ? "#ed334d" : "#2196f3", fontWeight: !opt.possible ? "bold" : "normal", marginBottom: 2}}>
        {transportIcons[opt.name] || ""} {opt.name} – Trung bình: {opt.avgCost?.toLocaleString()} VNĐ {opt.possible ? "(đủ tiền)" : "(thiếu tiền)"}
        {opt.reason && <Text style={{color:"#225545"}}> ({opt.reason})</Text>}
      </Text>
    ))}
    {recommendGo && (
      <Text style={{color: "#133bb8", fontWeight: "bold", marginTop:10}}>
        {transportIcons[recommendGo.name]} Nên đi: {recommendGo.name}. {recommendGo.reason}
      </Text>
    )}
    {warningGo && (
      <Text style={styles.warning}>{warningGo}</Text>
    )}
  </View>
);

const AISuggestInner = ({ innerMoveOptions, recommendInner, warningInner, specialTips }) => (
  <View style={{marginTop:12}}>
    <Text style={styles.sectionLabel}>Phương tiện đi lại nội thành tại điểm đến:</Text>
    {innerMoveOptions?.map((opt, i) => (
      <Text key={i} style={{color: !opt.possible ? "#e8672d" : "#0b9448", fontWeight: !opt.possible ? "bold" : "normal", marginBottom: 3}}>
        {transportIcons[opt.name] || ""} {opt.name} {opt.possible ? "" : "(Ngân sách yếu/ít khả thi)"} {opt.reason && <Text style={{color:"#935804"}}> ({opt.reason})</Text>}
      </Text>
    ))}
    {recommendInner && (
      <Text style={{color: "#165b7a", fontWeight: "bold", marginTop:10}}>
        {transportIcons[recommendInner.name]} Nên đi lại nội thành bằng: {recommendInner.name}. {recommendInner.reason}
      </Text>
    )}
    {warningInner && (
      <Text style={styles.warning}>{warningInner}</Text>
    )}
    {specialTips && specialTips.length > 0 && (
      <View style={styles.tipsAI}>
        <Text style={styles.tipsLabel}>Đặc biệt nên thử:</Text>
        {specialTips.map((tip, i) =>
          <Text key={i} style={styles.tipItem}>- {tip}</Text>
        )}
      </View>
    )}
  </View>
);

const AITimeline = ({ segments, warning, tips }) => (
  <View>
    <Text style={styles.sectionLabel}>Lộ trình di chuyển AI đề xuất:</Text>
    {segments?.map((seg, idx) => (
      <View style={styles.segmentCard} key={idx}>
        <Text style={styles.segTitle}>{seg.from} → {seg.to}</Text>
        <Text style={styles.segTransport}>
          {transportIcons[seg.suggestedTransport] || ""} <Text style={{ color: "#238cf1", fontWeight: "bold" }}>{seg.suggestedTransport}</Text>
          {typeof seg.cost === "number" ? <Text style={{ color: "#176c37" }}> • {seg.cost.toLocaleString()} VNĐ</Text> : ""}
        </Text>
        <Text style={styles.segReason}>{seg.reason}</Text>
      </View>
    ))}
    {warning && (
      <Text style={styles.warningAI}>{warning}</Text>
    )}
    {tips && tips.length ?
      <View style={styles.tipsAI}>
        <Text style={styles.tipsLabel}>Đặc biệt nên thử:</Text>
        {tips.map((tip, i) =>
          <Text key={i} style={styles.tipItem}>- {tip}</Text>
        )}
      </View>
      : null}
  </View>
);

const TravelTransportScreen = () => {
  const [flightBudget, setFlightBudget] = useState("");
  const [destination, setDestination] = useState("");
  const [aiAutoSuggest, setAIAutoSuggest] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const [selectedMainTransport, setSelectedMainTransport] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [customVehicle, setCustomVehicle] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [showAISuggestion, setShowAISuggestion] = useState(true);

  const dispatch = useDispatch();
  const hotel = useSelector((state:any) => state.inforUserTravel.userInforHotel || {});
  const activities = useSelector((state:any) => state.inforUserTravel.userPlaygrounds) || [];
  const userPreferences = useSelector((state:any) => state.inforUserTravel.userPreferences) || [];
  const currentLocation = useSelector((state:any) => state.inforUserTravel.userCurrentLocation);

  const aiDebounceTimer = useRef(null);

  useEffect(() => {
    setSelectedMainTransport(""); setAIAutoSuggest(null);
    if (!flightBudget || !destination) return;
    if (aiDebounceTimer.current) clearTimeout(aiDebounceTimer.current);
    aiDebounceTimer.current = setTimeout(() => {
      setLoadingAI(true);
      axios.post(`${API_URL}/AI/suggest-transport-auto`, {
        budget: flightBudget.trim().replace(/\D/g, ""),
        fromLocation: currentLocation,
        destination,
        hotel,
        activities,
        userPreferences
      })
        .then(res => setAIAutoSuggest(res.data))
        .catch(() => setAIAutoSuggest(null))
        .finally(() => setLoadingAI(false));
    }, 600);
    return () => { if (aiDebounceTimer.current) clearTimeout(aiDebounceTimer.current); };
  }, [flightBudget, destination]);

  let overrideWarning = "";
  if (selectedMainTransport && aiAutoSuggest?.goOptions) {
    const label = mainTransports.find(v => v.key === selectedMainTransport)?.label;
    const opt = aiAutoSuggest.goOptions?.find(o => o.name === label);
    if (opt && !opt.possible) {
      overrideWarning = `Cảnh báo: Số tiền hiện tại KHÔNG ĐỦ để đi ${label}!`;
    }
  }

  const handleSave = () => {
    dispatch(setUserFlightBudget(flightBudget ? formatMoney(flightBudget) : "0"));
    dispatch(setUserTransportType(selectedVehicle === "other" ? customVehicle : selectedVehicle));
    dispatch(setUserTransportMain(selectedMainTransport));
    setIsSaved(true);
    setShowAISuggestion(false);
  };

  const handleAISuggestion = async () => {
    setIsLoadingTimeline(true);
    setAiSuggestion(null);
    setShowAISuggestion(true);
    try {
      const res = await axios.post(
        `${API_URL}/AI/suggest-transport`,
        {
          budget: flightBudget,
          destination,
          hotel,
          activities,
          userPreferences,
        }
      );
      setAiSuggestion(res.data);
    } catch (err) {
      Alert.alert("Lỗi", "Không thể lấy dữ liệu AI. Thử lại sau.");
    }
    setIsLoadingTimeline(false);
  };

  useEffect(() => { setIsSaved(false); setAiSuggestion(null); }, [selectedMainTransport, selectedVehicle, customVehicle]);

  return (
    <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <Text style={styles.header}>Thông Tin Di Chuyển Chuyến Du Lịch</Text>
        <Text style={styles.subLabel}>Nhập điểm đến:</Text>
        <TextInput
          style={styles.customInput}
          placeholder="Ví dụ: Đà Nẵng"
          value={destination}
          onChangeText={setDestination}
          maxLength={30}
        />
        <Text style={styles.labelAI}>Nhập quỹ tiền cho di chuyển</Text>
        <View style={styles.moneyBox}>
          <TextInput
            style={styles.moneyInput}
            placeholder="Nhập số VNĐ"
            keyboardType="number-pad"
            value={formatMoney(flightBudget)}
            onChangeText={t => setFlightBudget(t.replace(/\D/g, ""))}
            maxLength={12}
          />
          <Text style={styles.vndSuffix}>VNĐ</Text>
        </View>
        {loadingAI && <ActivityIndicator color="#2196f3" style={{ marginTop: 15, marginBottom: 10 }} />}
        {aiAutoSuggest && (
          <View style={styles.resultBox}>
            <AISuggestGo goOptions={aiAutoSuggest.goOptions} recommendGo={aiAutoSuggest.recommendGo} warningGo={aiAutoSuggest.warningGo} />
            <AISuggestInner innerMoveOptions={aiAutoSuggest.innerMoveOptions} recommendInner={aiAutoSuggest.recommendInner} warningInner={aiAutoSuggest.warningInner} specialTips={aiAutoSuggest.specialTips} />
            {aiAutoSuggest.summary && (
              <Text style={[styles.summaryTxt, {marginTop:10}]}>{aiAutoSuggest.summary}</Text>
            )}
          </View>
        )}
        <Text style={styles.sectionLabel}>Bạn muốn chọn phương tiện nào?</Text>
        <View style={styles.vehiclesRow}>
          {mainTransports.map(v => (
            <TouchableOpacity
              key={v.key}
              style={[styles.mainVehicleBtn, selectedMainTransport === v.key && styles.vehicleBtnActive]}
              onPress={() => setSelectedMainTransport(v.key)}
              activeOpacity={0.87}
            >
              {v.icon}
              <Text style={styles.vehicleText}>{v.label}</Text>
              {selectedMainTransport === v.key &&
                <Ionicons name="checkmark-circle" size={17} color="#2f93e1" style={{ position: "absolute", top: 8, right: 7 }} />
              }
            </TouchableOpacity>
          ))}
        </View>
        {overrideWarning && (
          <Text style={styles.overrideWarn}>{overrideWarning}</Text>
        )}
        <Text style={styles.sectionLabel}>Chọn phương tiện di chuyển tại nơi đến</Text>
        <View style={styles.vehiclesRow}>
          {vehicles.map(v => (
            <TouchableOpacity
              key={v.key}
              style={[
                styles.vehicleBtn,
                selectedVehicle === v.key && styles.vehicleBtnActive,
              ]}
              onPress={() => { setSelectedVehicle(v.key); if (v.key !== "other") setCustomVehicle(""); }}
              activeOpacity={0.85}
            >
              {v.icon}
              <Text style={styles.vehicleText}>{v.label}</Text>
              {selectedVehicle === v.key && (
                <Ionicons name="checkmark-circle" size={18} color="#2f93e1" style={{ position: "absolute", top: 10, right: 8 }} />
              )}
            </TouchableOpacity>
          ))}
        </View>
        {selectedVehicle === "other" && (
          <View style={styles.customBox}>
            <Text style={styles.subLabel}>Nhập phương tiện của bạn:</Text>
            <TextInput
              style={styles.customInput}
              placeholder="Ví dụ: Taxi, xe bus, xe điện..."
              placeholderTextColor="#bebebe"
              value={customVehicle}
              onChangeText={setCustomVehicle}
              maxLength={30}
            />
          </View>
        )}
        <TouchableOpacity
  style={[
    styles.saveContinueBtn,
    (
      !flightBudget ||
      !destination ||
      (selectedVehicle === "other" && !customVehicle) ||
      (!selectedVehicle)
    ) && { opacity: 0.4 }
  ]}
  disabled={
    !flightBudget ||
    !destination ||
    (selectedVehicle === "other" && !customVehicle) ||
    (!selectedVehicle)
  }
  onPress={handleSave}
>
  <Ionicons name="save" size={20} color="#fff" />
  <Text style={styles.saveContinueText}>Lưu và Tiếp tục</Text>
</TouchableOpacity>
        {isSaved && (
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => {
              router.push("/TripScheduleScreen");
            }}
          >
            <Ionicons name="checkmark-done-circle" size={22} color="#fff" />
            <Text style={styles.confirmText}>Hoàn tất & Xem lịch trình</Text>
          </TouchableOpacity>
        )}
        {isSaved && (
          <TouchableOpacity
            style={[styles.aiBtn, isLoadingTimeline && { opacity: 0.7 }]}
            onPress={handleAISuggestion}
            disabled={isLoadingTimeline}
          >
            {isLoadingTimeline ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>AI Đề xuất lộ trình thông minh</Text>
            )}
          </TouchableOpacity>
        )}
        {aiSuggestion && showAISuggestion && (
          <View style={styles.suggestionBox}>
            <View style={{flexDirection: "row", alignItems: "center", justifyContent: "space-between"}}>
              <Text style={styles.sectionLabel}>Kịch bản AI gợi ý:</Text>
              <TouchableOpacity onPress={() => setShowAISuggestion(false)}>
                <Ionicons name="close-circle" size={22} color="#6175a1" />
              </TouchableOpacity>
            </View>
            <AITimeline
              segments={aiSuggestion.segments}
              warning={aiSuggestion.warning}
              tips={aiSuggestion.specialTips}
            />
            {!!aiSuggestion.summary && <Text style={styles.summaryTxt}>{aiSuggestion.summary}</Text>}
          </View>
        )}
        {aiSuggestion && !showAISuggestion && (
          <TouchableOpacity onPress={() => setShowAISuggestion(true)} style={styles.reopenAIBtn}>
            <Ionicons name="information-circle-outline" size={19} color="#22a3e2" />
            <Text style={{color: "#1b6da3", marginLeft: 5, fontWeight: "bold"}}>Xem lại AI gợi ý</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

// ------------ STYLES giữ nguyên, như trước -----------
const styles = StyleSheet.create({
  scroll: { backgroundColor: "#f7fafc", flex: 1 },
  container: { flex: 1, padding: 18, backgroundColor:"#f7fafc" },
  header: { fontSize: 23, fontWeight: "bold", color: "#2586eb", alignSelf: "center", marginVertical: 20 },
  subLabel: { color: "#0e233d", fontSize: 15, fontWeight: "600", marginVertical: 3, marginLeft: 2 },
  labelAI: { color: "#1e3d77", fontWeight: "bold", marginTop:12, marginBottom:3 },
  customInput: {
    borderColor: "#c0d6ea", borderWidth: 1.2, backgroundColor: "#f9fcff",
    borderRadius: 12, fontSize: 17, color: "#156ff4", paddingHorizontal: 12,
    paddingVertical: 8, marginBottom: 13, fontWeight: "500"
  },
  moneyBox: { flexDirection:"row", alignItems:"center", borderRadius:10, borderColor:"#d3eaf8", borderWidth:1.1, backgroundColor:"#eaf7fd", marginBottom:14 },
  moneyInput: { fontSize:17, color:"#1b80d7", padding:10, flex:1, fontWeight:"bold", backgroundColor:"transparent" },
  vndSuffix: { fontSize:17, color:"#1caf7a", fontWeight:"bold", marginRight:15 },
  resultBox: { backgroundColor:"#eafef4", borderRadius:14, padding:14, marginTop:6, borderLeftWidth:6, borderLeftColor:"#1593e1", elevation:2, shadowColor:"#c7daf6", marginBottom:10 },
  resultTitle: { fontSize:17, fontWeight:"bold", color: "#2176ba", marginBottom:5 },
  resultReason: { fontSize:15, fontStyle:"italic", color:"#1d430e", marginBottom:7 },
  warning: { color:"#ed334d", fontWeight:"bold", marginTop:10, fontSize:15 },
  overrideWarn: { color:"#e72e48", fontWeight:"bold", marginTop: 6, fontSize:15 },
  sectionLabel: { fontSize: 15, fontWeight: "600", color: "#3373da", marginTop: 8, marginBottom: 7 },
  vehiclesRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 13 },
  mainVehicleBtn: {
    flex: 1, alignItems: "center", backgroundColor: "#f8fbfe", borderRadius: 14,
    paddingVertical: 15, marginHorizontal: 3, elevation: 1, borderWidth: 2, borderColor: "#d3dbe8", position: "relative"
  },
  vehicleBtn: {
    flex: 1, alignItems: "center", backgroundColor: "#fff", borderRadius: 14,
    paddingVertical: 18, marginHorizontal: 3, elevation: 2, borderWidth: 2, borderColor: "#d3dbe8", position: "relative"
  },
  vehicleBtnActive: { borderColor: "#3479F6", backgroundColor: "#e8f1ff", shadowColor: "#4dc5fa", elevation: 8 },
  vehicleText: { color: "#276ef1", fontWeight: "600", marginTop: 7, fontSize: 15 },
  customBox: { backgroundColor: "#fff", borderRadius: 14, padding: 12, paddingBottom: 5, marginBottom: 15, marginTop: 2, borderWidth: 1.2, borderColor: "#e9e9ef", elevation: 2 },
  submitBtn: { marginTop: 10, backgroundColor: "#2196f3", padding: 16, borderRadius: 19, alignItems: "center", elevation: 2, shadowColor: "#2196f3" },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 17, letterSpacing: 1.1 },
  aiBtn: { backgroundColor: "#2586eb", borderRadius: 13, padding: 13, minHeight: 48, alignItems: "center", marginBottom: 9, marginTop: 9, shadowColor: "#1593e1", elevation: 4 },
  suggestionBox: { backgroundColor: "#f2fff8", padding: 13, borderRadius: 14, marginBottom: 11, marginTop: 2, borderLeftWidth: 4, borderLeftColor: "#179bf4" },
  segmentCard: { backgroundColor:"#fff", borderRadius:12, padding:12, marginBottom:7, marginTop:3, borderLeftWidth:4, borderLeftColor:"#238cf1" },
  segTitle: { color:"#3373da", fontWeight:"bold", fontSize:15 },
  segTransport: { fontSize:15, marginTop:3, marginLeft:2 },
  segReason: { color:"#086024", fontStyle:"italic", marginTop:2, fontSize:14 },
  warningAI: { color: "#ff4242", fontWeight:"bold", marginTop:7, fontSize:15 },
  tipsAI: {marginTop:8, backgroundColor:"#feffef", padding:9, borderRadius:9},
  tipsLabel: {color:"#ef9202", fontWeight:"bold"},
  tipItem: {color:"#ef9202", marginLeft:3},
  summaryTxt: {fontStyle:'italic', color:'#343990', marginTop:7},
  reopenAIBtn: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", backgroundColor: "#edf8fe", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 11, marginTop: 5 },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1976d2",
    borderRadius: 18,
    paddingVertical: 14,
    marginTop: 21,
    marginBottom: 18,
    shadowColor: "#1781d9",
    elevation: 5,
  },
  confirmText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
    marginLeft: 8,
    letterSpacing: 1,
  },
  saveContinueBtn: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#2196f3",
  borderRadius: 12,
  paddingVertical: 13,
  marginVertical: 16,
  elevation: 2,
  shadowColor: "#2196f3",
},
saveContinueText: {
  color: "#fff",
  fontWeight: "bold",
  fontSize: 16,
  marginLeft: 8,
  letterSpacing: 1,
},

});

export default TravelTransportScreen;
