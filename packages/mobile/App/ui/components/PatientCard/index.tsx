import React from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import type { IPatient } from '~/types';
import { useDateFormatter } from '~/ui/hooks/useDateFormatter';
import { getGender, joinNames } from '../../helpers/user';
import { TranslatedReferenceData } from '../Translations/TranslatedReferenceData';
import { UserAvatar } from '../UserAvatar';
import * as styles from './styles';
import { TranslatedText } from '/components/Translations/TranslatedText';
import { useSettings } from '/contexts/SettingsContext';
import { DateFormats } from '/helpers/constants';
import { type AgeDisplayFormat, getDisplayAge } from '/helpers/date';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { ColumnView, RowView, StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';

export interface PatientCardProps {
  patient: IPatient;
  onPress: Function;
}

export const PatientCard = ({ patient, onPress }: PatientCardProps) => {
  const { formatDate } = useDateFormatter();
  const { firstName, lastName, dateOfBirth, sex, village } = patient;

  const name = joinNames({ firstName, lastName });

  const { getSetting } = useSettings();
  const ageDisplayFormat = getSetting<AgeDisplayFormat>('ageDisplayFormat');

  return (
    <TouchableWithoutFeedback onPress={(): void => onPress()}>
      <styles.StyledCardContainer>
        <RowView
          justifyContent="space-between"
          height={screenPercentageToDP(5.46, Orientation.Height)}
          width="100%"
        >
          <UserAvatar
            size={screenPercentageToDP(4.86, Orientation.Height)}
            displayName={name}
            sex={sex}
          />
          <StyledText
            color={theme.colors.TEXT_DARK}
            fontSize={screenPercentageToDP(1.09, Orientation.Height)}
            fontWeight={500}
          >
            <TranslatedText stringId="patient.lastViewed.title" fallback="Last viewed" />
            {` \n${formatDate(new Date(), DateFormats.short)}`}
          </StyledText>
        </RowView>
        <ColumnView width="100%" marginTop={screenPercentageToDP(1.82, Orientation.Height)}>
          <StyledView width="75%" marginBottom={10}>
            <StyledText
              fontSize={screenPercentageToDP(1.82, Orientation.Height)}
              fontWeight={500}
              color={theme.colors.TEXT_DARK}
            >
              {name}
            </StyledText>
          </StyledView>
          <StyledView width="80%">
            <StyledText
              fontSize={screenPercentageToDP(1.45, Orientation.Height)}
              fontWeight={500}
              color={theme.colors.TEXT_MID}
            >
              {`${getGender(sex)}, ${getDisplayAge(dateOfBirth, ageDisplayFormat)}`}
            </StyledText>
            <StyledText
              fontSize={screenPercentageToDP(1.45, Orientation.Height)}
              fontWeight={500}
              color={theme.colors.TEXT_MID}
            >
              <TranslatedReferenceData
                fallback={village?.name}
                value={village?.id}
                category="village"
              />
            </StyledText>
          </StyledView>
        </ColumnView>
      </styles.StyledCardContainer>
    </TouchableWithoutFeedback>
  );
};
