import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';
import { IconWithSizeProps } from '/interfaces/WithSizeProps';

export const CalendarIcon = memo(({ size, fill = '#DEDEDE', ...props }: IconWithSizeProps) => {
  const xml = `
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M15 2H13V0H10V2H6V0H3V2H1C0.448 2 0 2.448 0 3V15C0 15.552 0.448 16 1 16H15C15.552 16 16 15.552 16 15V3C16 2.448 15.552 2 15 2ZM14 14H2V7H14V14Z" fill="${fill}" />
</svg>
`;

  return <SvgXml xml={xml} {...props} height={size} width={size} />;
});
