import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';
import { StyledView } from '../../styled/common';
import { IconWithSizeProps } from '../../interfaces/WithSizeProps';

export const GivenOnTimeIcon = memo(
  ({ size, background, fill = 'white' }: IconWithSizeProps) => {
    const xml = `
        <svg width="100%" height="100%" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">
    <circle cx="17" cy="17" r="16" stroke="#DEDEDE" stroke-width="2"/>
    <circle cx="17" cy="17" r="17" fill=${background || '#47CA80'}/>
    <path d="M22.3452 10.5829C19.7267 14.0999 17.1072 17.6174 14.4877 21.1354C14.8882 20.9174 15.2882 20.6999 15.6882 20.4814C16.6047 20.4754 16.7742 21.0434 15.9032 20.2184C15.2632 19.6099 14.6227 19.0029 13.9827 18.3954C13.1132 17.5699 12.2447 16.7449 11.3757 15.9204C10.1072 14.7169 8.14216 16.5819 9.40916 17.7864C10.9187 19.2189 12.4272 20.6509 13.9367 22.0839C15.0272 23.1194 16.0812 23.5509 17.1197 22.1569C19.6617 18.7439 22.2042 15.3289 24.7452 11.9144C25.7847 10.5214 23.3727 9.20593 22.3452 10.5829Z"/>
    </svg>
    `;
    return (
      <StyledView height={size} width={size}>
        <SvgXml xml={xml} fill={fill} />
      </StyledView>
    );
  },
);
