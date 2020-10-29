import React from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import { RowView, ColumnView, StyledView, StyledText } from '/styled/common';
import { DateFormats } from '/helpers/constants';
import { formatDate, getAgeFromDate } from '/helpers/date';
import { UserAvatar } from '../UserAvatar';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import * as styles from './styles';
import { theme } from '/styled/theme';
import { getGender, joinNames } from '../../helpers/user';
import { IPatient } from '~/types';

export interface PatientCardProps {
  patient: IPatient;
  onPress: Function;
}

export const PatientCard = ({
  patient,
  onPress,
}: PatientCardProps): JSX.Element => {
  const {
    firstName,
    lastName,
    dateOfBirth,
    sex,
  } = patient;

  const image = null;
  const village = 'Village goes here';
  const lastViewed = new Date();

  const name = joinNames({ firstName, lastName });
  const age = getAgeFromDate(dateOfBirth);

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
            image={image}
            gender={sex}
          />
          <StyledText
            color={theme.colors.TEXT_DARK}
            fontSize={screenPercentageToDP(1.09, Orientation.Height)}
            fontWeight={500}
          >
            {`Last viewed \n${formatDate(lastViewed, DateFormats.short)}`}
          </StyledText>
        </RowView>
        <ColumnView
          width="100%"
          marginTop={screenPercentageToDP(1.82, Orientation.Height)}
        >
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
              {`${getGender(sex)}, ${age}yrs`}
            </StyledText>
            <StyledText
              fontSize={screenPercentageToDP(1.45, Orientation.Height)}
              fontWeight={500}
              color={theme.colors.TEXT_MID}
            >
              {village}
            </StyledText>
          </StyledView>
        </ColumnView>
      </styles.StyledCardContainer>
    </TouchableWithoutFeedback>
  );
};
