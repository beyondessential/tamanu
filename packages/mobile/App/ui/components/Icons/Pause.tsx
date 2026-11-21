import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';
import type { IconWithSizeProps } from '../../interfaces/WithSizeProps';
import { theme } from '../../styled/theme';

export const PauseIcon = memo((props: IconWithSizeProps) => {
  const xml = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" stroke="${theme.colors.SECONDARY_MAIN}" stroke-width="1.5"/>
    <path d="M9.5 8v8M14.5 8v8" stroke="${theme.colors.SECONDARY_MAIN}" stroke-width="2" stroke-linecap="round"/>
  </svg>
  `;

  return <SvgXml xml={xml} {...props} height={props.size} width={props.size} />;
});
