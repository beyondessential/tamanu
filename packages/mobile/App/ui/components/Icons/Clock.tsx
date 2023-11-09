import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';
import {IconWithSizeProps} from "/interfaces/WithSizeProps";

export const ClockIcon = memo(({ size, fill, ...props }: IconWithSizeProps) => {
  const xml = `
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 0C3.589 0 0 3.589 0 8C0 12.411 3.589 16 8 16C12.411 16 16 12.411 16 8C16 3.589 12.411 0 8 0ZM12 8.5H7.5V3.5H8.5V7.5H12V8.5Z" fill="${fill}" />
  </svg>
  `;

  return <SvgXml xml={xml} {...props} height={size} width={size} />;
});
