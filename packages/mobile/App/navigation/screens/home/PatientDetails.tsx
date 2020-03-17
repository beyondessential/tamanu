import React, { useState, useCallback, ReactElement } from 'react';
import {
  FullView,
  StyledScrollView,
  CenterView,
  StyledSafeAreaView,
  StyledTouchableOpacity,
  StyledView,
  RowView,
  StyledText,
  StyledViewProps } from '../../../styled/common';
import { LeftArrow, ArrowForward } from '../../../components/Icons';
import { Button } from '../../../components/Button';
import { DotsMenu } from '../../../components/Icons/DotsMenu';
import { theme } from '../../../styled/theme';
import UserAvatar from '../../../components/UserAvatar';
import { Orientation, screenPercentageToDP } from '../../../helpers/screen';
import { SectionHeader } from '../../../components/SectionHeader';
import { Checkbox } from '../../../components/Checkbox';
import { isIOS } from '../../../helpers/platform';
import { TouchableProps } from '../../../interfaces/TouchableProps';
import * as Protocols from '../../../interfaces/PatientDetails';
import { formatDate } from '../../../helpers/date';
import { DateFormats } from '../../../helpers/constants';

const avatarMock = {
  id: 54,
  name: 'Tony Robbins',
  city: 'Zhenwen',
  lastVisit: new Date('8/21/2019'),
  age: 34,
  gender: 'Male',
};


const EditButton = ({ onPress }: TouchableProps): ReactElement => (
  <Button
    textColor={theme.colors.TEXT_SUPER_DARK}
    backgroundColor="#EEEEEE"
    width={62}
    height={34}
    buttonText="Edit"
    onPress={onPress}
  />
);

interface OpperativePlanProps extends Protocols.OpperativePlan {
  onEdit: () => void;
}

const OpperativePlan = (props: OpperativePlanProps): ReactElement => (
  <React.Fragment>
    <Separator width="100%" marginTop={20} />
    <StyledView marginTop={20} marginBottom={isIOS() ? 60 : 0}>
      <RowView alignItems="center" justifyContent="space-between">
        <SectionHeader h1>Opperative Plan</SectionHeader>
        <EditButton onPress={props.onEdit} />
      </RowView>
      {props.operativePlan.data.length > 0 && props.operativePlan.data.map((condition: string) => (
        <RowView key={condition} alignItems="center" marginTop={10}>
          <Dot /><StyledText marginLeft={10} color={theme.colors.TEXT_MID}>{condition}</StyledText>
        </RowView>
      )) }
    </StyledView>
  </React.Fragment>
);

interface FamilyHistoryProps extends Protocols.FamilyHistory {
  onEdit: () => void;
}

const FamilyHistory = (props:FamilyHistoryProps): ReactElement => (
  <React.Fragment>
    <Separator width="100%" marginTop={20} />
    <StyledView marginTop={20}>
      <RowView alignItems="center" justifyContent="space-between">
        <SectionHeader h1>Family History</SectionHeader>
        <EditButton onPress={props.onEdit} />
      </RowView>
      {props.familyHistory.data.length > 0 && props.familyHistory.data.map((condition: string) => (
        <RowView key={condition} alignItems="center" marginTop={10}>
          <Dot /><StyledText marginLeft={10} color={theme.colors.TEXT_MID}>{condition}</StyledText>
        </RowView>
      )) }
    </StyledView>
  </React.Fragment>
);

const Dot = (): ReactElement => (
  <StyledView
    background={theme.colors.TEXT_MID}
    height={5}
    width={5}
  />
);

interface OnGoingConditionsProps extends Protocols.OnGoingConditions {
  onEdit: () => void;
}

const OnGoingConditions = (props:OnGoingConditionsProps): ReactElement => (
  <React.Fragment>
    <Separator width="100%" marginTop={20} />
    <StyledView
      paddingTop={20}
    >
      <RowView alignItems="center" justifyContent="space-between">
        <SectionHeader h1>Ongoing Conditions</SectionHeader>
        <EditButton onPress={props.onEdit} />
      </RowView>
      {props.onGoingConditions.data.map((condition: string) => (
        <RowView key={condition} alignItems="center" marginTop={10}>
          <Dot /><StyledText marginLeft={10} color={theme.colors.TEXT_MID}>{condition}</StyledText>
        </RowView>
      ))}
    </StyledView>
  </React.Fragment>
);

interface FamilyInformationProps extends Protocols.PatientParents {
  onEdit: () => void
}

const FamilyInformation = (props: FamilyInformationProps): ReactElement => (
  <StyledView
    paddingTop={20}
  >
    <RowView justifyContent="space-between">
      <SectionHeader h1>
        Family
      </SectionHeader>
      <EditButton onPress={props.onEdit} />
    </RowView>
    <StyledView
      marginTop={20}
    >
      <RowView
        alignItems="center"
        justifyContent="space-between"
      >
        <InformationBox
          title="Mother"
          info={props.parentsInfo.motherName}
        />
        <ArrowForward size={15} fill={theme.colors.TEXT_SOFT} />
      </RowView>
    </StyledView>
    <Separator marginTop={10} marginBottom={10} width={370} />
    <StyledView>
      <RowView
        alignItems="center"
        justifyContent="space-between"
      >
        <InformationBox
          title="Father"
          info={props.parentsInfo.fatherName}
        />
        <ArrowForward size={15} fill={theme.colors.TEXT_SOFT} />
      </RowView>
    </StyledView>
  </StyledView>
);

 interface NotificationCheckboxProps {
   onChange: (value: boolean) => void;
   value: boolean
 }

const NotificationCheckbox = (props:NotificationCheckboxProps): ReactElement => (
  <React.Fragment>
    <Separator marginTop={20} />
    <StyledView marginTop={20} marginBottom={20}>
      <Checkbox
        onChange={props.onChange}
        value={props.value}
        text="Send Reminders for Vaccines, Appointments etc..."
      />
    </StyledView>
    <Separator />
  </React.Fragment>
);

interface InformationBoxProps extends StyledViewProps {
    title: string;
    info?: string | null;
}
const InformationBox = ({ title, info, ...props }: InformationBoxProps): ReactElement => (
  <StyledView {...props}>
    <StyledText
      fontSize={screenPercentageToDP(1.70, Orientation.Height)}
      fontWeight={500}
    >{title}
    </StyledText>
    <StyledText
      marginTop={5}
      fontSize={screenPercentageToDP(1.94, Orientation.Height)}
      color={theme.colors.TEXT_MID}
    >
      {info}
    </StyledText>
  </StyledView>
);

const GeneralInfo = (data: Protocols.PatientGeneralInformation): ReactElement => (
  <StyledView
    width="100%"
  >
    <SectionHeader
      h1
      fontWeight={500}
    >
      General Information
    </SectionHeader>
    <RowView marginTop={20}>
      <InformationBox
        flex={1}
        title="First name"
        info={data.generalInfo.firstName}
      />
      <InformationBox
        flex={1}
        title="Middle name"
        info={data.generalInfo.middleName}
      />
    </RowView>
    <RowView marginTop={20}>
      <InformationBox
        flex={1}
        title="Last name"
        info={data.generalInfo.lastName}
      />
      <InformationBox flex={1} title="Cultural/tradition name" info="Tony" />
    </RowView>
    <RowView marginTop={20}>
      <InformationBox
        flex={1}
        title="Date of Birth"
        info={formatDate(data.generalInfo.birthDate, DateFormats.DDMMYY)}
      />
      <InformationBox flex={1} title="Blood type" info={data.generalInfo.bloodType} />
    </RowView>
  </StyledView>
);

interface SeparatorProps extends StyledViewProps {
    width? : string| number;
}

const Separator = ({ width = '100%', ...props }: SeparatorProps): ReactElement => (
  <StyledView width="100%" height={1} {...props}>
    <StyledView width={width} height={1} background={theme.colors.BOX_OUTLINE} />
  </StyledView>
);


const HealthIdentificationRow = (): ReactElement => (
  <RowView height={45}>
    <StyledView justifyContent="center" flex={3} background={theme.colors.MAIN_SUPER_DARK}>
      <StyledText
        marginLeft={20}
        fontSize={screenPercentageToDP(1.45, Orientation.Height)}
        fontWeight="bold"
        color={theme.colors.SECONDARY_MAIN}
      >Health Identification Number
      </StyledText>
    </StyledView>
    <CenterView background={theme.colors.SECONDARY_MAIN} justifyContent="center" flex={1}>
      <StyledText fontWeight="bold" color={theme.colors.MAIN_SUPER_DARK}> TEMO001</StyledText>
    </CenterView>
  </RowView>
);

export const PatientDetailsScreen = (): ReactElement => {
  const patientData: Protocols.PatientDetails = {
    healthId: 'TEMO001',
    generalInfo: {
      firstName: 'Ugyen',
      lastName: 'Wangdi',
      middleName: null,
      birthDate: new Date(),
      bloodType: 'A+',
      culturalTraditionName: null,
    },
    reminderWarnings: true,
    parentsInfo: {
      fatherName: 'Nuno Wangdi',
      motherName: 'Rose Wangdi',
    },
    onGoingConditions: {
      data: ['Hepatitis C', 'Asthma'],
    },
    familyHistory: {
      data: ['Haemochromatosis'],
    },
    operativePlan: {
      data: [],
    },
  };

  const [reminders, setReminders] = useState(patientData.reminderWarnings);
  const [editField, setEditField] = useState(false);

  const changeReminder = useCallback(
    (value: boolean) => {
      setReminders(value);
    },
    [],
  );

  const onNavigateToFilters = useCallback(
    () => {
      console.log('navigate to filters...');
    },
    [],
  );

  const onNavigateBack = useCallback(
    () => {
      console.log('navigate back...');
    },
    [],
  );

  const onEditField = useCallback(
    () => {
      setEditField(!editField);
    },
    [editField],
  );

  return (
    <FullView>
      <StyledSafeAreaView background={theme.colors.PRIMARY_MAIN}>
        <StyledView
          background={theme.colors.PRIMARY_MAIN}
          height={170}
        >
          <RowView
            justifyContent="space-between"
          >
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
          <RowView
            paddingLeft={screenPercentageToDP(4.86, Orientation.Width)}
          >
            <UserAvatar
              size={screenPercentageToDP(7.29, Orientation.Height)}
              {...avatarMock}
            />
            <StyledView
              alignItems="flex-start"
              marginLeft={10}
            >
              <StyledText
                color={theme.colors.WHITE}
                fontSize={screenPercentageToDP(3.40, Orientation.Height)}
                fontWeight="bold"
              >
                {avatarMock.name}
              </StyledText>
              <StyledText
                color={theme.colors.WHITE}
                fontSize={screenPercentageToDP(1.94, Orientation.Height)}
              >
                {avatarMock.gender}, {avatarMock.age} years old, {avatarMock.city}
              </StyledText>
            </StyledView>
          </RowView>
        </StyledView>
        <HealthIdentificationRow />
      </StyledSafeAreaView>
      <FullView>
        <StyledScrollView
          background={theme.colors.BACKGROUND_GREY}
          paddingLeft={20}
          paddingRight={20}
          paddingTop={20}
        >
          <GeneralInfo
            generalInfo={patientData.generalInfo}
            healthId={patientData.healthId}
          />
          <NotificationCheckbox
            value={reminders}
            onChange={changeReminder}
          />
          <FamilyInformation
            onEdit={onEditField}
            parentsInfo={patientData.parentsInfo}
          />
          <OnGoingConditions
            onEdit={onEditField}
            onGoingConditions={patientData.onGoingConditions}
          />
          <FamilyHistory onEdit={onEditField} familyHistory={patientData.familyHistory} />
          <OpperativePlan
            onEdit={onEditField}
            operativePlan={patientData.operativePlan}
          />
        </StyledScrollView>
      </FullView>
    </FullView>
  );
};
