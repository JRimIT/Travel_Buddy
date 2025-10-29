import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { setUserInforHotel } from "../../redux/inforUserTravel/inforUserTravelSlice";
import { router } from "expo-router";
import { API_URL } from "../../constants/api";

const randomPrice = () => 900000 + Math.floor(Math.random() * 11) * 100000;
const GEOAPIFY_KEY =
  process.env.GEOAPIFY_KEY || "2ad8114410b44c76baf6c71f5ab23f3a";
const category = "accommodation.hotel";

const HotelTab = () => {
  const dispatch = useDispatch();
  const lat = useSelector(
    (state: any) => state.inforUserTravel.userProvince.latitude
  );
  const lng = useSelector(
    (state: any) => state.inforUserTravel.userProvince.longitude
  );
  const budget = useSelector(
    (state: any) => state.inforUserTravel.userHotelBudget
  );
  const selectedHotel = useSelector(
    (state: any) => state.inforUserTravel.userInforHotel
  );

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useOwnSelect, setUseOwnSelect] = useState(false);
  const [hotelConfirmed, setHotelConfirmed] = useState(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedHotelDetail, setSelectedHotelDetail] = useState(null);
  const [hotelDetails, setHotelDetails] = useState("");
  const [loadingDetails, setLoadingDetails] = useState(false);

  const hasHotelSelected = selectedHotel && selectedHotel.name;
  const budgetNumber = budget ? parseInt(budget.replace(/\./g, "")) : 0;

  useEffect(() => {
    setLoading(true);
    fetchHotelsWithPrice(lat, lng, category).then((data) => {
      setHotels(data);
      setLoading(false);
    });
  }, [lat, lng, category]);

  const fetchHotelsWithPrice = async (lat, lng, category) => {
    const url = `https://api.geoapify.com/v2/places?categories=${category}&filter=circle:${lng},${lat},2000&limit=12&apiKey=${GEOAPIFY_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.features || []).map((item) => ({
      ...item,
      price: randomPrice(),
    }));
  };

  // Lấy thông tin chi tiết từ Gemini AI
  const fetchHotelDetails = async (hotel) => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`${API_URL}/AI/hotel-details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelName: hotel.name || hotel.formatted,
          address: hotel.address_line2 || hotel.formatted,
          city: hotel.city || "Vietnam",
        }),
      });

      const data = await response.json();
      if (data.details) {
        setHotelDetails(data.details);
      } else {
        setHotelDetails("Không thể lấy thông tin chi tiết từ AI.");
      }
    } catch (error) {
      setHotelDetails("Lỗi khi lấy thông tin chi tiết.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const iconForInfo = (title) => {
    if (/sao|rating/i.test(title))
      return (
        <Ionicons
          name="star"
          size={18}
          color="#FDB900"
          style={{ marginRight: 8 }}
        />
      );
    if (/giá|giá phòng|price/i.test(title))
      return (
        <Ionicons
          name="pricetag"
          size={18}
          color="#43b87a"
          style={{ marginRight: 8 }}
        />
      );
    if (/web|website|trang web/i.test(title))
      return (
        <Ionicons
          name="globe-outline"
          size={18}
          color="#1976d2"
          style={{ marginRight: 8 }}
        />
      );
    if (/đánh giá|review|score/i.test(title))
      return (
        <Ionicons
          name="happy-outline"
          size={18}
          color="#21b6f5"
          style={{ marginRight: 8 }}
        />
      );
    if (/tiện ích|tiện nghi|amenity/i.test(title))
      return (
        <MaterialCommunityIcons
          name="room-service-outline"
          size={18}
          color="#ff9800"
          style={{ marginRight: 8 }}
        />
      );
    if (/vị trí|location/i.test(title))
      return (
        <Ionicons
          name="location-outline"
          size={18}
          color="#8e24aa"
          style={{ marginRight: 8 }}
        />
      );
    if (/loại phòng|phòng/i.test(title))
      return (
        <Ionicons
          name="bed-outline"
          size={18}
          color="#ab47bc"
          style={{ marginRight: 8 }}
        />
      );
    if (/chính sách/i.test(title))
      return (
        <Ionicons
          name="document-text-outline"
          size={18}
          color="#af3"
          style={{ marginRight: 8 }}
        />
      );
    if (/ghi chú|note/i.test(title))
      return (
        <Ionicons
          name="alert-circle-outline"
          size={18}
          color="#ec407a"
          style={{ marginRight: 8 }}
        />
      );
    return null;
  };

  const renderHotelDetails = (details) => {
  if (!details) return null;

  // Tách từng dòng có nội dung thực sự
  const lines = details.split(/\r?\n/).filter(line => line.trim().length > 0);

  return lines.map((line, idx) => {
    // Tách tiêu đề và nội dung (ví dụ "1. Giá phòng: 1.200.000 VNĐ")
    const match = line.match(/^(?:[0-9]+\.\s?)?([^:]+):\s*(.+)$/);
    let title = "";
    let value = "";

    if (match) {
      title = match[1].trim();
      value = match[2].trim();
    } else {
      // Nếu dòng không match pattern, hiển thị như dòng bình thường
      return (
        <Text
          key={idx}
          style={{
            color: "#e53935",
            marginBottom: 8,
            fontSize: 15,
            lineHeight: 22,
          }}
        >
          {line}
        </Text>
      );
    }

    const isWeb =
      /(web|website|trang web)/i.test(title) && value.match(/https?:\/\/[^\s]+/);

    return (
      <View
        key={idx}
        style={{
          marginBottom: 16,
          width: "100%",
          alignItems: "flex-start",
          paddingBottom: 6,
          borderBottomWidth: 0.6,
          borderBottomColor: "#eee",
        }}
      >
        {/* --- Tiêu đề + icon --- */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 5,
          }}
        >
          {iconForInfo(title)}
          <Text
            style={{
              fontWeight: "bold",
              color: "#ec407a",
              fontSize: 15.5,
              flexShrink: 1,
            }}
          >
            {title}:
          </Text>
        </View>

        {/* --- Nội dung --- */}
        {isWeb ? (
          <Text
            style={{
              color: "#1976d2",
              textDecorationLine: "underline",
              fontSize: 15,
              lineHeight: 22,
              marginLeft: 28,
              flexWrap: "wrap",
            }}
            onPress={() => Linking.openURL(value)}
            selectable
          >
            {value}
          </Text>
        ) : (
          <Text
            style={{
              color: "#434",
              fontSize: 15,
              lineHeight: 22,
              marginLeft: 28,
              flexWrap: "wrap",
            }}
          >
            {value}
          </Text>
        )}
      </View>
    );
  });
};


  // Mở modal và lấy thông tin chi tiết
  const openHotelDetail = (hotel) => {
    setSelectedHotelDetail(hotel);
    setModalVisible(true);
    setHotelDetails("");
    fetchHotelDetails(hotel);
  };

  // Google Map
  const openGgMap = (properties) => {
    const query = encodeURIComponent(
      properties.name || properties.formatted || ""
    );
    const latlon =
      properties.lat && properties.lon
        ? `${properties.lat},${properties.lon}`
        : query;
    const url = `https://www.google.com/maps/search/?api=1&query=${latlon}`;
    Linking.openURL(url);
  };

  // Xác nhận chọn khách sạn
  const handleConfirmHotel = (hotel) => {
    dispatch(setUserInforHotel(hotel));
    setHotelConfirmed(true);
    Alert.alert("Đã lưu khách sạn vào lịch trình!");
    setModalVisible(false);
  };

  // Điều hướng sang MapScreen để tự chọn khách sạn
  const pressSelectBtn = () => {
    if (!useOwnSelect) {
      setUseOwnSelect((prev) => !prev);
      router.push("/AddressSelectHotelScreen");
    } else {
      setUseOwnSelect((prev) => !prev);
    }
  };

  const hotelsFiltered = useOwnSelect
    ? hotels
    : budgetNumber
      ? hotels.filter((h) => h.price <= budgetNumber)
      : hotels;

  // Đã chọn khách sạn
  if (hasHotelSelected) {
    return (
      <ScrollView contentContainerStyle={styles.infoTabBox}>
        <TouchableOpacity
          style={styles.ownSelectBtn}
          onPress={() => {
            Alert.alert(
              "Chọn lại khách sạn",
              "Bạn muốn chọn lại khách sạn khác?",
              [
                { text: "Huỷ", style: "cancel" },
                {
                  text: "Chọn lại",
                  style: "destructive",
                  onPress: () => {
                    dispatch(setUserInforHotel({}));
                    setUseOwnSelect(false);

                    setHotelConfirmed(false);
                  },
                },
              ]
            );
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="reload-circle-outline" size={20} color="#2188ea" />
          <Text
            style={{
              color: "#2188ea",
              fontWeight: "bold",
              marginLeft: 8,
              fontSize: 15,
            }}
          >
            Chọn lại khách sạn
          </Text>
        </TouchableOpacity>
        <Text style={styles.sectionHeader}>Khách sạn bạn đã chọn</Text>
        <View style={styles.infoCard}>
          <MaterialCommunityIcons
            name="office-building-marker"
            size={45}
            color="#387be5"
            style={{ marginBottom: 8 }}
          />
          <Text style={styles.infoCardTitle}>
            {selectedHotel.name || selectedHotel.formatted}
          </Text>
          {selectedHotel.address_line2 && (
            <Text style={styles.infoField}>{selectedHotel.address_line2}</Text>
          )}
          <Text
            style={[styles.infoField, { color: "#21ac35", fontWeight: "bold" }]}
          >
            Giá phòng: {selectedHotel.price?.toLocaleString()} VNĐ
          </Text>
          <View
            style={{
              flexDirection: "row",
              marginTop: 12,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <TouchableOpacity
              style={[
                styles.choseBtn,
                {
                  backgroundColor: "#ffe5d4",
                  borderColor: "#e48b26",
                  marginBottom: 8,
                },
              ]}
              onPress={() => openGgMap(selectedHotel)}
            >
              <Ionicons name="map-outline" size={17} color="#db7a13" />
              <Text
                style={{ marginLeft: 7, color: "#db7a13", fontWeight: "bold" }}
              >
                Google Map
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.choseBtn,
                {
                  backgroundColor: "#e3f2fd",
                  borderColor: "#2196f3",
                  marginLeft: 8,
                  marginBottom: 8,
                },
              ]}
              onPress={() => openHotelDetail(selectedHotel)}
            >
              <Ionicons
                name="information-circle-outline"
                size={17}
                color="#2196f3"
              />
              <Text
                style={{
                  marginLeft: 7,
                  color: "#2196f3",
                  fontWeight: "bold",
                }}
              >
                Chi tiết AI
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Nút TIẾP TỤC chỉ hiện khi đã xác nhận và không đang ở trong modal */}
      {hotelConfirmed && (
        <TouchableOpacity
          style={{
            marginTop: 20,
            alignSelf: "center",
            backgroundColor: "#EC407A",
            borderRadius: 14,
            paddingHorizontal: 40,
            paddingVertical: 14,
            shadowColor: "#fd2e8e",
            shadowOpacity: 0.16,
            elevation: 5,
            flexDirection: "row",
            alignItems: "center",
          }}
          onPress={() => {
            // Router điều hướng sang màn tiếp theo, thay "/FunTab" bằng route phù hợp
            router.push("/ChoosePlayGroundScreen");
          }}
        >
          <Ionicons name="arrow-forward-circle" size={24} color="#fff" />
          <Text style={{
            color: "#fff",
            fontWeight: "bold",
            marginLeft: 9,
            fontSize: 18
          }}>
            Tiếp tục
          </Text>
        </TouchableOpacity>
      )}

        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedHotelDetail?.name ||
                    selectedHotelDetail?.formatted ||
                    "Chi tiết khách sạn"}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close-circle" size={28} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
                {loadingDetails ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ec407a" />
                    <Text style={styles.loadingText}>
                      Đang lấy thông tin từ AI...
                    </Text>
                  </View>
                ) : (
                  <View style={styles.detailsContainer}>
                    {renderHotelDetails(hotelDetails)}
                  </View>
                )}
              </ScrollView>

              {!loadingDetails && (
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: "#f5f5f5" }]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={[styles.modalBtnText, { color: "#666" }]}>
                      Đóng
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalBtn,
                      { backgroundColor: "#4caf50", marginLeft: 10 },
                    ]}
                    onPress={() =>
                      handleConfirmHotel({
                        ...selectedHotelDetail,
                        price: randomPrice(),
                      })
                    }
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text
                      style={[
                        styles.modalBtnText,
                        { color: "#fff", marginLeft: 5 },
                      ]}
                    >
                      Chọn khách sạn này
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  }

  // Chưa chọn - hiển thị danh sách
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.infoTabBox}>
        <TouchableOpacity
          style={styles.ownSelectBtn}
          onPress={pressSelectBtn}
          activeOpacity={0.85}
        >
          <Ionicons
            name={!useOwnSelect ? "hand-left-outline" : "cash-outline"}
            size={20}
            color={!useOwnSelect ? "#15b698" : "#2188ea"}
          />
          <Text
            style={{
              color: !useOwnSelect ? "#12ad63" : "#2188ea",
              fontWeight: "bold",
              marginLeft: 8,
              fontSize: 15,
            }}
          >
            {!useOwnSelect
              ? "Tự chọn khách sạn bạn muốn"
              : "Lọc khách sạn theo quỹ"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionHeader}>
          {useOwnSelect
            ? "Bạn đang tự chọn khách sạn, không lọc theo quỹ"
            : budget
              ? `Khách sạn phù hợp với quỹ (${Number(budgetNumber).toLocaleString()} VNĐ)`
              : "Danh sách khách sạn xung quanh"}
        </Text>

        {loading ? (
          <Text style={{ textAlign: "center", color: "#aaa", marginTop: 26 }}>
            Đang tải khách sạn...
          </Text>
        ) : (
          hotelsFiltered.map((item) => {
            const { properties, price } = item;
            return (
              <View key={properties.place_id} style={styles.infoCard}>
                <MaterialCommunityIcons
                  name="office-building-marker"
                  size={45}
                  color="#387be5"
                  style={{ marginBottom: 8 }}
                />
                <Text style={styles.infoCardTitle}>
                  {properties.name || properties.formatted}
                </Text>
                {properties.address_line2 && (
                  <Text style={styles.infoField}>
                    {properties.address_line2}
                  </Text>
                )}
                <Text
                  style={[
                    styles.infoField,
                    { color: "#21ac35", fontWeight: "bold" },
                  ]}
                >
                  Giá phòng: {price.toLocaleString()} VNĐ
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    marginTop: 12,
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.choseBtn,
                      {
                        backgroundColor: "#fbf1e1",
                        borderColor: "#e0ba73",
                        marginBottom: 8,
                      },
                    ]}
                    onPress={() => openGgMap(properties)}
                  >
                    <Ionicons name="map-outline" size={17} color="#d99c26" />
                    <Text
                      style={{
                        marginLeft: 7,
                        color: "#dbb13e",
                        fontWeight: "bold",
                      }}
                    >
                      Bản đồ
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.choseBtn,
                      {
                        backgroundColor: "#e3f2fd",
                        borderColor: "#2196f3",
                        marginBottom: 8,
                        marginLeft: 8,
                      },
                    ]}
                    onPress={() => openHotelDetail(properties)}
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={17}
                      color="#2196f3"
                    />
                    <Text
                      style={{
                        marginLeft: 7,
                        color: "#2196f3",
                        fontWeight: "bold",
                      }}
                    >
                      Chi tiết
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.choseBtn,
                      {
                        backgroundColor: "#d1fff0",
                        borderColor: "#16d08d",
                        marginLeft: 8,
                        marginBottom: 8,
                      },
                    ]}
                    onPress={() => handleConfirmHotel({ ...properties, price })}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={17}
                      color="#14b373"
                    />
                    <Text
                      style={{
                        marginLeft: 7,
                        color: "#14b373",
                        fontWeight: "bold",
                      }}
                    >
                      Xác nhận
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal Chi Tiết Khách Sạn */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedHotelDetail?.name ||
                  selectedHotelDetail?.formatted ||
                  "Chi tiết khách sạn"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {loadingDetails ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#2196f3" />
                  <Text style={styles.loadingText}>
                    Đang lấy thông tin từ AI...
                  </Text>
                </View>
              ) : (
                <View style={styles.detailsContainer}>
                  <Text style={styles.detailsText}>{renderHotelDetails(hotelDetails)}</Text>
                </View>
              )}
            </ScrollView>

            {!loadingDetails && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#f5f5f5" }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[styles.modalBtnText, { color: "#666" }]}>
                    Đóng
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    { backgroundColor: "#4caf50", marginLeft: 10 },
                  ]}
                  onPress={() =>
                    handleConfirmHotel({
                      ...selectedHotelDetail,
                      price: randomPrice(),
                    })
                  }
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text
                    style={[
                      styles.modalBtnText,
                      { color: "#fff", marginLeft: 5 },
                    ]}
                  >
                    Chọn khách sạn này
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    color: "#2188ea",
    fontSize: 19,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 18,
    letterSpacing: 0.1,
  },
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
    alignItems: "flex-start",
    width: "100%",
    elevation: 7,
    shadowColor: "#91caff",
    shadowOpacity: 0.11,
    borderWidth: 1.2,
    borderColor: "#dae6f9",
    marginBottom: 18,
  },
  infoCardTitle: {
    fontWeight: "bold",
    fontSize: 19,
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
  ownSelectBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    paddingHorizontal: 17,
    paddingVertical: 9,
    backgroundColor: "#e3fbef",
    borderRadius: 19,
    marginBottom: 12,
    marginTop: 3,
    shadowColor: "#2188ea",
    elevation: 1.5,
  },
  choseBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 9,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  // modalContainer: {
  //   backgroundColor: "#fff",
  //   borderRadius: 20,
  //   width: "90%",
  //   maxHeight: "80%",
  //   elevation: 10,
  // },
  // modalHeader: {
  //   flexDirection: "row",
  //   justifyContent: "space-between",
  //   alignItems: "center",
  //   padding: 20,
  //   borderBottomWidth: 1,
  //   borderBottomColor: "#eee",
  // },
  // modalTitle: {
  //   fontSize: 18,
  //   fontWeight: "bold",
  //   color: "#333",
  //   flex: 1,
  // },
  modalContent: {
    maxHeight: 400,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    color: "#666",
    fontSize: 16,
  },
  // detailsContainer: {
  //   padding: 20,
  // },
  detailsText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#333",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 26,
    width: "98%",
    maxWidth: 640,
    minHeight: "55%",
    maxHeight: "92%",
    elevation: 12,
    shadowColor: "#ec407a",
    paddingBottom: 8,
  },
  detailsContainer: {
    padding: 20,
    backgroundColor: "#fffafa",
    borderRadius: 18,
    minHeight: 320,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingTop: 24,
    paddingBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#e91e63",
    flex: 1,
    paddingRight: 12,
  },
});

export default HotelTab;
