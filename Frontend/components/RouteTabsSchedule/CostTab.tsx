import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Image,
  Platform
} from "react-native";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { confirmSchedule } from "../../utils/api";
import { useAuthStore } from "../../store/authStore";

const CostTab = () => {
  const router = useRouter();
  const budgetHotel = useSelector((state:any) => state.inforUserTravel.userHotelBudget);
  const budgetFlight = useSelector((state:any) => state.inforUserTravel.userFlightBudget);
  const budgetFun = useSelector((state:any) => state.inforUserTravel.userFunBudget);
  const days = useSelector((state:any) => state.inforUserTravel.userSchedule);
  const hotelDefault = useSelector((state:any) => state.inforUserTravel.userInforHotel);
  const flightTicket = useSelector((state:any) => state.inforUserTravel.userFlightTicket); // Nếu có: ví dụ máy bay/tàu
  const mainTransport = useSelector((state:any) => state.inforUserTravel.userTransportMain); // Phương tiện chính đi tới nơi đến
  const innerTransport = useSelector((state:any) => state.inforUserTravel.userTransportType); // Nội đô
  const fromLocation = useSelector((state:any) => state.inforUserTravel.userCurrentLocation);
  const province = useSelector((state:any) => state.inforUserTravel.userProvince);

  const home = useSelector((state:any) => state.inforUserTravel.userHomeAddress);

   const startDate = useSelector((state:any) => state.inforUserTravel.userStartDate); 
  const endDate = useSelector((state:any) => state.inforUserTravel.userEndDate); 

  const useHome = !!(home && home.lat && home.lon);
  const baseStay = useHome ? home : hotelDefault;


  const [isPublic, setIsPublic] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const { token } = useAuthStore();


  const handleSave = () => setModalVisible(true);


console.log("days (Costabs): ", days);



  const handleConfirmSave = async () => {
    setModalVisible(false);
    if (!image || !imageBase64) {
      Alert.alert("Chọn ảnh đại diện lịch trình!");
      return;
    }
    const budgets = {
      flight: Number(budgetFlight?.replace(/\./g, "")) || 0,
      hotel: Number(budgetHotel?.replace(/\./g, "")) || 0,
      fun: Number(budgetFun?.replace(/\./g, "")) || 0,
    };
    const uriParts = image.split(".");
    const fileType = uriParts[uriParts.length - 1];
    const imageType = fileType ? `image/${fileType.toLowerCase()}` : "image/jpeg";
    const imageDataUrl = `data:${imageType};base64,${imageBase64}`;

    const res = await confirmSchedule(
      title, description, isPublic, budgets, days,baseStay,
      hotelDefault, flightTicket, mainTransport, innerTransport, fromLocation, province.name,
      token, imageDataUrl,useHome ,startDate, 
      endDate
    );
   
   
    if (res?.success) {
      Alert.alert("Thành công", "Đã lưu lịch trình!");
      router.replace("/");
    }
  };

  const pickImage = async () => {
    try {
      if (Platform.OS === "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          alert("Bạn cần cấp quyền truy cập ảnh!");
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled) {
        const selectedImage = result.assets[0];
        setImage(selectedImage.uri);
        if (selectedImage.base64) setImageBase64(selectedImage.base64);
        else {
          const base64 = await FileSystem.readAsStringAsync(
            selectedImage.uri,
            { encoding: "base64" }
          );
          setImageBase64(base64);
        }
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không lấy được ảnh");
    }
  };
  
  return (
    <ScrollView contentContainerStyle={styles.infoTabBox}>
      <View style={[
        styles.infoCard,
        { backgroundColor: "#fff6db", borderColor: "#ffecb3" },
      ]}>
        <MaterialCommunityIcons
          name="cash-multiple"
          size={37}
          color="#f4b400"
          style={{ marginBottom: 7 }}
        />
        <Text style={[styles.infoCardTitle, { color: "#b67c10" }]}>
          Quỹ chi tiêu
        </Text>
        <Text style={styles.infoField}>
          Khách sạn: <Text style={styles.boldText}>{budgetHotel} VNĐ</Text>
        </Text>
        <Text style={styles.infoField}>
          Vé phương tiện chính: <Text style={styles.boldText}>{budgetFlight} VNĐ</Text>
        </Text>
        <Text style={styles.infoField}>
          Quỹ đi chơi: <Text style={styles.boldText}>{budgetFun} VNĐ</Text>
        </Text>
        <Text style={[styles.infoField, {color:"#0c5cad"}]}>
          Phương tiện chính: <Text style={{fontWeight:"bold"}}>{mainTransport}</Text>
        </Text>
        <Text style={[styles.infoField, {color:"#0c5cad"}]}>
          Phương tiện nội thành: <Text style={{fontWeight:"bold"}}>{innerTransport}</Text>
        </Text>
        <View style={{
          flexDirection: "row",
          justifyContent: "center",
          marginTop: 25,
        }}>
          <TouchableOpacity
            style={[
              styles.choseBtn,
              !isPublic && {
                backgroundColor: "#bae8ff",
                borderColor: "#1dadf8",
              },
            ]}
            onPress={() => setIsPublic(false)}
          >
            <Ionicons name="lock-closed-outline" size={20} color="#1895ff" />
            <Text style={{ marginLeft: 8, color: "#1895ff", fontWeight: "bold" }}>
              Lưu riêng tư
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.choseBtn,
              isPublic && {
                backgroundColor: "#ffd49b",
                borderColor: "#ec7f08",
              },
            ]}
            onPress={() => setIsPublic(true)}
          >
            <Ionicons name="earth-outline" size={20} color="#ec7f08" />
            <Text style={{ marginLeft: 8, color: "#ec7f08", fontWeight: "bold" }}>
              Công khai
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Ionicons name="save-outline" size={20} color="#fff" />
          <Text
            style={{ color: "#fff", marginLeft: 8, fontWeight: "bold", fontSize: 16 }}
          >
            Lưu lịch trình
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.resetBtn} onPress={()=>Alert.alert("Tính năng reset sẽ cập nhật sau!")}>
          <Ionicons name="refresh-outline" size={17} color="#e53935" />
          <Text style={{ color: "#e53935", marginLeft: 7, fontWeight: "600" }}>
            Thiết lập lại
          </Text>
        </TouchableOpacity>
      </View>
      {/* -------- Modal nhập Title/Description -------- */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text
              style={{
                fontWeight: "bold", fontSize: 19,
                color: "#269bfa", marginBottom: 15, textAlign: "center",
              }}>
              Thông tin lịch trình
            </Text>
            <View style={{ alignItems: "center" }}>
              {image && (
                <Image
                  source={{ uri: image } as any}
                  style={{
                    width: 120, height: 90,
                    borderRadius: 12, marginBottom: 10,
                  }}
                  resizeMode="cover"
                />
              )}
              <TouchableOpacity
                style={{
                  backgroundColor: "#eeefff", borderRadius: 7,
                  flexDirection: "row", alignItems: "center",
                  marginBottom: 12, paddingVertical: 7, paddingHorizontal: 17,
                }}
                onPress={pickImage}
              >
                <Ionicons name="image-outline" size={20} color="#4577e5" />
                <Text
                  style={{
                    marginLeft: 8, fontWeight: "bold", color: "#4276e7",
                  }}>
                  {image ? "Đổi ảnh đại diện" : "Chọn ảnh đại diện"}
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Nhập tiêu đề lịch trình..."
              value={title}
              onChangeText={setTitle}
              maxLength={60}
            />
            <TextInput
              style={[styles.input, { minHeight: 48 }]}
              placeholder="Mô tả ngắn về lịch trình (tùy chọn)"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={180}
            />
            <View style={{
              flexDirection: "row", justifyContent: "flex-end", marginTop: 17,
            }}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{ paddingHorizontal: 18, paddingVertical: 7, marginRight: 12 }}
              >
                <Text
                  style={{ color: "#888", fontWeight: "bold", fontSize: 16 }}
                >Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { marginTop: 0, minWidth: 92 }]}
                onPress={handleConfirmSave}
              >
                <Ionicons name="checkmark-circle-outline" size={19} color="#fff" />
                <Text
                  style={{
                    color: "#fff", fontWeight: "bold",
                    fontSize: 16, marginLeft: 8,
                  }}
                >Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};
export default CostTab;

const styles = StyleSheet.create({
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
    alignItems: "center",
    width: "100%",
    elevation: 7,
    shadowColor: "#91caff",
    shadowOpacity: 0.18,
    borderWidth: 1.2,
    borderColor: "#dae6f9",
    marginBottom: 15,
  },
  infoCardTitle: {
    fontWeight: "bold",
    fontSize: 21,
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
  resetBtn: {
    flexDirection: "row",
    marginTop: 25,
    alignItems: "center",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "#ffedf2",
    elevation: 2,
  },
  choseBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ddd",
    borderRadius: 9,
    marginHorizontal: 7,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#e5e9ee",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#269bfa",
    marginTop: 26,
    borderRadius: 9,
    justifyContent: "center",
    paddingVertical: 13,
    paddingHorizontal: 19,
    shadowColor: "#11aaff",
    shadowOpacity: 0.12,
    elevation: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(44,56,95,0.16)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    width: "85%",
    elevation: 7,
    shadowColor: "#7dc0ed",
    shadowOpacity: 0.15,
  },
  input: {
    borderBottomWidth: 1.3,
    borderBottomColor: "#b4c9ef",
    paddingVertical: 11,
    paddingHorizontal: 3,
    fontSize: 16,
    marginBottom: 18,
    color: "#234",
  },
});
