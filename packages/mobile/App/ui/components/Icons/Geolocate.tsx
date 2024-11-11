import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';
import { IconWithSizeProps } from '../../interfaces/WithSizeProps';
import { theme } from '~/ui/styled/theme';

export const Geolocate = memo((props: IconWithSizeProps) => {
  const xml = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g clip-path="url(#clip0_10588_10916)">
  <path d="M17.4499 9.16683C17.0666 5.69183 14.3083 2.9335 10.8333 2.55016V0.833496H9.16658V2.55016C5.69158 2.9335 2.93325 5.69183 2.54992 9.16683H0.833252V10.8335H2.54992C2.93325 14.3085 5.69158 17.0668 9.16658 17.4502V19.1668H10.8333V17.4502C14.3083 17.0668 17.0666 14.3085 17.4499 10.8335H19.1666V9.16683H17.4499ZM9.99992 15.8335C6.77492 15.8335 4.16658 13.2252 4.16658 10.0002C4.16658 6.77516 6.77492 4.16683 9.99992 4.16683C13.2249 4.16683 15.8333 6.77516 15.8333 10.0002C15.8333 13.2252 13.2249 15.8335 9.99992 15.8335Z" fill="${theme.colors.PRIMARY_MAIN}"/>
  </g>
  <defs>
  <clipPath id="clip0_10588_10916">
  <rect width="20" height="20" fill="white"/>
  </clipPath>
  </defs>
  </svg>
  `;
  return <SvgXml xml={xml} {...props} height={props.size} width={props.size} />;
});
