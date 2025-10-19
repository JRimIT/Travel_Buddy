import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import { API_URL } from "../../constants/api";
import { useTheme } from "../../contexts/ThemeContext";
import createHomeStyles from "../../assets/styles/home.styles";
import { formatPublishDate } from "../../lib/utils";
import Loader from "../Loader";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";


const NoteComponent = () => {
     const router = useRouter();
  const { colors } = useTheme();
  const styles = createHomeStyles(colors);
  const { logout, token } = useAuthStore();

  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);       // Lần load đầu
  const [loadingMore, setLoadingMore] = useState(false); // Load more
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [query, setQuery] = useState("");
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Lấy danh sách books ban đầu
  useEffect(() => {
    fetchBooks(1, true);
    fetchFavorites();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
      fetchBooks(1, true);
    }, [])
  );

  // =================== FETCH BOOKS ===================
  // const fetchBooks = async (pageNumber = 1, refresh = false) => {
  //   try {
  //     if (refresh) setRefreshing(true);
  //     else if (pageNumber === 1) setLoading(true);
  //     else setLoadingMore(true);

  //     const response = await fetch(`${API_URL}/books?page=${pageNumber}&limit=2`, {
  //       method: "GET",
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         "Content-Type": "application/json",
  //       },
  //     });

  //     const data = await response.json();

  //     if (!response.ok) throw new Error(data.message || "Failed to fetch books");

  //     if (refresh || pageNumber === 1) setBooks(data.books);
  //     else setBooks((prev) => [...prev, ...data.books]);

  //     setHasMore(pageNumber < data.totalPages);
  //     setPage(pageNumber);
  //   } catch (error: any) {
  //     console.error("Error fetching books:", error);
  //     if (error.message.includes("jwt")) {
  //       logout();
  //       Alert.alert("ERROR", "Please login again!");
  //     } else {
  //       Alert.alert("ERROR", "An unexpected error occurred");
  //     }
  //   } finally {
  //     setLoading(false);
  //     setLoadingMore(false);
  //     setRefreshing(false);
  //   }
  // };

  const normalizeBooks = (list: any[]) =>
  list.map((b, i) => ({
    ...b,
    _id: b._id || `temp-${Date.now()}-${i}`, // fallback id tạm
  }));

  const fetchBooks = async (pageNumber = 1, refresh = false) => {
  if (!token) {
    console.log("Token is missing, redirecting to login...");
    logout();
    return;
  }

  try {
    if (refresh) setRefreshing(true);
    else if (pageNumber === 1) setLoading(true);
    else setLoadingMore(true);

    const response = await fetch(
      `${API_URL}/books?page=${pageNumber}&limit=5`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to fetch books");

    // Normalize
    const newBooks = normalizeBooks(data.books);

    if (refresh || pageNumber === 1) {
      setBooks(newBooks);
    } else {
      setBooks((prev) => {
        const merged = [...prev, ...newBooks];
        // Loại bỏ trùng theo _id
        const unique = Array.from(new Map(merged.map((b) => [b._id, b])).values());
        return unique;
      });
    }

    setHasMore(pageNumber < data.totalPages);
    setPage(pageNumber);
  } catch (error: any) {
    console.error("Error fetching books:", error);
    if (error.message.includes("jwt")) {
      logout();
      Alert.alert("ERROR", "Please login again!");
    } else {
      Alert.alert("ERROR", "An unexpected error occurred");
    }
  } finally {
    setLoading(false);
    setLoadingMore(false);
    setRefreshing(false);
  }
};


  // =================== SEARCH ===================
  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      setSearchText("");
      return;
    }

    setSearching(true);
    setSearchText(query);

    try {
      const response = await fetch(`${API_URL}/books/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  // =================== FAVORITES ===================
  const fetchFavorites = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/favorites`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await response.json();
      setFavorites(data.map((b: any) => b._id));
    } catch (error) {
      console.log("Error fetching favorites", error);
    }
  };

  const handleToggleFavorite = async (bookId: string) => {
    const isFavorite = favorites.includes(bookId);
    const method = isFavorite ? "DELETE" : "POST";
    try {
      await fetch(`${API_URL}/auth/favorite/${bookId}`, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
      fetchFavorites();
    } catch (error) {
      console.log("Error toggling favorite", error);
    }
  };

  // =================== NAVIGATION ===================
  const handleDetailPress = (bookId: string) => {
    router.push({ pathname: "/(page)/detail", params: { id: bookId } });
  };

  // =================== RENDER ITEM ===================
  const renderRatingStars = (rating: number) => {
    return (
      <View style={{ flexDirection: "row" }}>
        {Array.from({ length: 5 }, (_, i) => (
          <Ionicons
            key={i}
            name={i < rating ? "star" : "star-outline"}
            size={16}
            color={i < rating ? "#f4b400" : colors.textSecondary}
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
    );
  };

  const renderItem = ({ item }: any) => (
    
    
    <TouchableOpacity onPress={() => handleDetailPress(item._id)} style={styles.bookCard} activeOpacity={0.8}>
      <TouchableOpacity
        onPress={() => handleToggleFavorite(item._id)}
        style={{
          position: "absolute",
          top: 12, 
          right: 12,
          zIndex: 10,
          backgroundColor: "#fff",
          borderRadius: 20,
          padding: 4,
          elevation: 2,
        }}
      >
        <Ionicons name={favorites.includes(item._id) ? "heart" : "heart-outline"} size={22} color={favorites.includes(item._id) ? "#e53935" : "#888"} />
      </TouchableOpacity>

      <View style={styles.bookHeader}>
        <View style={styles.userInfo}>
          <Image source={{ uri: item.user?.profileImage }} style={styles.avatar} />
          <Text style={styles.username}>{item.user.username}</Text>
        </View>
      </View>

      <View style={styles.bookImageContainer}>
        <Image source={{ uri: item.image }} style={styles.bookImage} />
      </View>

      <View style={styles.bookDetails}>
        <Text style={styles.bookTitle}>{item.title}</Text>
        {renderRatingStars(item.rating)}
        <Text style={styles.caption}>{item.caption}</Text>
        <Text style={styles.date}>Shared on {formatPublishDate(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  // =================== LOAD MORE ===================
  const handleLoadMore = () => {
    if (hasMore && !loading && !loadingMore && !refreshing) fetchBooks(page + 1);
  };

  // =================== RENDER ===================
  if (loading && !searching) return <Loader />;


  return (
    <View style={styles.container}>
          {/* Search Input */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20, marginTop: 20, justifyContent: "center", padding: 10 }}>
            <TextInput
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#bbb",
                borderRadius: 24,
                paddingVertical: 12,
                paddingHorizontal: 20,
                fontSize: 16,
                backgroundColor: "#fff",
                marginRight: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 2,
              }}
              placeholder="🔍 Tìm kiếm ghi chú/sách..."
              placeholderTextColor="#888"
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                if (text === "") {
                  setSearchText("");
                  setResults([]);
                }
              }}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={{
                backgroundColor: colors.back,
                borderRadius: 24,
                paddingVertical: 12,
                paddingHorizontal: 28,
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.85}
              onPress={handleSearch}
            >
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>Tìm</Text>
            </TouchableOpacity>
          </View>
    
          {/* FlatList */}
          <FlatList
            data={searchText ? results : showFavoritesOnly ? books.filter((b) => favorites.includes(b._id)) : books}
            keyExtractor={(item: any) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchBooks(1, true)} colors={[colors.primary]} tintColor={colors.primary} />}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListHeaderComponent={
              searchText
                ? null
                : (
                  <View style={styles.header}>
                    <Text style={styles.headerTitle}>Travel Buddy</Text>
                    <Text style={styles.headerSubtitle}>Note it. Mate it. Done.</Text>
                  </View>
                )
            }
            ListFooterComponent={
              loadingMore ? <ActivityIndicator style={{ marginVertical: 20 }} size="large" color={colors.primary} /> : null
            }
            ListEmptyComponent={
              searchText ? (
                <Text style={{ marginTop: 20 }}>Không có kết quả</Text>
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="book-outline" size={64} color={colors.textSecondary} />
                  <Text style={styles.emptyText}>No books found</Text>
                  <Text style={styles.emptySubtext}>Start sharing your favorite books!</Text>
                </View>
              )
            }
          />
                {/* NÚT TẠO NOTE HOẶC ĐI FORM */}
          <TouchableOpacity
            style={{
              position: "absolute",
              bottom: 36,
              right: 30,
              width: 62,
              height: 62,
              backgroundColor: colors.primary || "#276ef1",
              borderRadius: 31,
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.18,
              shadowRadius: 6,
              elevation: 8,
              zIndex: 100,
            }}
            activeOpacity={0.85}
            onPress={() => router.push("/FormTravel")}
          >
            <Ionicons name="add" size={38} color="#fff" />
          </TouchableOpacity>


        </View>
  )
}

export default NoteComponent