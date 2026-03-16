import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

interface LoadingOverlayProps {
  isVisible: boolean;
}

export const LoadingOverlay = ({ isVisible }: LoadingOverlayProps) => {
  if (!isVisible) return null;

  return (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color="#00FF00" />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});
