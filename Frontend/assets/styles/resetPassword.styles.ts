import { StyleSheet, Dimensions } from "react-native";
import { ThemeType } from "../../themes/theme";

const { width } = Dimensions.get("window");

const createResetPasswordStyles = (colors: ThemeType) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: colors.background,
      padding: 20,
      justifyContent: "center",
    },
    scrollViewStyle: {
      flex: 1,
      backgroundColor: colors.background,
    },
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 24,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 2,
      borderColor: colors.border,
    },
    header: {
      alignItems: "center",
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 16,
    },
    formContainer: {
      marginBottom: 16,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      marginBottom: 8,
      color: colors.textPrimary,
      fontWeight: "500",
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
    },
    input: {
      flex: 1,
      height: 48,
      color: colors.textDark,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      height: 50,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 16,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    buttonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: "600",
    },
  });

export default createResetPasswordStyles;
