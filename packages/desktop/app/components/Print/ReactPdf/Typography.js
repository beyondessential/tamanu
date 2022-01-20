import React from "react";
import { StyleSheet, Text, Font, View } from "@react-pdf/renderer";
import RobotoLight from "./Roboto/Roboto-Light.ttf";
import RobotoRegular from "./Roboto/Roboto-Regular.ttf";
import RobotoMedium from "./Roboto/Roboto-Medium.ttf";
import RobotoBold from "./Roboto/Roboto-Bold.ttf";
import RobotoBlack from "./Roboto/Roboto-Black.ttf";

Font.register({
  family: "Roboto",
  fonts: [
    { src: RobotoLight, fontWeight: 300 },
    { src: RobotoRegular, fontWeight: 400 },
    { src: RobotoMedium, fontWeight: 500 },
    { src: RobotoBold, fontWeight: 700 },
    { src: RobotoBlack, fontWeight: 900 },
  ],
});

export const styles = StyleSheet.create({
  h1: {
    fontFamily: "Roboto",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: 700,
  },
  h2: {
    fontFamily: "Roboto",
    textAlign: "center",
    fontSize: 14,
    marginBottom: 30,
    fontWeight: 500,
  },
  h3: {
    fontFamily: "Roboto",
    marginBottom: 10,
    fontSize: 12,
    fontWeight: 500,
    textDecoration: "underline",
  },
  p: {
    fontFamily: "Roboto",
    fontSize: 12,
    fontWeight: 400,
    marginBottom: 15,
  },
});

export const H1 = (props) => <Text {...props} style={styles.h1} />;
export const H2 = (props) => <Text {...props} style={styles.h2} />;
export const H3 = (props) => <Text {...props} style={styles.h3} />;
export const P = ({ mt = 0, mb, ...props }) => (
  <Text {...props} style={[styles.p, { marginTop: mt, marginBottom: mb }]} />
);
