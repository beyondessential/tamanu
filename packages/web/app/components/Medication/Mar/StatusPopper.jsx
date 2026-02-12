import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import { Divider, Popper, Paper, ClickAwayListener, Fade, IconButton } from '@material-ui/core';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { getDateFromTimeString } from '@tamanu/shared/utils/medication';
import { addHours, set } from 'date-fns';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { Form, Button, useDateTime } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import * as yup from 'yup';
import { TranslatedEnum, TranslatedText } from '../../Translation';
import { ADMINISTRATION_STATUS, DRUG_UNIT_SHORT_LABELS } from '@tamanu/constants';
import { useGivenMarMutation, useNotGivenMarMutation } from '../../../api/mutations/useMarMutation';
import { useEncounter } from '../../../contexts/Encounter';
import { useSuggestionsQuery } from '../../../api/queries/useSuggestionsQuery';
import { Field, NumberField } from '../../Field';
import { TimePickerField } from '../../Field/TimePickerField';
import { MAR_WARNING_MODAL } from '../../../constants/medication';
import { WarningModal } from '../WarningModal';
import { isWithinTimeSlot } from '../../../utils/medications';
import { NoteModalActionBlocker } from '../../NoteModalActionBlocker';

const StyledPaper = styled(Paper)`
  box-shadow: 0px 8px 32px 0px #00000026;
  border-radius: 5px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    z-index: 2;
    ${p =>
      p.$placement === 'right'
        ? `
      right: 100%;
      border-right: 8px solid white;
    `
        : `
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
    border-top: 9px solid transparent;
    border-bottom: 9px solid transparent;
    z-index: 1;
    ${p =>
      p.$placement === 'right'
        ? `
      right: 100%;
      border-right: 9px solid rgba(0, 0, 0, 0.1);
      margin-right: 1px;
    `
        : `
      left: 100%;
      border-left: 9px solid rgba(0, 0, 0, 0.1);
      margin-left: 1px;
    `}
  }
`;

const PopperContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 11px 14px;
`;

const StyledButton = styled(Button)`
  color: ${p => p.$color};
  border-color: ${p => p.$color} !important;
`;

const DoseContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 7px;
  gap: 5px;
`;

const DoseButton = styled(IconButton)`
  padding: 5px;
  margin: -5px;
  svg {
    color: ${p => (p.disabled ? Colors.softText : Colors.primary)};
    width: 14px;
    height: 14px;
  }
  ${p => p.$hidden && 'opacity: 0;'}
`;

const TimeGivenTitle = styled.div`
  color: ${Colors.darkText};
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 3px;
`;

const RequiredMark = styled.span`
  color: ${Colors.alert};
`;

const ConfirmButton = styled(Button)`
  min-width: 95px;
  width: 100%;
  height: 32px;
  font-size: 12px;
  margin-top: 7px;
`;

const StyledNumberFieldWrapper = styled.div`
  position: relative;

  .MuiInputBase-input {
    text-align: center;
    width: 41px;
    height: 17px;
    padding: 1px calc(${p => p.$units.length}ch + 5px) 1px 3px;
    font-size: 11px;

    /* Remove the spinner arrows */
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0px;
    }

    /* For Firefox */
    -moz-appearance: textfield;
  }
`;

const InputSuffix = styled.span`
  font-size: 11px;
  position: absolute;
  right: 3px;
  top: 1.7px;
  color: ${Colors.midText};
`;

const StyledTimePicker = styled(Field)`
  margin-bottom: 7px;
  .MuiInputBase-root {
    font-size: 12px;
    height: 32px;
    width: 100%;
    color: ${Colors.darkestText};
    background-color: ${Colors.white};
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
      border-color: ${Colors.primary} !important;
    }
    :not(.Mui-disabled):hover .MuiOutlinedInput-notchedOutline {
      border-color: ${Colors.softText};
    }
  }

  /* Add error message styling */
  .error-message {
    color: ${Colors.alert};
    font-size: 10px;
    margin-top: 2px;
  }
`;

const FormContainer = styled.div`
  padding: 11px 14px;
  width: ${p => p.$width}px;
`;

const ErrorMessage = styled.div`
  color: ${Colors.alert};
  font-size: 12px;
  margin: 4px 2px 2px;
  font-weight: 500;
  line-height: 15px;
`;

const MainScreen = ({ onGivenClick, onNotGivenClick }) => {
  return (
    <PopperContent>
      <NoteModalActionBlocker>
        <StyledButton onClick={onGivenClick} variant="outlined" $color={Colors.green}>
          <TranslatedText stringId="medication.status.given" fallback="Given" />
        </StyledButton>
      </NoteModalActionBlocker>
      <Divider color={Colors.outline} />
      <NoteModalActionBlocker>
        <StyledButton onClick={onNotGivenClick} variant="outlined" $color={Colors.alert}>
          <TranslatedText stringId="medication.status.notGiven" fallback="Not given" />
        </StyledButton>
      </NoteModalActionBlocker>
    </PopperContent>
  );
};

const ReasonScreen = ({ reasonsNotGiven, onReasonSelect, isUpdatingMarToNotGiven }) => {
  return (
    <PopperContent>
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
    </PopperContent>
  );
};

const GivenScreen = ({
  doseAmount: prescriptionDoseAmount,
  timeSlot,
  selectedDate,
  marId,
  units,
  onClose,
  prescriptionId,
  isFuture,
  isPast,
  isVariableDose,
}) => {
  const queryClient = useQueryClient();
  const { encounter } = useEncounter();
  const { getFacilityNow, toStoredDateTime } = useDateTime();
  const [containerWidth, setContainerWidth] = useState(null);
  const doseInputRef = useRef(null);
  const [showWarningModal, setShowWarningModal] = useState(null);

  // Measure the DoseContainer width when component mounts
  useLayoutEffect(() => {
    if (doseInputRef.current) {
      setContainerWidth(doseInputRef.current.offsetWidth + 62);
    }
  }, []);

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
  const handleDecreaseDose = (doseAmount, setFieldValue) => {
    if (doseAmount <= 0.25) return;
    setFieldValue('doseAmount', doseAmount - 0.25);
  };

  const handleIncreaseDose = (doseAmount, setFieldValue) => {
    if (!doseAmount) {
      setFieldValue('doseAmount', 0.5);
      return;
    }
    setFieldValue('doseAmount', doseAmount + 0.5);
  };

  const handleSubmit = async data => {
    const { timeGiven, doseAmount } = data;
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
    <Form
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
          <FormContainer $width={containerWidth}>
            <DoseContainer>
              <DoseButton
                disabled={values.doseAmount <= 0.25}
                onClick={() => handleDecreaseDose(values.doseAmount, setFieldValue)}
                $hidden={isVariableDose}
              >
                <RemoveCircleOutlineIcon />
              </DoseButton>
              <StyledNumberFieldWrapper $units={units} ref={doseInputRef}>
                <Field name="doseAmount" component={NumberField} min={0.25} />
                <InputSuffix>
                  <TranslatedEnum enumValues={DRUG_UNIT_SHORT_LABELS} value={units} />
                  <RequiredMark>*</RequiredMark>
                </InputSuffix>
              </StyledNumberFieldWrapper>
              <DoseButton
                onClick={() => handleIncreaseDose(values.doseAmount, setFieldValue)}
                $hidden={isVariableDose}
              >
                <AddCircleOutlineIcon />
              </DoseButton>
            </DoseContainer>

            <TimeGivenTitle>
              <TranslatedText stringId="medication.mar.timeGiven.label" fallback="Time given" />
              <RequiredMark>*</RequiredMark>
            </TimeGivenTitle>
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
                  InputProps: {
                    placeholder: '--:-- --',
                  },
                  error: errors.timeGiven,
                },
                digitalClockSectionItem: {
                  sx: { fontSize: '14px' },
                },
              }}
            />
            {errors.timeGiven && <ErrorMessage>{errors.timeGiven}</ErrorMessage>}

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
          </FormContainer>
        </>
      )}
      initialValues={{
        doseAmount: Number(prescriptionDoseAmount) || '',
        timeGiven: isPast
          ? addHours(getDateFromTimeString(timeSlot.startTime, selectedDate), 1)
          : new Date(getFacilityNow()),
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
  const { doseAmount, units, id: prescriptionId, isVariableDose } = medication || {};
  const { toStoredDateTime } = useDateTime();

  const [showReasonScreen, setShowReasonScreen] = useState(false);
  const [showGivenScreen, setShowGivenScreen] = useState(false);

  const {
    mutateAsync: updateMarToNotGiven,
    isLoading: isUpdatingMarToNotGiven,
  } = useNotGivenMarMutation(marId, {
    onSuccess: () => {
      queryClient.invalidateQueries(['encounterMedication', encounter?.id]);
    },
  });
  const queryClient = useQueryClient();

  const handleNotGivenClick = () => {
    setShowReasonScreen(true);
  };

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

  const handleGivenClick = () => {
    setShowGivenScreen(true);
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
          units={units}
          marId={marId}
          onClose={onClose}
          prescriptionId={prescriptionId}
          isFuture={isFuture}
          isPast={isPast}
          isVariableDose={isVariableDose}
        />
      );
    }
    return <MainScreen onGivenClick={handleGivenClick} onNotGivenClick={handleNotGivenClick} />;
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
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={250}>
          <div>
            <ClickAwayListener onClickAway={handleClose}>
              <StyledPaper $placement={placement}>{getContent()}</StyledPaper>
            </ClickAwayListener>
          </div>
        </Fade>
      )}
    </Popper>
  );
};
