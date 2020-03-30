import React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

export const Ring = React.memo((props: SvgProps) => (
  <Svg width="32" height="32" viewBox="0 0 32 32" fill="none" {...props}>
    <Path d="M31.5281 22.8688C27.7643 19.104 27.1979 17.2149 27.1979 11.2C27.1979 5.01437 22.1846 0 16.0001 0C9.81554 0 4.80224 5.01443 4.80224 11.2C4.80224 14.4432 4.71586 15.6538 4.26943 17.1402C3.71424 18.992 2.57449 20.7648 0.471559 22.8688C-0.535877 23.8768 0.177747 25.6 1.60281 25.6H10.4812L10.4006 26.4C10.4006 29.4928 12.9073 31.9999 15.9995 31.9999C19.0918 31.9999 21.5985 29.4928 21.5985 26.4L21.5179 25.6H30.3968C31.8224 25.6 32.5361 23.8768 31.5281 22.8688ZM16.0006 30.3999C13.792 30.3999 12.0012 28.6085 12.0012 26.4L12.0817 25.6H19.9185L20.0001 26.4C20.0001 28.6085 18.2092 30.3999 16.0006 30.3999ZM1.60331 24C6.40224 19.2 6.40223 16 6.40223 11.2C6.40223 5.89868 10.6993 1.6 16.0001 1.6C21.3009 1.6 25.5979 5.89868 25.5984 11.2C25.5984 16 25.5984 19.2 30.3974 24H1.60331Z" />
  </Svg>
));
