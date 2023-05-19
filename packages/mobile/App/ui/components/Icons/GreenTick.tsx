import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';
import { IconWithSizeProps } from '../../interfaces/WithSizeProps';

export const GreenTickIcon = memo((props: IconWithSizeProps) => {
  const xml = `
  <svg width="62" height="52" viewBox="0 0 62 52" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M51.7125 3.13387C41.5658 16.7622 31.4152 30.3926 21.2647 44.0248C22.8166 43.1801 24.3666 42.3372 25.9166 41.4906C29.468 41.4673 30.1249 43.6683 26.7497 40.4714C24.2697 38.1135 21.7878 35.7614 19.3078 33.4073C15.9385 30.2085 12.573 27.0116 9.20566 23.8167C4.29023 19.1531 -3.32415 26.38 1.58548 31.0474C7.43479 36.5984 13.2802 42.1474 19.1295 47.7002C23.3552 51.7128 27.4395 53.3849 31.4637 47.9831C41.3139 34.7577 51.1661 21.5246 61.0125 8.29343C65.0405 2.89556 55.694 -2.20201 51.7125 3.13387Z" fill="#47CA80"/>
  </svg>  
  `;

  return <SvgXml xml={xml} {...props} height={props.size} width={props.size} />;
});
