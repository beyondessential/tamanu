import React from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import { RowView, ColumnView, StyledView } from '/styled/common';
import { DateFormats } from '/helpers/constants';
import { formatDate } from '/helpers/date';
import { UserAvatar } from '/components/UserAvatar';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import * as styles from './styles';
export interface PatientCardProps {
  lastVisit: Date;
  name: string;
  image?: string;
  gender: string;
  city: string;
  age: string;
  onPress: Function;
}

export const PatientCard = ({
  name,
  image,
  age,
  gender,
  city,
  lastVisit,
  onPress,
}: PatientCardProps): JSX.Element => (
  <TouchableWithoutFeedback onPress={(): void => onPress()}>
    <styles.StyledCardContainer>
      <RowView justifyContent="space-between" height={45} width="100%">
        <UserAvatar
          size={screenPercentageToDP('4.86', Orientation.Height)}
          name={name}
          image={image}
          gender={gender}
        />
        <styles.StyledDate>
          {formatDate(lastVisit, DateFormats.short)}
        </styles.StyledDate>
      </RowView>
      <ColumnView width="100%" marginTop={15}>
        <StyledView width="75%" marginBottom={10}>
          <styles.StyledPatientName>{name}</styles.StyledPatientName>
        </StyledView>
        <StyledView width="80%">
          <styles.StyledPatientData>{`${gender} ${age}yrs`}</styles.StyledPatientData>
          <styles.StyledPatientData>{city}</styles.StyledPatientData>
        </StyledView>
      </ColumnView>
    </styles.StyledCardContainer>
  </TouchableWithoutFeedback>
);
