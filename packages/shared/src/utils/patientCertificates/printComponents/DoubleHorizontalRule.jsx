import { View } from '@react-pdf/renderer';
import React from 'react';
import { HorizontalRule } from './HorizontalRule';

export const DoubleHorizontalRule = ({ width = '1px' }) => {
  return (
    <View>
      <HorizontalRule width={width} style={{marginBottom: 0.5}}/>
      <HorizontalRule width={width} style={{marginTop: 0}}/>
    </View>
  );
};
