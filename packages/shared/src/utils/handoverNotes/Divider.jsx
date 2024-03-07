import React from 'react';
import { View } from '@react-pdf/renderer';
import { CustomStyleSheet } from '../renderPdf';

const dividerStyles = CustomStyleSheet.create({
  borderTop: '1 solid #000000',
  marginTop: 10,
  marginBottom: 10,
});
export const Divider = props => <View {...props} style={dividerStyles()} />;
