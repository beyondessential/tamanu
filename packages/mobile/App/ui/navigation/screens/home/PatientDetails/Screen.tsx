import React, { ReactElement } from 'react';
import { theme } from '/styled/theme';
import {
  StyledView,
  StyledSafeAreaView,
  FullView,
  RowView,
  StyledTouchableOpacity,
  StyledText,
  StyledScrollView,
} from '/styled/common';
import { LeftArrow } from '/components/Icons/LeftArrow';
import { DotsMenu } from '/components/Icons/DotsMenu';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { joinNames } from '/helpers/user';
import { UserAvatar } from '/components/UserAvatar';
import { PatientDetails } from '../../../../interfaces/PatientDetails';
import {
  GeneralInfo,
  NotificationCheckbox,
  HealthIdentificationRow,
  FamilyInformation,
  OnGoingConditions,
  FamilyHistory,
  OperativePlan,
} from './CustomComponents';
import { getAgeFromDate } from '/helpers/date';

const avatarMock = {
  id: 54,
  firstName: 'Ugyen',
  lastName: 'Wangdi',
  city: 'Mbelagha',
  lastVisit: new Date('8/21/2019'),
  age: 34,
  gender: 'Female',
};

interface PatientDetailScreenProps {
  onNavigateBack: () => void;
  onNavigateToFilters: () => void;
  patientData: PatientDetails;
  onEditField: () => void;
  changeReminder: (value: boolean) => void;
  reminders: boolean;
}

export const Screen = ({
  onNavigateBack,
  onNavigateToFilters,
  patientData,
  onEditField,
  changeReminder,
  reminders,
}: PatientDetailScreenProps): ReactElement => (
  <FullView>
    <StyledSafeAreaView background={theme.colors.PRIMARY_MAIN}>
      <StyledView background={theme.colors.PRIMARY_MAIN} height={170}>
        <RowView justifyContent="space-between">
          <StyledTouchableOpacity
            paddingRight={20}
            paddingLeft={20}
            paddingTop={20}
            paddingBottom={20}
            onPress={onNavigateBack}
          >
            <LeftArrow />
          </StyledTouchableOpacity>
          <StyledTouchableOpacity
            paddingLeft={20}
            paddingRight={20}
            paddingTop={20}
            paddingBottom={20}
            onPress={onNavigateToFilters}
          >
            <DotsMenu />
          </StyledTouchableOpacity>
        </RowView>
        <RowView paddingLeft={screenPercentageToDP(4.86, Orientation.Width)}>
          <UserAvatar
            size={screenPercentageToDP(7.29, Orientation.Height)}
            name={joinNames(patientData.generalInfo)}
            {...avatarMock}
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
              {patientData.generalInfo.gender},{' '}
              {getAgeFromDate(patientData.generalInfo.birthDate)} years old,{' '}
              {patientData.generalInfo.city}
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
        <OperativePlan
          onEdit={onEditField}
          operativePlan={patientData.operativePlan}
        />
      </StyledScrollView>
    </FullView>
  </FullView>
);
