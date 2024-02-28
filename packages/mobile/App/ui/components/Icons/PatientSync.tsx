import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';
import { IconWithSizeProps } from '/interfaces/WithSizeProps';

export const PatientSyncIcon = memo(({ size, fill = '#DEDEDE', ...props }: IconWithSizeProps) => {
  const xml = `
  <svg width="33" height="23" viewBox="0 0 33 23" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M26.6062 8.805C25.6712 4.06125 21.505 0.5 16.5 0.5C12.5262 0.5 9.075 2.755 7.35625 6.055C3.2175 6.495 0 10.0012 0 14.25C0 18.8012 3.69875 22.5 8.25 22.5H26.125C29.92 22.5 33 19.42 33 15.625C33 11.995 30.1812 9.0525 26.6062 8.805ZM22.9706 12.875L16.5 18.6176L10.3529 12.875H13.75V7.375H19.25V12.875H22.9706Z" fill="${fill}"/>
</svg>
`;

  return <SvgXml xml={xml} {...props} height={size} width={size} />;
});
