import React, { memo } from 'react';
import { SvgProps, SvgXml } from 'react-native-svg';

export const CheckboxMarkIcon = memo((props: SvgProps) => {
  const xml = `
  <svg width="15" height="11" viewBox="0 0 15 11" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M1.25 5.49992L5.41667 9.66659L13.75 1.33325" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
</svg>
`;

  return <SvgXml xml={xml} {...props} />;
});
