import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { API_URL } from "../../constants/api";
import { useTheme } from "../../contexts/ThemeContext";
import createDetailStyles from "../../assets/styles/detail.styles";
import { formatPublishDate } from "../../lib/utils";
import { useRoute } from "@react-navigation/native";

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
  return `${thu}, ${d
    .getDate()
    .toString()
    .padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
}

const transportIcons = {
  "Máy bay": <MaterialCommunityIcons name="airplane" size={22} color="#41b1ff" />,
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
  const styles = createDetailStyles(colors);

  const route = useRoute<any>();
  const id = route.params?.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScheduleDetail();
  }, [id]);

  const fetchScheduleDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/tripSchedule/${id}`);
      const json = await res.json();
      // console.log("Json: ", json.days);
      
      setData(json);
    } catch (err) {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size={"large"} color={colors.primary} />
      </View>
    );
  if (!data)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: 20,
            marginTop: 40,
          }}
        >
          Không tìm thấy lịch trình!
        </Text>
      </View>
    );

  const s = data;
  
    
  // ==== XỬ LÝ NƠI Ở (HOME hoặc HOTEL) ====
  const isHome = !!(s.home && s.home.lat && s.home.lon);
  const baseStay = isHome ? s.home : (s.hotelDefault || {});
  const baseLabel = isHome ? "Nhà riêng / Chỗ ở" : "Khách sạn mặc định";
  const baseIcon = isHome
    ? <Ionicons name="home" size={18} color="#00b49d" />
    : <Ionicons name="business" size={18} color={colors.primary} />;

  // ==== HIỂN THỊ startDate/endDate ====
  const tripStartDate = s.startDate || (Array.isArray(s.days) && s.days[0]?.date) || null;
  const tripEndDate = s.endDate || (Array.isArray(s.days) && s.days[s.days.length-1]?.date) || null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* === Ảnh đại diện & Tiêu đề === */}
      {s.image && (
        <Image
          source={{
            uri: s.image.startsWith("data:")
              ? s.image
              : `data:image/jpeg;base64,${s.image}`,
          }}
          style={{
            width: "100%",
            height: 180,
            borderRadius: 20,
            marginBottom: 15,
            backgroundColor: colors.border,
          }}
          resizeMode="cover"
        />
      )}

      {/* === Thông tin chung === */}
      <View
        style={[
          styles.bookCard,
          { padding: 16, alignItems: "flex-start", marginBottom: 20 },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 7 }}>
          {s.user && (
            <Image
              source={{
                uri:
                  s.user.profileImage ||
                  `https://ui-avatars.com/api/?name=${
                    s.user.username?.charAt(0) ?? "U"
                  }`,
              }}
              style={{
                width: 37,
                height: 37,
                borderRadius: 20,
                marginRight: 10,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
          )}
          <View>
            <Text
              style={[
                styles.headerTitle,
                { marginBottom: 4, fontSize: 22 },
              ]}
            >
              {s.title || "Chuyến đi"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="person-circle"
                size={16}
                color={colors.textSecondary}
              />
              <Text
                style={{
                  color: colors.textSecondary,
                  fontWeight: "600",
                  marginLeft: 5,
                }}
              >
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
        <Text
          style={[
            styles.date,
            {
              marginTop: 7,
              color: colors.textSecondary,
              fontSize: 13,
            },
          ]}
        >
          {s.createdAt ? formatPublishDate(s.createdAt) : ""}
        </Text>
        {/* === Ngày bắt đầu / kết thúc */}
        {(tripStartDate || tripEndDate) && (
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 15,
              fontWeight: "bold",
              marginTop: 4,
            }}
          >
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
      </View>

      {/* === Quỹ tiền và phương tiện tổng quát === */}
      <View
        style={[
          styles.bookCard,
          { padding: 16, marginBottom: 15, width: "100%" },
        ]}
      >
        <Text
          style={{
            color: colors.textDark,
            fontWeight: "bold",
            fontSize: 16,
            marginBottom: 5,
          }}
        >
          Thông tin hành trình
        </Text>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
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
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          {s.fromLocation && typeof s.fromLocation === "object" && (
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              <Ionicons name="navigate-circle" size={14} color={colors.textSecondary} />{" "}
              Điểm xuất phát:
              <Text style={{ fontWeight: "bold", color: colors.textDark }}>
                {" "}
                {s.fromLocation.name ||
                  `${s.fromLocation.latitude}, ${s.fromLocation.longitude}`}
              </Text>
            </Text>
          )}
          {s.province && typeof s.province === "object" && (
            <Text style={{ fontSize: 13, color: "#4e7cc0", marginLeft: 8 }}>
              <Ionicons name="location" size={13} color="#1975ff" /> Tỉnh / TP:
              <Text style={{ fontWeight: "bold", color: "#226ea4" }}>
                {" "}
                {s.province.name || s.province.code || ""}
              </Text>
            </Text>
          )}
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <View style={{ alignItems: "center" }}>
            {baseIcon}
            <Text style={{ color: colors.textPrimary }}>{baseLabel}</Text>
            <Text style={{ fontWeight: "bold", color: colors.primary }}>
              {(s.budget?.hotel || 0).toLocaleString()} VNĐ
            </Text>
          </View>
          <View style={{ alignItems: "center", marginLeft: 20, marginRight: 20 }}>
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

      {/* === Home hoặc Hotel Default === */}
      {baseStay && (
        <View style={[styles.footer, { marginTop: 6 }]}>
          <Text
            style={{
              fontWeight: "bold",
              color: colors.primary,
              fontSize: 16,
              marginBottom: 6,
            }}
          >
            {baseLabel}
          </Text>
          <Text style={{ marginBottom: 3, color: colors.textPrimary }}>
            {baseIcon} {baseStay.name || baseStay.address || baseStay.address_line1}
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

      {/* === Vé máy bay nếu có === */}
      {s.flightTicket && s.flightTicket.content && (
        <View style={[styles.footer]}>
          <Text
            style={{
              fontWeight: "bold",
              color: colors.primary,
              fontSize: 16,
              marginBottom: 6,
            }}
          >
            Vé máy bay
          </Text>
          <Text style={{ color: colors.textPrimary, marginBottom: 3 }}>
            <Ionicons name="airplane" size={16} color={colors.textSecondary} />{" "}
            {s.flightTicket.content.outboundLeg?.originAirport?.skyCode || "-"} →{" "}
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

      {/* === Lịch từng ngày === */}
      <View
        style={[
          styles.bookCard,
          { alignItems: "flex-start", padding: 18, marginTop: 2 },
        ]}
      >
        <Text
          style={{
            fontWeight: "bold",
            color: colors.primary,
            fontSize: 17,
            marginBottom: 10,
          }}
        >
          Lịch trình từng ngày
        </Text>
        {Array.isArray(s.days) && s.days.length === 0 && (
          <Text style={{ color: "#aaa", fontStyle: "italic" }}>Chưa có dữ liệu lịch trình.</Text>
        )}
        {Array.isArray(s.days) &&
          s.days.map((day, idx) => {
            let dayTitle = `Ngày ${day.day}`;
            if (day.label && day.label !== "") dayTitle += ` - ${day.label}`;
            if (day.date && day.date !== "") dayTitle += ` | ${beautifyDate(day.date)}`;
            return (
              <View key={idx} style={{ marginBottom: 15, width: "100%" }}>
                <Text style={{
                  fontWeight: "bold",
                  color: colors.textDark,
                  fontSize: 15,
                  marginBottom: 3,
                }}>
                  {dayTitle}
                </Text>
                {Array.isArray(day.activities) && day.activities.length > 0 ? (
                  day.activities.map((act, i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        marginTop: 5,
                        backgroundColor: colors.inputBackground,
                        borderRadius: 8,
                        padding: 8,
                        marginBottom: 4,
                      }}
                    >
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={16}
                        color={colors.primary}
                        style={{ marginTop: 1, marginRight: 3 }}
                      />
                      <Text style={{
                        color: colors.textPrimary,
                        fontSize: 15,
                        fontWeight: "bold",
                      }}>
                        {act.time}{" "}
                      </Text>
                      <Text style={{
                        marginLeft: 6,
                        color: colors.textDark,
                        flex: 1,
                      }}>
                        {act.name}
                      </Text>
                      {act.cost && (
                        <Text style={{
                          marginLeft: 7,
                          color: colors.primary,
                          fontWeight: "bold",
                        }}>
                          +{act.cost.toLocaleString()}đ
                        </Text>
                      )}
                    </View>
                  ))
                ) : (
                  <Text
                    style={{
                      color: "#b7a2c4",
                      fontStyle: "italic",
                      marginLeft: 2,
                    }}
                  >
                    Không có hoạt động
                  </Text>
                )}
                {day.hotel && (
                  <Text style={{
                    color: "#be0272",
                    marginLeft: 18,
                    fontSize: 14,
                    marginTop: 3,
                  }}>
                    <Ionicons name="business" size={13} color="#be0272" /> Ở khách sạn: {day.hotel?.name || day.hotel?.address_line1}
                  </Text>
                )}
                {day.move && (
                  <Text style={{
                    marginLeft: 18,
                    color: "#3f486f",
                    fontSize: 13,
                    marginTop: 1,
                  }}>
                    <Ionicons name="car-outline" size={13} color="#5374e7" />
                    Đã di chuyển: {day.move.label || ""}
                  </Text>
                )}
              </View>
            );
          })}
      </View>
    </ScrollView>
  );
};

export default ScheduleDetailScreen;
