import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';
import { IconWithSizeProps } from '../../interfaces/WithSizeProps';

export const ErrorIcon = memo((props: IconWithSizeProps) => {
  const xml = `
  <svg width="50" height="44" viewBox="0 0 50 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M25 9.4775L41.9425 38.75H8.0575L25 9.4775ZM25 0.5L0.25 43.25H49.75L25 0.5ZM27.25 32H22.75V36.5H27.25V32ZM27.25 18.5H22.75V27.5H27.25V18.5Z" fill="#F76853"/>
  </svg>  
  `;

  return <SvgXml xml={xml} {...props} height={props.size} width={props.size} />;
});
