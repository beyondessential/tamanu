import React, { FunctionComponent } from 'react';
import { SvgProps } from 'react-native-svg';
import {
  StyledView,
  RowView,
  StyledText,
  ColumnView,
} from '../../styled/common';
import { theme } from '../../styled/theme';
import * as Icons from '../Icons';
import { formatDate } from '../../helpers/date';
import { DateFormats, HeaderIcons } from '../../helpers/constants';
import { VisitOverviewProps } from '../../interfaces/VisitOverview';

interface IconProps {
  IconComponent: FunctionComponent<SvgProps>;
  fill: string;
  height?: number;
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
      IconComponent={isActive ? Icons.ArrowUp : Icons.ArrowDown}
      fill={isActive ? theme.colors.WHITE : theme.colors.TEXT_SOFT}
    />
  </StyledView>
);

interface HeaderDateProps {
  date: Date;
  isActive: boolean;
}

const HeaderDate = ({ date, isActive }: HeaderDateProps): JSX.Element => (
  <StyledText
    fontSize={14}
    color={isActive ? theme.colors.WHITE : theme.colors.TEXT_DARK}
  >
    {formatDate(date, DateFormats.DAY_MONTH_YEAR_SHORT)}
  </StyledText>
);

interface HeaderIconProps {
  isActive: boolean;
  type: string;
}

const HeaderLeftIcon = ({ isActive, type }: HeaderIconProps): JSX.Element => {
  const fill = isActive ? theme.colors.WHITE : theme.colors.PRIMARY_MAIN;
  const Icon = HeaderIcons[type];
  return (
    <StyledView marginRight={30}>
      <Icon fill={fill} />
    </StyledView>
  );
};

interface HeaderDescriptionProps extends VisitOverviewProps {
  isActive: boolean;
}

const HeaderDescription = ({
  type,
  isActive,
  typeDescription,
  location,
}: HeaderDescriptionProps): JSX.Element => (
  <ColumnView flex={1}>
    <StyledText
      color={isActive ? theme.colors.WHITE : theme.colors.MAIN_SUPER_DARK}
      fontWeight={700}
      fontSize={16}
    >
      {type}
      {typeDescription && (
        <StyledText
          color={isActive ? theme.colors.WHITE : theme.colors.TEXT_MID}
          fontWeight={400}
        >
          {' '}
          {typeDescription}
        </StyledText>
      )}
    </StyledText>
    <StyledView marginTop={1}>
      <StyledText
        color={isActive ? theme.colors.SECONDARY_MAIN : theme.colors.TEXT_MID}
      >
        {location}
      </StyledText>
    </StyledView>
  </ColumnView>
);

const Header = (
  section: VisitOverviewProps,
  index: number,
  isActive: boolean,
): JSX.Element => (
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
    <HeaderLeftIcon isActive={isActive} type={section.type} />
    <HeaderDescription {...section} isActive={isActive} />
    <HeaderDate {...section} isActive={isActive} />
    <HeaderRightIconContainer isActive={isActive} />
  </RowView>
);

export default Header;
