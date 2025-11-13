import ClickAwayListener from '@mui/material/ClickAwayListener';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import { styled } from '@mui/material/styles';
import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';

import { usePatientAdditionalDataQuery } from '../../../api/queries';
import { Colors } from '../../../constants';
import { reloadPatient } from '../../../store';
import { AppointmentDetailsDisplay } from './AppointmentDetailsDisplay';
import { AppointmentStatusSelector } from './AppointmentStatusSelector';
import { ControlsRow } from './ControlsRow';
import { PatientDetailsDisplay } from './PatientDetailsDisplay';
import { CheckInButton } from './CheckInButton';
import { useAuth } from '../../../contexts/Auth';

export const APPOINTMENT_CALENDAR_CLASS = 'appointment-calendar';

const StyledPaper = styled(Paper)`
  color: ${Colors.darkestText};
  display: flex;
  flex-direction: column;
  width: 16rem;
  box-shadow: 0 0.5rem 2rem 0 oklch(0 0 0 / 15%);
  border-radius: 0.3125rem;
  font-size: 0.6875rem;

  > * {
    padding-block: 0.625rem;
    padding-inline: 0.75rem;
  }
`;

const Footer = styled('footer')`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const AppointmentDetailPopper = ({
  actions,
  anchorEl,
  appointment,
  isOvernight = false,
  onCancel,
  onClose,
  onEdit,
  open = false,
  preventOverflowPadding = {},
}) => {
  const { ability } = useAuth();
  const dispatch = useDispatch();
  const patientId = appointment.patient.id;

  const { data: additionalData } = usePatientAdditionalDataQuery(appointment.patient.id);
  const navigate = useNavigate();

  const handlePatientDetailsClick = useCallback(async () => {
    await dispatch(reloadPatient(patientId));
    navigate(`/patients/all/${patientId}`);
  }, [dispatch, patientId, navigate]);

  const handleClickAway = e => {
    if (!e.target.closest(`.${APPOINTMENT_CALENDAR_CLASS}`)) return;
    onClose();
  };

  const modifiers = [
    {
      name: 'offset',
      options: {
        offset: [0, 2],
      },
    },
    {
      name: 'preventOverflow',
      enabled: true,
      options: {
        altAxis: true,
        altBoundary: true,
        tether: false,
        rootBoundary: 'document',
        padding: preventOverflowPadding,
      },
    },
  ];

  const canWriteAppointment = ability.can('write', 'Appointment');
  const canCreateEncounter = ability.can('create', 'Encounter');

  return (
    <Popper
      anchorEl={anchorEl}
      modifiers={modifiers}
      // Prevent the popper from closing when clicked
      onClick={e => e.stopPropagation()}
      open={open}
      placement="bottom-start"
      sx={{ zIndex: 10 }}
      data-testid="popper-tymk"
    >
      <ClickAwayListener
        onClickAway={handleClickAway}
        mouseEvent="onMouseDown"
        touchEvent="onTouchStart"
        data-testid="clickawaylistener-rxja"
      >
        <div>
          <ControlsRow
            additionalActions={actions}
            onCancel={onCancel}
            onClose={onClose}
            onEdit={onEdit}
            data-testid="controlsrow-30on"
          />
          <StyledPaper elevation={0} data-testid="styledpaper-mvu3">
            <PatientDetailsDisplay
              additionalData={additionalData}
              onClick={handlePatientDetailsClick}
              patient={appointment.patient}
              data-testid="patientdetailsdisplay-hxfv"
            />
            <AppointmentDetailsDisplay
              appointment={appointment}
              isOvernight={isOvernight}
              data-testid="appointmentdetailsdisplay-h1vt"
            />
            <Footer data-testid="footer-wcfm">
              <AppointmentStatusSelector
                appointment={appointment}
                disabled={!canWriteAppointment}
                data-testid="appointmentstatusselector-v277"
              />
              {canWriteAppointment && canCreateEncounter && (
                <CheckInButton appointment={appointment} data-testid="checkinbutton-o3lj" />
              )}
            </Footer>
          </StyledPaper>
        </div>
      </ClickAwayListener>
    </Popper>
  );
};
