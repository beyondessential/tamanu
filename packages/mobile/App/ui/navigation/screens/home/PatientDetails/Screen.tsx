import React, { ReactElement } from 'react';
import { theme } from '~/ui/styled/theme';
import {
  StyledView,
  StyledSafeAreaView,
  FullView,
  RowView,
  StyledTouchableOpacity,
  StyledText,
  StyledScrollView,
} from '~/ui/styled/common';
import { ArrowLeftIcon } from '~/ui/components/Icons';
import { screenPercentageToDP, Orientation } from '~/ui/helpers/screen';
import { joinNames, getGender } from '~/ui/helpers/user';
import { UserAvatar } from '~/ui/components/UserAvatar';
import { PatientDetails } from '~/ui/interfaces/PatientDetails';
import { getAgeFromDate } from '~/ui/helpers/date';
import {
  GeneralInfo,
  HealthIdentificationRow,
  PatientIssues,
} from './CustomComponents';
import { AdditionalInfo } from './CustomComponents/AdditionalInfo';

interface PatientDetailScreenProps {
  onNavigateBack: () => void;
  patientData: PatientDetails;
  onEditField: () => void;
  onEditPatientIssues: () => void;
  changeReminder: (value: boolean) => void;
  reminders: boolean;
}

export const Screen = ({
  onNavigateBack,
  patientData,
  onEditPatientIssues,
  onEditField,
  changeReminder,
  reminders,
}: PatientDetailScreenProps): ReactElement => (
  <FullView>
    <StyledSafeAreaView background={theme.colors.PRIMARY_MAIN}>
      <StyledView background={theme.colors.PRIMARY_MAIN} height={170}>
        <RowView justifyContent="space-between">
          <StyledTouchableOpacity padding={20} onPress={onNavigateBack}>
            <ArrowLeftIcon
              height={screenPercentageToDP(2.43, Orientation.Height)}
              width={screenPercentageToDP(2.43, Orientation.Height)}
            />
          </StyledTouchableOpacity>
        </RowView>
        <RowView paddingLeft={screenPercentageToDP(4.86, Orientation.Width)}>
          <UserAvatar
            size={screenPercentageToDP(7.29, Orientation.Height)}
            displayName={joinNames(patientData.generalInfo)}
            sex={patientData.generalInfo.sex}
          />
          <StyledView alignItems="flex-start" marginLeft={10}>
            <StyledText
              color={theme.colors.WHITE}
              fontSize={screenPercentageToDP(3.4, Orientation.Height)}
              fontWeight="bold"
            >
              {joinNames(patientData.generalInfo)}
            </StyledText>
            <StyledText
              color={theme.colors.WHITE}
              fontSize={screenPercentageToDP(1.94, Orientation.Height)}
            >
              {getGender(patientData.generalInfo.sex)},{' '}
              {getAgeFromDate(new Date(patientData.generalInfo.dateOfBirth))} years old
            </StyledText>
          </StyledView>
        </RowView>
      </StyledView>
      <HealthIdentificationRow patientId={patientData.id} />
    </StyledSafeAreaView>
    <FullView>
      <StyledScrollView
        background={theme.colors.BACKGROUND_GREY}
        paddingLeft={20}
        paddingRight={20}
        paddingTop={20}
      >
        <GeneralInfo
          id={patientData.id}
          generalInfo={patientData.generalInfo}
        />
        <AdditionalInfo
          id={patientData.id}
          generalInfo={patientData.generalInfo}
        />
        {/* Not functional yet
          <NotificationCheckbox value={reminders} onChange={changeReminder} />
          <FamilyInformation
            onEdit={onEditField}
            parentsInfo={patientData.parentsInfo}
          />
          <OnGoingConditions
            onEdit={onEditField}
            ongoingConditions={patientData.ongoingConditions}
          />
          <FamilyHistory
            onEdit={onEditField}
            familyHistory={patientData.familyHistory}
          />
          <AllergiesList onEdit={onEditField} allergies={patientData.allergies} />
          */}
        <PatientIssues
          onEdit={onEditPatientIssues}
          patientIssues={patientData.patientIssues}
        />
      </StyledScrollView>
    </FullView>
  </FullView>
);
