import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { Box, IconButton, Menu, MenuItem, Paper, Popper, styled } from '@mui/material';
import { MoreVert, Close, Brightness2 as Overnight } from '@mui/icons-material';

import { PatientNameDisplay } from '../PatientNameDisplay';
import {
  TranslatedEnum,
  TranslatedReferenceData,
  TranslatedSex,
  TranslatedText,
} from '../Translation';
import { Colors } from '../../constants';
import { DateDisplay } from '../DateDisplay';
import { reloadPatient } from '../../store';
import { APPOINTMENT_TYPE_LABELS } from '@tamanu/constants';
import { usePatientAdditionalDataQuery } from '../../api/queries';
import { CancelBookingModal } from './CancelBookingModal';
import { formatDateRange } from './utils';

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

const StyledMenuItem = styled(MenuItem)`
  font-size: 0.6875rem;
  padding-inline: 0.75rem;
  padding-block: 0.25rem;
`;

const KebabMenu = ({ anchor, open, onClose, items, ...props }) => {
  return (
    <Menu anchorEl={anchor} open={open} onClose={onClose} {...props}>
      {items.map((item, index) => (
        <StyledMenuItem key={index} onClick={item.onClick}>
          {item.label}
        </StyledMenuItem>
      ))}
    </Menu>
  );
};

const ControlsRow = ({ onClose, appointment, onUpdated }) => {
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const isKebabMenuOpen = Boolean(anchor);

  const handleCancelClick = () => {
    setCancelModalOpen(true);
  };

  const handleCancelModalClose = () => {
    setCancelModalOpen(false);
  };

  const handleKebabClick = event => {
    setAnchor(prevAnchor => (prevAnchor ? null : event.currentTarget));
  };

  const handleKebabClose = () => {
    setAnchor(null);
  };

  const controls = [
    {
      label: <TranslatedText stringId="scheduling.action.modify" fallback="Modify" />,
      onClick: () => {},
    },
    {
      label: <TranslatedText stringId="general.action.cancel" fallback="Cancel" />,
      onClick: handleCancelClick,
    },
  ];

  return (
    <ControlsContainer>
      <StyledIconButton onClick={handleKebabClick}>
        <MoreVert sx={{ fontSize: '0.875rem' }} />
        <KebabMenu
          anchor={anchor}
          items={controls}
          open={isKebabMenuOpen}
          onClose={handleKebabClose}
        />
      </StyledIconButton>
      <StyledIconButton onClick={onClose}>
        <Close sx={{ fontSize: '0.875rem' }} />
      </StyledIconButton>
      <CancelBookingModal
        appointment={appointment}
        open={cancelModalOpen}
        onClose={handleCancelModalClose}
        onUpdated={onUpdated}
      />
    </ControlsContainer>
  );
};

const DetailsDisplay = ({ label, value }) => (
  <FlexCol>
    <Label>{label}</Label>
    <span>{value ?? '—'}</span>
  </FlexCol>
);

const InlineDetailsDisplay = ({ label, value }) => (
  <FlexRow sx={{ display: 'inline-flex' }}>
    <span>
      <Label>{label}: </Label> {value ?? '—'}
    </span>
  </FlexRow>
);

const BookingTypeDisplay = ({ type, isOvernight }) => (
  <DetailsDisplay
    label={<TranslatedText stringId="scheduling.bookingType.label" fallback="Booking type" />}
    value={
      <FlexRow sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <TranslatedEnum value={type} enumValues={APPOINTMENT_TYPE_LABELS} enumFallback={type} />
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
  const { data: additionalData, isLoading } = usePatientAdditionalDataQuery(id);
  return (
    <PatientDetailsContainer onClick={onClick}>
      <Title>
        <PatientNameDisplay patient={patient} />
      </Title>
      <span>
        <InlineDetailsDisplay
          label={<TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />}
          value={<TranslatedSex sex={sex} />}
        />
        <Label>{' | '}</Label>
        <InlineDetailsDisplay
          label={
            <TranslatedText
              stringId="general.localisedField.dateOfBirth.label.short"
              fallback="DOB"
            />
          }
          value={<DateDisplay date={dateOfBirth} />}
        />
      </span>
      {!isLoading && additionalData?.primaryContactNumber && (
        <InlineDetailsDisplay
          label={
            <TranslatedText
              stringId="patient.details.reminderContacts.field.contact"
              fallback="Contact"
            />
          }
          value={additionalData.primaryContactNumber}
        />
      )}
      <Label color={Colors.primary}>{displayId}</Label>
    </PatientDetailsContainer>
  );
};

const AppointmentDetailsDisplay = ({ appointment, isOvernight }) => {
  const { startTime, endTime, clinician, locationGroup, location, type } = appointment;
  return (
    <AppointmentDetailsContainer>
      <DetailsDisplay
        label={<TranslatedText stringId="general.time.label" fallback="Time" />}
        value={formatDateRange(startTime, endTime, isOvernight)}
      />
      <DetailsDisplay
        label={
          <TranslatedText
            stringId="general.localisedField.clinician.label.short"
            fallback="Clinician"
          />
        }
        value={clinician?.displayName}
      />
      <DetailsDisplay
        label={
          <TranslatedText stringId="general.localisedField.locationGroupId.label" fallback="Area" />
        }
        value={
          <TranslatedReferenceData
            fallback={locationGroup?.name}
            value={locationGroup?.id}
            category="locationGroup"
          />
        }
      />
      <DetailsDisplay
        label={
          <TranslatedText stringId="general.localisedField.locationId.label" fallback="Location" />
        }
        value={
          <TranslatedReferenceData
            fallback={location?.name}
            value={location?.id}
            category="location"
          />
        }
      />
      <BookingTypeDisplay type={type} isOvernight={isOvernight} />
    </AppointmentDetailsContainer>
  );
};

const AppointmentStatusDisplay = () => {
  return <AppointmentStatusContainer></AppointmentStatusContainer>;
};

export const AppointmentDetailPopper = ({
  open,
  onClose,
  onUpdated,
  anchorEl,
  appointment,
  isOvernight = false,
}) => {
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
      <ControlsRow appointment={appointment} onClose={onClose} onUpdated={onUpdated} />
      <StyledPaper elevation={0}>
        <PatientDetailsDisplay patient={appointment.patient} onClick={handlePatientDetailsClick} />
        <AppointmentDetailsDisplay appointment={appointment} isOvernight={isOvernight} />
        <AppointmentStatusDisplay />
      </StyledPaper>
    </Popper>
  );
};
