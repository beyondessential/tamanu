import React from 'react';
import { StyleSheet, Text, View } from '@react-pdf/renderer';

const tableStyles = StyleSheet.create({
  table: {
    borderTop: '1 solid black',
    borderLeft: '1 solid black',
  },
  tr: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderBottom: '1 solid black',
  },
  th: {
    flex: 1,
    fontSize: 10,
    padding: 3,
    borderRight: '1 solid black',
    margin: 0,
  },
  td: {
    flex: 1,
    padding: 3,
    fontSize: 10,
    margin: 0,
    borderRight: '1 solid black',
  },
});

const TR = props => <View {...props} style={tableStyles.tr} />;
const TH = props => <Text {...props} style={tableStyles.th} />;
const TD = props => <Text {...props} style={tableStyles.td} />;

export const Table = ({ data, columns }) => (
  <View style={tableStyles.table}>
    <TR>
      {columns.map(({ title, key }) => (
        <TH key={key}>{title}</TH>
      ))}
    </TR>
    <TR>
      {columns.map(({ key, accessor }) => (
        <TD key={key}>{accessor ? accessor(data) : data[key]}</TD>
      ))}
    </TR>
  </View>
);
