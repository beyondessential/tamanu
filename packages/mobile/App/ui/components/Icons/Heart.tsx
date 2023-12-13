import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';

export const HeartIcon = memo(props => {
  const xml =
    `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M23.2 1C20.2 1 17.6 2.6 16 5C14.4 2.6 11.8 1 8.8 1C4 1 0 5 0 9.8C0 18.6 16 31.6 16 31.6C16 31.6 32 18.6 32 9.8C32 5 28 1 23.2 1Z" fill="black" />
</svg>
`;
  return <SvgXml xml={xml} {...props} />;
});
