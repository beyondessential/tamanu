import { View } from '@react-pdf/renderer';
import React from 'react';

export const HorizontalRule = ({ style = {}, width = '0.5px' }) => {
  return <View style={[{ borderBottom: `${width} solid black`, marginVertical: '3px' }, style]} />;
};
