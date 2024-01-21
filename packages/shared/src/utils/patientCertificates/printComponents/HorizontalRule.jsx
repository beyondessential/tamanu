import { View } from '@react-pdf/renderer';
import React from 'react';

export const HorizontalRule = ({ width = '1px' }) => {
  return <View style={{ borderBottom: `${width} solid black`, marginVertical: '3px' }} />;
};
