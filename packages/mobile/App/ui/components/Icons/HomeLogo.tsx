import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';
import { IconWithSizeProps } from '../../interfaces/WithSizeProps';

export const HomeLogoIcon = memo((props: IconWithSizeProps) => {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 23 23" fill="none">
  <path d="M9.26128 16.4309H8.76128V16.9309V22.5001H3.29113C3.16306 22.5001 3.04486 22.3918 3.04486 22.2414V12.0276L11.4986 4.65985L19.9553 12.0284V22.2414C19.9553 22.3918 19.8371 22.5001 19.709 22.5001H14.2389V16.9309V16.4309H13.7389H9.26128Z" stroke="${props.focusedColor}"/>
  <path d="M11.4985 0.71875L0.40094 10.4219L0.971665 11.1726L11.4985 1.99828L22.0284 11.1726L22.5992 10.4219L11.4985 0.71875Z" fill="${props.focusedColor}"/>
</svg>`;
  return <SvgXml xml={xml} {...props} height={props.size} width={props.size} />;
});
