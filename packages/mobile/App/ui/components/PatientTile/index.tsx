import React from 'react';
import { RowView, StyledView, StyledText } from '/styled/common';
import { UserAvatar } from '../UserAvatar';
import { getAgeFromDate } from '/helpers/date';
import { theme } from '/styled/theme';
import { getGender, joinNames } from '/helpers/user';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { IPatient } from '~/types';

export const PatientTile = ({
  displayId,
  firstName,
  lastName,
  sex,
  dateOfBirth,
}: IPatient): JSX.Element => (
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
        gender={sex}
        displayName={joinNames({ firstName, lastName })}
      />
    </StyledView>
    <StyledView flex={1} marginLeft={10}>
      <StyledText
        color={theme.colors.TEXT_SUPER_DARK}
        fontSize={screenPercentageToDP('1.822', Orientation.Height)}
        fontWeight={700}
      >
        {joinNames({ firstName, lastName })}
      </StyledText>
      <StyledText
        marginTop={1}
        color={theme.colors.TEXT_MID}
        fontSize={screenPercentageToDP('1.57', Orientation.Height)}
        fontWeight={500}
        textAlign="left"
      >
        {displayId && displayId} •{' '}
        {`${getGender(sex)[0]} • ${getAgeFromDate(dateOfBirth)}yrs`}
      </StyledText>
    </StyledView>
  </RowView>
);
