import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface GuideOverlayProps {
  stepText: string;
  statusMessage: string;
}

export const GuideOverlay = ({ stepText, statusMessage }: GuideOverlayProps) => {
  return (
    <View style={styles.guideContainer}>
      <Text style={styles.stepText}>{stepText}</Text>
      <Text style={styles.statusText}>{statusMessage}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  guideContainer: {
    position: "absolute",
    top: 60,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    width: "80%",
  },
  stepText: { color: "#FFF", fontSize: 14, fontWeight: "bold", opacity: 0.8 },
  statusText: {
    color: "#00FF00",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 5,
  },
});
// Note: Fixed 'bold' to '"bold"' in styles
