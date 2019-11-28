import React from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import * as styles from './styles';
import { RowView, ColumnView, StyledView } from '../../styled/common';
import FastImage from 'react-native-fast-image';
import theme from '../../styled/theme';
import { DateFormats } from '../../helpers/constants';
import { formatDate } from '../../helpers/date';
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
}: PatientCardProps) => {
  return (
    <TouchableWithoutFeedback onPress={() => onPress()}>
      <styles.StyledCardContainer>
        <RowView justifyContent="space-between" height={45} width="100%">
          <StyledView
            height={45}
            width={45}
            borderRadius={50}
            overflow="hidden"
            background={!image ? theme.colors.SAFE : 'transparent'}
            justifyContent="center">
            {image ? (
              <FastImage
                style={{
                  height: '100%',
                  width: '100%',
                }}
                source={{
                  uri: image,
                }}
              />
            ) : (
              <styles.StyledPatientInitials>
                {`${name.split(' ')[0][0]}${name.split(' ')[1][0]}`}
              </styles.StyledPatientInitials>
            )}
          </StyledView>
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
};
