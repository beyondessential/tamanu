import React, { ReactElement } from 'react';
import { StatusBar } from 'react-native';
// Components
import {
  FullView,
  StyledView,
  StyledSafeAreaView,
  RowView,
  StyledText,
} from '/styled/common';
import { UserAvatar } from '/components/UserAvatar';
import { Button } from '/components/Button';
import {
  BackButton,
  SearchButton,
  DotsMenuButton,
  VisitTypeButtonList,
  PatientMenuButtons,
} from './CustomComponents';
// Helpers
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { PatientModel } from '../../../../../models/Patient';
import { joinNames } from '/helpers/user';
import { getAgeFromDate } from '/helpers/date';
import { setDotsOnMaxLength } from '/helpers/text';

interface ScreenProps {
  navigateToSearchPatients: () => void;
  visitTypeButtons: any[];
  patientMenuButtons: any[];
  navigateToPatientActions: () => void;
  selectedPatient: PatientModel;
}

export const Screen = ({
  visitTypeButtons,
  patientMenuButtons,
  navigateToSearchPatients,
  navigateToPatientActions,
  selectedPatient,
}: ScreenProps): ReactElement => (
  <FullView background={theme.colors.PRIMARY_MAIN}>
    <StatusBar barStyle="light-content" />
    <StyledSafeAreaView flex={1}>
      <StyledView
        height={screenPercentageToDP(27.37, Orientation.Height)}
        background={theme.colors.PRIMARY_MAIN}
        width="100%"
      >
        <RowView alignItems="center">
          <BackButton onPress={navigateToSearchPatients} />
          <SearchButton onPress={navigateToSearchPatients} />
          <DotsMenuButton onPress={navigateToPatientActions} />
        </RowView>
        <RowView
          marginTop={screenPercentageToDP(1.5, Orientation.Height)}
          paddingLeft={screenPercentageToDP(4.86, Orientation.Width)}
        >
          <StyledView
            marginRight={screenPercentageToDP(3.64, Orientation.Width)}
          >
            <UserAvatar
              size={screenPercentageToDP(7.29, Orientation.Height)}
              gender={selectedPatient.gender}
              name={joinNames(selectedPatient)}
            />
          </StyledView>
          <StyledView>
            <StyledText
              fontWeight="bold"
              color={theme.colors.WHITE}
              fontSize={screenPercentageToDP(3.4, Orientation.Height)}
            >
              {setDotsOnMaxLength(joinNames(selectedPatient), 20)}
            </StyledText>
            <StyledText
              color={theme.colors.WHITE}
              fontSize={screenPercentageToDP(1.94, Orientation.Height)}
            >
              {selectedPatient.gender},{' '}
              {getAgeFromDate(selectedPatient.birthDate)} years old,{' '}
              {selectedPatient.city}
            </StyledText>
            <Button
              marginTop={screenPercentageToDP(1.21, Orientation.Height)}
              width={screenPercentageToDP(23.11, Orientation.Width)}
              height={screenPercentageToDP(4.86, Orientation.Height)}
              buttonText="Sync Data"
              fontSize={screenPercentageToDP(1.57, Orientation.Height)}
              onPress={(): null => null}
              outline
              borderColor={theme.colors.WHITE}
            />
          </StyledView>
        </RowView>
      </StyledView>
      <StyledView flex={1} background={theme.colors.BACKGROUND_GREY}>
        <PatientMenuButtons list={patientMenuButtons} />
        <VisitTypeButtonList list={visitTypeButtons} />
      </StyledView>
    </StyledSafeAreaView>
  </FullView>
);
