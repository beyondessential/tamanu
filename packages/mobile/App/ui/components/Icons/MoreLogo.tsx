import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';
import { IconWithSizeProps } from '../../interfaces/WithSizeProps';

export const MoreLogoIcon = memo((props: IconWithSizeProps) => {
  const xml = `
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 23 21" fill="none">
  <path d="M17.1538 10.2981C17.1538 11.6388 18.2362 12.7212 19.5769 12.7212C20.9177 12.7212 22 11.6388 22 10.2981C22 8.95731 20.9177 7.875 19.5769 7.875C18.2362 7.875 17.1538 8.95731 17.1538 10.2981ZM13.9231 10.2981C13.9231 8.95731 12.8408 7.875 11.5 7.875C10.1592 7.875 9.07692 8.95731 9.07692 10.2981C9.07692 11.6388 10.1592 12.7212 11.5 12.7212C12.8408 12.7212 13.9231 11.6388 13.9231 10.2981ZM5.84615 10.2981C5.84615 8.95731 4.76385 7.875 3.42308 7.875C2.08231 7.875 1 8.95731 1 10.2981C1 11.6388 2.08231 12.7212 3.42308 12.7212C4.76385 12.7212 5.84615 11.6388 5.84615 10.2981Z" stroke="${props.focusedColor}"/>
  </svg>
  `;
  return <SvgXml xml={xml} {...props} height={props.size} width={props.size} />;
});
