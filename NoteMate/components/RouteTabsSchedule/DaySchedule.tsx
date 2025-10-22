import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useDispatch } from "react-redux";
import { set } from "lodash";
import { setUserSchedule } from "../../redux/inforUserTravel/inforUserTravelSlice";

const GEOAPIFY_KEY =
  process.env.GEOAPIFY_KEY || "2ad8114410b44c76baf6c71f5ab23f3a";
const category = "entertainment";

// Đề xuất mẫu từ hệ thống
const SUGGESTED_ACTS = [
  "Đi dạo công viên",
  "Thưởng thức cà phê view đẹp",
  "Ghé khu trò chơi giải trí",
  "Mua sắm trong TTTM",
  "Chụp ảnh check-in",
  "Ăn đặc sản địa phương",
  "Tham quan bảo tàng",
];

const DaySchedule = () => {
  const [places, setPlaces] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalShow, setModalShow] = useState(false);
  const [modalDayIdx, setModalDayIdx] = useState(0);
  const [actInput, setActInput] = useState("");
  const [actPriceInput, setActPriceInput] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [chosenDate, setChosenDate] = useState(new Date());

  const [updateModalShow, setUpdateModalShow] = useState(false);
  const [updateDayIdx, setUpdateDayIdx] = useState(0);
  const [updateActIdx, setUpdateActIdx] = useState(0);
  const [editName, setEditName] = useState("");
  const [editMoney, setEditMoney] = useState("");
  const [editDate, setEditDate] = useState(new Date());
  const [showEditTimePicker, setShowEditTimePicker] = useState(false);

  const numDays = useSelector(
    (state: any) => state.inforUserTravel.userTravelDays
  );
  const funBudget = useSelector(
    (state: any) => state.inforUserTravel.userFunBudget
  );
  const fundNumber = funBudget ? parseInt(funBudget.replace(/\./g, "")) : 0;
  const lat = useSelector(
    (state: any) => state.inforUserTravel.userProvince.latitude
  );
  const lng = useSelector(
    (state: any) => state.inforUserTravel.userProvince.longitude
  );

  const userSchedule = useSelector(
    (state: any) => state.inforUserTravel.userSchedule
  );

  const dispatch = useDispatch();
  // Hàm random price KHÔNG còn dùng khi add mới nữa
  const randomPrice = () => 50000 + Math.floor(Math.random() * 12) * 25000;
  const formatMoney = (val) => {
    const v = val.replace(/\D/g, "");
    if (!v) return "";
    return v.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };
  function autoArrangeSchedule(places, numDays, fund) {
    const dailyBudget = Math.floor(fund / numDays);
    let idx = 0;
    const grouped = [];
    for (let day = 1; day <= numDays; day++) {
      let thisDayBudget = dailyBudget;
      const activities = [];
      while (idx < places.length && thisDayBudget > 0) {
        const price = places[idx].price || randomPrice();
        if (price <= thisDayBudget) {
          activities.push({
            name:
              places[idx].properties.name || places[idx].properties.formatted,
            time: `${9 + activities.length}:00`,
            place: places[idx],
            cost: price,
          });
          thisDayBudget -= price;
          idx += 1;
        } else {
          idx += 1;
        }
      }
      grouped.push({ day, date: "", activities });
    }
    return grouped;
  }

  // Mở modal add, truyền index ngày
  const openAddModal = (idx) => {
    setModalDayIdx(idx);
    setActInput("");
    setActPriceInput("");
    setChosenDate(new Date());
    setModalShow(true);
  };

  const updateScheduleAndDispatch = (newSchedule) => {
    setSchedule(newSchedule);
    dispatch(setUserSchedule(newSchedule));
  };

  const removeActivity = (dayIdx, actIdx) => {
    const newSchedule = schedule.map((d, idx) =>
      idx === dayIdx
        ? { ...d, activities: d.activities.filter((_, i) => i !== actIdx) }
        : d
    );
    updateScheduleAndDispatch(newSchedule);
  };

  const handleAddActivity = () => {
    if (!actInput.trim() || !actPriceInput.trim()) return;
    const parseTime = (timeStr) => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };
    const newSchedule = schedule.map((d, idx) => {
      if (idx !== modalDayIdx) return d;
      const newActs = [
        ...d.activities,
        {
          name: actInput.trim(),
          time:
            chosenDate.getHours().toString().padStart(2, "0") +
            ":" +
            chosenDate.getMinutes().toString().padStart(2, "0"),
          cost: parseInt(actPriceInput.replace(/\./g, "")),
          place: {},
        },
      ];
      newActs.sort((a, b) => parseTime(a.time) - parseTime(b.time));
      return { ...d, activities: newActs };
    });
    updateScheduleAndDispatch(newSchedule);
    setModalShow(false);
  };

  // Thêm gợi ý vào input
  const pickSuggest = (txt) => setActInput(txt);

  const fetchPlacesWithPrice = async (lat, lng, category) => {
    const url = `https://api.geoapify.com/v2/places?categories=${category}&filter=circle:${lng},${lat},2000&limit=18&apiKey=${GEOAPIFY_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.features || []).map((item) => ({
      ...item,
      price: randomPrice(),
    }));
  };

  useEffect(() => {
    if (userSchedule && userSchedule.length > 0) {
      setSchedule(userSchedule);
      setLoading(false);
    } else {
      setLoading(true);
      fetchPlacesWithPrice(lat, lng, category).then((data) => {
        setPlaces(data);
        setLoading(false);
      });
    }
  }, [userSchedule, lat, lng, category]);

  useEffect(() => {
    if (
      !loading &&
      places.length > 0 &&
      numDays &&
      fundNumber > 0 &&
      (!userSchedule || userSchedule.length === 0)
    ) {
      const sch = autoArrangeSchedule(places, numDays, fundNumber);
      setSchedule(sch);
      dispatch(setUserSchedule(sch));
    }
  }, [places, loading, numDays, fundNumber, userSchedule]);

  // Tổng tiền các ngày
  const total = schedule.reduce(
    (sum, day) =>
      sum + day.activities.reduce((s2, act) => s2 + (act.cost || 0), 0),
    0
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "#348ceb", fontSize: 17, fontWeight: "600" }}>
          Đang tải địa điểm vui chơi...
        </Text>
      </View>
    );
  }
  if (!numDays || !fundNumber) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "#e75959", fontWeight: "bold", fontSize: 16 }}>
          Chưa có số ngày hoặc quỹ tiền!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f8fafd" }}>
      <Text style={styles.sectionHeader}>
        Quỹ: {fundNumber.toLocaleString()} VNĐ
      </Text>
      {/* Tổng tiền tất cả */}
      <View style={styles.totalBox}>
        <Ionicons name="wallet" size={20} color="#1db06e" />
        <Text style={styles.tongTienTxt}>Tổng tiền đã dùng: </Text>
        <Text style={styles.tongSoTienTxt}>{total.toLocaleString()} VNĐ</Text>
      </View>

      {schedule.map((d, dayIdx) => {
        // Tổng tiền 1 ngày
        const totalDay = d.activities.reduce(
          (sum, act) => sum + (act.cost || 0),
          0
        );
        return (
          <View style={styles.dayCard} key={dayIdx}>
            <View style={styles.dayHeaderRow}>
              <View style={styles.dayBadge}>
                <Ionicons name="sunny" size={21} color="#fff" />
                <Text style={styles.dayBadgeText}> {d.day} </Text>
              </View>
              <View>
                <Text style={styles.dayLabel}>Ngày {d.day}</Text>
                <Text style={styles.dayDate}>{d.date}</Text>
              </View>
              {/* Tổng tiền ngày */}
              <View style={styles.dayTotalBox}>
                <Ionicons name="pricetags-outline" size={17} color="#45d984" />
                <Text style={styles.dayTotalText}>
                  Đã dùng:{" "}
                  <Text style={{ color: "#25d975", fontWeight: "bold" }}>
                    {totalDay.toLocaleString()} VNĐ
                  </Text>
                </Text>
              </View>
            </View>
            <View style={{ marginTop: 10 }}>
              {d.activities.length === 0 ? (
                <Text style={{ color: "#bbb", marginBottom: 5 }}>
                  Chưa có hoạt động
                </Text>
              ) : (
                d.activities.map((act, actIdx) => (
                  <View style={styles.activityRow} key={actIdx}>
                    <View style={styles.timeBox}>
                      <Ionicons name="time-outline" size={15} color="#64b8f6" />
                      <Text style={styles.timeText}>{act.time}</Text>
                    </View>
                    <Text
                      style={styles.actText}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {act.name}
                    </Text>
                    <Text style={styles.priceText}>
                      {act.cost?.toLocaleString()} VNĐ
                    </Text>
                    <TouchableOpacity
                      style={styles.updateBtn}
                      onPress={() => {
                        setUpdateDayIdx(dayIdx);
                        setUpdateActIdx(actIdx);
                        setEditName(act.name);
                        setEditMoney(act.cost?.toString() || "");
                        // Parse time sang Date object cho DateTimePicker
                        const [h, m] = act.time.split(":").map(Number);
                        const d = new Date();
                        d.setHours(h);
                        d.setMinutes(m);
                        d.setSeconds(0);
                        setEditDate(d);
                        setUpdateModalShow(true);
                      }}
                    >
                      <Ionicons
                        name="create-outline"
                        size={19}
                        color="#fe941a"
                      />
                    </TouchableOpacity>
                  </View>
                ))
              )}
              {/* Nút "Thêm hoạt động" */}
              <TouchableOpacity
                style={styles.addActivityBtn}
                onPress={() => openAddModal(dayIdx)}
              >
                <Ionicons name="add-circle" size={20} color="#247ff7" />
                <Text style={styles.addActivityText}>Thêm hoạt động</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {/* MODAL THÊM HOẠT ĐỘNG */}
      <Modal
        visible={modalShow}
        transparent
        animationType="slide"
        onRequestClose={() => setModalShow(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Thêm hoạt động mới</Text>
            {/* DateTimePicker chuyên nghiệp */}
            <TouchableOpacity
              style={styles.timePickerToggle}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time" size={18} color="#3477de" />
              <Text
                style={{
                  fontWeight: "bold",
                  color: "#2b6fc9",
                  fontSize: 16,
                  marginLeft: 7,
                }}
              >
                Chọn mốc giờ
              </Text>
              <Text
                style={{
                  marginLeft: 13,
                  fontWeight: "bold",
                  color: "#3baa5a",
                  fontSize: 16,
                }}
              >
                {chosenDate.getHours().toString().padStart(2, "0") +
                  ":" +
                  chosenDate.getMinutes().toString().padStart(2, "0")}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color="#bbb"
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={chosenDate}
                mode="time"
                is24Hour={true}
                onChange={(event, selectedDate) => {
                  setShowTimePicker(false);
                  if (selectedDate) setChosenDate(selectedDate);
                }}
              />
            )}
            {/* Nhập/chọn hoạt động */}
            <TextInput
              style={styles.inputAct}
              placeholder="Nhập hoạt động..."
              value={actInput}
              onChangeText={setActInput}
              maxLength={60}
            />
            {/* Nhập số tiền hoạt động */}
            <TextInput
              style={styles.inputAct}
              placeholder="Số tiền hoạt động (VNĐ)"
              value={formatMoney(actPriceInput)}
              onChangeText={(txt) => setActPriceInput(txt.replace(/\D/g, ""))}
              keyboardType="number-pad"
              maxLength={10}
            />
            {/* ...Đề xuất hoạt động giữ nguyên */}
            <Text
              style={{
                fontWeight: "bold",
                marginBottom: 7,
                color: "#3477de",
                marginTop: 14,
              }}
            >
              Hoặc chọn nhanh hoạt động đề xuất:
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {SUGGESTED_ACTS.map((sug, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestedBtn}
                  onPress={() => pickSuggest(sug)}
                >
                  <Text style={styles.suggestedText}>{sug}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Nút hành động */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                marginTop: 17,
              }}
            >
              <TouchableOpacity
                onPress={() => setModalShow(false)}
                style={{
                  marginRight: 14,
                  paddingVertical: 7,
                  paddingHorizontal: 18,
                }}
              >
                <Text
                  style={{ color: "#444", fontWeight: "bold", fontSize: 16 }}
                >
                  Huỷ
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddActivity}
                style={[
                  styles.confirmBtn,
                  (!actInput.trim() || !actPriceInput.trim()) && {
                    opacity: 0.5,
                  },
                ]}
                disabled={!actInput.trim() || !actPriceInput.trim()}
              >
                <Ionicons name="checkmark-done" size={19} color="#fff" />
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: 16,
                    marginLeft: 7,
                  }}
                >
                  Thêm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={updateModalShow}
        transparent
        animationType="slide"
        onRequestClose={() => setUpdateModalShow(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Cập nhật hoạt động</Text>
            {/* Giờ bằng DateTimePicker */}
            <TouchableOpacity
              style={styles.timePickerToggle}
              onPress={() => setShowEditTimePicker(true)}
            >
              <Ionicons name="time" size={18} color="#3477de" />
              <Text
                style={{
                  fontWeight: "bold",
                  color: "#2b6fc9",
                  fontSize: 16,
                  marginLeft: 7,
                }}
              >
                Thay đổi mốc giờ
              </Text>
              <Text
                style={{
                  marginLeft: 13,
                  fontWeight: "bold",
                  color: "#fe941a",
                  fontSize: 16,
                }}
              >
                {editDate.getHours().toString().padStart(2, "0") +
                  ":" +
                  editDate.getMinutes().toString().padStart(2, "0")}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color="#bbb"
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>
            {showEditTimePicker && (
              <DateTimePicker
                value={editDate}
                mode="time"
                is24Hour={true}
                onChange={(event, selectedDate) => {
                  setShowEditTimePicker(false);
                  if (selectedDate) setEditDate(selectedDate);
                }}
              />
            )}
            {/* Tên hoạt động */}
            <TextInput
              style={styles.inputAct}
              placeholder="Tên hoạt động"
              value={editName}
              onChangeText={setEditName}
              maxLength={60}
            />
            {/* Số tiền hoạt động */}
            <TextInput
              style={styles.inputAct}
              placeholder="Số tiền hoạt động (VNĐ)"
              value={formatMoney(editMoney)}
              onChangeText={(txt) => setEditMoney(txt.replace(/\D/g, ""))}
              keyboardType="number-pad"
              maxLength={10}
            />
            {/* Nút cập nhật/xoá */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 18,
              }}
            >
              {/* XÓA HOẠT ĐỘNG */}
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: "#fa5252" }]}
                onPress={() => removeActivity(updateDayIdx, updateActIdx)}
              >
                <Ionicons name="trash-outline" size={17} color="#fff" />
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: 16,
                    marginLeft: 7,
                  }}
                >
                  Xoá
                </Text>
              </TouchableOpacity>
              {/* CẬP NHẬT */}
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  (!editName.trim() || !editMoney.trim()) && { opacity: 0.5 },
                ]}
                disabled={!editName.trim() || !editMoney.trim()}
                onPress={() => {
                  const parseTime = (timeStr) => {
                    const [h, m] = timeStr.split(":").map(Number);
                    return h * 60 + m;
                  };
                  // Update activity
                  const newSchedule = schedule.map((d, idx) => {
                    if (idx !== updateDayIdx) return d;
                    // Thay đổi activity trong mảng (giữ nguyên các mốc khác)
                    const newActs = d.activities.map((act, i) =>
                      i === updateActIdx
                        ? {
                            ...act,
                            name: editName.trim(),
                            cost: parseInt(editMoney.replace(/\./g, "")),
                            time:
                              editDate.getHours().toString().padStart(2, "0") +
                              ":" +
                              editDate.getMinutes().toString().padStart(2, "0"),
                          }
                        : act
                    );
                    // Sort lại theo time tăng dần
                    newActs.sort(
                      (a, b) => parseTime(a.time) - parseTime(b.time)
                    );
                    return { ...d, activities: newActs };
                  });
                  updateScheduleAndDispatch(newSchedule);
                  setUpdateModalShow(false);
                }}
              >
                <Ionicons name="create-outline" size={17} color="#fff" />
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: 16,
                    marginLeft: 7,
                  }}
                >
                  Cập nhật
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    color: "#2188ea",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 14,
    letterSpacing: 0.1,
  },
  totalBox: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#f9fff6",
    borderRadius: 13,
    paddingHorizontal: 27,
    paddingVertical: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#bbe9c2",
  },
  tongTienTxt: {
    color: "#1da765",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 10,
  },
  tongSoTienTxt: {
    color: "#2db57d",
    fontWeight: "bold",
    marginLeft: 10,
    fontSize: 17,
  },
  dayCard: {
    backgroundColor: "#f8fcff",
    borderRadius: 22,
    padding: 21,
    marginBottom: 25,
    elevation: 6,
    shadowColor: "#1768e4",
    shadowOpacity: 0.18,
    shadowRadius: 13,
    borderWidth: 1,
    borderColor: "#c6e2ff",
  },
  dayHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
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
  dayTotalBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "#eafcf1",
    borderRadius: 9,
    position: "absolute",
    right: 0,
    top: 2,
  },
  dayTotalText: {
    color: "#22a666",
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 7,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 7,
    backgroundColor: "#fff",
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 2,
    shadowColor: "#baddff",
    elevation: 1,
    minHeight: 52,
    position: "relative",
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
  actText: {
    color: "#384655",
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
    flexWrap: "wrap",
    minWidth: 30,
    marginRight: 7,
  },
  priceText: {
    color: "#27b851",
    fontWeight: "bold",
    marginLeft: 6,
    fontSize: 14,
  },
  removeBtn: {
    position: "absolute",
    right: -18,

    top: "85%",
    marginTop: -12,
    padding: 5,
    backgroundColor: "#fff0f0",
    borderRadius: 8,
    elevation: 1.5,
    zIndex: 2,
  },
  addActivityBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#e4f0ff",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginTop: 12,
    elevation: 2,
  },
  addActivityText: {
    color: "#247ff7",
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 7,
  },
  // MODAL STYLES
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(50,65,120,0.19)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 25,
    elevation: 9,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#247ff7",
    marginBottom: 16,
    textAlign: "center",
  },
  inputAct: {
    borderBottomWidth: 1.4,
    borderBottomColor: "#ddd",
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
    color: "#222",
    fontWeight: "bold",
  },
  suggestedBtn: {
    backgroundColor: "#edf6ff",
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 9,
    marginRight: 8,
    marginBottom: 8,
  },
  suggestedText: { color: "#1b5bbd", fontWeight: "600", fontSize: 15 },
  confirmBtn: {
    flexDirection: "row",
    backgroundColor: "#2196f3",
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
  },
  timePickerToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e9f2fd",
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 9,
    marginBottom: 8,
    marginTop: -4,
  },
  updateBtn: {  
    marginLeft: 7,
    padding: 5,
    backgroundColor: "#ffefd9",
    borderRadius: 8,
    elevation: 1,
  },
});

export default DaySchedule;
