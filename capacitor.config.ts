import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.example.galaxygallery",
  appName: "Gallery",
  webDir: "out",
  android: { allowMixedContent: false },
  plugins: {
    SplashScreen: { launchShowDuration: 1200, backgroundColor: "#f7f7fb" }
  }
};
export default config;