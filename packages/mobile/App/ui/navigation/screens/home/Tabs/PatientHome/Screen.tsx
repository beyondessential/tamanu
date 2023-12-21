import React, { ReactElement } from 'react';
import { StatusBar } from 'react-native';
// Components
import {
  FullView,
  StyledView,
  StyledSafeAreaView,
  StyledText,
  ColumnView,
  StyledTouchableOpacity,
  RowView,
} from '/styled/common';
import { UserAvatar } from '/components/UserAvatar';
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
        height={screenPercentageToDP(28.5, Orientation.Height)}
        background={theme.colors.PRIMARY_MAIN}
        width="100%"
        flexDirection="row"
        justifyContent="space-between"
      >
        <StyledView flex={1}>
          <BackButton />
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
              {getGender(selectedPatient.sex)}, {getAgeFromDate(selectedPatient.dateOfBirth)} years
              old{' '}
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
        <StyledView flex={1}>
          <StyledTouchableOpacity
            onPress={markPatientForSync}
            marginLeft={'auto'}
            marginRight={screenPercentageToDP(4.62, Orientation.Width)}
          >
            <ColumnView alignItems="center">
              <PatientSyncIcon size={screenPercentageToDP(4.86, Orientation.Height)} fill="white" />
              <StyledText
                fontSize={10}
                color="white"
                marginTop={screenPercentageToDP(-0.6, Orientation.Height)}
              >
                Sync data
              </StyledText>
            </ColumnView>
          </StyledTouchableOpacity>
        </StyledView>
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
