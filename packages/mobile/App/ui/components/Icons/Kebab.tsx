import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';

export const KebabIcon = memo(props => {
  const xml =
    `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7.84615 3.69231C8.86769 3.69231 9.69231 2.86769 9.69231 1.84615C9.69231 0.824615 8.86769 0 7.84615 0C6.82462 0 6 0.824615 6 1.84615C6 2.86769 6.82462 3.69231 7.84615 3.69231ZM7.84615 6.15385C6.82462 6.15385 6 6.97846 6 8C6 9.02154 6.82462 9.84615 7.84615 9.84615C8.86769 9.84615 9.69231 9.02154 9.69231 8C9.69231 6.97846 8.86769 6.15385 7.84615 6.15385ZM7.84615 12.3077C6.82462 12.3077 6 13.1323 6 14.1538C6 15.1754 6.82462 16 7.84615 16C8.86769 16 9.69231 15.1754 9.69231 14.1538C9.69231 13.1323 8.86769 12.3077 7.84615 12.3077Z" fill="white" />
</svg>`;
  return <SvgXml xml={xml} {...props} />;
});
