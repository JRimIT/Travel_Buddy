import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { API_URL } from "../../constants/api";
import { useTheme } from "../../contexts/ThemeContext";
import { formatPublishDate } from "../../lib/utils";
import { useRoute } from "@react-navigation/native";
import { useAuthStore } from "../../store/authStore";
import { router } from "expo-router";
import COLORS from "../../constants/colors";

// Helper định dạng ngày tiếng Việt
function beautifyDate(dateStr) {
  if (!dateStr) return "";
  let d = new Date(dateStr);
  if (isNaN(+d)) return dateStr;
  const days = [
    "Chủ nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  let thu = days[d.getDay()];
  return `${thu}, ${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
}

const transportIcons = {
  "Máy bay": (
    <MaterialCommunityIcons name="airplane" size={22} color="#41b1ff" />
  ),
  "Tàu hỏa": <FontAwesome5 name="train" size={20} color="#7c5efa" />,
  "Xe khách": <Ionicons name="bus" size={22} color="#ed881a" />,
  "Xe máy": <Ionicons name="bicycle-outline" size={22} color="#33bc7f" />,
  "Ô tô": <MaterialCommunityIcons name="car" size={22} color="#3b6bb3" />,
  Taxi: <Ionicons name="car-sport-outline" size={22} color="#eaa620" />,
  "Xe bus": <Ionicons name="bus" size={22} color="#37a6ce" />,
  "Xe đạp": <FontAwesome5 name="bicycle" size={20} color="#30bc3e" />,
  "Xe điện": <Ionicons name="train-outline" size={22} color="#54c4fa" />,
};

const ScheduleDetailScreen = () => {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const { user} = useAuthStore();
  const id = route.params?.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScheduleDetail();
    // eslint-disable-next-line
  }, [id]);

  const fetchScheduleDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/tripSchedule/${id}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToBookingPage = (user, scheduleId, fromLocation, province) => {
    router.push({
      pathname: "/BookFlightScreen",
      params: { user, scheduleId, fromLocation, province },
    });
  };

  if (loading)
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size={"large"} color={colors.primary} />
      </View>
    );
  if (!data)
    return (
      <View style={styles.loaderContainer}>
        <Text style={[styles.notFoundText, { color: colors.textPrimary }]}>
          Không tìm thấy lịch trình!
        </Text>
      </View>
    );

  const s = data;
  const isHome = !!(s.home && s.home.lat && s.home.lon);
  const baseStay = isHome ? s.home : s.hotelDefault || {};
  const baseLabel = isHome ? "Nhà riêng / Chỗ ở" : "Khách sạn mặc định";
  const baseIcon = isHome ? (
    <Ionicons name="home" size={18} color="#00b49d" />
  ) : (
    <Ionicons name="business" size={18} color={colors.primary} />
  );

  const tripStartDate =
    s.startDate || (Array.isArray(s.days) && s.days[0]?.date) || null;
  const tripEndDate =
    s.endDate ||
    (Array.isArray(s.days) && s.days[s.days.length - 1]?.date) ||
    null;
  const fromLocationStr = s.fromLocation || "";
  const provinceStr = s.province  || "";
console.log("fromLocation: ", fromLocationStr);
  console.log("province: ", provinceStr);
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Ảnh đại diện */}
      {s.image && (
        <Image
          source={{
            uri: s.image.startsWith("data:")
              ? s.image
              : `data:image/jpeg;base64,${s.image}`,
          }}
          style={styles.avatar}
          resizeMode="cover"
        />
      )}

      {/* Thông tin chung + nơi xuất phát + tỉnh thành */}
      <View
        style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 7,
          }}
        >
          {s.user && (
            <Image
              source={{
                uri:
                  s.user.profileImage ||
                  `https://ui-avatars.com/api/?name=${
                    s.user.username?.charAt(0) ?? "U"
                  }`,
              }}
              style={[styles.profileImage, { borderColor: colors.border }]}
            />
          )}
          <View>
            <Text style={[styles.headerTitle, { color: colors.primary }]}>
              {s.title || "Chuyến đi"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="person-circle"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
                {s.user?.username || "User"}{" "}
                <Text
                  style={{
                    fontWeight: "400",
                    fontStyle: "italic",
                    color: colors.placeholderText,
                    marginLeft: 8,
                  }}
                >
                  {s.isPublic ? "Công khai" : "Riêng tư"}
                </Text>
              </Text>
            </View>
          </View>
        </View>
        {s.description ? (
          <>
            <MaterialCommunityIcons
              name="notebook-outline"
              size={18}
              color={colors.textSecondary}
              style={{ marginBottom: 2 }}
            />
            <Text style={[styles.caption, { color: colors.textDark }]}>
              {s.description}
            </Text>
          </>
        ) : null}
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {s.createdAt ? formatPublishDate(s.createdAt) : ""}
        </Text>
        {(tripStartDate || tripEndDate) && (
          <Text style={styles.dateRange}>
            Thời gian:{" "}
            <Text style={{ color: colors.primary }}>
              {tripStartDate ? beautifyDate(tripStartDate) : "..."}
            </Text>
            {" - "}
            <Text style={{ color: colors.primary }}>
              {tripEndDate ? beautifyDate(tripEndDate) : "..."}
            </Text>
          </Text>
        )}
        <View style={styles.locationInfo}>
          {!!fromLocationStr && (
            <Text
              style={[
                styles.currentLocationText,
                { color: colors.textPrimary },
              ]}
            >
              <Ionicons name="navigate" size={17} color={colors.primary} /> Xuất
              phát: {fromLocationStr}
            </Text>
          )}
          {!!provinceStr && (
            <Text
              style={[styles.provinceText, { color: colors.textSecondary }]}
            >
              <Ionicons name="location" size={15} color={colors.primary} />{" "}
              Tỉnh/Thành: {provinceStr}
            </Text>
          )}
        </View>
      </View>

      {/* Quỹ tiền và phương tiện tổng quát */}
      <View
        style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}
      >
        <Text style={[styles.infoTitle, { color: colors.textDark }]}>
          Thông tin hành trình
        </Text>
        <View style={styles.transportRow}>
          <Text style={{ color: colors.primary }}>
            {transportIcons[s.mainTransport] || (
              <Ionicons name="car-sport" size={18} />
            )}{" "}
            Phương tiện chính:
            <Text style={{ fontWeight: "bold", color: colors.textPrimary }}>
              {" "}
              {s.mainTransport || "Không có"}
            </Text>
          </Text>
          <Text style={{ color: "#218a32" }}>
            {transportIcons[s.innerTransport] || (
              <Ionicons name="walk" size={18} />
            )}{" "}
            Nội thành:
            <Text style={{ fontWeight: "bold", color: colors.textPrimary }}>
              {" "}
              {s.innerTransport || "Không có"}
            </Text>
          </Text>
        </View>
        <View style={styles.budgetRow}>
          <View style={{ alignItems: "center" }}>
            {baseIcon}
            <Text style={{ color: colors.textPrimary }}>{baseLabel}</Text>
            <Text style={{ fontWeight: "bold", color: colors.primary }}>
              {(s.budget?.hotel || 0).toLocaleString()} VNĐ
            </Text>
          </View>
          <View
            style={{ alignItems: "center", marginLeft: 20, marginRight: 20 }}
          >
            <Ionicons name="airplane" size={18} color={colors.primary} />
            <Text style={{ color: colors.textPrimary }}>Đi tới</Text>
            <Text style={{ fontWeight: "bold", color: colors.primary }}>
              {(s.budget?.flight || 0).toLocaleString()} VNĐ
            </Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Ionicons name="musical-notes" size={18} color={colors.primary} />
            <Text style={{ color: colors.textPrimary }}>Đi chơi</Text>
            <Text style={{ fontWeight: "bold", color: colors.primary }}>
              {(s.budget?.fun || 0).toLocaleString()} VNĐ
            </Text>
          </View>
        </View>
      </View>

      {/* Home hoặc Hotel Default */}
      {baseStay && (
        <View
          style={[styles.footer, { backgroundColor: colors.cardBackground }]}
        >
          <Text style={[styles.footerTitle, { color: colors.primary }]}>
            {baseLabel}
          </Text>
          <Text style={{ marginBottom: 3, color: colors.textPrimary }}>
            {baseIcon}{" "}
            {baseStay.name || baseStay.address || baseStay.address_line1}
          </Text>
          {baseStay.address_line2 && (
            <Text style={{ marginBottom: 3, color: colors.textSecondary }}>
              {baseStay.address_line2}
            </Text>
          )}
          {baseStay.phone && (
            <Text style={{ marginBottom: 3 }}>
              <Ionicons name="call" size={12} color={colors.textPrimary} />{" "}
              {baseStay.phone || baseStay.contact?.phone}
            </Text>
          )}
          {baseStay.website && (
            <Text style={{ marginBottom: 2, color: "#2186fb" }}>
              {baseStay.website}
            </Text>
          )}
        </View>
      )}

      {/* Vé máy bay nếu có */}
      {s.flightTicket && s.flightTicket.content && (
        <View
          style={[styles.footer, { backgroundColor: colors.cardBackground }]}
        >
          <Text style={[styles.footerTitle, { color: colors.primary }]}>
            Vé máy bay
          </Text>
          <Text style={{ color: colors.textPrimary, marginBottom: 3 }}>
            <Ionicons name="airplane" size={16} color={colors.textSecondary} />{" "}
            {s.flightTicket.content.outboundLeg?.originAirport?.skyCode || "-"}{" "}
            →{" "}
            {s.flightTicket.content.outboundLeg?.destinationAirport?.skyCode ||
              "-"}
          </Text>
          <Text style={{ color: colors.textSecondary, marginBottom: 2 }}>
            Ngày đi:{" "}
            {s.flightTicket.content.outboundLeg?.localDepartureDateLabel ||
              s.flightTicket.content.outboundLeg?.localDepartureDate ||
              "-"}
          </Text>
          <Text
            style={{
              color: colors.primary,
              fontWeight: "bold",
              marginBottom: 3,
            }}
          >
            Giá:{" "}
            {typeof s.flightTicket.content.price === "string"
              ? s.flightTicket.content.price
              : `${s.flightTicket.content.price} USD`}
          </Text>
          <Text style={{ color: colors.textSecondary }}>
            {s.flightTicket.content.direct ? "Bay thẳng" : "Có điểm dừng"}
          </Text>
        </View>
      )}

      {/* Nút đặt vé máy bay */}
      {user.username === s.user.username && (
        <View style={styles.bookingButtonWrap}>
          <TouchableOpacity
            style={[
              styles.bookingButton,
              { backgroundColor: colors.primary, shadowColor: colors.primary },
            ]}
            onPress={() => handleGoToBookingPage(user, s._id, fromLocationStr, provinceStr)}
          >
            <Ionicons
              name="airplane"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
              Bạn có muốn đặt giúp vé máy bay?
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lịch từng ngày */}
      <View
        style={[styles.dayCard, { backgroundColor: colors.cardBackground }]}
      >
        <Text style={[styles.dayTitle, { color: colors.primary }]}>
          Lịch trình từng ngày
        </Text>
        {Array.isArray(s.days) && s.days.length === 0 && (
          <Text style={styles.noData}>Chưa có dữ liệu lịch trình.</Text>
        )}
        {Array.isArray(s.days) &&
          s.days.map((day, idx) => {
            let dayTitle = `Ngày ${day.day}`;
            if (day.label && day.label !== "") dayTitle += ` - ${day.label}`;
            if (day.date && day.date !== "")
              dayTitle += ` | ${beautifyDate(day.date)}`;
            return (
              <View key={idx} style={{ marginBottom: 15, width: "100%" }}>
                <Text style={styles.dayItemTitle}>{dayTitle}</Text>
                {Array.isArray(day.activities) && day.activities.length > 0 ? (
                  day.activities.map((act, i) => (
                    <View
                      key={i}
                      style={[
                        styles.activityRow,
                        { backgroundColor: colors.inputBackground },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={16}
                        color={colors.primary}
                        style={{ marginTop: 1, marginRight: 3 }}
                      />
                      <Text style={styles.activityTime}>{act.time} </Text>
                      <Text style={styles.activityName}>{act.name}</Text>
                      {act.cost && (
                        <Text style={styles.activityCost}>
                          +{act.cost.toLocaleString()}đ
                        </Text>
                      )}
                    </View>
                  ))
                ) : (
                  <Text style={styles.noActivity}>Không có hoạt động</Text>
                )}
                {day.hotel && (
                  <Text style={styles.hotelInfo}>
                    <Ionicons name="business" size={13} color="#be0272" /> Ở
                    khách sạn: {day.hotel?.name || day.hotel?.address_line1}
                  </Text>
                )}
                {day.move && (
                  <Text style={styles.moveInfo}>
                    <Ionicons name="car-outline" size={13} color="#5374e7" />
                    Đã di chuyển: {day.move.label || ""}
                  </Text>
                )}
              </View>
            );
          })}
      </View>
      {/* Vé tàu/xe nếu có */}
      {s.ticket && (
        <View
          style={[styles.footer, { backgroundColor: colors.cardBackground }]}
        >
          <Text style={[styles.footerTitle, { color: colors.primary }]}>
            Vé tàu / xe
          </Text>

          {/* Vé tàu */}
          {s.ticket.chuyenTau && (
            <>
              <Text style={{ color: colors.textPrimary, marginBottom: 3 }}>
                <Ionicons name="train" size={16} color={colors.textSecondary} />{" "}
                {s.ticket.chuyenTau} | {s.ticket.gaDi} → {s.ticket.gaDen}
              </Text>
              <Text style={{ color: colors.textSecondary }}>
                Ngày đi: {s.ticket.ngayDi || "-"}
              </Text>
              {s.ticket.gioDi && (
                <Text style={{ color: colors.textSecondary }}>
                  Giờ đi: {s.ticket.gioDi}
                </Text>
              )}
              {s.ticket.gioDen && (
                <Text style={{ color: colors.textSecondary }}>
                  Giờ đến: {s.ticket.gioDen}
                </Text>
              )}
              <Text style={{ color: colors.textSecondary }}>
                Số ghế trống: {s.ticket.soGheTrong ?? "-"}
              </Text>
            </>
          )}

          {/* Vé xe khách */}
          {s.ticket.nhaXe && (
            <>
              <Text style={{ color: colors.textPrimary, marginBottom: 3 }}>
                <Ionicons name="bus" size={16} color={colors.textSecondary} />{" "}
                {s.ticket.nhaXe} | {s.ticket.diemDi} → {s.ticket.diemDen}
              </Text>
              <Text style={{ color: colors.textSecondary }}>
                Loại xe: {s.ticket.loaiXe || "-"}
              </Text>
              <Text style={{ color: colors.textSecondary }}>
                Số xe: {s.ticket.soXe || "-"}
              </Text>
              <Text style={{ color: colors.textSecondary }}>
                Ngày đi: {s.ticket.ngayDi || "-"}
              </Text>
              {s.ticket.gioDi && (
                <Text style={{ color: colors.textSecondary }}>
                  Giờ đi: {s.ticket.gioDi}
                </Text>
              )}
              {s.ticket.gioDen && (
                <Text style={{ color: colors.textSecondary }}>
                  Giờ đến: {s.ticket.gioDen}
                </Text>
              )}
              <Text style={{ color: colors.textSecondary }}>
                Số ghế trống: {s.ticket.soGheTrong ?? "-"}
              </Text>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1,
      backgroundColor: COLORS.background,
      padding: 16, },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFoundText: { fontSize: 20, marginTop: 40, fontWeight: "bold" },
  avatar: { width: "100%", height: 180, borderRadius: 20, marginBottom: 15 },
  infoCard: {
    padding: 16,
    alignItems: "flex-start",
    marginBottom: 20,
    borderRadius: 16,
  },
  profileImage: {
    width: 37,
    height: 37,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  headerTitle: { marginBottom: 4, fontSize: 22, fontWeight: "bold" },
  headerSub: { fontWeight: "600", marginLeft: 5 },
  caption: { fontSize: 15, marginBottom: 5 },
  date: { marginTop: 7, fontSize: 13 },
  dateRange: { color: "#333", fontSize: 15, fontWeight: "bold", marginTop: 4 },
  locationInfo: { marginTop: 10, marginBottom: 15 },
  currentLocationText: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  provinceText: { fontSize: 15 },
  infoTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 5 },
  transportRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    width: "100%",
  },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  footer: { marginTop: 6, borderRadius: 16, padding: 12 },
  footerTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 6 },
  bookingButtonWrap: { marginVertical: 18, alignItems: "center" },
  bookingButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  dayCard: {
    alignItems: "flex-start",
    padding: 18,
    marginTop: 2,
    borderRadius: 16,
  },
  dayTitle: { fontWeight: "bold", fontSize: 17, marginBottom: 10 },
  dayItemTitle: {
    fontWeight: "bold",
    color: "#222",
    fontSize: 15,
    marginBottom: 3,
  },
  noData: { color: "#aaa", fontStyle: "italic" },
  activityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 5,
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
  },
  activityTime: { color: "#333", fontSize: 15, fontWeight: "bold" },
  activityName: { marginLeft: 6, color: "#444", flex: 1 },
  activityCost: { marginLeft: 7, color: "#3b6bb3", fontWeight: "bold" },
  noActivity: { color: "#b7a2c4", fontStyle: "italic", marginLeft: 2 },
  hotelInfo: { color: "#be0272", marginLeft: 18, fontSize: 14, marginTop: 3 },
  moveInfo: { marginLeft: 18, color: "#3f486f", fontSize: 13, marginTop: 1 },
});

export default ScheduleDetailScreen;
