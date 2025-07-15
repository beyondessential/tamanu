import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';
import { IconWithSizeProps } from '../../interfaces/WithSizeProps';

export const CircleAdd = memo((props: IconWithSizeProps) => {
  const xml = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16 0C7.2 0 0 7.2 0 16C0 24.8 7.2 32 16 32C24.8 32 32 24.8 32 16C32 7.2 24.8 0 16 0ZM23 17H17V23C17 23.6 16.6 24 16 24C15.4 24 15 23.6 15 23V17H9C8.4 17 8 16.6 8 16C8 15.4 8.4 15 9 15H15V9C15 8.4 15.4 8 16 8C16.6 8 17 8.4 17 9V15H23C23.6 15 24 15.4 24 16C24 16.6 23.6 17 23 17Z" fill="#326699"/>
<path d="M23 15H17V9C17 8.4 16.6 8 16 8C15.4 8 15 8.4 15 9V15H9C8.4 15 8 15.4 8 16C8 16.6 8.4 17 9 17H15V23C15 23.6 15.4 24 16 24C16.6 24 17 23.6 17 23V17H23C23.6 17 24 16.6 24 16C24 15.4 23.6 15 23 15Z" fill="white"/>
</svg>
`;
  return <SvgXml xml={xml} {...props} height={props.size} width={props.size} />;
});
