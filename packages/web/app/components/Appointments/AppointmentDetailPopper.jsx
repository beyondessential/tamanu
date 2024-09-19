import { Box, ClickAwayListener, Divider, Paper, Popper, styled } from '@mui/material';
import React from 'react';
import { PatientNameDisplay } from '../PatientNameDisplay';
import { TranslatedText } from '../Translation';
import { Colors } from '../../constants';
import { format } from 'date-fns';
import { DateDisplay } from '../DateDisplay';

const formatDateRange = (start, end) => {
  const formattedStart = format(new Date(start), 'MM/dd/yyyy h:mma');
  const formattedEnd = format(new Date(end), 'h:mma');

  return `${formattedStart} - ${formattedEnd}`;
};

const Title = styled(`span`)({
  fontWeight: 500,
  fontSize: '0.875rem',
});

const Label = styled(`span`)(({ color }) => ({
  fontWeight: 500,
  color: color || 'inherit',
}));

const StyledPopper = styled(Popper)({
  boxShadow: '0px 8px 32px 0px #00000026',
  borderRadius: 5,
  fontSize: '0.6875rem',
});

const StyledPaper = styled(Paper)({
  padding: '0.75rem',
  color: Colors.darkestText,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
});

const PatientDetailsContainer = styled(`div`)`
  display: flex;
  flex-direction: column;
  gap: 0.1875rem;
`;

const AppointmentDetailsContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
});

const DetailsField = ({ label, value }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Label>{label}</Label>
      <span>{value ?? 'N/A'}</span>
    </Box>
  );
};

const DetailDivider = ({ props }) => {
  return <Divider sx={{ color: Colors.outline }} {...props} />;
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
        {sex || 'N/A'}
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
  const { startTime, endTime, clinicianId, locationGroupId, type } = appointment;

  return (
    <AppointmentDetailsContainer>
      <DetailsField
        label={<TranslatedText stringId="general.time.label" fallback="Time" />}
        value={formatDateRange(startTime, endTime)}
      />
      <DetailsField label="Clinician" value={clinicianId} />
      <DetailsField label="Area" value={locationGroupId} />
      <DetailsField label="Location" value={locationGroupId} />
      <DetailsField label="Type" value={type} />
    </AppointmentDetailsContainer>
  );
};

export const AppointmentDetailPopper = ({ open, handleClose, anchorEl, appointment }) => {
  return (
    <ClickAwayListener onClickAway={handleClose}>
      <StyledPopper open={open} anchorEl={anchorEl} placement="bottom-start">
        <StyledPaper elevation={0}>
          <PatientDetailsDisplay patient={appointment.patient} />
          <DetailDivider />
          <AppointDetailsDisplay appointment={appointment} />
        </StyledPaper>
      </StyledPopper>
    </ClickAwayListener>
  );
};
