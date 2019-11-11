import React, { PropsWithChildren } from 'react';
import { View } from 'react-native';
import style from './style';

export default function CenterView({ children }: PropsWithChildren<{}>) {
  return <View style={style.main}>{children}</View>;
}
