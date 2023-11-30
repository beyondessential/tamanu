import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';
import { IconWithSizeProps } from '~/ui/interfaces/WithSizeProps';

export const LaunchIcon = memo((props: IconWithSizeProps) => {
  const xml = `
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10.875 10.875H2.125V2.125H6.5V0.875H2.125C1.43125 0.875 0.875 1.4375 0.875 2.125V10.875C0.875 11.5625 1.43125 12.125 2.125 12.125H10.875C11.5625 12.125 12.125 11.5625 12.125 10.875V6.5H10.875V10.875ZM7.75 0.875V2.125H9.99375L3.85 8.26875L4.73125 9.15L10.875 3.00625V5.25H12.125V0.875H7.75Z" fill="${props.color}"/>
</svg>
  `;
  return <SvgXml xml={xml} {...props} width={props.size} height={props.size} />;
});