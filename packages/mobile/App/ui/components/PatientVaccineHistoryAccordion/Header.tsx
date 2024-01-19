import React, { FunctionComponent, ReactElement } from 'react';
import { SvgProps } from 'react-native-svg';
import { RowView, StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import * as Icons from '../Icons';
import { Separator } from '../Separator';

interface IconProps {
  IconComponent: FunctionComponent<SvgProps>;
  fill: string;
  height: number;
}

const StatusIcon = ({ IconComponent, ...rest }: IconProps): ReactElement => (
  <IconComponent {...rest} />
);

interface HeaderRightIconContainerProps {
  isActive: boolean;
}

const HeaderRightIconContainer = ({
  isActive,
}: HeaderRightIconContainerProps): ReactElement => (
  <StyledView>
    <StatusIcon
      height={12}
      IconComponent={isActive ? Icons.ArrowUpIcon : Icons.ArrowDownIcon}
      fill={isActive ? theme.colors.WHITE : theme.colors.TEXT_DARK}
    />
  </StyledView>
);

export const Header = (
  section: any,
  index: number,
  isActive: boolean,
): ReactElement => (
  <StyledView>
    <RowView
      width="100%"
      background={
        isActive ? theme.colors.MAIN_SUPER_DARK : theme.colors.BACKGROUND_GREY
      }
      height={60}
      alignItems="center"
      paddingLeft={20}
      paddingRight={20}
    >
      <StyledText color={isActive ? theme.colors.WHITE : theme.colors.TEXT_DARK} fontWeight="bold">{section.title}</StyledText>
      <HeaderRightIconContainer isActive={isActive} />
    </RowView>
    <Separator />
  </StyledView>
);
