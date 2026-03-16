import React from "react";
import { StyleSheet, View } from "react-native";

export const FocusFrame = () => {
  return <View style={styles.focusFrame} />;
};

const styles = StyleSheet.create({
  focusFrame: {
    width: 280,
    height: 280,
    borderWidth: 2,
    borderColor: "#00FF00",
    borderRadius: 140,
    backgroundColor: "transparent",
  },
});
