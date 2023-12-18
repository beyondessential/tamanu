import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';
import { IconWithSizeProps } from '../../interfaces/WithSizeProps';

export const SyncCloudIcon = memo((props: IconWithSizeProps) => {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 27 20" fill="none">
  <path d="M15.5833 10.8302H16.8261L13.5 14.2338L10.1738 10.8302H11.4167H11.9167V10.3302V6.68345H15.0833V10.3302V10.8302H15.5833ZM26.5 12.4036C26.5 9.57002 24.3092 7.16588 21.6163 6.76384C20.7095 3.18702 17.4656 0.5 13.5 0.5C10.3867 0.5 7.67766 2.16116 6.29957 4.69045C2.90855 5.28197 0.5 8.76564 0.5 12.0926C0.5 15.789 3.53556 18.842 7.25 18.842H20.7917C22.3846 18.842 23.8225 18.2218 24.8585 17.089C25.8931 15.9578 26.5 14.3465 26.5 12.4036Z" stroke="${props.focusedColor}"/>
</svg>`;
  return <SvgXml xml={xml} {...props} height={props.size} width={props.size} />;
});
