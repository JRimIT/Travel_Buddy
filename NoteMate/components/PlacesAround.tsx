// import React, { useEffect, useState } from "react";
// import { View, Text, FlatList } from "react-native";
// import createProfileStyles from "../assets/styles/profile.styles";
// import { useTheme } from "../contexts/ThemeContext";

// const GEOAPIFY_KEY = process.env.GEOAPIFY_KEY || "2ad8114410b44c76baf6c71f5ab23f3a";

// const getNearby = async (lat, lng, category) => {
//   const url = `https://api.geoapify.com/v2/places?categories=${category}&filter=circle:${lng},${lat},2000&apiKey=${GEOAPIFY_KEY}`;
//   const res = await fetch(url);
//   const data = await res.json();
//   return data.features || [];
// };

// const categories = [
//   { key: "accommodation.hotel", label: "Khách sạn" },
//   { key: "catering.restaurant", label: "Nhà hàng" },
//   { key: "entertainment", label: "Vui chơi" }
// ];

// const PlacesAround = ({ lat, lng }) => {
// const { colors } = useTheme();
//   const styles = createProfileStyles(colors);
//   const [places, setPlaces] = useState({});
//   useEffect(() => {
//     categories.forEach(cat => {
//       getNearby(lat, lng, cat.key).then(data => setPlaces(prev => ({ ...prev, [cat.key]: data })));
//     });
//   }, [lat, lng]);

//   console.log("Khach san:", places["accommodation.hotel"]);


//   return (
//     <View style={styles.placesContainer}>
//       {categories.map(cat => (
//         <View key={cat.key}>
//           <Text style={styles.placesHeader}>{cat.label}</Text>
//           <FlatList
//             data={places[cat.key] || []}
//             keyExtractor={item => item.properties.place_id?.toString()}
//             renderItem={({item}) => (
//               <Text style={styles.placeItem}>{item.properties.name || item.properties.formatted}</Text>
//             )}
//           />
//         </View>
//       ))}
//     </View>
//   );
// };
// export default PlacesAround;

import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import createProfileStyles from "../assets/styles/profile.styles";
import { useTheme } from "../contexts/ThemeContext";
import { router } from "expo-router";

const GEOAPIFY_KEY = process.env.GEOAPIFY_KEY || "2ad8114410b44c76baf6c71f5ab23f3a";

const categories = [
  { key: "accommodation.hotel", label: "Khách sạn" },
  { key: "catering.restaurant", label: "Nhà hàng" },
  { key: "entertainment", label: "Vui chơi" }
];

const getNearby = async (lat, lng, category, offset = 0) => {
  const url = `https://api.geoapify.com/v2/places?categories=${category}&filter=circle:${lng},${lat},2000&limit=10&offset=${offset}&apiKey=${GEOAPIFY_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.features || [];
};

const PlacesAround = ({ lat, lng }) => {
  const { colors } = useTheme();
  const styles = createProfileStyles(colors);

  const [activeCat, setActiveCat] = useState(categories[0].key);
  const [places, setPlaces] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);

  // Load initial data
  const fetchPlaces = useCallback(async (reset = false) => {
    if (reset) {
      setRefreshing(true);
      setOffset(0);
    } else {
      setLoadingMore(true);
    }

    const data = await getNearby(lat, lng, activeCat, reset ? 0 : offset);

    if (reset) {
      setPlaces(data);
      setRefreshing(false);
    } else {
      setPlaces(prev => {
        const merged = [...prev, ...data];
        // lọc trùng place_id
        const unique = merged.filter(
          (item, index, self) =>
            index === self.findIndex(p => p.properties.place_id === item.properties.place_id)
        );
        return unique;
      });
      setOffset(prev => prev + 10);
      setLoadingMore(false);
    }
  }, [lat, lng, activeCat, offset]);


  useEffect(() => {
    fetchPlaces(true);
  }, [activeCat, lat, lng]);


  


  // const renderItem = ({ item }) => {
  //   const { properties } = item;
  //   // console.log("phone: ",properties);
    
  //   return (
  //     <View style={{
  //       backgroundColor: "#fff",
  //       borderRadius: 16,
  //       marginVertical: 8,
  //       marginHorizontal: 4,
  //       shadowColor: "#000",
  //       shadowOpacity: 0.08,
  //       shadowRadius: 8,
  //       elevation: 2,
  //       padding: 12,
  //       flexDirection: "row",
  //       alignItems: "center"
  //     }}>
  //       {/* Hiển thị hình ảnh nếu có (url), ưu tiên properties.image hoặc icon */}
  //       <View style={{ marginRight: 14 }}>
  //         {properties.image
  //           ? <Image
  //             source={{ uri: properties.image }}
  //             style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: "#eee" }}
  //           />
  //           : <Ionicons name="business-outline" size={38} color="#b1b1b1" />
  //         }
  //       </View>
  //       {/* Thông tin */}
  //       <View style={{ flex: 1 }}>
  //         <Text style={{ fontWeight: "bold", fontSize: 15, color: "#276ef1" }}>
  //           {properties.name || properties.formatted}
  //         </Text>
          
  //         {properties.address_line2 && (
  //           <Text style={{ color: "#474747" }}>{properties.address_line2}</Text>
  //         )}
  //         {/* Số điện thoại nếu có */}
  //         {properties.contact?.phone && (
  //           <Text style={{ color: "#ff7b29" }}>SĐT: {properties.contact.phone}</Text>
  //         )}

  //         <TouchableOpacity
  //       style={{
  //         backgroundColor: "#276ef1",
  //         marginTop: 8,
  //         borderRadius: 8,
  //         padding: 11,
  //         alignItems: 'center',
  //       }}
        
  //       onPress={()=>  router.push({ pathname: 'FlightPage', params: { dest: properties.city } })}
  //       // onPress={() => router.push(`/FlightPage?dest=${encodeURIComponent(properties.city || properties.name)}`)}
  //       // onPress={() => navigation.navigate("FlightPage", { dest: properties.city })}
  //     >
  //       <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 15 }}>
  //         Xem chuyến bay đến {properties.city || properties.name}
  //       </Text>
  //     </TouchableOpacity>
  //       </View>
        
  //     </View>
  //   );
  // };
const renderItem = ({ item }) => {
  const { properties } = item;
  console.log("map: ",properties);
  

  const cityIATAMap = {
  "Ho Chi Minh City": "SGN",
  "Ha Noi": "HAN",
  "Da Nang": "DAD",
  "Hai Phong": "HPH",
  "Can Tho": "VCA",
  "Nha Trang": "CXR",
  "Phu Quoc": "PQC",
  "Hue": "HUI",
  "Da Lat": "DLI",
  "Vinh": "VII",
  "Thanh Hoa": "THD",
  "Buon Ma Thuot": "BMV",
  "Pleiku": "PXU",
  "Dong Hoi": "VDH",
  "Tuy Hoa": "TBB",
  "Chu Lai": "VCL",
  "Rach Gia": "VKG",
  "Dien Bien Phu": "DIN",
  "Ca Mau": "CAH",
  "Con Dao": "VCS"
};

  // Chuẩn hóa mã IATA cho API
  const toEntityId = cityIATAMap[properties.city?.trim()] || "SGN";

  // Tham số search có thể lấy động theo nhu cầu UI
  const params = {
    fromEntityId: "DAD", // ví dụ luôn xuất phát Đà Nẵng, hoặc lấy GPS của user
    toEntityId: toEntityId,
    type: "oneway",
    year: "2025",
    month: "10",
    market: "VN",
    locale: "vi-VN",
    currency: "VND",
    adults: 1,
    cabinClass: "economy"
  };

  return (
    <TouchableOpacity 
      style={{
              backgroundColor: "#ffe3cfff",
              marginTop: 8,
              borderRadius: 8,
              padding: 11,
              alignItems: 'center',
            }}
    onPress={() => router.push({
      pathname: "MapScreen",
      params: {
        lat: properties.lat,
        lon: properties.lon,
        name: properties.name,
        image: Array.isArray(properties.image) ? properties.image[0] : properties.image,
        address: properties.address_line2 || properties.formatted,
        phone: properties.contact?.phone,
        website: properties.website
      }
    })}
    >
        <View style={{ flex: 1 }}>
          {/* Thông tin */}
          <Text style={{ fontWeight: "bold", fontSize: 15, color: "#276ef1" }}>
            {properties.name || properties.formatted}
          </Text>
          {properties.address_line2 && (
            <Text style={{ color: "#474747" }}>{properties.address_line2}</Text>
          )}
          {properties.contact?.phone && (
            <Text style={{ color: "#ff7b29" }}>SĐT: {properties.contact.phone}</Text>
          )}

          
        </View>



    </TouchableOpacity>
  );
};


  return (
    <View style={[styles.placesContainer, { flex: 1 }]}>
      {/* Category selector */}
      <View style={{ flexDirection: "row", marginBottom: 10, justifyContent: "center" }}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={{
              backgroundColor: activeCat === cat.key ? colors.primary : "#f3f4f6",
              paddingHorizontal: 12,
              paddingVertical: 6,
              marginHorizontal: 4,
              borderRadius: 12,
            }}
            onPress={() => setActiveCat(cat.key)}
          >
            <Text style={{ color: activeCat === cat.key ? "#fff" : colors.primary, fontWeight: "700" }}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
        
      </View>

      {/* FlatList giống như ví dụ */}
      <FlatList
        data={places}
        keyExtractor={(item, index) =>
          item.properties.place_id
            ? item.properties.place_id.toString()
            : `${index}-${Math.random()}`
        }

        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchPlaces(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={() => fetchPlaces(false)}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <View style={{ padding: 10, alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.textPrimary }}>
              Địa điểm quanh bạn
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={{ marginVertical: 20 }} size="large" color={colors.primary} />
          ) : null
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Ionicons name="location-outline" size={64} color={colors.textSecondary} />
            <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 10 }}>
              Không tìm thấy địa điểm nào
            </Text>
            <Text style={{ color: colors.textSecondary }}>Hãy thử danh mục khác</Text>
          </View>
        }
      />
    </View>
  );
};

export default PlacesAround;
