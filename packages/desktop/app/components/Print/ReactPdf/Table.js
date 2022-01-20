import { StyleSheet, Text, View } from "@react-pdf/renderer";
import React from "react";

const tableStyles = StyleSheet.create({
  table: {
    borderTop: "1 solid black",
    borderLeft: "1 solid black",
  },
  tr: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderBottom: "1 solid black",
  },
  th: {
    flex: 1,
    fontSize: 10,
    padding: 3,
    borderRight: "1 solid black",
    margin: 0,
  },
  td: {
    flex: 1,
    padding: 3,
    fontSize: 10,
    margin: 0,
    borderRight: "1 solid black",
  },
});

const TR = (props) => <View {...props} style={tableStyles.tr} />;
const TH = (props) => <Text {...props} style={tableStyles.th} />;
const TD = (props) => <Text {...props} style={tableStyles.td} />;

export const Table = () => {
  const columns = [];
  const data = [];
  return (
    <View style={tableStyles.table}>
      <TR>
        <TH>Date of swab</TH>
        <TH>Date of test</TH>
        <TH>Laboratory</TH>
        <TH>Request ID</TH>
      </TR>
      <TR>
        <TD>01/01/2022</TD>
        <TD>11/01/2022</TD>
        <TD>Tonga Health Center</TD>
        <TD>11223344</TD>
      </TR>
    </View>
  );
};
