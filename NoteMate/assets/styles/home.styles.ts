// styles/home.styles.js
import { StyleSheet } from "react-native";
import { ThemeType } from "../../themes/theme";

const createHomeStyles = (colors: ThemeType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    listContainer: {
      padding: 16,
      paddingBottom: 80,
    },
    header: {
      marginBottom: 20,
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 24,
      fontFamily: "JetBrainsMono-Medium",
      letterSpacing: 0.5,
      color: colors.primary,
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
    },
    bookCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      marginBottom: 20,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: colors.border,
      // Bỏ padding ở đây
    },
    bookHeader: {
        position: 'absolute',    // Nổi lên trên
        zIndex: 10,              // Đảm bảo nó nằm trên ảnh
        top: 12,
        left: 16,
        right: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userInfo: {
      flexDirection: "row",
      alignItems: "center",
      // Thêm background mờ để dễ đọc hơn
      backgroundColor: 'rgba(0,0,0,0.4)',
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 20,
    },

    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginRight: 8,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.9)',
    },

    username: {
      fontSize: 15,
      fontWeight: "600",
      color: '#fff', // Chữ màu trắng
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
     bookImageContainer: {
      position: 'relative', // Quan trọng để các phần tử con có thể định vị tuyệt đối
      width: "100%",
      aspectRatio: 16 / 9, // Giữ tỉ lệ ảnh
      justifyContent: 'flex-start', // Đẩy header lên trên
    },
    bookImage: {
      width: "100%",
      height: "100%",
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    bookDetails: {
      padding: 16,
    },
    bookTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 6,
    },
    ratingContainer: {
      flexDirection: "row",
      marginBottom: 8,
    },
    caption: {
      fontSize: 14,
      color: colors.textDark,
      marginBottom: 8,
      lineHeight: 20,
    },
    date: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
      marginTop: 40,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.textPrimary,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
    },
    footerLoader: {
      marginVertical: 20,
    },
   page: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  suggestionText: {
    padding: 12,
    fontSize: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  menuOptionsContainer: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 15,
  },
  menuOptionText: {
      marginLeft: 12,
      fontSize: 16,
      color: colors.text,
  },
  });

export default createHomeStyles;
