import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { RegistrationStep } from "../../hooks/useFaceRegistration";

interface GuideOverlayProps {
  step: RegistrationStep;
  statusMessage: string;
}

export const GuideOverlay = ({ step, statusMessage }: GuideOverlayProps) => {
  let stepText = "";
  let currentStep = 0;

  switch (step) {
    case "STRAIGHT":
      stepText = "Bước: 1/3";
      currentStep = 1;
      break;
    case "LEFT":
      stepText = "Bước: 2/3";
      currentStep = 2;
      break;
    case "RIGHT":
      stepText = "Bước: 3/3";
      currentStep = 3;
      break;
    case "DONE":
      stepText = "Hoàn tất";
      currentStep = 3;
      break;
    default:
      stepText = "Bước: 1/3";
      currentStep = 1;
  }

  return (
    <View style={styles.guideContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.titleText}>ĐĂNG KÝ KHUÔN MẶT</Text>
        <Text style={styles.stepText}>{stepText}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${(currentStep / 3) * 100}%` },
          ]}
        />
      </View>

      <Text style={styles.statusText}>{statusMessage}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  guideContainer: {
    position: "absolute",
    top: 60,
    backgroundColor: "rgba(15, 23, 42, 0.85)", // Slate dark glassmorphism
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    width: "85%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },
  titleText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  stepText: {
    color: "#3B82F6",
    fontSize: 13,
    fontWeight: "700",
  },
  progressBarBg: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 2,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 2,
  },
  statusText: {
    color: "#22C55E",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
});
