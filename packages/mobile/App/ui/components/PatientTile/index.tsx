import React from 'react';
import { RowView, StyledText, StyledView } from '/styled/common';
import { UserAvatar } from '../UserAvatar';
import { getDisplayAge } from '/helpers/date';
import { theme } from '/styled/theme';
import { getGender, joinNames } from '/helpers/user';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { IPatient } from '~/types';
import { getReferenceDataStringId } from '../Translations/TranslatedReferenceData';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { useSettings } from '/contexts/SettingsContext';

export const PatientTile = (patient: IPatient): JSX.Element => {
  const { firstName, lastName, sex } = patient;
  const { getTranslation } = useTranslation();
  const { getSetting } = useSettings();
  const ageDisplayFormat = getSetting('ageDisplayFormat');

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
  ageDisplayFormat,
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
    .join(' • ');
};
