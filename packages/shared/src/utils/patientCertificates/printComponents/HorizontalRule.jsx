import { View } from '@react-pdf/renderer';
import React from 'react';

export const HorizontalRule = ({ style = {} }) => {
  return (
    <View
      style={[
        {
          borderBottom: '1px solid black',
          marginVertical: '3px',
          flex: 1,
        },
        style,
      ]}
    />
  );
};
