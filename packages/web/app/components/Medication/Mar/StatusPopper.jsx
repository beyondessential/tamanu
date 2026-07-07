import { ClickAwayListener, Paper, Popper } from '@material-ui/core';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import IconButton, { iconButtonClasses } from '@mui/material/IconButton';
import { useQueryClient } from '@tanstack/react-query';
import { addHours, set } from 'date-fns';
import React, { useId, useMemo, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import * as yup from 'yup';

import { ADMINISTRATION_STATUS, DRUG_UNIT_SHORT_LABELS } from '@tamanu/constants';
import { getDateFromTimeString } from '@tamanu/shared/utils/medication';
import {
  Button,
  Field,
  Form,
  NumberField,
  OuterLabelFieldWrapper,
  RequiredOrnament,
  TAMANU_COLORS,
  TranslatedEnum,
  TranslatedText,
  useDateTime,
} from '@tamanu/ui-components';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { useGivenMarMutation, useNotGivenMarMutation } from '../../../api/mutations/useMarMutation';
import { useSuggestionsQuery } from '../../../api/queries/useSuggestionsQuery';
import { MAR_WARNING_MODAL } from '../../../constants/medication';
import { useEncounter } from '../../../contexts/Encounter';
import { isWithinTimeSlot } from '../../../utils/medications';
import { TimePickerField } from '../../Field/TimePickerField';
import { NoteModalActionBlocker } from '../../NoteModalActionBlocker';
import { WarningModal } from '../WarningModal';

const StyledPaper = styled(Paper)`
  border-radius: 5px;
  border: 1px solid ${p => p.theme.palette.divider};
  box-shadow: 0 8px 32px 0 oklch(0 0 0 / 15%);
  display: flex;
  flex-direction: column;
  gap: 10px;
  inline-size: 8rem;
  min-inline-size: 8rem;
  padding: 10px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-block: 8px solid transparent;
    z-index: 2;
    ${p =>
      p.$placement === 'right'
        ? css`
            right: 100%;
            border-right: 8px solid white;
          `
        : css`
            left: 100%;
            border-left: 8px solid white;
          `}
  }

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-block: 9px solid transparent;
    z-index: 1;
    ${p =>
      p.$placement === 'right'
        ? css`
            right: 100%;
            border-right: 9px solid rgba(0, 0, 0, 0.1);
            margin-right: 1px;
          `
        : css`
            left: 100%;
            border-left: 9px solid rgba(0, 0, 0, 0.1);
            margin-left: 1px;
          `}
  }
`;

const StyledForm = styled(Form)`
  > * + * {
    margin-block-start: 8px;
  }
`;

const DoseContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  inline-size: 100%;
`;

const DoseButton = styled(IconButton).attrs({ size: 'small' })`
  &.${iconButtonClasses.root} {
    padding: 0;
    color: ${p => p.theme.palette.primary.main};
    &:disabled {
      color: ${TAMANU_COLORS.softText};
    }
  }
  svg {
    font-size: 16px;
  }
`;

const ConfirmButton = styled(Button).attrs({ fullWidth: true })`
  block-size: 32px;
  font-size: 12px;
`;

const StyledNumberFieldWrapper = styled.div`
  position: relative;

  .MuiInputBase-input {
    font-size: 11px;
    height: 17px;
    padding: 1px calc(${p => p.$units.length}ch + 5px) 1px 3px;
    width: 41px;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0px;
    }
  }
`;

const InputSuffix = styled.span`
  color: ${p => p.theme.palette.text.tertiary};
  font-size: 11px;
  inset-block-start: 1.7px;
  inset-inline-end: 3px;
  position: absolute;
`;

const StyledTimePicker = styled(Field)`
  .MuiInputBase-root {
    background-color: ${p => p.theme.palette.background.paper};
    color: ${p => p.theme.palette.text.primary};
    font-size: 12px;
    height: 32px;
    width: 100%;
    .MuiButtonBase-root {
      padding: 5px;
    }
    .MuiSvgIcon-root {
      font-size: 14px;
    }
    .MuiInputBase-input {
      text-transform: lowercase;
    }
    .MuiOutlinedInput-notchedOutline {
      border-width: 1px !important;
    }
    &.Mui-focused .MuiOutlinedInput-notchedOutline {
      border-color: ${p => p.theme.palette.primary.main} !important;
    }
    :not(.Mui-disabled):hover .MuiOutlinedInput-notchedOutline {
      border-color: ${TAMANU_COLORS.softText};
    }
  }
`;

const ErrorMessage = styled.div`
  color: ${p => p.theme.palette.error.main};
  font-size: 12px;
  font-weight: 500;
  line-height: 1.25;
  margin-block: 4px 2px;
  margin-inline: 2px;
`;

const StyledButton = styled(Button).attrs({
  color: 'inherit',
  variant: 'outlined',
})`
  border-color: ${p => p.$color};
  color: ${p => p.$color};
  transition-property: none;
`;

const MainScreen = ({ onGivenClick, onNotGivenClick }) => {
  return (
    <>
      <NoteModalActionBlocker>
        <StyledButton $color={TAMANU_COLORS.green} onClick={onGivenClick}>
          <TranslatedText stringId="medication.status.given" fallback="Given" />
        </StyledButton>
      </NoteModalActionBlocker>
      <hr aria-hidden />
      <NoteModalActionBlocker>
        <StyledButton $color={TAMANU_COLORS.alert} onClick={onNotGivenClick}>
          <TranslatedText stringId="medication.status.notGiven" fallback="Not given" />
        </StyledButton>
      </NoteModalActionBlocker>
    </>
  );
};

const ReasonScreen = ({ reasonsNotGiven, onReasonSelect, isUpdatingMarToNotGiven }) => {
  return (
    <>
      {reasonsNotGiven?.data?.map(reason => (
        <Button
          key={reason.id}
          variant="outlined"
          onClick={() => onReasonSelect(reason.id)}
          disabled={isUpdatingMarToNotGiven}
        >
          <TranslatedText stringId={reason.name} fallback={reason.name} />
        </Button>
      ))}
    </>
  );
};

const GivenScreen = ({
  doseAmount: prescriptionDoseAmount,
  timeSlot,
  selectedDate,
  marId,
  dosingUnit,
  onClose,
  prescriptionId,
  isFuture,
  isPast,
  isVariableDose,
}) => {
  const queryClient = useQueryClient();
  const { encounter } = useEncounter();
  const { getFacilityNowDate, toStoredDateTime } = useDateTime();
  const doseInputRef = useRef(null);
  const timeGivenInputId = useId();
  const [showWarningModal, setShowWarningModal] = useState(null);

  const { mutateAsync: updateMarToGiven, isLoading: isUpdatingMarToGiven } = useGivenMarMutation(
    marId,
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['encounterMedication', encounter?.id]);
        queryClient.invalidateQueries(['marDoses', marId]);
        onClose();
      },
    },
  );
  const handleSubmit = async ({ timeGiven, doseAmount }) => {
    if (
      Number(doseAmount) !== Number(prescriptionDoseAmount) &&
      !showWarningModal &&
      !isVariableDose
    ) {
      setShowWarningModal(MAR_WARNING_MODAL.NOT_MATCHING_DOSE);
      return;
    }

    const givenTime = set(new Date(selectedDate), {
      hours: timeGiven.getHours(),
      minutes: timeGiven.getMinutes(),
      seconds: timeGiven.getSeconds(),
    });
    const dueAt = addHours(getDateFromTimeString(timeSlot.startTime, selectedDate), 1);
    await updateMarToGiven({
      dueAt: toStoredDateTime(toDateTimeString(dueAt)),
      prescriptionId,
      dose: {
        doseAmount,
        givenTime: toStoredDateTime(toDateTimeString(givenTime)),
      },
    });
  };

  return (
    <StyledForm
      suppressErrorDialog
      onSubmit={handleSubmit}
      render={({ setFieldValue, values, submitForm, errors }) => (
        <>
          <WarningModal
            modal={showWarningModal}
            onClose={() => setShowWarningModal(null)}
            onConfirm={() => {
              setShowWarningModal(null);
              handleSubmit(values);
            }}
          />
          <>
            <DoseContainer>
              <DoseButton
                onClick={() => doseInputRef.current?.stepDown()}
                disabled={values.doseAmount <= 0.25}
                style={isVariableDose ? { visibility: 'hidden' } : undefined}
              >
                <RemoveCircleOutlineIcon />
              </DoseButton>
              <StyledNumberFieldWrapper $units={dosingUnit}>
                <Field
                  name="doseAmount"
                  component={NumberField}
                  inputRef={doseInputRef}
                  min={0.25}
                  step={0.25}
                />
                <InputSuffix>
                  <TranslatedEnum enumValues={DRUG_UNIT_SHORT_LABELS} value={dosingUnit} />
                  <RequiredOrnament />
                </InputSuffix>
              </StyledNumberFieldWrapper>
              <DoseButton
                onClick={() => doseInputRef.current?.stepUp()}
                style={isVariableDose ? { visibility: 'hidden' } : undefined}
              >
                <AddCircleOutlineIcon />
              </DoseButton>
            </DoseContainer>

            <OuterLabelFieldWrapper
              label={
                <TranslatedText stringId="medication.mar.timeGiven.label" fallback="Time given" />
              }
              htmlFor={timeGivenInputId}
              required
              size="small"
            >
              <StyledTimePicker
                name="timeGiven"
                onChange={value => {
                  setFieldValue('timeGiven', value);
                }}
                component={TimePickerField}
                format="hh:mmaa"
                timeSteps={{ minutes: 1 }}
                error={errors.timeGiven}
                slotProps={{
                  textField: {
                    error: errors.timeGiven,
                    id: timeGivenInputId,
                  },
                  digitalClockSectionItem: {
                    sx: { fontSize: '14px' },
                  },
                }}
              />
              {errors.timeGiven && <ErrorMessage>{errors.timeGiven}</ErrorMessage>}
            </OuterLabelFieldWrapper>

            <div>
              <ConfirmButton
                onClick={submitForm}
                variant="outlined"
                size="small"
                disabled={!values.doseAmount || isUpdatingMarToGiven}
                isSubmitting={isUpdatingMarToGiven}
              >
                <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
              </ConfirmButton>
            </div>
          </>
        </>
      )}
      initialValues={{
        doseAmount: Number(prescriptionDoseAmount) || '',
        timeGiven: isPast
          ? addHours(getDateFromTimeString(timeSlot.startTime, selectedDate), 1)
          : getFacilityNowDate(),
      }}
      validationSchema={yup.object().shape({
        doseAmount: yup
          .number()
          .required(<TranslatedText stringId="validation.required.inline" fallback="*Required" />)
          .translatedLabel(
            <TranslatedText stringId="medication.mar.doseAmount.label" fallback="Dose amount" />,
          ),
        timeGiven: yup
          .date()
          .required(<TranslatedText stringId="validation.required.inline" fallback="*Required" />)
          .test(
            'time-within-slot',
            <TranslatedText
              stringId="medication.mar.timeGiven.validation.outside"
              fallback="Time is outside selected window"
            />,
            value => isWithinTimeSlot(timeSlot, value, isFuture),
          ),
      })}
    />
  );
};

export const StatusPopper = ({
  open,
  anchorEl,
  onClose,
  timeSlot,
  selectedDate,
  marInfo,
  medication,
  isFuture,
  isPast,
}) => {
  const { id: marId } = marInfo || {};
  const { doseAmount, dosingUnit, id: prescriptionId, isVariableDose } = medication || {};
  const { toStoredDateTime } = useDateTime();

  const [showReasonScreen, setShowReasonScreen] = useState(false);
  const [showGivenScreen, setShowGivenScreen] = useState(false);

  const { mutateAsync: updateMarToNotGiven, isLoading: isUpdatingMarToNotGiven } =
    useNotGivenMarMutation(marId, {
      onSuccess: () => {
        queryClient.invalidateQueries(['encounterMedication', encounter?.id]);
      },
    });
  const queryClient = useQueryClient();

  const { encounter } = useEncounter();

  const handleClose = () => {
    setShowReasonScreen(false);
    setShowGivenScreen(false);
    onClose();
  };

  const handleReasonSelect = async reasonNotGivenId => {
    const dueAt = addHours(getDateFromTimeString(timeSlot.startTime, selectedDate), 1);
    await updateMarToNotGiven({
      status: ADMINISTRATION_STATUS.NOT_GIVEN,
      reasonNotGivenId,
      dueAt: toStoredDateTime(toDateTimeString(dueAt)),
      prescriptionId,
    });

    setShowReasonScreen(false);
    handleClose();
  };

  const reasonsNotGiven = useSuggestionsQuery('medicationNotGivenReason');

  const getContent = () => {
    if (showReasonScreen) {
      return (
        <ReasonScreen
          reasonsNotGiven={reasonsNotGiven}
          onReasonSelect={handleReasonSelect}
          isUpdatingMarToNotGiven={isUpdatingMarToNotGiven}
        />
      );
    }
    if (showGivenScreen) {
      return (
        <GivenScreen
          doseAmount={doseAmount}
          timeSlot={timeSlot}
          selectedDate={selectedDate}
          dosingUnit={dosingUnit}
          marId={marId}
          onClose={onClose}
          prescriptionId={prescriptionId}
          isFuture={isFuture}
          isPast={isPast}
          isVariableDose={isVariableDose}
        />
      );
    }
    return (
      <MainScreen
        onGivenClick={() => void setShowGivenScreen(true)}
        onNotGivenClick={() => void setShowReasonScreen(true)}
      />
    );
  };

  const placement = useMemo(() => {
    return ['00:00', '02:00', '04:00'].includes(timeSlot.startTime) ? 'right' : 'left';
  }, [timeSlot]);

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement={placement}
      transition
      modifiers={{
        offset: {
          enabled: true,
          offset: '0, 10',
        },
      }}
      popperOptions={{
        positionFixed: true,
        modifiers: {
          preventOverflow: {
            enabled: true,
            boundariesElement: 'window',
          },
        },
      }}
      style={{ zIndex: 1300 }}
    >
      <ClickAwayListener onClickAway={handleClose}>
        <StyledPaper $placement={placement}>{getContent()}</StyledPaper>
      </ClickAwayListener>
    </Popper>
  );
};
