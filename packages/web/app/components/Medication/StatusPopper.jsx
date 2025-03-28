import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import { Divider, Popper, Paper, ClickAwayListener, Fade, IconButton } from '@material-ui/core';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { getDateFromTimeString } from '@tamanu/shared/utils/medication';
import { set } from 'date-fns';
import * as yup from 'yup';
import { Colors } from '../../constants';
import { TranslatedText } from '../Translation';
import { Button } from '../Button';
import { ADMINISTRATION_STATUS } from '@tamanu/constants';
import { useMarMutation } from '../../api/mutations/useMarMutation';
import { useEncounter } from '../../contexts/Encounter';
import { useSuggestionsQuery } from '../../api/queries/useSuggestionsQuery';
import { Field, Form, NumberField } from '../Field';
import { TimePickerField } from '../Field/TimePickerField';

const StyledPaper = styled(Paper)`
  box-shadow: 0px 8px 32px 0px #00000026;
  border-radius: 5px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 100%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    border-left: 8px solid white;
    z-index: 2;
  }

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 100%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-top: 9px solid transparent;
    border-bottom: 9px solid transparent;
    border-left: 9px solid rgba(0, 0, 0, 0.1);
    z-index: 1;
    margin-left: 1px;
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
    color: ${Colors.primary};
    width: 14px;
    height: 14px;
  }
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
      <StyledButton onClick={onGivenClick} variant="outlined" $color={Colors.green}>
        <TranslatedText stringId="medication.status.given" fallback="Given" />
      </StyledButton>
      <Divider color={Colors.outline} />
      <StyledButton onClick={onNotGivenClick} variant="outlined" $color={Colors.alert}>
        <TranslatedText stringId="medication.status.notGiven" fallback="Not given" />
      </StyledButton>
    </PopperContent>
  );
};

const ReasonScreen = ({ reasonsNotGiven, onReasonSelect }) => {
  return (
    <PopperContent>
      {reasonsNotGiven?.data?.map(reason => (
        <Button key={reason.id} variant="outlined" onClick={() => onReasonSelect(reason.id)}>
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
}) => {
  const queryClient = useQueryClient();
  const { encounter } = useEncounter();
  const [containerWidth, setContainerWidth] = useState(null);
  const doseInputRef = useRef(null);

  // Measure the DoseContainer width when component mounts
  useEffect(() => {
    if (doseInputRef.current) {
      setContainerWidth(doseInputRef.current.offsetWidth + 62);
    }
  }, [doseInputRef.current]);

  const { mutateAsync: updateMar } = useMarMutation(marId, {
    onSuccess: () => {
      queryClient.invalidateQueries(['encounterMedication', encounter?.id]);
      onClose();
    },
  });
  const handleDecreaseDose = (doseAmount, setFieldValue) => {
    if (doseAmount <= 0.25) return;
    setFieldValue('doseAmount', doseAmount - 0.25);
  };

  const handleIncreaseDose = (doseAmount, setFieldValue) => {
    setFieldValue('doseAmount', doseAmount + 0.5);
  };

  const handleSubmit = async data => {
    const { timeGiven, doseAmount } = data;
    const givenTime = set(new Date(selectedDate), {
      hours: timeGiven.getHours(),
      minutes: timeGiven.getMinutes(),
      seconds: timeGiven.getSeconds(),
    });
    const administeredAt = getDateFromTimeString(timeSlot.startTime, selectedDate);
    await updateMar({
      status: ADMINISTRATION_STATUS.GIVEN,
      administeredAt,
      doses: [
        {
          doseAmount,
          givenTime,
        },
      ],
      prescriptionId,
    });
  };

  return (
    <Form
      enableReinitialize
      suppressErrorDialog
      onSubmit={handleSubmit}
      render={({ setFieldValue, values, submitForm, errors }) => (
        <FormContainer $width={containerWidth}>
          <DoseContainer>
            <DoseButton onClick={() => handleDecreaseDose(values.doseAmount, setFieldValue)}>
              <RemoveCircleOutlineIcon />
            </DoseButton>
            <StyledNumberFieldWrapper $units={units} ref={doseInputRef}>
              <Field name="doseAmount" component={NumberField} min={0.25} />
              <InputSuffix>{units}</InputSuffix>
            </StyledNumberFieldWrapper>
            <DoseButton onClick={() => handleIncreaseDose(values.doseAmount, setFieldValue)}>
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
                readOnly: true,
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
            <ConfirmButton onClick={submitForm} variant="outlined" size="small">
              <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
            </ConfirmButton>
          </div>
        </FormContainer>
      )}
      initialValues={{
        doseAmount: Number(prescriptionDoseAmount) || 0.25,
        timeGiven: new Date(),
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
            function(value) {
              if (!value || !timeSlot) return true; // Skip validation if no value or timeSlot

              // Convert times to minutes since midnight for easier comparison
              const timeToMinutes = date => date.getHours() * 60 + date.getMinutes();

              // Get the minutes for the selected time
              const selectedTimeMinutes = timeToMinutes(new Date(value));

              const slotStartMinutes = timeToMinutes(getDateFromTimeString(timeSlot.startTime));
              const slotEndMinutes = timeToMinutes(getDateFromTimeString(timeSlot.endTime));

              // Check if the time slot crosses midnight
              if (slotEndMinutes < slotStartMinutes) {
                // For time slots that cross midnight
                return (
                  selectedTimeMinutes >= slotStartMinutes || selectedTimeMinutes <= slotEndMinutes
                );
              } else {
                // For normal time slots within the same day
                return (
                  selectedTimeMinutes >= slotStartMinutes && selectedTimeMinutes <= slotEndMinutes
                );
              }
            },
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
}) => {
  const { id: marId, prescriptionId, administeredAt: marAdministeredAt } = marInfo || {};
  const { doseAmount, units } = medication || {};
  const administeredAt =
    marAdministeredAt || getDateFromTimeString(timeSlot.startTime, selectedDate);

  const [showReasonScreen, setShowReasonScreen] = useState(false);
  const [showGivenScreen, setShowGivenScreen] = useState(false);

  const queryClient = useQueryClient();
  const { mutateAsync: updateMar } = useMarMutation(marId, {
    onSuccess: () => {
      queryClient.invalidateQueries(['encounterMedication', encounter?.id]);
    },
  });

  const handleNotGivenClick = () => {
    setShowReasonScreen(true);
  };

  const { encounter } = useEncounter();

  const handleReasonSelect = async reasonNotGivenId => {
    await updateMar({
      status: ADMINISTRATION_STATUS.NOT_GIVEN,
      reasonNotGivenId,
      ...(marId && { administeredAt }),
      ...(marId && { prescriptionId }),
    });

    setShowReasonScreen(false);
    onClose();
  };

  const handleGivenClick = () => {
    setShowGivenScreen(true);
  };

  const reasonsNotGiven = useSuggestionsQuery('reasonNotGiven');

  const getContent = () => {
    if (showReasonScreen) {
      return <ReasonScreen reasonsNotGiven={reasonsNotGiven} onReasonSelect={handleReasonSelect} />;
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
        />
      );
    }
    return <MainScreen onGivenClick={handleGivenClick} onNotGivenClick={handleNotGivenClick} />;
  };

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="left"
      transition
      modifiers={{
        offset: {
          enabled: true,
          offset: '0, 10',
        },
      }}
      style={{ zIndex: 1300 }}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={250}>
          <div>
            <ClickAwayListener onClickAway={onClose}>
              <StyledPaper>{getContent()}</StyledPaper>
            </ClickAwayListener>
          </div>
        </Fade>
      )}
    </Popper>
  );
};
