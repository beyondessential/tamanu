import { StyleSheet, View } from '@react-pdf/renderer';
import React from 'react';

const dividerStyles = StyleSheet.create({
  borderTop: '1 solid #000000',
  marginTop: 10,
  marginBottom: 10,
});
export const Divider = props => <View {...props} style={dividerStyles} />;
