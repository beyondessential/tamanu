import React from 'react';
import { StatusBar } from 'react-native';
import type { IPatient } from '~/types';
import type { MenuOptionButtonProps } from '~/types/MenuOptionButtonProps';
import { PatientSyncStatus } from '~/ui/components/PatientSyncStatus';
import { SyncInactiveAlert } from '~/ui/components/SyncInactiveAlert';
import { BackButton, PatientMenuButtons, VisitTypeButtonList } from './CustomComponents';
import { UserAvatar } from '/components/UserAvatar';
import { useSettings } from '/contexts/SettingsContext';
import { type AgeDisplayFormat, getDisplayAge } from '/helpers/date';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { setDotsOnMaxLength } from '/helpers/text';
import { getGender, joinNames } from '/helpers/user';
import {
  FullView,
  RowView,
  StyledSafeAreaView,
  StyledScrollView,
  StyledText,
  StyledView,
} from '/styled/common';
import { theme } from '/styled/theme';

interface ScreenProps {
  navigateToSearchPatients: () => void;
  visitTypeButtons: MenuOptionButtonProps[];
  patientMenuButtons: MenuOptionButtonProps[];
  selectedPatient: IPatient;
}

export const Screen = ({
  visitTypeButtons,
  patientMenuButtons,
  navigateToSearchPatients,
  selectedPatient,
}: ScreenProps) => {
  const { getSetting } = useSettings();
  const ageDisplayFormat = getSetting<AgeDisplayFormat>('ageDisplayFormat');
  return (
    <FullView background={theme.colors.PRIMARY_MAIN}>
      <StatusBar barStyle="light-content" />
      <StyledSafeAreaView flex={1} edges={['top']}>
        <StyledView
          height={screenPercentageToDP(28.5, Orientation.Height)}
          background={theme.colors.PRIMARY_MAIN}
          width="100%"
          flexDirection="row"
          justifyContent="space-between"
        >
          <StyledView flex={1}>
            <BackButton onPress={navigateToSearchPatients} />
          </StyledView>
          <StyledView flexDirection="column" justifyContent="center">
            <StyledView alignItems="center">
              <UserAvatar
                size={screenPercentageToDP(6.03, Orientation.Height)}
                sex={selectedPatient.sex}
                displayName={joinNames(selectedPatient)}
              />
            </StyledView>
            <StyledView
              marginTop={screenPercentageToDP(1.6, Orientation.Height)}
              marginBottom={screenPercentageToDP(1.6, Orientation.Height)}
              alignItems="center"
            >
              <StyledText
                fontWeight={500}
                color={theme.colors.WHITE}
                fontSize={screenPercentageToDP(3.01, Orientation.Height)}
              >
                {setDotsOnMaxLength(joinNames(selectedPatient), 20)}
              </StyledText>
              <StyledText
                color={theme.colors.WHITE}
                fontSize={screenPercentageToDP(1.76, Orientation.Height)}
                fontWeight="bold"
              >
                {getGender(selectedPatient.sex)},{' '}
                {getDisplayAge(selectedPatient.dateOfBirth, ageDisplayFormat)} old{' '}
              </StyledText>
            </StyledView>
            <StyledView
              borderColor={theme.colors.WHITE}
              borderWidth={1}
              borderRadius={5}
              paddingLeft={screenPercentageToDP(5.84, Orientation.Width)}
              paddingTop={screenPercentageToDP(1, Orientation.Height)}
              paddingBottom={screenPercentageToDP(1, Orientation.Height)}
              paddingRight={screenPercentageToDP(5.84, Orientation.Width)}
            >
              <RowView>
                <StyledText
                  color={theme.colors.WHITE}
                  textAlign="center"
                  fontSize={screenPercentageToDP(1.76, Orientation.Height)}
                >
                  Display ID:
                </StyledText>
                <StyledText
                  color={theme.colors.WHITE}
                  textAlign="center"
                  fontSize={screenPercentageToDP(1.76, Orientation.Height)}
                  fontWeight="bold"
                >
                  {' '}
                  {selectedPatient.displayId}
                </StyledText>
              </RowView>
            </StyledView>
          </StyledView>
          <PatientSyncStatus selectedPatient={selectedPatient} />
        </StyledView>
        <StyledScrollView flex={1} background={theme.colors.BACKGROUND_GREY}>
          <PatientMenuButtons list={patientMenuButtons} />
          <VisitTypeButtonList list={visitTypeButtons} />
          <StyledView position="absolute" bottom={0} width="100%">
            <SyncInactiveAlert />
          </StyledView>
        </StyledScrollView>
      </StyledSafeAreaView>
    </FullView>
  );
};
