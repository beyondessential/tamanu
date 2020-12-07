import React, { memo, ReactElement } from 'react';
import { SvgXml } from 'react-native-svg';
import { StyledView } from '/styled/common';
import { IconWithSizeProps } from '/interfaces/WithSizeProps';

export const NotGivenIcon = memo(
  ({ size, fill = 'white', background }: IconWithSizeProps): ReactElement => {
    const xml = `
    <svg width="100%" height="100%" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="17" cy="17" r="16" fill="white" stroke="#DEDEDE" stroke-width="2"/>
        <circle cx="17" cy="17" r="17" fill=${background || '#B8B8B8'}/>
        <path d="M22.775 11.225C22.475 10.925 22.025 10.925 21.725 11.225L17 15.95L12.275 11.225C11.975 10.925 11.525 10.925 11.225 11.225C10.925 11.525 10.925 11.975 11.225 12.275L15.95 17L11.225 21.725C10.925 22.025 10.925 22.475 11.225 22.775C11.375 22.925 11.525 23 11.75 23C11.975 23 12.125 22.925 12.275 22.775L17 18.05L21.725 22.775C21.875 22.925 22.1 23 22.25 23C22.4 23 22.625 22.925 22.775 22.775C23.075 22.475 23.075 22.025 22.775 21.725L18.05 17L22.775 12.275C23.075 11.975 23.075 11.525 22.775 11.225Z" />
    </svg>
    `;
    return (
      <StyledView height={size} width={size}>
        <SvgXml xml={xml} fill={fill} />
      </StyledView>
    );
  },
);
