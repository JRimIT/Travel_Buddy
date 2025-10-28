import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { setUserSchedule } from "../../redux/inforUserTravel/inforUserTravelSlice";
import { API_URL } from "../../constants/api";

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
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal thêm hoạt động thủ công
  const [modalShow, setModalShow] = useState(false);
  const [modalDayIdx, setModalDayIdx] = useState(0);
  const [actInput, setActInput] = useState("");
  const [actPriceInput, setActPriceInput] = useState("");
  const [chosenDate, setChosenDate] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Modal update activity
  const [updateModalShow, setUpdateModalShow] = useState(false);
  const [updateDayIdx, setUpdateDayIdx] = useState(0);
  const [updateActIdx, setUpdateActIdx] = useState(0);
  const [editName, setEditName] = useState("");
  const [editMoney, setEditMoney] = useState("");
  const [editDate, setEditDate] = useState(new Date());
  const [showEditTimePicker, setShowEditTimePicker] = useState(false);

  // Modal "Thêm hoạt động đã tích chọn"
  const [suggestModal, setSuggestModal] = useState({
    show: false,
    dayIdx: 0,
    showTime: false,
    act: null,
    time: new Date(),
    money: "",
  });

  const numDays = useSelector(
    (state: any) => state.inforUserTravel.userTravelDays
  );
  const funBudget = useSelector(
    (state: any) => state.inforUserTravel.userFunBudget
  );
  const fundNumber =
    funBudget && typeof funBudget === "string"
      ? parseInt(funBudget.replace(/\./g, ""))
      : Number(funBudget) || 0;
  const userSchedule = useSelector(
    (state: any) => state.inforUserTravel.userSchedule
  );
  const userPlaygrounds =
    useSelector((state: any) => state.inforUserTravel.userPlaygrounds) || [];
  const dispatch = useDispatch();

  // Utility
  const formatMoney = (val) => {
    const v = val.replace(/\D/g, "");
    if (!v) return "";
    return v.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // AI auto xếp lịch khi có danh sách địa điểm
  const autoArrangeWithAI = async () => {
    if (!userPlaygrounds?.length || !numDays || !fundNumber) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/AI/schedule-optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          places: userPlaygrounds,
          numDays: numDays,
          budget: fundNumber,
        }),
      });
      const data = await response.json();
      if (data.schedule) {
        setSchedule(data.schedule);
        dispatch(setUserSchedule(data.schedule));
      }
    } catch {}
    setLoading(false);
  };

  // GỌI AI tự động khi userPlaygrounds/thông tin input thay đổi
  useEffect(() => {
    if (userPlaygrounds.length > 0 && numDays && fundNumber) {
      autoArrangeWithAI();
    } else if (userSchedule && userSchedule.length > 0) {
      setSchedule(userSchedule);
      setLoading(false);
    } else {
      setSchedule([]);
      setLoading(false);
    }
  }, [userPlaygrounds, numDays, fundNumber]);

  // Sửa/thêm activity thủ công như cũ
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

  // Thêm từ đã tích chọn: submit sau khi chọn giờ/giá
  const handleAddSuggested = () => {
    if (!suggestModal.act) return;
    const name = suggestModal.act.properties?.name || suggestModal.act.name;
    const time =
      suggestModal.time.getHours().toString().padStart(2, "0") +
      ":" +
      suggestModal.time.getMinutes().toString().padStart(2, "0");
    const cost = suggestModal.money
      ? parseInt(suggestModal.money.replace(/\./g, ""))
      : suggestModal.act.price || 0;
    const newSchedule = schedule.map((d, idx) => {
      if (idx !== suggestModal.dayIdx) return d;
      const newActs = [
        ...d.activities,
        {
          name,
          time,
          cost,
          place: suggestModal.act,
        },
      ];
      newActs.sort((a, b) => {
        const [hA, mA] = a.time.split(":").map(Number);
        const [hB, mB] = b.time.split(":").map(Number);
        return hA * 60 + mA - (hB * 60 + mB);
      });
      return { ...d, activities: newActs };
    });
    updateScheduleAndDispatch(newSchedule);
    setSuggestModal({
      show: false,
      dayIdx: 0,
      showTime: false,
      act: null,
      time: new Date(),
      money: "",
    });
  };

  const pickSuggest = (txt) => setActInput(txt);

  // Xác định ngày nào đã có hoạt động
  const findDaysWithActivity = (activityName) =>
    schedule
      .filter((d) => d.activities.some((a) => a.name === activityName))
      .map((d) => d.day);

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
          Đang tải lịch trình...
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
      <View style={styles.totalBox}>
        <Ionicons name="wallet" size={20} color="#1db06e" />
        <Text style={styles.tongTienTxt}>Tổng tiền đã dùng: </Text>
        <Text style={styles.tongSoTienTxt}>{total.toLocaleString()} VNĐ</Text>
      </View>
      {schedule.map((d, dayIdx) => {
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
              <View style={styles.dayTotalBox}>
                <Ionicons name="pricetags-outline" size={17} color="#45d984" />
                <Text style={styles.dayTotalText}>
                  Đã dùng:
                  <Text style={{ color: "#25d975", fontWeight: "bold" }}>
                    {totalDay.toLocaleString()} VNĐ
                  </Text>
                </Text>
              </View>
            </View>
            <View style={{ marginTop: 10 }}>
              {d.activities.length === 0 ? (
                <View>
                  <Text style={{ color: "#bbb", marginBottom: 5 }}>
                    Chưa có hoạt động
                  </Text>
                </View>
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

              {/* Nút thêm hoạt động đã tích chọn */}
              <TouchableOpacity
                style={styles.addFromPickBtn}
                onPress={() =>
                  setSuggestModal({
                    show: true,
                    dayIdx,
                    showTime: false,
                    act: null,
                    time: new Date(),
                    money: "",
                  })
                }
              >
                <Ionicons
                  name="duplicate-outline"
                  color="#3f4c5e"
                  size={18}
                  style={{ marginRight: 7 }}
                />
                <Text style={styles.addFromPickText}>
                  Thêm từ danh sách đã chọn
                </Text>
              </TouchableOpacity>
              {/* Nút thêm hoạt động thủ công */}
              <TouchableOpacity
                style={styles.addActivityBtn}
                onPress={() => {
                  setModalDayIdx(dayIdx);
                  setActInput("");
                  setActPriceInput("");
                  setChosenDate(new Date());
                  setModalShow(true);
                }}
              >
                <Ionicons name="add-circle" size={20} color="#247ff7" />
                <Text style={styles.addActivityText}>
                  Thêm hoạt động thủ công
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
      {/* ...Modal thêm/sửa giữ nguyên như cũ, chỉ thêm styles/addFromPickBtn và addFromPickText ở trên ... */}
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
                       
            <TextInput
              style={styles.inputAct}
              placeholder="Nhập hoạt động..."
              value={actInput}
              onChangeText={setActInput}
              maxLength={60}
            />
                       
            <TextInput
              style={styles.inputAct}
              placeholder="Số tiền hoạt động (VNĐ)"
              value={formatMoney(actPriceInput)}
              onChangeText={(txt) => setActPriceInput(txt.replace(/\D/g, ""))}
              keyboardType="number-pad"
              maxLength={10}
            />
                               
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
  animationType="fade"
  onRequestClose={() => setUpdateModalShow(false)}
>
  <TouchableOpacity
    style={styles.modalBackdrop}
    activeOpacity={1}
    onPressOut={() => setUpdateModalShow(false)}
  >
    <View
      style={styles.centeredModalContent}
      // bắt touch bên trong Modal không đóng
      pointerEvents="box-none"
    >
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Cập nhật hoạt động</Text>

        {/* Thay đổi mốc giờ */}
        <TouchableOpacity
          style={styles.timePickerToggle}
          onPress={() => setShowEditTimePicker(true)}
          activeOpacity={0.72}
        >
          <Ionicons name="time" size={18} color="#3477de" />
          <Text style={styles.timeLabel}>Thay đổi mốc giờ</Text>
          <Text style={styles.timeValue}>
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

        <TextInput
          style={styles.inputAct}
          placeholder="Tên hoạt động"
          value={editName}
          onChangeText={setEditName}
          maxLength={60}
        />

        <TextInput
          style={styles.inputAct}
          placeholder="Số tiền hoạt động (VNĐ)"
          value={formatMoney(editMoney)}
          onChangeText={(txt) => setEditMoney(txt.replace(/\D/g, ""))}
          keyboardType="number-pad"
          maxLength={10}
        />

        <View style={styles.btnRowModal}>
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: "#fa5252" }]}
            onPress={() => removeActivity(updateDayIdx, updateActIdx)}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={17} color="#fff" />
            <Text style={styles.btnTextWhite}>Xoá</Text>
          </TouchableOpacity>

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
              const newSchedule = schedule.map((d, idx) => {
                if (idx !== updateDayIdx) return d;
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
                newActs.sort((a, b) => parseTime(a.time) - parseTime(b.time));
                return { ...d, activities: newActs };
              });
              updateScheduleAndDispatch(newSchedule);
              setUpdateModalShow(false);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={17} color="#fff" />
            <Text style={styles.btnTextWhite}>Cập nhật</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </TouchableOpacity>
</Modal>

      {/* Modal - Chọn hoạt động đã tích chọn */}
      <Modal
        visible={suggestModal.show}
        transparent
        animationType="fade"
        onRequestClose={() => setSuggestModal({ ...suggestModal, show: false })}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContainer, { maxHeight: "70%" }]}>
            <Text style={styles.modalTitle}>Chọn hoạt động đã tích</Text>
            <ScrollView
              showsVerticalScrollIndicator={true}
              style={{ maxHeight: "57%" }}
            >
              {userPlaygrounds
                .filter(
                  (p) =>
                    !schedule[suggestModal.dayIdx]?.activities.find(
                      (act) => act.name === (p.properties?.name || p.name)
                    )
                )
                .map((p, i) => {
                  const name = p.properties?.name || p.name;
                  const days = findDaysWithActivity(name);
                  return (
                    <TouchableOpacity
                      key={p._cardKey || i}
                      style={styles.suggestActivityCard}
                      activeOpacity={0.7}
                      onPress={() =>
                        setSuggestModal({
                          ...suggestModal,
                          act: p,
                          showTime: true,
                          time: new Date(),
                          money: p.price?.toString() || "",
                        })
                      }
                    >
                      <Text style={styles.suggestActivityTitle}>{name}</Text>
                      <Text style={styles.suggestActivityAddress}>
                        {p.properties?.address_line2}
                      </Text>
                      {typeof p.price !== "undefined" && (
                        <Text style={styles.suggestActivityCost}>
                          Giá gốc: {p.price?.toLocaleString()} VNĐ
                        </Text>
                      )}
                      {days.length > 0 && (
                        <Text style={styles.suggestActivityExisted}>
                          Đã có ở ngày: {days.join(", ")}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
            <TouchableOpacity
              style={{
                alignSelf: "center",
                marginTop: 14,
                padding: 8,
              }}
              onPress={() => setSuggestModal({ ...suggestModal, show: false })}
            >
              <Text
                style={{
                  color: "#61738d",
                  fontWeight: "bold",
                  fontSize: 15,
                }}
              >
                Đóng
              </Text>
            </TouchableOpacity>
          </View>

          {/* Step nhập giờ/tiền nhỏ gọn */}
          {suggestModal.showTime && suggestModal.act && (
            <View
              style={[
                styles.modalContainer,
                {
                  position: "absolute",
                  top: "16%",
                  width: "86%",
                  padding: 18,
                  maxHeight: 240,
                },
              ]}
            >
              <Text
                style={{
                  color: "#814731",
                  fontWeight: "bold",
                  fontSize: 15,
                  marginBottom: 8,
                }}
              >
                Thêm "
                {suggestModal.act.properties?.name || suggestModal.act.name}"
              </Text>
              <TouchableOpacity
                style={styles.timePickerToggle}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time" size={18} color="#497497" />
                <Text
                  style={{
                    marginLeft: 7,
                    fontWeight: "bold",
                    color: "#375168",
                    fontSize: 15,
                  }}
                >
                  Chọn giờ
                </Text>
                <Text
                  style={{
                    marginLeft: 10,
                    fontWeight: "bold",
                    color: "#63896b",
                    fontSize: 15,
                  }}
                >
                  {suggestModal.time.getHours().toString().padStart(2, "0") +
                    ":" +
                    suggestModal.time.getMinutes().toString().padStart(2, "0")}
                </Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={suggestModal.time}
                  mode="time"
                  is24Hour={true}
                  onChange={(event, selectedDate) => {
                    setShowTimePicker(false);
                    if (selectedDate)
                      setSuggestModal({ ...suggestModal, time: selectedDate });
                  }}
                />
              )}
              <TextInput
                style={styles.inputAct}
                placeholder="Số tiền (VNĐ)"
                value={formatMoney(suggestModal.money)}
                onChangeText={(txt) =>
                  setSuggestModal({
                    ...suggestModal,
                    money: txt.replace(/\D/g, ""),
                  })
                }
                keyboardType="number-pad"
                maxLength={10}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  marginTop: 13,
                }}
              >
                <TouchableOpacity
                  onPress={() =>
                    setSuggestModal({
                      ...suggestModal,
                      showTime: false,
                      act: null,
                      money: "",
                      time: new Date(),
                    })
                  }
                  style={{
                    marginRight: 13,
                    paddingVertical: 5,
                    paddingHorizontal: 14,
                  }}
                >
                  <Text
                    style={{
                      color: "#495270",
                      fontWeight: "bold",
                      fontSize: 15,
                    }}
                  >
                    Huỷ
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddSuggested}
                  style={[
                    styles.confirmBtn,
                    (!suggestModal.time || !suggestModal.act) && {
                      opacity: 0.7,
                    },
                  ]}
                  disabled={!suggestModal.time || !suggestModal.act}
                >
                  <Ionicons name="checkmark-done" size={19} color="#fff" />
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "bold",
                      fontSize: 15,
                      marginLeft: 7,
                    }}
                  >
                    Thêm
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    color: "#405380",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 14,
    letterSpacing: 0.2,
    textShadowColor: "#eaeaea",
    textShadowRadius: 4,
  },
  totalBox: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#f5f7fa",
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 14,
    elevation: 2,
    shadowColor: "#9bb8d7",
    shadowOpacity: 0.13,
    shadowRadius: 7,
    borderWidth: 1,
    borderColor: "#e0e6ed",
  },
  tongTienTxt: {
    color: "#495270",
    fontWeight: "bold",
    fontSize: 15.5,
    marginLeft: 8,
  },
  tongSoTienTxt: {
    color: "#63896b",
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 9,
    letterSpacing: 0.1,
  },
  dayCard: {
    backgroundColor: "#eeece6",
    borderRadius: 22,
    padding: 17,
    marginBottom: 17,
    elevation: 4,
    shadowColor: "#ccc",
    shadowOpacity: 0.13,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: "#d2d2c7",
    marginHorizontal: 7,
  },
  dayHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
    position: "relative",
    borderBottomColor: "#eee6e7",
    borderBottomWidth: 1.2,
    paddingBottom: 4,
  },
  dayBadge: {
    backgroundColor: "#814731",
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 13,
    marginRight: 9,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#bfa991",
    shadowRadius: 5,
    elevation: 1.5,
  },
  dayBadgeText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 0.3,
  },
  dayLabel: {
    color: "#375168",
    fontWeight: "700",
    fontSize: 15.5,
    marginBottom: 2,
  },
  dayDate: {
    color: "#698088",
    fontSize: 13,
    marginTop: 0,
    fontStyle: "italic",
  },
  dayTotalBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 4,
    backgroundColor: "#f1f4ee",
    borderRadius: 10,
    position: "absolute",
    right: 0,
    top: 0,
    borderWidth: 1,
    borderColor: "#abdcbf",
  },
  dayTotalText: {
    color: "#6b8b6d",
    fontSize: 13.5,
    fontWeight: "500",
    marginLeft: 6,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
    backgroundColor: "#f5f7fa",
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 3,
    shadowColor: "#ddd",
    elevation: 1.5,
    minHeight: 49,
    position: "relative",
    borderLeftColor: "#898989",
    borderLeftWidth: 3.5,
  },
  timeBox: {
    flexDirection: "row",
    alignItems: "center",
    width: 64,
    backgroundColor: "#e1e8ed",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 9,
    borderWidth: 1,
    borderColor: "#ececec",
  },
  timeText: {
    color: "#417c90",
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 5,
    letterSpacing: 0.2,
  },
  actText: {
    color: "#455173",
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    minWidth: 30,
    marginRight: 8,
  },
  priceText: {
    color: "#7c916a",
    fontWeight: "700",
    marginLeft: 3,
    fontSize: 13.5,
    backgroundColor: "#f1f7ee",
    borderRadius: 7,
    paddingHorizontal: 5,
    paddingVertical: 2,
    overflow: "hidden",
  },
  addActivityBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#e0e3e8",
    borderRadius: 7,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginTop: 9,
    marginBottom: 0,
    elevation: 1.5,
  },
  addActivityText: {
    color: "#455173",
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 7,
    letterSpacing: 0.1,
  },
  addFromPickBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#c9cacc",
    backgroundColor: "#f1f7fa",
    borderRadius: 9,
    paddingVertical: 8,
    paddingHorizontal: 13,
    marginTop: 5,
    marginBottom: 2,
    elevation: 1,
    shadowColor: "#9bb8d7",
  },
  addFromPickText: {
    color: "#3f4c5e",
    fontSize: 15,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(25,37,50,0.17)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "94%",
    backgroundColor: "#f9faf5",
    borderRadius: 18,
    padding: 25,
    elevation: 8,
    shadowColor: "#3d475a",
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#61738d",
    marginBottom: 14,
    textAlign: "center",
  },
  inputAct: {
    borderBottomWidth: 1.2,
    borderBottomColor: "#bfcacb",
    paddingVertical: 9,
    fontSize: 15,
    marginBottom: 12,
    color: "#222",
    fontWeight: "bold",
    backgroundColor: "#f6f8fa",
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  suggestedBtn: {
    backgroundColor: "#e0e3e8",
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 7,
    elevation: 1,
  },
  suggestedText: { color: "#61738d", fontWeight: "600", fontSize: 14.5 },
  confirmBtn: {
    flexDirection: "row",
    backgroundColor: "#61738d",
    paddingHorizontal: 19,
    paddingVertical: 11,
    borderRadius: 9,
    alignItems: "center",
    elevation: 1.5,
  },
  timePickerToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecf0f3",
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginBottom: 9,
    marginTop: -4,
  },
  updateBtn: {
    marginLeft: 8,
    padding: 5,
    backgroundColor: "#f3e8e8",
    borderRadius: 8,
    elevation: 1.5,
  },
  suggestActivityCard: {
    marginBottom: 10,
    padding: 15,
    borderRadius: 11,
    borderColor: "#e3e3dc",
    borderWidth: 1,
    backgroundColor: "#f5f7fa",
    flexDirection: "column",
  },
  centeredModalContent: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
},
btnRowModal: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginTop: 18,
},
timeLabel: {
  fontWeight: "bold",
  color: "#2b6fc9",
  fontSize: 16,
  marginLeft: 7,
},
timeValue: {
  marginLeft: 13,
  fontWeight: "bold",
  color: "#fe941a",
  fontSize: 16,
},
btnTextWhite: {
  color: "#fff",
  fontWeight: "bold",
  fontSize: 16,
  marginLeft: 7,
},

  suggestActivityTitle: { color: "#795f4a", fontWeight: "bold", fontSize: 16 },
  suggestActivityAddress: { color: "#7a8594", fontSize: 13.5 },
  suggestActivityCost: { color: "#63896b", fontSize: 13, marginTop: 2 },
  suggestActivityExisted: { color: "#e02c65", marginTop: 6, fontSize: 13.5 },
});

export default DaySchedule;
