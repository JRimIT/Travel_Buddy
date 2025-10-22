import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

// Hàm random giá khách sạn (900K ~ 2tr)
const randomPrice = () => {
  return 900000 + Math.floor(Math.random() * 11) * 100000;
};



const GEOAPIFY_KEY =
  process.env.GEOAPIFY_KEY || "2ad8114410b44c76baf6c71f5ab23f3a";
const category = "accommodation.hotel";

const HotelTab = () => {
  const lat = useSelector(
    (state: any) => state.inforUserTravel.userProvince.latitude
  );
  const lng = useSelector(
    (state: any) => state.inforUserTravel.userProvince.longitude
  );
  const budget = useSelector(
    (state: any) => state.inforUserTravel.userHotelBudget
  );

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useOwnSelect, setUseOwnSelect] = useState(false);
  const selectedHotel = useSelector((state :any) => state.inforUserTravel.userInforHotel);

  const selectedHotelWithPrice = {
    ...selectedHotel,
    price: randomPrice(),
  }
  
  // Xử lý quỹ về số VND (nếu nhập 2.000.000 thì về 2000000)
  const budgetNumber = budget ? parseInt(budget.replace(/\./g, "")) : 0;

  // Lấy hotels và auto gán price cho từng item
  const fetchHotelsWithPrice = async (lat, lng, category) => {
    const url = `https://api.geoapify.com/v2/places?categories=${category}&filter=circle:${lng},${lat},2000&limit=12&apiKey=${GEOAPIFY_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.features || []).map((item) => ({
      ...item,
      price: randomPrice(),
    }));
  };

  useEffect(() => {
    setLoading(true);
    fetchHotelsWithPrice(lat, lng, category).then((data) => {
      setHotels(data);
      setLoading(false);
    });
  }, [lat, lng, category]);

  // Lọc khách sạn theo quỹ tiền
  const hotelsFiltered = hotels.filter(
    (h) => budgetNumber && h.price <= budgetNumber
  );

  const goToMap = (properties) => {
    console.log("Nhấn");

    router.push({
      pathname: "MapScreen",
      params: {
        lat: properties.lat,
        lon: properties.lon,
        name: properties.name || properties.formatted,
        address: properties.address_line2 || "",
        phone: properties.contact?.phone || "",
        website: properties.website || "",
      },
    });
  };

  const pressSelectBtn= () => {
    if (!useOwnSelect){
      setUseOwnSelect((prev) => !prev)
      router.push("/AddressSelectHotelScreen");

    }else{
      setUseOwnSelect((prev) => !prev)
    }
  }

  return (
    // <ScrollView contentContainerStyle={styles.infoTabBox}>
    //   <Text style={styles.sectionHeader}>
    //     {budget
    //       ? `Khách sạn phù hợp với quỹ (${Number(budgetNumber).toLocaleString()} VNĐ)`
    //       : "Danh sách khách sạn xung quanh"}
    //   </Text>
    //   {loading ? (
    //     <Text style={{ textAlign: "center", color: "#aaa", marginTop: 26 }}>
    //       Đang tải khách sạn...
    //     </Text>
    //   ) : budgetNumber ? (
    //     hotelsFiltered.length ? (
    //       hotelsFiltered.map((item) => {
    //         const { properties, price } = item;
    //         return (
    //           <TouchableOpacity key={properties.place_id} onPress={() => goToMap(properties)}>
    //             <View style={styles.infoCard}>
    //               <MaterialCommunityIcons
    //                 name="office-building-marker"
    //                 size={45}
    //                 color="#387be5"
    //                 style={{ marginBottom: 8 }}
    //               />
    //               <Text style={styles.infoCardTitle}>
    //                 {properties.name || properties.formatted}
    //               </Text>
    //               {properties.address_line2 && (
    //                 <Text style={styles.infoField}>{properties.address_line2}</Text>
    //               )}
    //               <Text style={[styles.infoField, { color: "#21ac35", fontWeight: "bold" }]}>
    //                 Giá phòng: {price.toLocaleString()} VNĐ
    //               </Text>
    //               {properties.contact?.phone && (
    //                 <Text style={styles.infoField}>
    //                   <Ionicons name="call" size={15} color="#37b878" /> SĐT:{" "}
    //                   <Text style={{ fontWeight: "bold" }}>{properties.contact.phone}</Text>
    //                 </Text>
    //               )}
    //               {properties.website && (
    //                 <Text style={styles.infoField}>
    //                   <Ionicons name="earth" size={15} color="#2b88f7" /> Website:{" "}
    //                   <Text style={[styles.boldText, { color: "#247ff7" }]}
    //                     onPress={() => Linking.openURL(properties.website)}>
    //                     {properties.website}
    //                   </Text>
    //                 </Text>
    //               )}
    //               <Text style={styles.showMapText}>Chạm để xem bản đồ & chi tiết</Text>
    //             </View>
    //           </TouchableOpacity>
    //         );
    //       })
    //     ) : (
    //       <View style={styles.noHotelBox}>
    //         {/* <MaterialCommunityIcons name="hotel-remove" size={40} color="#ff5959" /> */}
    //         <Text style={{ color: "#ff5959", fontWeight: "bold", fontSize: 16, marginVertical: 9 }}>
    //           Không tìm thấy khách sạn phù hợp với quỹ!
    //         </Text>
    //         <Text style={{ color: "#999", marginBottom: 8 }}>
    //           Tăng quỹ hoặc thử khu vực khác nhé.
    //         </Text>
    //       </View>
    //     )
    //   ) : (
    //     hotels.map((item) => {
    //       const { properties, price } = item;
    //       return (
    //         <View key={properties.place_id} style={styles.infoCard}>
    //           <MaterialCommunityIcons
    //             name="office-building-marker"
    //             size={45}
    //             color="#387be5"
    //             style={{ marginBottom: 8 }}
    //           />
    //           <Text style={styles.infoCardTitle}>
    //             {properties.name || properties.formatted}
    //           </Text>
    //           {properties.address_line2 && (
    //             <Text style={styles.infoField}>{properties.address_line2}</Text>
    //           )}
    //           <Text style={[styles.infoField, { color: "#21ac35", fontWeight: "bold" }]}>
    //             Giá phòng: {price.toLocaleString()} VNĐ
    //           </Text>
    //           {properties.contact?.phone && (
    //             <Text style={styles.infoField}>
    //               <Ionicons name="call" size={15} color="#37b878" /> SĐT:{" "}
    //               <Text style={{ fontWeight: "bold" }}>{properties.contact.phone}</Text>
    //             </Text>
    //           )}
    //           {properties.website && (
    //             <Text style={styles.infoField}>
    //               <Ionicons name="earth" size={15} color="#2b88f7" /> Website:{" "}
    //               <Text style={[styles.boldText, { color: "#247ff7" }]}
    //                 onPress={() => Linking.openURL(properties.website)}>
    //                 {properties.website}
    //               </Text>
    //             </Text>
    //           )}
    //           <Text style={styles.showMapText}>Chạm để xem bản đồ & chi tiết</Text>
    //         </View>
    //       );
    //     })
    //   )}
    // </ScrollView>
    <ScrollView contentContainerStyle={styles.infoTabBox}>
      {/* Nút chuyển chế độ tự chọn */}
      <TouchableOpacity
        style={styles.ownSelectBtn}
        onPress={() => pressSelectBtn()}
        activeOpacity={0.85}
      >
        <Ionicons
          name={useOwnSelect ? "cash-outline" : "hand-left-outline"}
          size={20}
          color={useOwnSelect ? "#2188ea" : "#15b698"}
        />
        <Text
          style={{
            color: useOwnSelect ? "#2188ea" : "#12ad63",
            fontWeight: "bold",
            marginLeft: 8,
            fontSize: 15,
          }}
        >
          {useOwnSelect
            ? "Lọc theo quỹ khách sạn"
            : "Tự chọn khách sạn bạn muốn"}
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
      ) : useOwnSelect ? (
        // Show FULL danh sách cho chế độ tự chọn
       
            <TouchableOpacity
              key={selectedHotelWithPrice.place_id}
              onPress={() => goToMap(selectedHotelWithPrice)}
            >
              <View style={styles.infoCard}>
                <MaterialCommunityIcons
                  name="office-building-marker"
                  size={45}
                  color="#387be5"
                  style={{ marginBottom: 8 }}
                />
                <Text style={styles.infoCardTitle}>
                  {selectedHotelWithPrice.name || selectedHotelWithPrice.formatted}
                </Text>
                {selectedHotelWithPrice.address_line2 && (
                  <Text style={styles.infoField}>
                    {selectedHotelWithPrice.address_line2}
                  </Text>
                )}
                <Text
                  style={[
                    styles.infoField,
                    { color: "#21ac35", fontWeight: "bold" },
                  ]}
                >
                  Giá phòng: {selectedHotelWithPrice.price.toLocaleString()} VNĐ
                </Text>
                {selectedHotelWithPrice.contact?.phone && (
                  <Text style={styles.infoField}>
                    <Ionicons name="call" size={15} color="#37b878" /> SĐT:{" "}
                    <Text style={{ fontWeight: "bold" }}>
                      {selectedHotelWithPrice.contact.phone}
                    </Text>
                  </Text>
                )}
                {selectedHotelWithPrice.website && (
                  <Text style={styles.infoField}>
                    <Ionicons name="earth" size={15} color="#2b88f7" /> Website:{" "}
                    <Text
                      style={[styles.boldText, { color: "#247ff7" }]}
                      onPress={() => Linking.openURL(selectedHotelWithPrice.website)}
                    >
                      {selectedHotelWithPrice.website}
                    </Text>
                  </Text>
                )}
                <Text style={styles.showMapText}>
                  Chạm để xem bản đồ & chi tiết
                </Text>
              </View>
            </TouchableOpacity>
         
      
      ) : budgetNumber ? (
        hotelsFiltered.length ? (
          hotelsFiltered.map((item) => {
            const { properties, price } = item;
            return (
              <TouchableOpacity
                key={properties.place_id}
                onPress={() => goToMap(properties)}
              >
                <View style={styles.infoCard}>
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
                  {properties.contact?.phone && (
                    <Text style={styles.infoField}>
                      <Ionicons name="call" size={15} color="#37b878" /> SĐT:{" "}
                      <Text style={{ fontWeight: "bold" }}>
                        {properties.contact.phone}
                      </Text>
                    </Text>
                  )}
                  {properties.website && (
                    <Text style={styles.infoField}>
                      <Ionicons name="earth" size={15} color="#2b88f7" />{" "}
                      Website:{" "}
                      <Text
                        style={[styles.boldText, { color: "#247ff7" }]}
                        onPress={() => Linking.openURL(properties.website)}
                      >
                        {properties.website}
                      </Text>
                    </Text>
                  )}
                  <Text style={styles.showMapText}>
                    Chạm để xem bản đồ & chi tiết
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.noHotelBox}>
            {/* <MaterialCommunityIcons name="hotel-remove" size={40} color="#ff5959" /> */}
            <Text
              style={{
                color: "#ff5959",
                fontWeight: "bold",
                fontSize: 16,
                marginVertical: 9,
              }}
            >
              Không tìm thấy khách sạn phù hợp với quỹ!
            </Text>
            <Text style={{ color: "#999", marginBottom: 8 }}>
              Tăng quỹ hoặc thử khu vực khác nhé.
            </Text>
          </View>
        )
      ) : (
        hotels.map((item) => {
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
                <Text style={styles.infoField}>{properties.address_line2}</Text>
              )}
              <Text
                style={[
                  styles.infoField,
                  { color: "#21ac35", fontWeight: "bold" },
                ]}
              >
                Giá phòng: {price.toLocaleString()} VNĐ
              </Text>
              {properties.contact?.phone && (
                <Text style={styles.infoField}>
                  <Ionicons name="call" size={15} color="#37b878" /> SĐT:{" "}
                  <Text style={{ fontWeight: "bold" }}>
                    {properties.contact.phone}
                  </Text>
                </Text>
              )}
              {properties.website && (
                <Text style={styles.infoField}>
                  <Ionicons name="earth" size={15} color="#2b88f7" /> Website:{" "}
                  <Text
                    style={[styles.boldText, { color: "#247ff7" }]}
                    onPress={() => Linking.openURL(properties.website)}
                  >
                    {properties.website}
                  </Text>
                </Text>
              )}
              <Text style={styles.showMapText}>
                Chạm để xem bản đồ & chi tiết
              </Text>
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
  showMapText: {
    marginTop: 7,
    color: "#248aea",
    fontSize: 14,
    fontStyle: "italic",
    opacity: 0.85,
  },
  noHotelBox: {
    alignItems: "center",
    marginTop: 26,
    backgroundColor: "#fff4f4",
    padding: 23,
    borderRadius: 14,
    elevation: 2,
    shadowColor: "#ff5959",
    shadowOpacity: 0.09,
  },
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
});

export default HotelTab;
