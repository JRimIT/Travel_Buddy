import "dotenv/config";
// console.log("ENV TEST:", process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID);

export default {
  expo: {
    name: "TravelBuddy",
    slug: "travelbuddy",
    scheme: "travelbuddy",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/logoTB.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/logoTB.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      package: "com.travelbuddy.app",
      intentFilters: [
        {
          action: "VIEW",
          data: [
            {
              scheme: "travelbuddy",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
      adaptiveIcon: {
        foregroundImage: "./assets/logoTB.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
    },
    web: {
      favicon: "./assets/logoTB.png",
    },
    extra: {
      backendUrl: process.env.BACKEND_URL,
      facebookAppId: process.env.FACEBOOK_APP_ID,
      googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      googleExpoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    },
    plugins: ["expo-audio", "expo-router"],
  },
};
