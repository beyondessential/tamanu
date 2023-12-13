import React, { ReactElement } from 'react';
import { StatusBar } from 'react-native';
// Components
import { Button } from '/components/Button';
import { UserAvatar } from '/components/UserAvatar';
import { FullView, RowView, StyledSafeAreaView, StyledText, StyledView } from '/styled/common';
import { BackButton, PatientMenuButtons, VisitTypeButtonList } from './CustomComponents';
// Helpers
import { getAgeFromDate } from '/helpers/date';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { setDotsOnMaxLength } from '/helpers/text';
import { getGender, joinNames } from '/helpers/user';
import { theme } from '/styled/theme';
import { IPatient } from '~/types';
import { MenuOptionButtonProps } from '~/types/MenuOptionButtonProps';
import { SyncInactiveAlert } from '~/ui/components/SyncInactiveAlert';

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
              {getGender(selectedPatient.sex)}, {getAgeFromDate(selectedPatient.dateOfBirth)}{' '}
              years old{' '}
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
