import React from 'react';
import { RowView, StyledView, StyledText } from '/styled/common';
import { UserAvatar } from '../UserAvatar';
import { formatDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';
import { theme } from '/styled/theme';
import { getGender } from '/helpers/user';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

export interface PatientTileProps {
  displayId?: string;
  name: string;
  age: number;
  gender: string;
  city: string;
  lastVisit?: Date;
  image?: string;
}

export const PatientTile = ({
  displayId,
  name,
  age,
  gender,
  city,
  image,
  lastVisit,
}: PatientTileProps): JSX.Element => (
  <RowView
    paddingTop={screenPercentageToDP('2', Orientation.Height)}
    paddingBottom={screenPercentageToDP('2', Orientation.Height)}
    width="100%"
    background={theme.colors.BACKGROUND_GREY}
    alignItems="center"
  >
    <StyledView marginLeft={20}>
      <UserAvatar
        size={screenPercentageToDP('4.86', Orientation.Height)}
        image={image}
        gender={gender}
        name={name}
      />
    </StyledView>
    <StyledView flex={1} marginLeft={10}>
      <StyledText
        color={theme.colors.TEXT_SUPER_DARK}
        fontSize={screenPercentageToDP('1.822', Orientation.Height)}
        fontWeight={700}
      >
        {name}
      </StyledText>
      <StyledText
        marginTop={1}
        color={theme.colors.TEXT_MID}
        fontSize={screenPercentageToDP('1.57', Orientation.Height)}
        fontWeight={500}
        textAlign="left"
      >
        {displayId && displayId} •{' '}
        {`${getGender(gender)[0]} ${age}yrs • ${city}`}
      </StyledText>
    </StyledView>
    {lastVisit && (
      <StyledText
        marginRight={screenPercentageToDP('14.59', Orientation.Width)}
        color={theme.colors.TEXT_MID}
      >
        {formatDate(lastVisit, DateFormats.DAY_MONTH_YEAR_SHORT)}
      </StyledText>
    )}
  </RowView>
);
