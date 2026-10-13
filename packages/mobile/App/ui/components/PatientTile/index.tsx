import React from 'react';
import type { IPatient } from '~/types';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { getReferenceDataStringId } from '../Translations/TranslatedReferenceData';
import { UserAvatar } from '../UserAvatar';
import { useSettings } from '/contexts/SettingsContext';
import { type AgeDisplayFormat, getDisplayAge } from '/helpers/date';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { getGender, joinNames } from '/helpers/user';
import { RowView, StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';

export const PatientTile = (patient: IPatient): JSX.Element => {
  const { firstName, lastName, sex } = patient;
  const { getTranslation } = useTranslation();
  const { getSetting } = useSettings();
  const ageDisplayFormat = getSetting<AgeDisplayFormat>('ageDisplayFormat');

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
          {getSecondaryInfoString(getTranslation, ageDisplayFormat, patient)}
        </StyledText>
      </StyledView>
    </RowView>
  );
};

const getSecondaryInfoString = (
  getTranslation,
  ageDisplayFormat: AgeDisplayFormat | undefined,
  { displayId, sex, dateOfBirth, village }: IPatient,
) => {
  const secondaryInfo = {
    displayId,
    gender: getGender(sex)[0],
    age: dateOfBirth && `${getDisplayAge(dateOfBirth, ageDisplayFormat)}`,
    village: getTranslation(getReferenceDataStringId(village?.id, 'village'), village?.name),
  };
  return Object.values(secondaryInfo)
    .filter(e => e)
    .join(' · '); // Interpunct U+00B7
};
