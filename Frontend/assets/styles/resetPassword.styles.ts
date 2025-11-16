// frontend/assets/styles/resetPassword.styles.ts
import { StyleSheet } from "react-native";
import { ThemeType } from "../../themes/theme";

const createResetPasswordStyles = (colors: ThemeType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 20,
      justifyContent: "center",
    },
    label: {
      fontSize: 14,
      marginBottom: 8,
      color: colors.textPrimary,
      fontWeight: "500",
    },
    input: {
      height: 48,
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      marginBottom: 16,
      color: colors.textDark,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      height: 50,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 8,
    },
    buttonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: "600",
    },
  });

export default createResetPasswordStyles;
