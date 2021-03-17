import React, { FunctionComponent } from 'react';
import { SvgProps } from 'react-native-svg';
import { StyledView, RowView, StyledText, ColumnView } from '/styled/common';
import { theme } from '/styled/theme';
import { formatDate } from '/helpers/date';
import { DateFormats, HeaderIcons } from '/helpers/constants';
import * as Icons from '../Icons';
import { Separator } from '../Separator';
import { EncounterType, IEncounter } from '~/types';

interface IconProps {
  IconComponent: FunctionComponent<SvgProps>;
  fill: string;
  height: number;
}

const StatusIcon = ({ IconComponent, ...rest }: IconProps): JSX.Element => (
  <IconComponent {...rest} />
);

interface HeaderRightIconContainerProps {
  isActive: boolean;
}

const HeaderRightIconContainer = ({
  isActive,
}: HeaderRightIconContainerProps): JSX.Element => (
  <StyledView>
    <StatusIcon
      height={12}
      IconComponent={isActive ? Icons.ArrowUpIcon : Icons.ArrowDownIcon}
      fill={theme.colors.WHITE}
    />
  </StyledView>
);

export const Header = (
  section: any,
  index: number,
  isActive: boolean,
): JSX.Element => (
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
      <StyledText fontWeight="bold">{section.title}</StyledText>
      <HeaderRightIconContainer isActive={isActive} />
    </RowView>
    <Separator />
  </StyledView>
);
