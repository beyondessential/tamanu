import React from 'react';
import { RowView, StyledView, StyledText } from '/styled/common';
import { UserAvatar } from '../UserAvatar';
import { getAgeFromDate } from '/helpers/date';
import { theme } from '/styled/theme';
import { getGender, joinNames } from '/helpers/user';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { IPatient } from '~/types';

export const PatientTile = (patient: IPatient): JSX.Element => {
  const { firstName, lastName, sex } = patient;
  return (
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
          sex={sex}
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
          {getSecondaryInfoString(patient)}
        </StyledText>
      </StyledView>
    </RowView>
  );
};

const getSecondaryInfoString = ({ displayId, sex, dateOfBirth, village }: IPatient) => {
  const secondaryInfo = {
    displayId,
    gender: getGender(sex)[0],
    age: dateOfBirth && `${getAgeFromDate(dateOfBirth)}yrs`,
    village: village?.name
  };
  return Object.values(secondaryInfo).filter(e => e).join(' • ');
}
