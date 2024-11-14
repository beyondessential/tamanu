import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import Box from '@mui/material/Box';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import { styled } from '@mui/material/styles';
import { debounce } from 'lodash';
import { toast } from 'react-toastify';

import { TranslatedText } from '../../Translation';
import { Colors } from '../../../constants';
import { reloadPatient } from '../../../store';
import { useApi } from '../../../api';
import { usePatientAdditionalDataQuery } from '../../../api/queries';
import { ControlsRow } from './ControlsRow';
import { PatientDetailsDisplay } from './PatientDetailsDisplay';
import { AppointmentDetailsDisplay } from './AppointmentDetailsDisplay';
import { AppointmentStatusSelector } from './AppointmentStatusSelector';

export const APPOINTMENT_DRAWER_CLASS = 'appointment-drawer';
const DEBOUNCE_DELAY = 200; // ms

const StyledPaper = styled(Paper)`
  color: ${Colors.darkestText};
  display: flex;
  flex-direction: column;
  width: 16rem;
  box-shadow: 0 0.5rem 2rem 0 oklch(0 0 0 / 15%);
  border-radius: 0.3125rem;
  font-size: 0.6875rem;
`;

export const AppointmentDetailPopper = ({
  open,
  onClose,
  onStatusChange,
  onEdit,
  onCancel,
  anchorEl,
  appointment,
  isOvernight = false,
}) => {
  const dispatch = useDispatch();
  const api = useApi();
  const patientId = appointment.patient.id;

  const { data: additionalData } = usePatientAdditionalDataQuery(patientId);

  const [localStatus, setLocalStatus] = useState(appointment.status);

  const handlePatientDetailsClick = useCallback(async () => {
    await dispatch(reloadPatient(patientId));
    dispatch(push(`/patients/all/${patientId}`));
  }, [dispatch, patientId]);

  const debouncedUpdateAppointmentStatus = useMemo(
    () =>
      debounce(async newValue => {
        try {
          await api.put(`appointments/${appointment.id}`, {
            status: newValue,
          });
          console.log('newValue', newValue);
          console.log(onStatusChange);
          onStatusChange?.(newValue);
        } catch (error) {
          toast.error(
            <TranslatedText
              stringId="schedule.error.updateStatus"
              fallback="Error updating appointment status"
            />,
          );
          setLocalStatus(appointment.status);
        }
      }, DEBOUNCE_DELAY),
    [api, appointment.id, appointment.status, onStatusChange],
  );

  const updateAppointmentStatus = useCallback(
    newValue => {
      setLocalStatus(newValue);
      debouncedUpdateAppointmentStatus(newValue);
    },
    [debouncedUpdateAppointmentStatus],
  );

  const handleClickAway = e => {
    if (e.target.closest(`.${APPOINTMENT_DRAWER_CLASS}`)) return;
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
        padding: { top: 64, left: 184 }, // px conversions of height / width from CarouselComponents
      },
    },
  ];

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="bottom-start"
      onClick={e => e.stopPropagation()} // Prevent the popper from closing when clicked
      sx={{
        zIndex: 10,
      }}
      modifiers={modifiers}
    >
      <ClickAwayListener
        onClickAway={handleClickAway}
        mouseEvent="onMouseDown"
        touchEvent="onTouchStart"
      >
        <Box>
          <ControlsRow onClose={onClose} onEdit={onEdit} onCancel={onCancel} />
          <StyledPaper elevation={0}>
            <PatientDetailsDisplay
              patient={appointment.patient}
              onClick={handlePatientDetailsClick}
              additionalData={additionalData}
            />
            <AppointmentDetailsDisplay appointment={appointment} isOvernight={isOvernight} />
            <AppointmentStatusSelector
              selectedStatus={localStatus}
              updateAppointmentStatus={updateAppointmentStatus}
              appointment={appointment}
              additionalData={additionalData}
            />
          </StyledPaper>
        </Box>
      </ClickAwayListener>
    </Popper>
  );
};
