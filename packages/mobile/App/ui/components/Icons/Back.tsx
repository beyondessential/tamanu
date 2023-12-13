import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';

export const BackIcon = memo(props => {
  const xml =
    `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M30.693 14.1772H4.733L12.496 6.14825C13.006 5.65725 13.006 4.85925 12.496 4.36825C11.986 3.87725 11.16 3.87725 10.651 4.36825L0 15.4622L10.486 26.6343C10.741 26.8813 11.075 27.0053 11.408 27.0053C11.741 27.0053 12.077 26.8822 12.331 26.6343C12.842 26.1433 12.842 25.3472 12.331 24.8563L4.648 16.6953H30.693C31.415 16.6953 32 16.1322 32 15.4352C32 14.7402 31.415 14.1772 30.693 14.1772Z" fill="black" />
</svg>
`;
  return <SvgXml xml={xml} {...props} />;
});
