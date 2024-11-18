import ClickAwayListener from '@mui/material/ClickAwayListener';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import { styled } from '@mui/material/styles';
import { push } from 'connected-react-router';
import { debounce } from 'lodash';
import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

import { useApi } from '../../../api';
import { usePatientAdditionalDataQuery } from '../../../api/queries';
import { Colors } from '../../../constants';
import { reloadPatient } from '../../../store';
import { TranslatedText } from '../../Translation';
import { AppointmentDetailsDisplay } from './AppointmentDetailsDisplay';
import { AppointmentStatusSelector } from './AppointmentStatusSelector';
import { ControlsRow } from './ControlsRow';
import { PatientDetailsDisplay } from './PatientDetailsDisplay';

export const APPOINTMENT_DRAWER_CLASS = 'appointment-drawer';
const DEBOUNCE_DELAY_MS = 200;

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
  actions,
  anchorEl,
  appointment,
  isOvernight = false,
  onCancel,
  onClose,
  onEdit,
  onStatusChange,
  open = false,
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
          onStatusChange?.(newValue);
        } catch (error) {
          toast.error(
            <TranslatedText
              stringId="schedule.error.updateStatus"
              fallback="Error updating appointment status"
            />,
            console.error(error),
          );
          setLocalStatus(appointment.status);
        }
      }, DEBOUNCE_DELAY_MS),
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
      anchorEl={anchorEl}
      modifiers={modifiers}
      onClick={e => e.stopPropagation()} // Prevent the popper from closing when clicked
      open={open}
      placement="bottom-start"
      sx={{ zIndex: 10 }}
    >
      <ClickAwayListener
        onClickAway={handleClickAway}
        mouseEvent="onMouseDown"
        touchEvent="onTouchStart"
      >
        <div>
          <ControlsRow
            additionalActions={actions}
            onCancel={onCancel}
            onClose={onClose}
            onEdit={onEdit}
          />
          <StyledPaper elevation={0}>
            <PatientDetailsDisplay
              additionalData={additionalData}
              onClick={handlePatientDetailsClick}
              patient={appointment.patient}
            />
            <AppointmentDetailsDisplay appointment={appointment} isOvernight={isOvernight} />
            <AppointmentStatusSelector
              additionalData={additionalData}
              appointment={appointment}
              selectedStatus={localStatus}
              updateAppointmentStatus={updateAppointmentStatus}
            />
          </StyledPaper>
        </div>
      </ClickAwayListener>
    </Popper>
  );
};
