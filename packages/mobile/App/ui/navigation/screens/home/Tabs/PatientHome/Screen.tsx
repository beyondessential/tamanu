import React, { ReactElement } from 'react';
import { StatusBar } from 'react-native';
// Components
import {
  FullView,
  StyledView,
  StyledSafeAreaView,
  RowView,
  StyledText,
  ColumnView,
  StyledTouchableOpacity,
} from '/styled/common';
import { UserAvatar } from '/components/UserAvatar';
import { Button } from '/components/Button';
import { BackButton, VisitTypeButtonList, PatientMenuButtons } from './CustomComponents';
// Helpers
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { IPatient } from '~/types';
import { joinNames, getGender } from '/helpers/user';
import { getAgeFromDate } from '/helpers/date';
import { setDotsOnMaxLength } from '/helpers/text';
import { SyncInactiveAlert } from '~/ui/components/SyncInactiveAlert';
import { MenuOptionButtonProps } from '~/types/MenuOptionButtonProps';
import { PatientSyncIcon } from '~/ui/components/Icons';

interface ScreenProps {
  navigateToSearchPatients: () => void;
  visitTypeButtons: MenuOptionButtonProps[];
  patientMenuButtons: MenuOptionButtonProps[];
  markPatientForSync: () => void;
  selectedPatient: IPatient;
}

export const Screen = ({
  visitTypeButtons,
  patientMenuButtons,
  navigateToSearchPatients,
  selectedPatient,
  markPatientForSync,
}: ScreenProps): ReactElement => (
  <FullView background={theme.colors.PRIMARY_MAIN}>
    <StatusBar barStyle="light-content" />
    <StyledSafeAreaView flex={1}>
      <StyledView
        height={screenPercentageToDP(27, Orientation.Height)}
        background={theme.colors.PRIMARY_MAIN}
        width="100%"
      >
        <RowView alignItems="center" justifyContent="space-between">
          <BackButton onPress={navigateToSearchPatients} />
          <StyledTouchableOpacity onPress={markPatientForSync}>
            <StyledView
              marginRight={screenPercentageToDP(4.86, Orientation.Width)}
              flexDirection='column'
              alignItems='center'
              justifyContent='center'
            >
              <PatientSyncIcon size={screenPercentageToDP(7.29, Orientation.Height)} fill="white" />
              <StyledText color='white'>Sync data</StyledText>
            </StyledView>
          </StyledTouchableOpacity>
        </RowView>
        <ColumnView
          marginTop={screenPercentageToDP(1, Orientation.Height)}
          paddingLeft={screenPercentageToDP(4.86, Orientation.Width)}
          alignItems="center"
          justifyContent="center"
        >
          <StyledView marginRight={screenPercentageToDP(3.64, Orientation.Width)}>
            <UserAvatar
              size={screenPercentageToDP(7.29, Orientation.Height)}
              sex={selectedPatient.sex}
              displayName={joinNames(selectedPatient)}
            />
          </StyledView>
          <StyledView>
            <StyledText
              fontWeight={500}
              color={theme.colors.WHITE}
              fontSize={screenPercentageToDP(3.4, Orientation.Height)}
            >
              {setDotsOnMaxLength(joinNames(selectedPatient), 20)}
            </StyledText>
            <StyledText
              color={theme.colors.WHITE}
              fontSize={screenPercentageToDP(1.94, Orientation.Height)}
            >
              {getGender(selectedPatient.sex)}, {getAgeFromDate(selectedPatient.dateOfBirth)} years
              old{' '}
            </StyledText>
          </StyledView>
        </ColumnView>
      </StyledView>
      <StyledView flex={1} background={theme.colors.BACKGROUND_GREY}>
        <PatientMenuButtons list={patientMenuButtons} />
        <VisitTypeButtonList list={visitTypeButtons} />
        <StyledView position="absolute" bottom={0} width="100%">
          <SyncInactiveAlert />
        </StyledView>
      </StyledView>
    </StyledSafeAreaView>
  </FullView>
);
