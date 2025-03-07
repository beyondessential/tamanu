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
} from '@tamanu/constants';
import {
  findAdministrationTimeSlotFromIdealTime,
  getDateFromTimeString,
} from '@tamanu/shared/utils/medication';
import { formatTime, formatShort } from '@tamanu/utils/dateTime';
import { addDays, format } from 'date-fns';
import { foreignKey } from '../utils/validation';
import { PrintPrescriptionModal } from '../components/PatientPrinting';
import {
  AutocompleteField,
  BodyText,
  CheckField,
  CheckInput,
  DateField,
  DateTimeField,
  Dialog,
  Field,
  Form,
  FormCancelButton,
  FormGrid,
  FormSubmitButton,
  NumberField,
  SelectField,
  TextField,
  TimeInput,
  TranslatedSelectField,
} from '../components';
import { Colors, FORM_TYPES, MAX_AGE_TO_RECORD_WEIGHT } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useTranslation } from '../contexts/Translation';
import { getAgeDurationFromDate } from '@tamanu/utils/date';
import { useQuery } from '@tanstack/react-query';
import { useApi, useSuggester } from '../api';
import { useSelector } from 'react-redux';
import { getReferenceDataStringId } from '../components/Translation/index.js';
import { FrequencySearchField } from '../components/Medication/FrequencySearchInput.jsx';
import { useAuth } from '../contexts/Auth.js';
import { useSettings } from '../contexts/Settings.jsx';
import { ChevronIcon } from '../components/Icons/ChevronIcon.jsx';
import { useFormikContext } from 'formik';
import { ConditionalTooltip } from '../components/Tooltip.jsx';
import { capitalize } from 'lodash';
import { preventInvalidNumber, validateDecimalPlaces } from '../utils/utils.jsx';

const validationSchema = yup.object().shape({
  medicationId: foreignKey(
    <TranslatedText stringId="validation.required.inline" fallback="*Required" />,
  ),
  isOngoing: yup.boolean().optional(),
  isPrn: yup.boolean().optional(),
  doseAmount: yup
    .number()
    .positive()
    .when('isVariableDose', {
      is: false,
      then: schema =>
        schema.required(
          <TranslatedText stringId="validation.required.inline" fallback="*Required" />,
        ),
    }),
  units: foreignKey(
    <TranslatedText stringId="validation.required.inline" fallback="*Required" />,
  ).oneOf(DRUG_UNIT_VALUES),
  frequency: foreignKey(
    <TranslatedText stringId="validation.required.inline" fallback="*Required" />,
  ),
  timeSlots: yup.array().of(
    yup.object().shape({
      index: yup.number(),
      value: foreignKey()
        .translatedLabel(
          <TranslatedText
            stringId="medication.medicationAdministrationSchedule.scheduleTime"
            fallback="Schedule time"
          />,
        )
        .test((value, context) => {
          const selectedDate = getDateFromTimeString(value).getTime();
          const startDate = getDateFromTimeString(context.parent.timeSlot.startTime).getTime();
          const endDate = getDateFromTimeString(context.parent.timeSlot.endTime).getTime();

          if (selectedDate >= startDate && selectedDate < endDate) {
            return true;
          }
          return false;
        }),
    }),
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
  prescriberId: foreignKey(
    <TranslatedText stringId="validation.required.inline" fallback="*Required" />,
  ),
  quantity: yup.number().integer(),
  patientWeight: yup.number().positive(),
});

const CheckboxGroup = styled.div`
  .MuiTypography-body1 {
    font-size: 14px;
  }
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 1.2rem;
  border-bottom: 1px solid ${Colors.outline};
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

const FieldContent = styled.div`
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
`;

const StyledFormGrid = styled(FormGrid)`
  .MuiFormHelperText-root.Mui-error {
    font-size: 12px;
  }
`;

const formatTimeSlot = time => {
  return formatTime(time)
    .replaceAll(' ', '')
    .toLowerCase();
};

const MedicationAdministrationForm = () => {
  const { getSetting } = useSettings();
  const frequenciesAdministrationIdealTimes = getSetting(
    'medications.defaultAdministrationTimes',
  );

  const { values, setValues, errors } = useFormikContext();
  const selectedTimeSlots = values.timeSlots;

  const firstAdministrationTime = useMemo(() => {
    if (!values.startDate) return '';
    if (!values.frequency) return '';
    if (!selectedTimeSlots.length) return '';

    const startDate = new Date(values.startDate);

    const firstStartTime = selectedTimeSlots
      .map(s => getDateFromTimeString(s.value, startDate).getTime())
      .concat(
        selectedTimeSlots.map(s => getDateFromTimeString(s.value, addDays(startDate, 1)).getTime()),
      )
      .filter(s => s > startDate.getTime())
      .sort((a, b) => a - b)[0];

    const firstSlot = findAdministrationTimeSlotFromIdealTime(
      format(new Date(firstStartTime), 'HH:mm'),
    ).timeSlot;

    return `${formatTimeSlot(getDateFromTimeString(firstSlot.startTime))} - ${formatTimeSlot(
      getDateFromTimeString(firstSlot.endTime),
    )} ${formatShort(new Date(firstStartTime))}`;
  }, [values.startDate, selectedTimeSlots]);

  useEffect(() => {
    if (values.frequency) {
      handleResetToDefault();
    }
  }, [values.frequency]);

  const handleResetToDefault = () => {
    if (
      values.frequency === ADMINISTRATION_FREQUENCIES.AS_DIRECTED ||
      values.frequency === ADMINISTRATION_FREQUENCIES.IMMEDIATELY
    )
      return setValues({ ...values, timeSlots: [] });

    const defaultIdealTimes = frequenciesAdministrationIdealTimes?.[values.frequency];
    setValues({
      ...values,
      timeSlots: defaultIdealTimes?.map(findAdministrationTimeSlotFromIdealTime),
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

  const handleChangeTime = (value, index) => {
    setValues({
      ...values,
      timeSlots: selectedTimeSlots.map(s =>
        s.index === index ? { ...s, value: format(new Date(value), 'HH:mm') } : s,
      ),
    });
  };

  const getDefaultIdealTimeFromTimeSlot = (slot, index) => {
    if (values.frequency === ADMINISTRATION_FREQUENCIES.IMMEDIATELY) {
      return slot.startTime;
    }
    const defaultIdealTimes = frequenciesAdministrationIdealTimes?.[values.frequency];
    const correspondingSlot = defaultIdealTimes
      ?.map(findAdministrationTimeSlotFromIdealTime)
      .find(it => it.index === index);
    return correspondingSlot?.value || slot.startTime;
  };

  return (
    <StyledAccordion defaultExpanded={values.frequency !== ADMINISTRATION_FREQUENCIES.AS_DIRECTED}>
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
        <FieldContent>
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
          <ResetToDefaultButton onClick={handleResetToDefault}>
            <TranslatedText stringId="general.action.resetToDefault" fallback="Reset to default" />
          </ResetToDefaultButton>
        </Box>
        <Box display="flex" flexDirection="column" mt={2} style={{ gap: 12 }}>
          {MEDICATION_ADMINISTRATION_TIME_SLOTS.map((slot, index) => {
            const startTime = getDateFromTimeString(slot.startTime);
            const endTime = getDateFromTimeString(slot.endTime);

            const selectedTimeSlot = selectedTimeSlots.find(s => s.index === index);
            const checked = !!selectedTimeSlot;
            const isDisabled =
              (!checked &&
                (frequenciesAdministrationIdealTimes?.[values.frequency]?.length ===
                  selectedTimeSlots?.length ||
                  (values.frequency === ADMINISTRATION_FREQUENCIES.IMMEDIATELY &&
                    selectedTimeSlots.length === 1))) ||
              values.frequency === ADMINISTRATION_FREQUENCIES.AS_DIRECTED;
            const selectedTime = selectedTimeSlot
              ? getDateFromTimeString(selectedTimeSlot.value)
              : null;
            const error = errors?.timeSlots?.find((e, i) => index === values.timeSlots[i]?.index);

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
                  <ConditionalTooltip
                    visible={isDisabled}
                    title={
                      <TranslatedText
                        stringId="medication.medicationAdministrationSchedule.disabledTooltip"
                        fallback="Only :slots administration times can be selected based on the frequency. Please deselect a time in order to select another."
                        replacements={{
                          slots:
                            values.frequency === ADMINISTRATION_FREQUENCIES.IMMEDIATELY
                              ? 1
                              : frequenciesAdministrationIdealTimes?.[values.frequency]?.length ||
                                '0',
                        }}
                      />
                    }
                    PopperProps={{
                      style: { maxWidth: '200px' },
                    }}
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
                        {...(isDisabled && { icon: <StyledIcon className="far fa-square" /> })}
                      />
                    </Box>
                  </ConditionalTooltip>
                  <Box ml={1} width="187px">
                    <TimeInput
                      disabled={isDisabled || !checked}
                      value={selectedTime}
                      onChange={e => handleChangeTime(e.target.value, index)}
                      error={!!error}
                      helperText={error?.value}
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

export const MedicationForm = ({ encounterId, onCancel, onSaved }) => {
  const api = useApi();
  const { currentUser } = useAuth();
  const { getTranslation } = useTranslation();
  const { getSetting } = useSettings();
  const frequenciesAdministrationIdealTimes = getSetting(
    'medications.defaultAdministrationTimes',
  );

  const weightUnit = getTranslation('general.localisedField.weightUnit.label', 'kg');

  const patient = useSelector(state => state.patient);
  const age = getAgeDurationFromDate(patient.dateOfBirth).years;
  const showPatientWeight = age < MAX_AGE_TO_RECORD_WEIGHT;

  const [submittedMedication, setSubmittedMedication] = useState(null);
  const [printModalOpen, setPrintModalOpen] = useState();
  const [awaitingPrint, setAwaitingPrint] = useState(false);
  const [patientWeight, setPatientWeight] = useState('');
  const [idealTimesErrorOpen, setIdealTimesErrorOpen] = useState(false);

  const practitionerSuggester = useSuggester('practitioner');
  const drugSuggester = useSuggester('drug', {
    formatter: ({ name, id, ...rest }) => ({ ...rest, label: name, value: id }),
  });

  const { data: allergies, isLoading: isLoadingAllergies } = useQuery(
    [`allergies`, patient?.id],
    () => api.get(`patient/${patient?.id}/allergies`),
    { enabled: !!patient?.id },
  );
  const allergiesList = allergies?.data
    ?.map(allergyDetail =>
      getTranslation(
        getReferenceDataStringId(allergyDetail?.allergy.id, allergyDetail?.allergy.type),
        allergyDetail?.allergy.name,
      ),
    )
    .join(', ');

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
    if (
      data.frequency !== ADMINISTRATION_FREQUENCIES.AS_DIRECTED &&
      data.timeSlots.length < defaultIdealTimes?.length
    ) {
      setIdealTimesErrorOpen(true);
      return Promise.reject({ message: 'Administration times discrepancy error' });
    }

    const idealTimes = data.timeSlots.map(slot => slot.value);
    const medicationSubmission = await api.post('medication', {
      ...data,
      doseAmount: data.doseAmount || null,
      idealTimes,
      encounterId,
    });
    // The return from the post doesn't include the joined tables like medication and prescriber
    const newMedication = await api.get(`medication/${medicationSubmission.id}`);

    setSubmittedMedication(newMedication);
  };

  return (
    <>
      <Form
        suppressErrorDialog
        onSubmit={onSubmit}
        onSuccess={() => {
          if (!awaitingPrint) {
            onSaved();
          }
        }}
        initialValues={{
          date: new Date(),
          prescriberId: currentUser.id,
          timeSlots: [],
        }}
        formType={FORM_TYPES.CREATE_FORM}
        validationSchema={validationSchema}
        render={({ submitForm, setValues, values }) => (
          <StyledFormGrid>
            <div style={{ gridColumn: '1 / -1' }}>
              <TranslatedText stringId="medication.allergies.title" fallback="Allergies" />:{' '}
              <span style={{ fontWeight: 500 }}>
                {!isLoadingAllergies &&
                  (allergiesList || (
                    <TranslatedText
                      stringId="medication.allergies.noRecord"
                      fallback="None recorded"
                    />
                  ))}
              </span>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field
                name="medicationId"
                label={
                  <TranslatedText stringId="medication.medication.label" fallback="Medication" />
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
                }}
              />
            </div>
            <CheckboxGroup>
              <Field
                name="isOngoing"
                label={
                  <TranslatedText
                    stringId="medication.isOngoing.label"
                    fallback="Ongoing Medication"
                  />
                }
                component={CheckField}
              />
              <Field
                name="isPrn"
                label={
                  <TranslatedText stringId="medication.isPrn.label" fallback="PRN Medication" />
                }
                component={CheckField}
              />
            </CheckboxGroup>
            <div style={{ gridColumn: '1/-1', marginBottom: '-12px' }}>
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
                component={CheckField}
                onChange={(_, value) => {
                  if (value) {
                    setValues({ ...values, doseAmount: '' });
                  }
                }}
              />
            </div>
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
            />
            <Field
              name="units"
              label={<TranslatedText stringId="medication.units.label" fallback="Units" />}
              component={TranslatedSelectField}
              enumValues={DRUG_UNIT_LABELS}
              required
            />
            <Field name="frequency" component={FrequencySearchField} required />
            <Field
              name="route"
              label={<TranslatedText stringId="medication.route.label" fallback="Route" />}
              component={TranslatedSelectField}
              enumValues={DRUG_ROUTE_LABELS}
              required
            />
            <Field
              name="date"
              label={
                <TranslatedText stringId="medication.date.label" fallback="Prescription date" />
              }
              saveDateAsString
              component={DateField}
              required
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
            />
            <FormGrid nested>
              <Field
                name="durationValue"
                label={<TranslatedText stringId="medication.duration.label" fallback="Duration" />}
                component={NumberField}
                min={0}
                onInput={preventInvalidNumber}
              />
              <Field
                name="durationUnit"
                label={<Box sx={{ opacity: 0 }}>.</Box>}
                component={SelectField}
                options={Object.entries(MEDICATION_DURATION_UNITS_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
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
            />
            <Field
              name="indication"
              label={
                <TranslatedText stringId="medication.indication.label" fallback="Indication" />
              }
              component={TextField}
            />
            <div style={{ gridColumn: '1/-1' }}>
              <Field
                name="isPhoneOrder"
                label={
                  <BodyText>
                    <TranslatedText stringId="medication.phoneOrder.label" fallback="Phone Order" />
                  </BodyText>
                }
                component={CheckField}
              />
            </div>
            <Field
              name="notes"
              label={<TranslatedText stringId="general.notes.label" fallback="Notes" />}
              component={TextField}
              style={{ gridColumn: '1/-1' }}
            />
            <div style={{ gridColumn: '1 / -1' }}>
              <Divider />
            </div>
            {values.frequency ? (
              <MedicationAdministrationForm />
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
            <div style={{ gridColumn: '1 / -1' }}>
              <Divider />
            </div>
            <Field
              name="quantity"
              label={
                <TranslatedText
                  stringId="medication.dischargeQuantity.label"
                  fallback="Discharge quantity"
                />
              }
              min={0}
              component={NumberField}
              onInput={preventInvalidNumber}
            />
            {showPatientWeight && (
              <>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Divider />
                </div>
                <Field
                  name="patientWeight"
                  label={
                    <TranslatedText
                      stringId="medication.patientWeight.label"
                      fallback="Patient weight if printing (:unit)"
                      replacements={{ unit: weightUnit }}
                    />
                  }
                  onChange={e => setPatientWeight(e.target.value)}
                  component={TextField}
                  placeholder={getTranslation('medication.patientWeight.placeholder', 'e.g 2.4')}
                  type="number"
                />
              </>
            )}
            <div style={{ gridColumn: '1 / -1', margin: '0 -32px' }}>
              <Divider />
            </div>
            <ButtonRow>
              <FormSubmitButton
                color="primary"
                onClick={data => {
                  setAwaitingPrint(true);
                  submitForm(data);
                }}
                variant="outlined"
                startIcon={<PrintIcon />}
              >
                <TranslatedText
                  stringId="medication.action.finaliseAndPrint"
                  fallback="Finalise & Print"
                />
              </FormSubmitButton>
              <Box display="flex" sx={{ gap: '16px' }}>
                <FormCancelButton onClick={onCancel}>
                  <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
                </FormCancelButton>
                <FormSubmitButton
                  color="primary"
                  onClick={data => {
                    setAwaitingPrint(false);
                    submitForm(data);
                  }}
                >
                  <TranslatedText stringId="general.action.finalise" fallback="Finalise" />
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
            <Box pt={2} pb={4}>
              <TranslatedText
                stringId="medication.medicationAdministrationSchedule.discrepancyError.content"
                fallback="There are less administration times than expected for the selected frequency. Please resolve this issue before finalising the prescription."
              />
            </Box>
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
