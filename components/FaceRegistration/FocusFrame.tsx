import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const CIRCLE_SIZE = 280;

interface FocusFrameProps {
  color?: string;
}

export const FocusFrame = ({ color = "#16A34A" }: FocusFrameProps) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [15, CIRCLE_SIZE - 20],
  });

  const topOffset = (screenHeight - CIRCLE_SIZE) / 2;
  const leftOffset = (screenWidth - CIRCLE_SIZE) / 2;

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* 4 dark backdrop blocks for transparent cutout */}
      <View style={[styles.backdrop, { top: 0, left: 0, right: 0, height: topOffset }]} />
      <View style={[styles.backdrop, { top: topOffset + CIRCLE_SIZE, left: 0, right: 0, bottom: 0 }]} />
      <View style={[styles.backdrop, { top: topOffset, left: 0, width: leftOffset, height: CIRCLE_SIZE }]} />
      <View style={[styles.backdrop, { top: topOffset, right: 0, width: leftOffset, height: CIRCLE_SIZE }]} />

      {/* Center Viewfinder circle */}
      <View style={[styles.focusFrame, { borderColor: color, top: topOffset, left: leftOffset }]}>
        {/* Glow corners */}
        <View style={[styles.corner, styles.topLeft, { borderColor: color }]} />
        <View style={[styles.corner, styles.topRight, { borderColor: color }]} />
        <View style={[styles.corner, styles.bottomLeft, { borderColor: color }]} />
        <View style={[styles.corner, styles.bottomRight, { borderColor: color }]} />

        {/* Dynamic laser scan line */}
        <Animated.View
          style={[
            styles.scanLine,
            {
              backgroundColor: color,
              shadowColor: color,
              transform: [{ translateY }],
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    backgroundColor: "rgba(15, 23, 42, 0.7)", // Slate dark overlay
  },
  focusFrame: {
    position: "absolute",
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderWidth: 1.5,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  scanLine: {
    position: "absolute",
    left: "5%",
    width: "90%",
    height: 3,
    borderRadius: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderWidth: 4,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
});
