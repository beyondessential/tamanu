import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';
import { IconWithSizeProps } from '../../interfaces/WithSizeProps';

export const SearchIcon = memo((props: IconWithSizeProps) => {
  const xml = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M15.4889 14.5735L11.6808 10.6129C12.66 9.44901 13.1964 7.98455 13.1964 6.45999C13.1964 2.89801 10.2984 0 6.73642 0C3.17444 0 0.276428 2.89801 0.276428 6.45999C0.276428 10.022 3.17444 12.92 6.73642 12.92C8.07364 12.92 9.34794 12.5167 10.4374 11.751L14.2744 15.7416C14.4348 15.9082 14.6505 16 14.8816 16C15.1004 16 15.308 15.9166 15.4656 15.7649C15.8004 15.4428 15.811 14.9085 15.4889 14.5735ZM6.73642 1.68522C9.36929 1.68522 11.5112 3.82713 11.5112 6.45999C11.5112 9.09286 9.36929 11.2348 6.73642 11.2348C4.10355 11.2348 1.96164 9.09286 1.96164 6.45999C1.96164 3.82713 4.10355 1.68522 6.73642 1.68522Z" />
</svg>
`;

  return <SvgXml xml={xml} {...props} />;
});
