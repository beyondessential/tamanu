import { Box, IconButton, Paper, Popper, styled } from '@mui/material';
import { MoreVert, Close } from '@mui/icons-material';
import React from 'react';
import { PatientNameDisplay } from '../PatientNameDisplay';
import { TranslatedReferenceData, TranslatedSex, TranslatedText } from '../Translation';
import { Colors } from '../../constants';
import { format } from 'date-fns';
import { DateDisplay } from '../DateDisplay';

const formatDateRange = (start, end) => {
  const formattedStart = format(new Date(start), 'MM/dd/yyyy h:mma');
  const formattedEnd = format(new Date(end), 'h:mma');

  return `${formattedStart} - ${formattedEnd}`;
};

const Title = styled(`span`)`
  font-weight: 500;
  font-size: 0.875rem;
`;

const Label = styled(`span`)`
  font-weight: 500;
  color: ${props => props.color || 'inherit'};
`;

const StyledPaper = styled(Paper)`
  color: ${Colors.darkestText};
  display: flex;
  flex-direction: column;
  width: 16rem;
  box-shadow: 0px 8px 32px 0px #00000026;
  border-radius: 5;
  font-size: 0.6875rem;
`;

const StyledIconButton = styled(IconButton)`
  padding: 0px;
`;

const ControlsContainer = styled(Box)`
  position: fixed;
  display: flex;
  flex-direction: row;
  top: 8px;
  right: 8px;
  gap: 0.125rem;
`;

const PatientDetailsContainer = styled(Box)`
  padding-inline: 0.75rem;
  padding-block-start: 0.75rem;
  padding-block-end: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.1875rem;
  :hover {
    background-color: ${Colors.veryLightBlue};
    cursor: pointer;
  }
  border-top-left-radius: 5;
  border-top-right-radius: 5;
`;

const AppointmentDetailsContainer = styled(Box)`
  padding-inline: 0.75rem;
  padding-block: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-top: 1px solid ${Colors.outline};
  border-bottom: 1px solid ${Colors.outline};
`;

const AppointmentStatusContainer = styled(Box)`
  padding-inline: 0.75rem;
  padding-block-start: 0.5rem;
  padding-block-end: 0.75rem;
`;

const ControlsRow = ({ handleClose }) => {
  return (
    <ControlsContainer>
      <StyledIconButton>
        <MoreVert sx={{ fontSize: '0.875rem' }} />
      </StyledIconButton>
      <StyledIconButton onClick={handleClose}>
        <Close sx={{ fontSize: '0.875rem' }} />
      </StyledIconButton>
    </ControlsContainer>
  );
};

const DetailsField = ({ label, value }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Label>{label}</Label>
      <span>{value ?? '—'}</span>
    </Box>
  );
};

const PatientDetailsDisplay = ({ patient }) => {
  const { displayId, sex, dateOfBirth } = patient;

  return (
    <PatientDetailsContainer>
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
      <Label color={Colors.primary}>{displayId}</Label>
    </PatientDetailsContainer>
  );
};

const AppointDetailsDisplay = ({ appointment }) => {
  const { startTime, endTime, clinician, locationGroup, location, type } = appointment;
  return (
    <AppointmentDetailsContainer>
      <DetailsField
        label={<TranslatedText stringId="general.time.label" fallback="Time" />}
        value={formatDateRange(startTime, endTime)}
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
      <DetailsField
        label={<TranslatedText stringId="scheduling.bookingType.label" fallback="Booking type" />}
        value={type}
      />
    </AppointmentDetailsContainer>
  );
};

const AppointmentStatusDisplay = () => {
  return <AppointmentStatusContainer></AppointmentStatusContainer>;
};

export const AppointmentDetailPopper = ({ open, handleClose, anchorEl, appointment }) => {
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
      <ControlsRow handleClose={handleClose} />
      <StyledPaper elevation={0}>
        <PatientDetailsDisplay patient={appointment.patient} />
        <AppointDetailsDisplay appointment={appointment} />
        <AppointmentStatusDisplay />
      </StyledPaper>
    </Popper>
  );
};
