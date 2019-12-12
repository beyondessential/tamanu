import React from 'react';
import { RowView, StyledView, StyledText } from '../../styled/common';
import UserAvatar from '../UserAvatar';
import { formatDate } from '../../helpers/date';
import { DateFormats } from '../../helpers/constants';
import theme from '../../styled/theme';
import { getGender } from '../../helpers/user';

interface PatientTileProps {
  name: string;
  age: string;
  gender: string;
  city: string;
  lastVisit?: Date;
  image?: string;
}

export const PatientTile = ({
  name,
  age,
  gender,
  city,
  lastVisit,
}: PatientTileProps) => {
  return (
    <RowView
      paddingTop={20}
      paddingBottom={20}
      width="100%"
      background={theme.colors.BACKGROUND_GREY}
      alignItems="center">
      <StyledView marginLeft={20}>
        <UserAvatar gender={gender} name={name} />
      </StyledView>
      <StyledView flex={1} marginLeft={10}>
        <StyledText
          color={theme.colors.TEXT_SUPER_DARK}
          fontSize={1}
          fontWeight={700}>
          {name}
        </StyledText>
        <StyledText
          marginTop={1}
          color={theme.colors.TEXT_MID}
          fontSize={13}
          fontWeight={500}>
          {getGender(gender)} {age} yrs, {city}
        </StyledText>
      </StyledView>
      {lastVisit && (
        <StyledText marginRight={60} color={theme.colors.TEXT_MID}>
          {formatDate(lastVisit, DateFormats.DAY_MONTH_YEAR_SHORT)}
        </StyledText>
      )}
    </RowView>
  );
};
