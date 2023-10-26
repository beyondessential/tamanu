import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';
import { IconWithSizeProps } from '/interfaces/WithSizeProps';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

export const ArrowLeftIcon = memo(
  ({
    size = screenPercentageToDP(2.43, Orientation.Height),
    ...props
  }: IconWithSizeProps) => {
    const fill = props.fill || 'white';
    const xml = `<svg width="100%" height="100%" viewBox="0 0 32 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M30.693 10.1772H4.733L12.496 2.14825C13.006 1.65725 13.006 0.85925 12.496 0.36825C11.986 -0.12275 11.16 -0.12275 10.651 0.36825L0 11.4622L10.486 22.6343C10.741 22.8813 11.075 23.0053 11.408 23.0053C11.741 23.0053 12.077 22.8822 12.331 22.6343C12.842 22.1433 12.842 21.3472 12.331 20.8563L4.648 12.6953H30.693C31.415 12.6953 32 12.1322 32 11.4352C32 10.7402 31.415 10.1772 30.693 10.1772Z" fill='${fill}' />
    </svg>
  `;
    return <SvgXml xml={xml} {...props} height={size} width={size} />;
  },
);
