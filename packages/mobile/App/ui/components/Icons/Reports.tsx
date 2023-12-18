import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';
import { IconWithSizeProps } from '../../interfaces/WithSizeProps';

export const ReportsIcon = memo((props: IconWithSizeProps) => {
  const xml = `
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 21 21" fill="none">
  <g clip-path="url(#clip0_9544_419)">
    <path d="M19.8634 20.5H16.2264V14.3429H19.8634V20.5ZM12.3179 0.5V20.5H8.6808V0.5H12.3179ZM4.77361 7.42081V20.4993H1.13589V7.42081H4.77361Z" stroke="${props.focusedColor}"/>
  </g>
  <defs>
    <clipPath id="clip0_9544_419">
      <rect width="21" height="21" fill="${props.focusedColor}"/>
    </clipPath>
  </defs>
</svg>
`;
  return <SvgXml xml={xml} {...props} height={props.size} width={props.size} />;
});
