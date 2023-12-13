import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';

export const PhoneIcon = memo(props => {
  const xml =
    `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M0.20315 5.49072C3.19508 14.138 10.2949 15.886 11.3839 15.969C13.9943 16.2515 15.6723 14.5775 15.9998 12.0431C15.9998 12.0431 13.3609 10.3246 12.0439 10.0426L9.96293 12.1741C9.96293 12.1741 8.84345 12.2246 6.39001 9.71262C3.93857 7.20168 3.98706 6.05471 3.98706 6.05471L5.77802 4.21975C5.47903 2.36029 4.42805 -0.579142 2.3726 0.0998425C0.347647 0.752828 -0.400836 3.67726 0.20315 5.49072Z" fill="white" />
</svg>
`;
  return <SvgXml xml={xml} {...props} />;
});
