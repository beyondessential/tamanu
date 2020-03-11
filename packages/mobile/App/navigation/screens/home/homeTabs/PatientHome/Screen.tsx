import React, { ReactElement } from 'react';
// Components
import {
  FullView,
  StyledView,
  StyledSafeAreaView,
  RowView,
  StyledText,
} from '../../../../../styled/common';
import { UserAvatar } from '../../../../../components/UserAvatar';
import { Button } from '../../../../../components/Button';
import {
  BackButton,
  SearchButton,
  DotsMenuButton,
  mockAvatar,
  VisitTypeButtons,
  PatientMenuButtons,
} from './CustomComponents';
// Helpers
import { theme } from '../../../../../styled/theme';
import { screenPercentageToDP, Orientation } from '../../../../../helpers/screen';

interface ScreenProps {
    navigateToSearchPatients: () => void;
    visitTypeButtons: any[];
    patientMenuButtons: any[];
    navigateToPatientActions: () => void;
}

export const Screen = ({
  visitTypeButtons,
  patientMenuButtons,
  navigateToSearchPatients,
  navigateToPatientActions,
}:ScreenProps): ReactElement => (
  <FullView
    background={theme.colors.PRIMARY_MAIN}
  >
    <StyledSafeAreaView
      flex={1}
    >
      <StyledView
        height={screenPercentageToDP(27.37, Orientation.Height)}
        background={theme.colors.PRIMARY_MAIN}
        width="100%"
      >
        <RowView
          alignItems="center"
        >
          <BackButton onPress={navigateToSearchPatients} />
          <SearchButton onPress={navigateToSearchPatients} />
          <DotsMenuButton onPress={navigateToPatientActions} />
        </RowView>
        <RowView
          marginTop={screenPercentageToDP(3.8, Orientation.Height)}
          paddingLeft={screenPercentageToDP(4.86, Orientation.Width)}
        >
          <StyledView marginRight={screenPercentageToDP(3.64, Orientation.Width)}>
            <UserAvatar {...mockAvatar} />
          </StyledView>
          <StyledView>
            <StyledText
              fontWeight="bold"
              color={theme.colors.WHITE}
              fontSize={screenPercentageToDP(3.40, Orientation.Height)}
            >{mockAvatar.name}
            </StyledText>
            <StyledText
              color={theme.colors.WHITE}
              fontSize={screenPercentageToDP(1.94, Orientation.Height)}
            >
              {mockAvatar.gender}, {mockAvatar.age} years old, {mockAvatar.city}
            </StyledText>
            <Button
              marginTop={20}
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
      <StyledView
        flex={1}
        background={theme.colors.BACKGROUND_GREY}
      >
        <PatientMenuButtons list={patientMenuButtons} />
        <VisitTypeButtons list={visitTypeButtons} />
      </StyledView>
    </StyledSafeAreaView>
  </FullView>
);
