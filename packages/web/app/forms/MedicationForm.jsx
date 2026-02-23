import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { Box, Divider, Accordion, AccordionDetails, AccordionSummary } from '@material-ui/core';
import PrintIcon from '@material-ui/icons/Print';
import {
  DRUG_UNIT_VALUES,
  DRUG_UNIT_LABELS,
  DRUG_ROUTE_LABELS,
  DRUG_ROUTE_VALUES,
  MEDICATION_DURATION_UNITS_LABELS,
  MEDICATION_ADMINISTRATION_TIME_SLOTS,
  ADMINISTRATION_FREQUENCIES,
  FORM_TYPES,
  MAX_REPEATS,
} from '@tamanu/constants';
import { getReferenceDataStringId } from '@tamanu/shared/utils/translation';
import {
  findAdministrationTimeSlotFromIdealTime,
  getDateFromTimeString,
  getFirstAdministrationDate,
} from '@tamanu/shared/utils/medication';
import {
  formatShort,
  getCurrentDateString,
  getCurrentDateTimeString,
} from '@tamanu/utils/dateTime';
import { format, subSeconds } from 'date-fns';
import { useFormikContext } from 'formik';
import { toast } from 'react-toastify';

import { WarningOutlineIcon } from '../assets/icons/WarningOutlineIcon';
import { foreignKey } from '../utils/validation';
import { PrintPrescriptionModal } from '../components/PatientPrinting';
import {
  AutocompleteField,
  BodyText,
  CheckField,
  CheckInput,
  DateField,
  DateTimeField,
  Field,
  NumberField,
  SmallBodyText,
} from '../components';
import {
  TextField,
  TranslatedSelectField,
  Form,
  FormCancelButton,
  FormGrid,
  FormSubmitButton,
  Dialog,
} from '@tamanu/ui-components';
import { Colors, MAX_AGE_TO_RECORD_WEIGHT } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useTranslation } from '../contexts/Translation';
import { getAgeDurationFromDate } from '@tamanu/utils/date';
import { useQueryClient } from '@tanstack/react-query';
import { useApi, useSuggester } from '../api';
import { useSelector } from 'react-redux';
import { FrequencySearchField } from '../components/Medication/FrequencySearchInput';
import { useAuth } from '../contexts/Auth';
import { useSettings } from '../contexts/Settings';
import { ChevronIcon } from '../components/Icons/ChevronIcon';
import { ConditionalTooltip } from '../components/Tooltip';
import { capitalize } from 'lodash';
import { preventInvalidNumber, preventInvalidRepeatsInput, validateDecimalPlaces } from '../utils/utils';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { formatTimeSlot } from '../utils/medications';
import { useEncounter } from '../contexts/Encounter';
import { usePatientAllergiesQuery } from '../api/queries/usePatientAllergiesQuery';
import { useMedicationIdealTimes } from '../hooks/useMedicationIdealTimes';
import { useEncounterMedicationQuery } from '../api/queries/useEncounterMedicationQuery';
import { CircleAlert, CircleCheck, CircleHelp } from 'lucide-react';

const validationSchema = yup.object().shape({
  medicationId: foreignKey(
    <TranslatedText stringId="validation.required.inline" fallback="*Required" />,
  ),
  isOngoing: yup.boolean().optional(),
  isPrn: yup.boolean().optional(),
  doseAmount: yup
    .number()
    .positive()
    .translatedLabel(
      <TranslatedText stringId="medication.doseAmount.label" fallback="Dose amount" />,
    )
    .when('isVariableDose', {
      is: true,
      then: schema => schema.optional(),
      otherwise: schema =>
        schema.required(
          <TranslatedText stringId="validation.required.inline" fallback="*Required" />,
        ),
    }),
  units: foreignKey(
    <TranslatedText stringId="validation.required.inline" fallback="*Required" />,
  ).oneOf(DRUG_UNIT_VALUES),
  repeats: yup
    .number()
    .integer()
    .min(0)
    .max(MAX_REPEATS)
    .nullable()
    .optional(),
  frequency: foreignKey(
    <TranslatedText stringId="validation.required.inline" fallback="*Required" />,
  ),
  route: foreignKey(
    <TranslatedText stringId="validation.required.inline" fallback="*Required" />,
  ).oneOf(DRUG_ROUTE_VALUES),
  date: yup
    .date()
    .required(<TranslatedText stringId="validation.required.inline" fallback="*Required" />),
  startDate: yup
    .date()
    .required(<TranslatedText stringId="validation.required.inline" fallback="*Required" />),
  durationValue: yup
    .number()
    .positive()
    .translatedLabel(<TranslatedText stringId="medication.duration.label" fallback="Duration" />),
  durationUnit: yup
    .string()
    .when('durationValue', (durationValue, schema) =>
      durationValue
        ? schema.required(
          <TranslatedText stringId="validation.required.inline" fallback="*Required" />,
        )
        : schema.optional(),
    ),
  prescriberId: foreignKey(
    <TranslatedText stringId="validation.required.inline" fallback="*Required" />,
  ),
  quantity: yup.number().integer(),
  patientWeight: yup.number().positive(),
});

const FullWidthFieldWrapper = styled.div`
  position: relative;
  grid-column: 1 / -1;
  width: 100%;
`;

const CheckboxGroup = styled.div`
  position: relative;
  width: 100%;
  grid-column: 1 / -1;
  .MuiTypography-body1 {
    font-size: 14px;
  }
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 1.2rem;
  border-bottom: 1px solid ${Colors.outline};
  > div:nth-of-type(2) {
    max-width: fit-content;
  }
`;

const StyledCheckField = styled(CheckField)`
  cursor: pointer;
  width: 100%;
  background-color: ${Colors.white};
  border: 1px solid
    ${({ $isChecked, $isLocked }) => {
    if ($isLocked && $isChecked) return Colors.midText;
    if ($isChecked) return Colors.primary;
    return Colors.outline;
  }};
  border-radius: 3px;
  .MuiFormControlLabel-root {
    padding: 10px 2px;
    margin: 0;
    height: 44px;
  }
`;

const CheckboxRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
  align-items: stretch;
  border: 1px solid ${Colors.outline};
  padding: 12px 16px;
  border-radius: 3px;
`;

const CheckboxRowItem = styled.div`
  flex: 1;
`;

const ButtonRow = styled.div`
  display: flex;
  grid-column: 1 / -1;
  justify-content: space-between;
  height: 40px;
`;

const FieldLabel = styled(Box)`
  color: ${Colors.darkText};
  font-weight: 500;
  font-size: 14px;
`;

const FieldContent = styled(Box)`
  color: ${Colors.darkText};
  font-weight: 400;
  font-size: 14px;
`;

const StyledAccordion = styled(Accordion)`
  background-color: unset;
  grid-column: 1 / -1;
  margin: 0 !important;
  box-shadow: none;
  &::before {
    content: none;
  }
`;

const StyledAccordionSummary = styled(AccordionSummary)`
  padding: 0;
  min-height: unset !important;
  .expanded-icon {
    transition: transform 0.15s;
  }
  .MuiAccordionSummary-content {
    margin: 0;
    justify-content: space-between;
    align-items: center;
  }
  .MuiAccordionSummary-content.Mui-expanded .expanded-icon {
    transform: rotate(180deg);
  }
`;

const StyledAccordionDetails = styled(AccordionDetails)`
  padding: 0;
  margin-top: 8px;
  flex-direction: column;
`;

const ResetToDefaultButton = styled(Box)`
  font-size: 14px;
  font-weight: 400;
  text-decoration: underline;
  cursor: pointer;
`;

const StyledIcon = styled.i`
  border-radius: 0.1875rem;
  font-size: 1rem;
  line-height: 0.875rem;
  margin: 0.0625rem 0;
  ${props => props.$color && `color: ${props.$color};`}
`;

const StyledFormGrid = styled(FormGrid)`
  .MuiFormHelperText-root.Mui-error {
    font-size: 12px;
  }
`;

const StyledConditionalTooltip = styled(ConditionalTooltip)`
  max-width: 200px;
  .MuiTooltip-tooltip {
    font-weight: 400;
  }
`;

const VariableDoseFieldWrapper = styled.div`
  margin-bottom: -12px;
  grid-column: 1 / -1;
  width: 290px;
`;

const StyledTimePicker = styled(TimePicker)`
  .MuiInputBase-root {
    font-size: 14px;
    color: ${Colors.darkestText};
    background-color: ${Colors.white};
    &.Mui-disabled {
      background-color: inherit;
    }
    &.Mui-disabled .MuiOutlinedInput-notchedOutline {
      border-color: ${Colors.outline};
    }
    .MuiSvgIcon-root {
      font-size: 22px;
    }
    .MuiInputBase-input {
      padding-top: 11.85px;
      padding-bottom: 11.85px;
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
`;

const AllergiesWarningBox = styled(Box)`
  grid-column: 1 / -1;
  border: 1px solid ${Colors.alert};
  border-radius: 3px;
  padding: 10px 26px;
  background-color: ${Colors.lightAlert};
  margin-bottom: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const AllergiesWarningHeader = styled(Box)`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AllergiesWarningTitle = styled(BodyText)`
  color: ${Colors.darkestText};
  font-weight: 500;
  font-size: 14px;
`;

const AllergiesList = styled.ul`
  margin: 0;
  padding-left: 41px;
  list-style-type: disc;
`;

const AllergyItem = styled.li`
  color: ${Colors.darkestText};
  font-size: 14px;
  line-height: 20px;
`;

const StockLevelContainer = styled.div`
  padding: 12px 10px;
  margin-top: 4px;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  background-color: ${Colors.white};
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: ${Colors.darkestText};
`;

const StockLevelValue = styled.span`
  font-weight: 500;
  font-size: 14px;
  margin-left: -8px;
`;

const isOneTimeFrequency = frequency =>
  [ADMINISTRATION_FREQUENCIES.AS_DIRECTED, ADMINISTRATION_FREQUENCIES.IMMEDIATELY].includes(
    frequency,
  );

const MedicationAdministrationForm = ({ frequencyChanged }) => {
  const { getSetting } = useSettings();
  const frequenciesAdministrationIdealTimes = getSetting('medications.defaultAdministrationTimes');

  const { values, setValues } = useFormikContext();
  const selectedTimeSlots = values.timeSlots;

  const { defaultTimeSlots } = useMedicationIdealTimes({
    frequency: values.frequency,
  });

  const firstAdministrationTime = useMemo(() => {
    if (!values.startDate) return '';
    if (!values.frequency) return '';
    if (!selectedTimeSlots?.length) return '';

    const startDate = new Date(values.startDate);

    const firstStartTime = getFirstAdministrationDate(
      startDate,
      selectedTimeSlots.map(s => s.value),
    ).getTime();

    const firstSlot = findAdministrationTimeSlotFromIdealTime(firstStartTime).timeSlot;

    return `${formatTimeSlot(getDateFromTimeString(firstSlot.startTime))} - ${formatTimeSlot(
      getDateFromTimeString(firstSlot.endTime),
    )} ${formatShort(new Date(firstStartTime))}`;
  }, [values.startDate, selectedTimeSlots]);

  useEffect(() => {
    if (frequencyChanged) {
      handleResetToDefault();
    }
  }, [frequencyChanged]);

  const handleResetToDefault = () => {
    if (isOneTimeFrequency(values.frequency)) return setValues({ ...values, timeSlots: [] });

    setValues({
      ...values,
      timeSlots: defaultTimeSlots,
    });
  };

  const handleSelectTimeSlot = (checked, slot, index) => {
    setValues({
      ...values,
      timeSlots: checked
        ? [
          ...selectedTimeSlots,
          {
            index,
            value: getDefaultIdealTimeFromTimeSlot(slot, index),
            timeSlot: slot,
          },
        ]
        : selectedTimeSlots.filter(s => s.index !== index),
    });
  };

  const handleChangeTime = (value, index, context) => {
    if (context.validationError) return;
    setValues({
      ...values,
      timeSlots: selectedTimeSlots.map(s =>
        s.index === index ? { ...s, value: format(value, 'HH:mm') } : s,
      ),
    });
  };

  const getDefaultIdealTimeFromTimeSlot = (slot, index) => {
    const defaultIdealTimes = frequenciesAdministrationIdealTimes?.[values.frequency];
    const correspondingSlot = defaultIdealTimes
      ?.map(findAdministrationTimeSlotFromIdealTime)
      .find(it => it.index === index);
    return correspondingSlot?.value || slot.startTime;
  };

  return (
    <StyledAccordion
      defaultExpanded={!isOneTimeFrequency(values.frequency)}
      data-testid="medication-accordion-medicationAdministration-5m2w"
    >
      <StyledAccordionSummary>
        <FieldLabel>
          <TranslatedText
            stringId="medication.medicationAdministrationSchedule.label"
            fallback="Medication administration schedule"
          />
        </FieldLabel>
        <ChevronIcon width={12} height={12} className="expanded-icon" />
      </StyledAccordionSummary>
      <StyledAccordionDetails>
        <FieldContent lineHeight={'18px'}>
          <TranslatedText
            stringId="medication.medicationAdministrationSchedule.description"
            fallback="Administration times have been preset based on the frequency selected above. These times can be adjusted by deselecting and selecting the desired administration times. You can also set an ideal administration time within each administration window. The first administration time is displayed below, and can be adjusted by changing the start date & time above."
          />
        </FieldContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Box display="inline-flex">
            <FieldLabel>
              <TranslatedText
                stringId="medication.medicationAdministrationSchedule.firstAdministrationTime"
                fallback="First administration time"
              />
              {':'}
            </FieldLabel>
            <FieldContent>&nbsp;{firstAdministrationTime}</FieldContent>
          </Box>
          <ResetToDefaultButton
            onClick={handleResetToDefault}
            data-testid="medication-button-resetToDefault-9h6k"
          >
            <TranslatedText stringId="general.action.resetToDefault" fallback="Reset to default" />
          </ResetToDefaultButton>
        </Box>
        <Box display="flex" flexDirection="column" mt={2} style={{ gap: 12 }}>
          {MEDICATION_ADMINISTRATION_TIME_SLOTS.map((slot, index) => {
            const startTime = getDateFromTimeString(slot.startTime);
            const endTime = getDateFromTimeString(slot.endTime);

            const selectedTimeSlot = selectedTimeSlots?.find(s => s.index === index);
            const checked = !!selectedTimeSlot;
            const isDisabled =
              (!checked &&
                frequenciesAdministrationIdealTimes?.[values.frequency]?.length ===
                selectedTimeSlots?.length) ||
              isOneTimeFrequency(values.frequency);
            const selectedTime = selectedTimeSlot
              ? getDateFromTimeString(selectedTimeSlot.value)
              : null;

            return (
              <Box
                key={index}
                {...(slot.periodLabel && {
                  p: 1,
                  border: `1px solid ${Colors.outline}`,
                  borderRadius: '3px',
                  width: 'fit-content',
                })}
              >
                {slot.periodLabel && (
                  <FieldLabel mb={'3px'}>
                    <TranslatedText
                      stringId={`medication.medicationAdministrationSchedule.periodLabel.${slot.periodLabel}`}
                      fallback={capitalize(slot.periodLabel)}
                    />
                  </FieldLabel>
                )}
                <Box display="flex" ml={slot.periodLabel ? 0 : 1}>
                  <StyledConditionalTooltip
                    visible={isDisabled}
                    title={
                      values.frequency === ADMINISTRATION_FREQUENCIES.AS_DIRECTED ? (
                        <TranslatedText
                          stringId="medication.medicationAdministrationSchedule.disabledTooltipAsDirected"
                          fallback="Medication administration schedule not applicable for selected frequency."
                        />
                      ) : values.frequency === ADMINISTRATION_FREQUENCIES.IMMEDIATELY ? (
                        <TranslatedText
                          stringId="medication.medicationAdministrationSchedule.disabledTooltipImmediately"
                          fallback="Medication administration schedule is not applicable for selected frequency. Dose will be due immediately."
                        />
                      ) : (
                        <TranslatedText
                          stringId="medication.medicationAdministrationSchedule.disabledTooltip"
                          fallback="Only :slots administration times can be selected based on the frequency. Please deselect a time in order to select another."
                          replacements={{
                            slots: frequenciesAdministrationIdealTimes?.[values.frequency]?.length,
                          }}
                        />
                      )
                    }
                  >
                    <Box
                      px={1.5}
                      py={1.25}
                      bgcolor={isDisabled ? undefined : Colors.white}
                      borderRadius="3px"
                      width="187px"
                      height="fit-content"
                      border={`1px solid ${checked ? Colors.primary : Colors.outline}`}
                    >
                      <CheckInput
                        label={
                          <FieldContent>{`${formatTimeSlot(startTime)} - ${formatTimeSlot(
                            endTime,
                          )}`}</FieldContent>
                        }
                        value={checked}
                        onChange={(_, value) => handleSelectTimeSlot(value, slot, index)}
                        disabled={isDisabled}
                        data-testid={`medication-checkbox-asfd${index}`}
                        {...(isDisabled && { icon: <StyledIcon className="far fa-square" /> })}
                      />
                    </Box>
                  </StyledConditionalTooltip>
                  <Box ml={1} width="187px">
                    <StyledTimePicker
                      disabled={isDisabled || !checked}
                      value={selectedTime}
                      onChange={(value, context) => handleChangeTime(value, index, context)}
                      format="hh:mmaa"
                      slotProps={{
                        textField: {
                          readOnly: true,
                          InputProps: {
                            placeholder: '--:-- --',
                          },
                        },
                        layout: {
                          sx: {
                            '.MuiList-root:nth-child(3) :not(.Mui-selected)': {
                              pointerEvents: 'none',
                              opacity: 0.38,
                            },
                          },
                        },
                        digitalClockSectionItem: {
                          sx: { fontSize: '14px' },
                        },
                      }}
                      placeholder="--:-- --"
                      timeSteps={{ minutes: 1 }}
                      minTime={startTime}
                      maxTime={subSeconds(endTime, 1)}
                      data-testid={`medication-time-picker-asfd${index}`}
                    />
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </StyledAccordionDetails>
    </StyledAccordion>
  );
};

const MedicationBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  padding: 12px 20px;
  background-color: ${Colors.white};
  grid-column: 1 / -1;
`;

export const MedicationForm = ({
  encounterId,
  onCancel,
  onSaved,
  onConfirmEdit,
  onCancelEdit,
  editingMedication,
  isOngoingPrescription,
  onDirtyChange,
}) => {
  const isEditing = !!onConfirmEdit;
  const api = useApi();
  const { ability, currentUser } = useAuth();
  const { getTranslation } = useTranslation();
  const { getSetting } = useSettings();
  const frequenciesAdministrationIdealTimes = getSetting('medications.defaultAdministrationTimes');
  const queryClient = useQueryClient();
  const { loadEncounter } = useEncounter();
  const { data: { data: medications = [] } = {} } = useEncounterMedicationQuery(encounterId);
  const existingDrugIds = medications
    .filter(({ discontinued }) => !discontinued)
    .map(({ medication }) => medication?.id);

  const weightUnit = getTranslation('general.localisedField.weightUnit.label', 'kg');

  const patient = useSelector(state => state.patient);
  const age = getAgeDurationFromDate(patient.dateOfBirth)?.years ?? 0;
  const showPatientWeight = age < MAX_AGE_TO_RECORD_WEIGHT && !isOngoingPrescription;
  const canPrintPrescription = ability.can('read', 'Medication');

  const [submittedMedication, setSubmittedMedication] = useState(null);
  const [printModalOpen, setPrintModalOpen] = useState();
  const [awaitingPrint, setAwaitingPrint] = useState(false);
  const [patientWeight, setPatientWeight] = useState('');
  const [idealTimesErrorOpen, setIdealTimesErrorOpen] = useState(false);
  const [showExistingDrugWarning, setShowExistingDrugWarning] = useState(false);
  const [isFinalizingMedication, setIsFinalizingMedication] = useState(false);
  const [frequencyChanged, setFrequencyChanged] = useState(0);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const drugQuantity = selectedDrug?.facilities?.[0]?.quantity;
  const drugStockStatus = selectedDrug?.facilities?.[0]?.stockStatus;

  const { defaultTimeSlots } = useMedicationIdealTimes({
    frequency: editingMedication?.frequency,
  });

  const practitionerSuggester = useSuggester('practitioner');
  const drugSuggester = useSuggester('drug', {
    formatter: ({ name, id, ...rest }) => ({ ...rest, label: name, value: id }),
    baseQueryParameters: isOngoingPrescription ? { includeUnavailable: true } : {},
  });

  const { data: allergies, isLoading: isLoadingAllergies } = usePatientAllergiesQuery(patient?.id);
  const allergiesList =
    allergies?.data?.map(allergyDetail =>
      getTranslation(
        getReferenceDataStringId(allergyDetail?.allergy.id, allergyDetail?.allergy.type),
        allergyDetail?.allergy.name,
      ),
    ) || [];

  // Transition to print page as soon as we have the generated id
  useEffect(() => {
    (async () => {
      if (awaitingPrint && submittedMedication) {
        setPrintModalOpen(true);
      }
    })();
  }, [awaitingPrint, submittedMedication]);

  const onSubmit = async data => {
    const defaultIdealTimes = frequenciesAdministrationIdealTimes?.[data.frequency];
    if (!isOneTimeFrequency(data.frequency) && data.timeSlots.length < defaultIdealTimes?.length) {
      setIdealTimesErrorOpen(true);
      return Promise.reject();
    }

    const idealTimes = data.timeSlots.map(slot => slot.value);
    const payload = {
      ...data,
      doseAmount: data.doseAmount || undefined,
      durationValue: data.durationValue || undefined,
      durationUnit: data.durationUnit || undefined,
      idealTimes,
    };
    if (onConfirmEdit) {
      onConfirmEdit(payload);
      return;
    }
    let medicationSubmission;
    try {
      medicationSubmission = await (isOngoingPrescription
        ? api.post(`medication/patientOngoingPrescription/${patient.id}`, payload)
        : api.post(`medication/encounterPrescription/${encounterId}`, payload));
      // The return from the post doesn't include the joined tables like medication and prescriber
      const newMedication = await api.get(`medication/${medicationSubmission.id}`);
      setSubmittedMedication(newMedication);
    } catch (error) {
      toast.error(error.message);
      return Promise.reject(error);
    }
    if (loadEncounter && encounterId) {
      loadEncounter(encounterId, false);
    }
    if (encounterId) {
      queryClient.invalidateQueries(['encounterMedication', encounterId]);
    }
    if (patient) {
      queryClient.invalidateQueries(['patient-ongoing-prescriptions', patient.id]);
    }
  };

  const onFinalise = async ({ data, isPrinting, submitForm, dirty }) => {
    if (isFinalizingMedication) {
      return;
    }

    setIsFinalizingMedication(true);

    try {
      setAwaitingPrint(isPrinting);
      if (onDirtyChange) {
        onDirtyChange(dirty);
      }
      await submitForm(data);
    } finally {
      setIsFinalizingMedication(false);
    }
  };

  const getInitialValues = () => {
    return {
      date: getCurrentDateString(),
      prescriberId: currentUser.id,
      isVariableDose: false,
      startDate: getCurrentDateTimeString(),
      isOngoing: isOngoingPrescription,
      repeats: editingMedication?.repeats ?? 0,
      timeSlots: defaultTimeSlots,
      ...editingMedication,
    };
  };

  const handleChangeMedication = e => {
    const isExistingDrug = existingDrugIds.includes(e.target.value);
    setShowExistingDrugWarning(isExistingDrug);
    setSelectedDrug(e.target?.referenceDrug);
  };

  const getStockLevelIcon = () => {
    if (drugQuantity > 0) return <CircleCheck size={20} color={Colors.safe} />;
    if (drugQuantity === 0) return <CircleAlert size={20} color={Colors.alert} />;
    return <CircleHelp size={20} color={Colors.blue} />;
  };

  const getStockLevelContent = () => {
    const MAX_DISPLAYABLE_STOCK_LEVEL = 1000000;

    if (isNaN(parseInt(drugQuantity))) {
      return (
        <TranslatedText
          stringId="medication.stockLevel.unknown"
          fallback="The stock status of this medication is currently unknown."
        />
      );
    }

    if (drugQuantity === 0) {
      return (
        <TranslatedText
          stringId="medication.stockLevel.outOfStock"
          fallback="Medication is currently marked as out of stock."
        />
      );
    }

    const stockLevelValue =
      drugQuantity <= MAX_DISPLAYABLE_STOCK_LEVEL ? (
        <TranslatedText
          stringId="medication.stockLevel.inStock.approxUnits"
          fallback="Approx :quantity units"
          replacements={{ quantity: Number(drugQuantity).toLocaleString() }}
        />
      ) : (
        <TranslatedText
          stringId="medication.stockLevel.inStock.moreThanOneMillionUnits"
          fallback="More than 1 million units"
        />
      );

    return (
      <>
        <TranslatedText
          stringId="medication.stockLevel.inStock"
          fallback="Medication is currently in stock. Stock level: "
        />
        <StockLevelValue>{stockLevelValue}</StockLevelValue>
      </>
    );
  };

  return (
    <>
      <Form
        suppressErrorDialog
        onSubmit={onSubmit}
        onSuccess={() => {
          if (isEditing) return;
          if (encounterId) {
            queryClient.invalidateQueries(['encounterMedication', encounterId]);
          }
          if (!awaitingPrint) {
            onSaved();
          }
        }}
        initialValues={getInitialValues()}
        formType={FORM_TYPES.CREATE_FORM}
        validationSchema={validationSchema}
        render={({ submitForm, setValues, values, dirty, setFieldError }) => (
          <StyledFormGrid>
            {!isEditing ? (
              <>
                {!isLoadingAllergies && allergiesList.length > 0 && (
                  <AllergiesWarningBox>
                    <AllergiesWarningHeader>
                      <WarningOutlineIcon />
                      <AllergiesWarningTitle>
                        <TranslatedText
                          stringId="medication.allergies.title"
                          fallback="Patient allergies"
                        />
                      </AllergiesWarningTitle>
                    </AllergiesWarningHeader>
                    <AllergiesList>
                      {allergiesList.map((allergy, index) => (
                        <AllergyItem key={index}>{allergy}</AllergyItem>
                      ))}
                    </AllergiesList>
                  </AllergiesWarningBox>
                )}
                <FullWidthFieldWrapper>
                  <Field
                    name="medicationId"
                    label={
                      <TranslatedText
                        stringId="medication.medication.label"
                        fallback="Medication"
                      />
                    }
                    component={AutocompleteField}
                    suggester={drugSuggester}
                    required
                    onChange={e => {
                      const referenceDrug = e.target.referenceDrug;
                      setValues({
                        ...values,
                        route: referenceDrug?.route?.toLowerCase() || '',
                        units: referenceDrug?.units || '',
                        notes: referenceDrug?.notes || '',
                      });
                      handleChangeMedication(e);
                    }}
                    data-testid="medication-field-medicationId-8k3m"
                  />
                  {showExistingDrugWarning && (
                    <SmallBodyText mt="2px" color={Colors.midText}>
                      <TranslatedText
                        stringId="medication.warning.existingDrug"
                        fallback="Please be aware that this medicine has already been prescribed for this encounter. Double check that this is clinically appropriate."
                      />
                    </SmallBodyText>
                  )}
                  {!isOngoingPrescription && !!drugStockStatus && (
                    <StockLevelContainer>
                      {getStockLevelIcon()}
                      {getStockLevelContent()}
                    </StockLevelContainer>
                  )}
                </FullWidthFieldWrapper>
              </>
            ) : (
              <MedicationBox>
                <BodyText color={Colors.midText}>
                  <TranslatedText stringId="medication.medication.label" fallback="Medication" />
                </BodyText>
                <BodyText color={Colors.darkestText} fontWeight={500}>
                  {editingMedication.medication.name}
                </BodyText>
              </MedicationBox>
            )}
            <CheckboxGroup>
              <CheckboxRow>
                <CheckboxRowItem>
                  <ConditionalTooltip
                    visible={isOngoingPrescription}
                    $maxWidth="220px"
                    title={
                      <TranslatedText
                        stringId="medication.isOngoing.tooltip"
                        fallback="Medications recorded outside of an encounter must be recorded as ongoing"
                      />
                    }
                  >
                    <Field
                      name="isOngoing"
                      label={
                        <TranslatedText
                          stringId="medication.isOngoing.label"
                          fallback="Ongoing medication"
                        />
                      }
                      component={StyledCheckField}
                      style={{ ...(isOngoingPrescription && { pointerEvents: 'none' }) }}
                      {...(isOngoingPrescription && { value: true })}
                      onChange={(_, value) => {
                        if (value) {
                          setValues({ ...values, durationValue: '', durationUnit: '' });
                        }
                      }}
                      checkedIcon={
                        <StyledIcon
                          className="far fa-check-square"
                          $color={isOngoingPrescription ? Colors.midText : Colors.primary}
                        />
                      }
                      data-testid="medication-field-isOngoing-7j2p"
                      $isChecked={values.isOngoing || isOngoingPrescription}
                      $isLocked={isOngoingPrescription}
                    />
                  </ConditionalTooltip>
                </CheckboxRowItem>
                <CheckboxRowItem>
                  <Field
                    name="isPrn"
                    label={
                      <TranslatedText stringId="medication.isPrn.label" fallback="PRN medication" />
                    }
                    component={StyledCheckField}
                    data-testid="medication-field-isPrn-9n4q"
                    $isChecked={values.isPrn}
                  />
                </CheckboxRowItem>
              </CheckboxRow>
            </CheckboxGroup>
            <VariableDoseFieldWrapper>
              <Field
                name="isVariableDose"
                label={
                  <BodyText>
                    <TranslatedText
                      stringId="medication.variableDose.label"
                      fallback="Variable dose"
                    />
                  </BodyText>
                }
                component={StyledCheckField}
                onChange={(_, value) => {
                  if (value) {
                    setValues({ ...values, doseAmount: '' });
                    setFieldError('doseAmount', null);
                  }
                }}
                data-testid="medication-field-isVariableDose-5h8x"
                $isChecked={values.isVariableDose}
              />
            </VariableDoseFieldWrapper>
            <Field
              name="doseAmount"
              label={
                <TranslatedText stringId="medication.doseAmount.label" fallback="Dose amount" />
              }
              component={NumberField}
              min={0}
              onInput={validateDecimalPlaces}
              required={!values.isVariableDose}
              disabled={values.isVariableDose}
              data-testid="medication-field-doseAmount-3t6w"
            />
            <Field
              name="units"
              label={<TranslatedText stringId="medication.units.label" fallback="Units" />}
              component={TranslatedSelectField}
              enumValues={DRUG_UNIT_LABELS}
              required
              data-testid="medication-field-units-2r9v"
            />
            <Field
              name="frequency"
              component={FrequencySearchField}
              required
              onChange={e => {
                if (e.target.value === ADMINISTRATION_FREQUENCIES.IMMEDIATELY) {
                  setValues({ ...values, durationValue: '', durationUnit: '' });
                }
                setFrequencyChanged(prev => prev + 1);
              }}
              data-testid="medication-field-frequency-4c7z"
            />
            <Field
              name="route"
              label={<TranslatedText stringId="medication.routeOfAdministration.label" fallback="Route of administration" />}
              component={TranslatedSelectField}
              enumValues={DRUG_ROUTE_LABELS}
              required
              data-testid="medication-field-route-6d1b"
            />
            <Field
              name="date"
              label={
                <TranslatedText stringId="medication.date.label" fallback="Prescription date" />
              }
              saveDateAsString
              component={DateField}
              required
              data-testid="medication-field-date-8m5k"
            />
            <Field
              name="startDate"
              label={
                <TranslatedText
                  stringId="medication.startDatetime.label"
                  fallback="Start date & time"
                />
              }
              saveDateAsString
              component={DateTimeField}
              required
              data-testid="medication-field-startDate-1a9s"
            />
            <FormGrid nested>
              <StyledConditionalTooltip
                visible={values.frequency === ADMINISTRATION_FREQUENCIES.IMMEDIATELY}
                title={
                  <TranslatedText
                    stringId="medication.duration.tooltip"
                    fallback="Duration is not supported by the selected frequency"
                  />
                }
              >
                <Field
                  name="durationValue"
                  label={
                    <TranslatedText stringId="medication.duration.label" fallback="Duration" />
                  }
                  component={NumberField}
                  min={0}
                  onInput={preventInvalidNumber}
                  disabled={
                    values.frequency === ADMINISTRATION_FREQUENCIES.IMMEDIATELY || values.isOngoing
                  }
                  data-testid="medication-field-durationValue-7p2n"
                />
              </StyledConditionalTooltip>
              <Field
                name="durationUnit"
                label={<Box sx={{ opacity: 0 }}>.</Box>}
                component={TranslatedSelectField}
                enumValues={MEDICATION_DURATION_UNITS_LABELS}
                disabled={
                  values.frequency === ADMINISTRATION_FREQUENCIES.IMMEDIATELY || values.isOngoing
                }
                data-testid="medication-field-durationUnit-4q8f"
              />
            </FormGrid>
            <div />
            <Field
              name="prescriberId"
              label={
                <TranslatedText stringId="medication.prescriber.label" fallback="Prescriber" />
              }
              component={AutocompleteField}
              suggester={practitionerSuggester}
              required
              data-testid="medication-field-prescriberId-3x5h"
            />
            <Field
              name="indication"
              label={
                <TranslatedText stringId="medication.indication.label" fallback="Indication" />
              }
              component={TextField}
              data-testid="medication-field-indication-9w6y"
            />
            <div style={{ gridColumn: '1/-1' }}>
              <Field
                name="isPhoneOrder"
                label={
                  <BodyText>
                    <TranslatedText stringId="medication.phoneOrder.label" fallback="Phone order" />
                  </BodyText>
                }
                component={CheckField}
                data-testid="medication-field-isPhoneOrder-2e4r"
              />
            </div>
            <Field
              name="notes"
              label={<TranslatedText stringId="general.notes.label" fallback="Notes" />}
              component={TextField}
              style={{ gridColumn: '1/-1' }}
              data-testid="medication-field-notes-5b3t"
            />
            <div style={{ gridColumn: '1 / -1' }}>
              <Divider />
            </div>
            {values.frequency ? (
              <MedicationAdministrationForm frequencyChanged={frequencyChanged} />
            ) : (
              <div style={{ gridColumn: '1 / -1' }}>
                <FieldLabel>
                  <TranslatedText
                    stringId="medication.medicationAdministrationSchedule.label"
                    fallback="Medication administration schedule"
                  />
                </FieldLabel>
                <FieldContent>
                  <TranslatedText
                    stringId="medication.medicationAdministrationSchedule.noFrequencySelected"
                    fallback="Select a frequency above to complete the medication administration schedule"
                  />
                </FieldContent>
              </div>
            )}
            <>
              <div style={{ gridColumn: '1 / -1' }}>
                <Divider />
              </div>
              <Field
                name="quantity"
                label={
                  encounterId ? (
                    <TranslatedText
                      stringId="medication.details.dischargeQuantity"
                      fallback="Discharge quantity"
                    />
                  ) : (
                    <TranslatedText
                      stringId="medication.quantity.label"
                      fallback="Quantity"
                    />
                  )
                }
                min={0}
                component={NumberField}
                onInput={preventInvalidNumber}
                data-testid="medication-field-quantity-6j9m"
              />
              <Field
                name="repeats"
                label={
                  encounterId ? (
                    <TranslatedText stringId="medication.repeats.onDischarge.label" fallback="Repeats on discharge" />
                  ) : (
                    <TranslatedText stringId="medication.repeats.label" fallback="Repeats" />
                  )
                }
                component={NumberField}
                min={0}
                max={MAX_REPEATS}
                step={1}
                onInput={preventInvalidRepeatsInput}
              />
            </>

            {showPatientWeight && (
              <>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Divider />
                </div>
                <Field
                  name="patientWeight"
                  label={
                    <TranslatedText
                      stringId="medication.patientWeightIfPrinting.label"
                      fallback="Patient weight if printing (:unit)"
                      replacements={{ unit: weightUnit }}
                    />
                  }
                  onChange={e => setPatientWeight(e.target.value)}
                  component={TextField}
                  placeholder={getTranslation('medication.patientWeight.placeholder', 'e.g 2.4')}
                  type="number"
                  data-testid="medication-field-patientWeight-1k7c"
                />
              </>
            )}
            <div style={{ gridColumn: '1 / -1', margin: '0 -32px' }}>
              <Divider />
            </div>
            <ButtonRow>
              {isOngoingPrescription || isEditing || !canPrintPrescription ? (
                <div />
              ) : (
                <FormSubmitButton
                  color="primary"
                  onClick={async data => onFinalise({ data, isPrinting: true, submitForm, dirty })}
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  disabled={isFinalizingMedication}
                  showLoadingIndicator={isFinalizingMedication}
                  data-testid="medication-button-finaliseAndPrint-8v2q"
                >
                  <TranslatedText
                    stringId="medication.action.finaliseAndPrint"
                    fallback="Finalise & Print"
                  />
                </FormSubmitButton>
              )}
              <Box display="flex" ml="auto" sx={{ gap: '16px' }}>
                {(!isEditing || dirty) && (
                  <FormCancelButton
                    onClick={onCancelEdit || onCancel}
                    data-testid="medication-button-cancel-4n8p"
                  >
                    {isEditing ? (
                      <TranslatedText
                        stringId="general.action.cancelChanges"
                        fallback="Cancel changes"
                      />
                    ) : (
                      <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
                    )}
                  </FormCancelButton>
                )}
                <FormSubmitButton
                  color="primary"
                  onClick={async data => onFinalise({ data, isPrinting: false, submitForm, dirty })}
                  disabled={isFinalizingMedication}
                  showLoadingIndicator={isFinalizingMedication}
                  data-testid="medication-button-finalise-7x3d"
                >
                  {isEditing ? (
                    <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
                  ) : (
                    <TranslatedText stringId="general.action.finalise" fallback="Finalise" />
                  )}
                </FormSubmitButton>
              </Box>
            </ButtonRow>
          </StyledFormGrid>
        )}
      />
      {submittedMedication && (
        <PrintPrescriptionModal
          medication={submittedMedication}
          patientWeight={showPatientWeight ? patientWeight : undefined}
          open={printModalOpen}
          onClose={() => {
            if (awaitingPrint) {
              onSaved();
            }
            setAwaitingPrint(false);
            setPrintModalOpen(false);
          }}
        />
      )}
      {idealTimesErrorOpen && (
        <Dialog
          isVisible
          onClose={() => setIdealTimesErrorOpen(false)}
          headerTitle={
            <TranslatedText
              stringId="medication.medicationAdministrationSchedule.discrepancyError.title"
              fallback="Administration times discrepancy"
            />
          }
          disableDevWarning
          contentText={
            <>
              <FieldContent pt={3} pb={4}>
                <TranslatedText
                  stringId="medication.medicationAdministrationSchedule.discrepancyError.content"
                  fallback="There are less administration times than expected for the selected frequency. Please resolve this issue before finalising the prescription."
                />
              </FieldContent>
              <Box pb={2.5} mx={-4} borderTop={`1px solid ${Colors.outline}`} />
            </>
          }
          okText={
            <TranslatedText
              stringId="medication.medicationAdministrationSchedule.discrepancyError.backToPrescription"
              fallback="Back to prescription"
            />
          }
        />
      )}
    </>
  );
};
