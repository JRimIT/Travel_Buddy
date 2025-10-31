import React, { useMemo, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Modal
} from "react-native";
import { useSelector } from "react-redux";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import MapView, { Marker, Callout } from "react-native-maps";

// Hàm tính khoảng cách địa lý
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = deg => deg * (Math.PI/180);
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 100)/100;
};

const HotelDetailsScreen = () => {
  // Data hotel đúng field log của bạn
  const hotel = useSelector((state:any) => state.inforUserTravel.userInforHotel);
  const home = useSelector((state:any) => state.inforUserTravel.userHomeAddress);

  // Lấy bản playground đã mapping lại:
  const rawPlaygrounds = useSelector((state:any) => state.inforUserTravel.userPlaygrounds) || [];
  // mapping lại lat/lon cho marker:
  const playgrounds = rawPlaygrounds.map(p => ({
    ...p,
    lat: (
      typeof p.properties?.lat === 'number'
      ? p.properties.lat
      : (
        Array.isArray(p.geometry?.coordinates)
          ? p.geometry.coordinates[1]
          : null
        )
    ),
    lon: (
      typeof p.properties?.lon === 'number'
      ? p.properties.lon
      : (
        Array.isArray(p.geometry?.coordinates)
          ? p.geometry.coordinates[0]
          : null
        )
    ),
  }));

  const [mapModal, setMapModal] = useState(false);

  // --- Chọn "base" info: nếu chọn Home thì lấy Home làm gốc, nếu chưa thì lấy hotel
  const isHome = home && home.lat && home.lon;
  const baseLat = isHome ? Number(home.lat) : (hotel?.lat ? Number(hotel.lat) : 0);
  const baseLon = isHome ? Number(home.lon) : (hotel?.lon ? Number(hotel.lon) : 0);
  const baseName = isHome ? (home.name || "Nhà của bạn") : (hotel.name || hotel.address_line1 || hotel.datasource?.raw?.name);
  const baseAddress = isHome
    ? (home.address || home.name)
    : (hotel.address_line2 || hotel.address || hotel.datasource?.raw?.formatted);

  const baseIcon = isHome
    ? <Ionicons name="home" size={32} color="#00b4a9" />
    : <Ionicons name="business" size={32} color="#EB5757" />;

  // Memo vị trí trung tâm map cho focus đẹp
  const region = useMemo(() =>
    baseLat && baseLon ? ({
      latitude: baseLat,
      longitude: baseLon,
      latitudeDelta: 0.012,
      longitudeDelta: 0.018,
    }) : ({
      latitude: 21.0285,
      longitude: 105.8542,
      latitudeDelta: 0.12,
      longitudeDelta: 0.15,
    }), [baseLat, baseLon]);

  const validPlaygrounds = playgrounds.filter(
    p => typeof p.lat === 'number' && typeof p.lon === 'number'
  );

  if (!isHome && !hotel) return (
    <View style={styles.centered}>
      <Text style={{ color: "#ab3b3b", fontSize: 17, fontWeight: "bold" }}>Chưa chọn chỗ ở!</Text>
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f3f5fa" }} contentContainerStyle={{ paddingBottom:30 }}>
      <View style={styles.hotelCard}>
        {/* Ảnh hotel nếu không phải Home */}
        {(!isHome && hotel?.image) &&
          <Image source={{ uri: hotel.image }} style={styles.hotelImage} />
        }
        {/* Tên/địa chỉ Home/Hotel */}
        <Text style={styles.hotelName}>{baseName}</Text>
        <Text style={styles.hotelStar}>
          <Ionicons name="star" size={17} color="#F8D97B" />
          <Text style={{ color: "#F8D97B" }}> {hotel?.stars || ""}</Text>
        </Text>
        <View style={styles.infoRow}>
          <Ionicons name="location-sharp" size={18} color="#4364FE" />
          <Text style={styles.infoText}>{baseAddress}</Text>
        </View>
        {/* Số phone (chỉ với khách sạn) */}
        {!isHome && (hotel?.contact?.phone || hotel?.datasource?.raw?.phone) &&
          <View style={styles.infoRow}>
            <Ionicons name="call" size={18} color="#35ae56" />
            <Text style={styles.infoText}>{hotel.contact?.phone || hotel.datasource?.raw?.phone}</Text>
          </View>
        }
        {/* Website (khách sạn) */}
        {!isHome && hotel?.datasource?.raw?.website && (
          <View style={styles.infoRow}>
            <Ionicons name="earth" size={18} color="#2B81D6" />
            <Text style={styles.infoText}>{hotel.datasource.raw.website}</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.btnMap}
          onPress={() => setMapModal(true)}
        >
          <Ionicons name="map" size={18} color="#fff" />
          <Text style={styles.btnMapText}>
            Xem {isHome ? "nhà/chỗ ở" : "khách sạn"} & vui chơi trên bản đồ
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.playgroundBlock}>
        <Text style={styles.playHeader}>Khu vui chơi đã chọn</Text>
        {validPlaygrounds.length === 0 ? (
          <View style={{alignItems:"center", marginVertical:16 }}>
            <Text style={{color:"#888"}}>Chưa có khu vui chơi nào!</Text>
          </View>
        ) : (
          validPlaygrounds.map((p, i) => (
            <View style={styles.playCard} key={p._cardKey || i}>
              <Text style={styles.playName}>{p.properties?.name || p.name}</Text>
              {p.properties?.address_line2 &&
                <Text style={styles.playAddr}>{p.properties.address_line2}</Text>
              }
              {baseLat && baseLon && p.lat && p.lon &&
                <Text style={styles.kmText}>
                  <MaterialIcons name="straighten" size={15} color="#7B51E1" />
                  <Text>
                    {" "}{getDistanceKm(baseLat, baseLon, p.lat, p.lon)} km từ {isHome ? "nhà ở" : "khách sạn"}
                  </Text>
                </Text>
              }
            </View>
          ))
        )}
      </View>
      {/* Modal xem map lớn */}
      <Modal visible={mapModal} transparent animationType="slide" onRequestClose={()=>setMapModal(false)}>
        <View style={styles.mapWrap}>
          <MapView
            style={styles.mapView}
            region={region}
            showsPointsOfInterest={false}
          >
            {/* Marker Home OR Hotel */}
            {(baseLat && baseLon) && (
              <Marker
                coordinate={{ latitude: baseLat, longitude: baseLon }}
                title={baseName}
                pinColor={isHome ? "#00b4a9" : "#EB5757"}
                identifier="base-point"
              >
                {baseIcon}
                <Callout>
                  <View style={{maxWidth: 200}}>
                    <Text style={{fontWeight: "bold", color: isHome ? "#00b4a9" : "#EB5757"}}>
                      {baseName}
                    </Text>
                    <Text style={{color:"#4F4F4F"}}>
                      {baseAddress}
                    </Text>
                  </View>
                </Callout>
              </Marker>
            )}
            {/* Marker khu vui chơi */}
            {validPlaygrounds.map((p, i) => (
              <Marker
                key={p._cardKey || i}
                coordinate={{ latitude: p.lat, longitude: p.lon }}
                pinColor="#00DB7C"
                title={p.properties?.name || p.name}
                identifier={"play-"+(p._cardKey||i)}
              >
                <Ionicons name="sparkles" size={28} color="#00DB7C" />
                <Callout>
                  <View style={{maxWidth: 220}}>
                    <Text style={{fontWeight:"bold", color:"#00DB7C"}}>{p.properties?.name || p.name}</Text>
                    {baseLat && baseLon && p.lat && p.lon &&
                      <Text style={{marginTop: 5, color:"#888"}}>
                        <Ionicons name="swap-horizontal-outline" size={14} color="#735DF8" />
                        <Text style={{fontWeight:"bold", color:"#333"}}>
                          {getDistanceKm(baseLat, baseLon, p.lat, p.lon)} km
                        </Text>{" "}tới {isHome ? "nhà" : "khách sạn"}
                      </Text>
                    }
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
          <TouchableOpacity style={styles.mapCloseBtn} onPress={()=>setMapModal(false)}>
            <Ionicons name="close-circle" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#f7fafb',
  },
  hotelCard: {
    backgroundColor: "#fff",
    margin: 18,
    borderRadius: 18,
    padding: 18,
    shadowColor: "#bbb",
    shadowOpacity: 0.17,
    shadowOffset: { width: 2, height: 4 },
    shadowRadius: 12,
    elevation: 5,
    alignItems: "center"
  },
  hotelImage: {
    width: "100%", height: 170, borderRadius: 15, marginBottom: 12, resizeMode: "cover"
  },
  hotelName: {
    fontSize: 19, fontWeight: "bold", color:"#4339AA", textAlign:'center'
  },
  hotelStar: { fontSize: 15, fontWeight: "bold", marginVertical:8, color: "#F8D97B" },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4
  },
  infoText: { color: "#494949", fontSize: 14, marginLeft: 7 },
  btnMap: {
    backgroundColor: "#664FFF", flexDirection:'row', alignItems:'center', borderRadius: 13,
    paddingVertical: 10, paddingHorizontal: 20, marginTop: 13, alignSelf: "center",
    shadowColor:"#664FFF", shadowOffset: { width: 1, height: 2 }, shadowOpacity:0.22
  },
  btnMapText: { color: "#fff", fontWeight: "bold", fontSize: 15, marginLeft: 7 },
  playgroundBlock: {
    backgroundColor:'#f6f7fc',
    marginHorizontal:12,
    marginTop:6,
    borderRadius:17,
    padding:14,
    elevation:2
  },
  playHeader: {
    fontWeight:'bold', fontSize:18, color:'#543DE1', marginBottom: 8
  },
  playCard: {
    backgroundColor:"#fff",
    borderRadius:9,
    marginBottom:10,
    padding:12,
    shadowColor:"#dadcff", shadowRadius:7, elevation:2
  },
  playName: { color:"#4841C5", fontWeight:'bold', fontSize:15 },
  playAddr: {color: "#888", fontSize:14, marginTop:2},
  kmText: {marginTop:3, color:"#7B51E1", fontSize:14, fontWeight:"bold"},
  mapWrap: { flex:1, backgroundColor:"rgba(20,25,38,0.8)", justifyContent:'center', alignItems:'center' },
  mapView: { width:'96%', height:'72%',
    borderRadius: 20, overflow:'hidden', backgroundColor:"#eaeaea"
  },
  mapCloseBtn: {
    position:"absolute",top:15,right:17,backgroundColor:"rgba(60,60,60,0.77)",
    borderRadius:18,padding:2,zIndex:2
  },
});
export default HotelDetailsScreen;
