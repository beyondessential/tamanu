import React, { ReactElement } from 'react';
import { StatusBar } from 'react-native';
// Components
import { FullView, StyledView, StyledSafeAreaView, RowView, StyledText } from '/styled/common';
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
        <RowView alignItems="center">
          <BackButton onPress={navigateToSearchPatients} />
        </RowView>
        <RowView
          marginTop={screenPercentageToDP(1, Orientation.Height)}
          paddingLeft={screenPercentageToDP(4.86, Orientation.Width)}
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
            <Button
              marginTop={screenPercentageToDP(1.21, Orientation.Height)}
              width={screenPercentageToDP(23.11, Orientation.Width)}
              height={screenPercentageToDP(4.86, Orientation.Height)}
              buttonText="Sync Data"
              fontSize={screenPercentageToDP(1.57, Orientation.Height)}
              onPress={markPatientForSync}
              outline
              borderColor={theme.colors.WHITE}
            />
          </StyledView>
        </RowView>
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
