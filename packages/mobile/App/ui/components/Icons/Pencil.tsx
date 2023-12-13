import React, { FunctionComponent, memo } from 'react';
import { SvgProps, SvgXml } from 'react-native-svg';

export const PencilIcon: FunctionComponent<SvgProps> = memo(props => {
  const xml = `
    <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 19.7924V25H5.20761L20.5666 9.64102L15.359 4.43341L0 19.7924ZM24.5938 5.6138C25.1354 5.07221 25.1354 4.19733 24.5938 3.65574L21.3443 0.406194C20.8027 -0.135398 19.9278 -0.135398 19.3862 0.406194L16.8449 2.94751L22.0525 8.15512L24.5938 5.6138Z" fill="#326699" />
    </svg>
  `;
  return <SvgXml xml={xml} {...props} />;
});
