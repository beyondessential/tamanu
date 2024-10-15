import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';
import { IconWithSizeProps } from '~/ui/interfaces/WithSizeProps';

export const PatientIcon = memo((props: IconWithSizeProps) => {
  const xml = `
  <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none">
  <path d="M15.25 5.25C15.25 7.87448 13.1245 10 10.5 10C7.87552 10 5.75 7.87448 5.75 5.25C5.75 2.62552 7.87552 0.5 10.5 0.5C13.1245 0.5 15.25 2.62552 15.25 5.25ZM0.5 18.375C0.5 17.6858 0.841263 17.0452 1.48694 16.4492C2.13601 15.8502 3.05883 15.3307 4.12179 14.9049C6.24852 14.053 8.81032 13.625 10.5 13.625C12.1897 13.625 14.7515 14.053 16.8782 14.9049C17.9412 15.3307 18.864 15.8502 19.5131 16.4492C20.1587 17.0452 20.5 17.6858 20.5 18.375V20.5H0.5V18.375Z" fill="${props.fill}" stroke="${props.focusedColor}"/>
</svg>
  `;
  return <SvgXml xml={xml} {...props} />;
});
