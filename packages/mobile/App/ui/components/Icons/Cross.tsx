import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';
import { IconWithSizeProps } from '../../interfaces/WithSizeProps';

export const CrossIcon = memo((props: IconWithSizeProps) => {
  const xml = `
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M31.4 0.6C30.6 -0.2 29.4 -0.2 28.6 0.6L16 13.2L3.4 0.6C2.6 -0.2 1.4 -0.2 0.6 0.6C-0.2 1.4 -0.2 2.6 0.6 3.4L13.2 16L0.6 28.6C-0.2 29.4 -0.2 30.6 0.6 31.4C1 31.8 1.4 32 2 32C2.6 32 3 31.8 3.4 31.4L16 18.8L28.6 31.4C29 31.8 29.6 32 30 32C30.4 32 31 31.8 31.4 31.4C32.2 30.6 32.2 29.4 31.4 28.6L18.8 16L31.4 3.4C32.2 2.6 32.2 1.4 31.4 0.6Z" fill=${props.fill
      || 'white'} />
  </svg>
  `;

  return <SvgXml xml={xml} {...props} height={props.size} width={props.size} />;
});
