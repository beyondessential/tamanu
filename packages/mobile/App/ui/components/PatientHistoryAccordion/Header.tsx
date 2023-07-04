import React, { FunctionComponent } from 'react';
import { SvgProps } from 'react-native-svg';
import { StyledView, RowView, StyledText, ColumnView } from '/styled/common';
import { theme } from '/styled/theme';
import { formatStringDate } from '/helpers/date';
import { DateFormats, HeaderIcons, EncounterTypeNames } from '/helpers/constants';
import * as Icons from '../Icons';
import { Separator } from '../Separator';
import { EncounterType, IEncounter, ILocation, IUser } from '~/types';

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
      fill={isActive ? theme.colors.WHITE : theme.colors.TEXT_SOFT}
    />
  </StyledView>
);

interface HeaderDateProps {
  startDate: string;
  isActive: boolean;
}

const HeaderDate = ({ startDate, date, isActive }: HeaderDateProps): JSX.Element => (
  <StyledText
    fontSize={14}
    color={isActive ? theme.colors.WHITE : theme.colors.TEXT_DARK}
  >
    {formatStringDate((startDate || date), DateFormats.DAY_MONTH_YEAR_SHORT)}
  </StyledText>
);

interface HeaderIconProps {
  isActive: boolean;
  type: string;
}

const HeaderLeftIcon = ({ isActive, type }: HeaderIconProps): JSX.Element => {
  const fill = isActive ? theme.colors.WHITE : theme.colors.PRIMARY_MAIN;
  const Icon = HeaderIcons[type] || HeaderIcons[EncounterType.Clinic];

  return (
    <StyledView marginRight={30}>
      <Icon fill={fill} />
    </StyledView>
  );
};

interface HeaderDescriptionProps {
  encounterType: string;
  referredDepartment: string;
  isActive: boolean;
  formTitle: string;
  location: ILocation;
}

const HeaderDescription = ({
  encounterType,
  location,
  formTitle,
  isActive,
}: HeaderDescriptionProps): JSX.Element => (
  <ColumnView flex={1}>
    <StyledText
      color={isActive ? theme.colors.WHITE : theme.colors.MAIN_SUPER_DARK}
      fontWeight={700}
      fontSize={16}
    >
      {EncounterTypeNames[encounterType] || formTitle || ''}
    </StyledText>
    <StyledView marginTop={1}>
      <StyledText
        color={isActive ? theme.colors.SECONDARY_MAIN : theme.colors.TEXT_MID}
      >
        {location?.facility?.name ?? location?.name ?? ''}
      </StyledText>
    </StyledView>
  </ColumnView>
);

const Header = (
  section: IEncounter,
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
      <HeaderLeftIcon isActive={isActive} type={section.encounterType} />
      <HeaderDescription {...section} isActive={isActive} />
      <HeaderDate {...section} isActive={isActive} />
      <HeaderRightIconContainer isActive={isActive} />
    </RowView>
    <Separator />
  </StyledView>
);

export default Header;
