import { Box, IconButton, Paper, Popper, styled } from '@mui/material';
import { MoreVert, Close, Brightness2 as Overnight } from '@mui/icons-material';
import React, { useCallback, useEffect, useState } from 'react';
import { PatientNameDisplay } from '../PatientNameDisplay';
import { TranslatedReferenceData, TranslatedSex, TranslatedText } from '../Translation';
import { Colors } from '../../constants';
import { DateDisplay, getDateDisplay } from '../DateDisplay';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { reloadPatient } from '../../store';
import { useApi } from '../../api';

const formatDateRange = (start, end, isOvernight) => {
  const formattedStart = getDateDisplay(start, { showDate: true, showTime: true });
  const formattedEnd = getDateDisplay(end, { showDate: isOvernight, showTime: true });

  return `${formattedStart} - ${formattedEnd}`;
};

const FlexRow = styled(Box)`
  display: flex;
  flex-direction: row;
`;

const FlexCol = styled(Box)`
  display: flex;
  flex-direction: column;
`;

const Title = styled('span')`
  font-weight: 500;
  font-size: 0.875rem;
`;

const Label = styled('span')`
  font-weight: 500;
  color: ${props => props.color || 'inherit'};
`;

const StyledPaper = styled(Paper)`
  color: ${Colors.darkestText};
  display: flex;
  flex-direction: column;
  width: 16rem;
  box-shadow: 0px 8px 32px 0px #00000026;
  border-radius: 5px;
  font-size: 0.6875rem;
`;

const StyledIconButton = styled(IconButton)`
  padding: 0px;
`;

const ControlsContainer = styled(FlexRow)`
  position: fixed;
  top: 8px;
  right: 8px;
  gap: 0.125rem;
`;

const PatientDetailsContainer = styled(FlexCol)`
  padding-inline: 0.75rem;
  padding-block-start: 0.75rem;
  padding-block-end: 0.5rem;
  gap: 0.1875rem;
  :hover {
    background-color: ${Colors.veryLightBlue};
    cursor: pointer;
  }
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
`;

const AppointmentDetailsContainer = styled(FlexCol)`
  padding-inline: 0.75rem;
  padding-block: 0.75rem;
  gap: 0.5rem;
  border-top: 1px solid ${Colors.outline};
  border-bottom: 1px solid ${Colors.outline};
`;

const AppointmentStatusContainer = styled(Box)`
  padding-inline: 0.75rem;
  padding-block-start: 0.5rem;
  padding-block-end: 0.75rem;
`;

const ControlsRow = ({ onClose }) => (
  <ControlsContainer>
    <StyledIconButton>
      <MoreVert sx={{ fontSize: '0.875rem' }} />
    </StyledIconButton>
    <StyledIconButton onClick={onClose}>
      <Close sx={{ fontSize: '0.875rem' }} />
    </StyledIconButton>
  </ControlsContainer>
);

const DetailsField = ({ label, value }) => (
  <FlexCol>
    <Label>{label}</Label>
    <span>{value ?? '—'}</span>
  </FlexCol>
);

const BookingTypeField = ({ type, isOvernight }) => (
  <DetailsField
    label={<TranslatedText stringId="scheduling.bookingType.label" fallback="Booking type" />}
    value={
      <FlexRow sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{type ?? '-'}</span>
        {isOvernight && (
          <FlexRow sx={{ gap: '2px' }}>
            <Overnight sx={{ fontSize: 15, color: Colors.primary }} />
            <TranslatedText stringId="scheduling.bookingType.overnight" fallback="Overnight" />
          </FlexRow>
        )}
      </FlexRow>
    }
  />
);

const PatientDetailsDisplay = ({ patient, onClick }) => {
  const { id, displayId, sex, dateOfBirth } = patient;
  const api = useApi();
  const [additionalData, setAdditionalData] = useState();
  useEffect(() => {
    (async () => {
      const data = await api.get(`/patient/${id}/additionalData`);
      setAdditionalData(data);
    })();
  }, [id, api]);

  return (
    <PatientDetailsContainer onClick={onClick}>
      <Title>
        <PatientNameDisplay patient={patient} />
      </Title>
      <span>
        <Label>
          <TranslatedText stringId="general.sex.label" fallback="Sex" />:
        </Label>{' '}
        <TranslatedSex sex={sex} />
        <Label>
          {' | '}
          <TranslatedText stringId="general.dateOfBirth.label" fallback="DOB" />:
        </Label>{' '}
        <DateDisplay date={dateOfBirth} />
      </span>
      {additionalData?.primaryContactNumber && (
        <DetailsField
          label={
            <TranslatedText
              stringId="patient.details.reminderContacts.field.contact"
              fallback="Contact"
              value={additionalData.primaryContactNumber}
            />
          }
        />
      )}
      <Label color={Colors.primary}>{displayId}</Label>
    </PatientDetailsContainer>
  );
};

const AppointDetailsDisplay = ({ appointment, isOvernight }) => {
  const { startTime, endTime, clinician, locationGroup, location, type } = appointment;
  return (
    <AppointmentDetailsContainer>
      <DetailsField
        label={<TranslatedText stringId="general.time.label" fallback="Time" />}
        value={formatDateRange(startTime, endTime, isOvernight)}
      />
      <DetailsField
        label={
          <TranslatedText
            stringId="general.localisedField.clinician.label.short"
            fallback="Clinician"
          />
        }
        value={clinician?.displayName}
      />
      <DetailsField
        label={<TranslatedText stringId="general.form.area.label" fallback="Area" />}
        value={
          <TranslatedReferenceData
            fallback={locationGroup?.name}
            value={locationGroup?.id}
            category="locationGroup"
          />
        }
      />
      <DetailsField
        label={<TranslatedText stringId="general.form.location.label" fallback="Location" />}
        value={
          <TranslatedReferenceData
            fallback={location?.name}
            value={location?.id}
            category="location"
          />
        }
      />
      <BookingTypeField type={type} isOvernight={isOvernight} />
    </AppointmentDetailsContainer>
  );
};

const AppointmentStatusDisplay = () => {
  return <AppointmentStatusContainer></AppointmentStatusContainer>;
};

export const AppointmentDetailPopper = ({ open, onClose, anchorEl, appointment, isOvernight }) => {
  const dispatch = useDispatch();
  const patientId = appointment.patient.id;

  const handlePatientDetailsClick = useCallback(async () => {
    await dispatch(reloadPatient(patientId));
    dispatch(push(`/patients/all/${patientId}`));
  }, [dispatch, patientId]);

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="bottom-start"
      onClick={e => e.stopPropagation()} // Prevent the popper from closing when clicked
      modifiers={[
        {
          name: 'offset',
          options: {
            offset: [0, 2],
          },
        },
      ]}
    >
      <ControlsRow onClose={onClose} />
      <StyledPaper elevation={0}>
        <PatientDetailsDisplay patient={appointment.patient} onClick={handlePatientDetailsClick} />
        <AppointDetailsDisplay appointment={appointment} isOvernight={isOvernight} />
        <AppointmentStatusDisplay />
      </StyledPaper>
    </Popper>
  );
};
