import React, { Fragment, ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { compose } from 'redux';
import { useSelector } from 'react-redux';
import { Formik } from 'formik';
import { ScrollView } from 'react-native-gesture-handler';
import * as Yup from 'yup';

import { Field } from '/components/Forms/FormField';
import { ColumnView, FullView, RowView, StyledText, StyledView } from '/styled/common';
import { TextField } from '/components/TextField/TextField';
import { SubmitButton } from '/components/Forms/SubmitButton';
import { theme } from '/styled/theme';
import { KeyboardAvoidingView, StyleSheet } from 'react-native';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { useBackend, useBackendEffect } from '~/ui/hooks';
import { withPatient } from '~/ui/containers/Patient';
import { Routes } from '~/ui/helpers/routes';
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
import { ReferenceDataType } from '~/types';
import { Suggester } from '~/ui/helpers/suggester';
import { ReferenceData } from '~/models/ReferenceData';
import { NumberField } from '~/ui/components/NumberField';
import { authUserSelector } from '~/ui/helpers/selectors';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { DateField } from '~/ui/components/DateField/DateField';
import { Dropdown } from '~/ui/components/Dropdown';
import { FrequencySearchField } from '~/ui/components/FrequencySearchField/FrequencySearchField';
import { Checkbox } from '~/ui/components/Checkbox';
import {
  DRUG_UNIT_VALUES,
  DRUG_ROUTE_VALUES,
  MEDICATION_DURATION_UNITS_LABELS,
  ADMINISTRATION_FREQUENCIES,
  DRUG_ROUTE_LABELS,
  DRUG_UNIT_LABELS,
} from '~/constants/medications';
import { TranslatedReferenceData } from '~/ui/components/Translations/TranslatedReferenceData';
import { PatientAllergy } from '~/models/PatientAllergy';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { readConfig } from '~/services/config';
import { Button } from '~/ui/components/Button';
import { useSettings } from '~/ui/contexts/SettingsContext';
import { add } from 'date-fns';
import { Prescription } from '~/models/Prescription';
import { useAuth } from '~/ui/contexts/AuthContext';

const styles = StyleSheet.create({
  KeyboardAvoidingViewStyles: { flex: 1 },
  KeyboardAvoidingViewContainer: {
    flexGrow: 1,
    paddingBottom: 150,
  },
  ScrollView: { flex: 1 },
  medicationContainer: {
    marginTop: screenPercentageToDP(1.12, Orientation.Height),
  },
  variableDoseContainer: {
    marginTop: screenPercentageToDP(2.24, Orientation.Height),
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.BOX_OUTLINE,
  },
});

export const DumbPrescribeMedicationScreen = ({ selectedPatient, navigation }): ReactElement => {
  const { models } = useBackend();
  const { ability } = useAuth();
  const user = useSelector(authUserSelector);
  const [patientAllergies, setPatientAllergies] = useState<PatientAllergy[]>([]);
  const { getTranslation, getEnumTranslation } = useTranslation();
  const { getSetting } = useSettings();
  const frequenciesAdministrationIdealTimes = getSetting('medications.defaultAdministrationTimes');

  const navigateToHistory = useCallback(() => {
    navigation.navigate(Routes.HomeStack.HistoryVitalsStack.Index);
  }, []);

  const [patientFacility] = useBackendEffect(
    async ({ models: m }) =>
      m.PatientFacility.findOne({
        where: {
          patient: { id: selectedPatient.id },
          facility: { id: await readConfig('facilityId', '') },
        },
      }),
    [],
  );
  const isMarkedForSync = Boolean(patientFacility);

  useEffect(() => {
    const fetchPatientAllergies = async () => {
      try {
        const allergies = await models.PatientAllergy.find({
          where: { patient: { id: selectedPatient.id } },
          relations: ['allergy'],
        });
        setPatientAllergies(allergies);
      } catch (error) {
        console.error('Error fetching patient allergies:', error);
        setPatientAllergies([]);
      }
    };

    if (selectedPatient?.id) {
      fetchPatientAllergies();
    }
  }, [selectedPatient?.id, models.PatientAllergy]);

  const onPrescribeMedication = useCallback(async (values): Promise<any> => {
    const encounter = await models.Encounter.getOrCreateActiveEncounter(
      selectedPatient.id,
      user.id,
    );

    const idealTimes =
      values.frequency === ADMINISTRATION_FREQUENCIES.IMMEDIATELY ||
      values.frequency === ADMINISTRATION_FREQUENCIES.AS_DIRECTED
        ? ''
        : frequenciesAdministrationIdealTimes[values.frequency]?.join(',') || '';
    const data = {
      ...values,
      doseAmount: values.doseAmount || null,
      durationValue: values.durationValue || null,
      durationUnit: values.durationUnit || null,
      idealTimes,
      prescriber: values.prescriberId,
      medication: values.medicationId,
    };

    if (values.durationValue && values.durationUnit) {
      data.endDate = add(new Date(values.startDate), {
        [values.durationUnit]: values.durationValue,
      }).toISOString();
    }

    const prescription = (await models.Prescription.createAndSaveOne({
      ...data,
    })) as Prescription;

    await models.EncounterPrescription.createAndSaveOne({
      encounter,
      prescription,
    });

    await models.MedicationAdministrationRecord.generateMedicationAdministrationRecords(
      prescription,
    );

    navigateToHistory();
  }, []);

  const canCreateSensitiveMedication = ability.can('create', 'SensitiveMedication');
  const medicationSuggester = useMemo(
    () =>
      new Suggester({
        model: ReferenceData,
        options: {
          column: 'name',
          where: {
            type: ReferenceDataType.Drug,
          },
          relations: ['referenceDrug'],
        },
        formatter: (record: any) => ({
          label: record.entity_display_label,
          value: record.entity_id,
          ...record,
        }),
        filter: (data: any) => {
          const isSensitive = data.referenceDrug_isSensitive;
          return !isSensitive || canCreateSensitiveMedication;
        },
      }),
    [canCreateSensitiveMedication],
  );

  const practitionerSuggester = useMemo(
    () =>
      new Suggester({
        model: models.User,
        options: {
          column: 'displayName',
          where: {},
        },
      }),
    [models.User],
  );

  // Convert constants to dropdown options
  const unitOptions = Object.entries(DRUG_UNIT_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
  const routeOptions = Object.entries(DRUG_ROUTE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const durationUnitOptions = Object.keys(MEDICATION_DURATION_UNITS_LABELS).map(value => ({
    value,
    label: getEnumTranslation(MEDICATION_DURATION_UNITS_LABELS, value),
  }));

  const getInitialValues = () => ({
    date: new Date(),
    startDate: new Date(),
    prescriberId: user.id,
    isVariableDose: false,
    isOngoing: false,
  });

  const validationSchema = Yup.object().shape({
    medicationId: Yup.string().required(getTranslation('validation.required.inline', '*Required')),
    doseAmount: Yup.number()
      .positive()
      .translatedLabel(
        <TranslatedText stringId="medication.doseAmount.label" fallback="Dose amount" />,
      )
      .when('isVariableDose', {
        is: true,
        then: schema => schema.optional(),
        otherwise: schema =>
          schema.required(getTranslation('validation.required.inline', '*Required')),
      }),
    units: Yup.string()
      .required(getTranslation('validation.required.inline', '*Required'))
      .oneOf(DRUG_UNIT_VALUES),
    frequency: Yup.string().required(getTranslation('validation.required.inline', '*Required')),
    route: Yup.string()
      .required(getTranslation('validation.required.inline', '*Required'))
      .oneOf(DRUG_ROUTE_VALUES),
    date: Yup.date().required(getTranslation('validation.required.inline', '*Required')),
    startDate: Yup.date().required(getTranslation('validation.required.inline', '*Required')),
    durationValue: Yup.number()
      .positive()
      .translatedLabel(<TranslatedText stringId="medication.duration.label" fallback="Duration" />),
    durationUnit: Yup.string().when('durationValue', (durationValue, schema) =>
      durationValue
        ? schema.required(getTranslation('validation.required.inline', '*Required'))
        : schema.optional(),
    ),
    prescriberId: Yup.string().required(getTranslation('validation.required.inline', '*Required')),
  });

  return (
    <FullView background={theme.colors.BACKGROUND_GREY}>
      <Formik
        onSubmit={onPrescribeMedication}
        validationSchema={validationSchema}
        initialValues={getInitialValues()}
      >
        {({ values, setValues }): ReactElement => (
          <FullView
            background={theme.colors.BACKGROUND_GREY}
            paddingRight={20}
            paddingLeft={20}
            paddingTop={20}
          >
            <KeyboardAvoidingView
              behavior="padding"
              style={styles.KeyboardAvoidingViewStyles}
              contentContainerStyle={styles.KeyboardAvoidingViewContainer}
            >
              <ScrollView
                style={styles.ScrollView}
                showsVerticalScrollIndicator={false}
                scrollToOverflowEnabled
                overScrollMode="always"
              >
                <RowView alignItems="flex-start">
                  <StyledText color={theme.colors.TEXT_MID}>
                    <TranslatedText stringId="medication.allergies.label" fallback="Allergies" />:{' '}
                  </StyledText>
                  {patientAllergies.length ? (
                    patientAllergies.map((allergy, index) => (
                      <Fragment key={allergy.id}>
                        <StyledText color={theme.colors.MAIN_SUPER_DARK} fontWeight={500}>
                          <TranslatedReferenceData
                            category={allergy.allergy.type}
                            value={allergy.allergy.name}
                            fallback={allergy.allergy.name}
                          />
                          {index < patientAllergies.length - 1 && ', '}
                        </StyledText>
                      </Fragment>
                    ))
                  ) : (
                    <ColumnView>
                      {isMarkedForSync ? (
                        <StyledText
                          color={theme.colors.MAIN_SUPER_DARK}
                          fontStyle="italic"
                          fontWeight={500}
                        >
                          <TranslatedText
                            stringId="medication.allergies.noneRecorded"
                            fallback="None recorded"
                          />
                        </StyledText>
                      ) : (
                        <>
                          <StyledText
                            color={theme.colors.MAIN_SUPER_DARK}
                            fontStyle="italic"
                            fontWeight={500}
                          >
                            <TranslatedText
                              stringId="medication.allergies.notMarkedForSync"
                              fallback="Patient record not marked for sync."
                            />
                          </StyledText>
                          <StyledText
                            color={theme.colors.MAIN_SUPER_DARK}
                            fontStyle="italic"
                            fontWeight={500}
                          >
                            <TranslatedText
                              stringId="medication.allergies.unknownAllergies"
                              fallback="Allergies unknown."
                            />
                          </StyledText>
                        </>
                      )}
                    </ColumnView>
                  )}
                </RowView>

                <StyledView style={styles.medicationContainer}>
                  <Field
                    component={AutocompleteModalField}
                    placeholder={
                      <TranslatedText stringId="general.action.search" fallback="Search" />
                    }
                    navigation={navigation}
                    suggester={medicationSuggester}
                    name="medicationId"
                    label={
                      <TranslatedText
                        stringId="medication.medication.label"
                        fallback="Medication"
                      />
                    }
                    labelColor={theme.colors.TEXT_DARK}
                    showSearchIcon={false}
                    required
                    labelFontSize={14}
                    fieldFontSize={14}
                    onChange={(_, selectedItem) => {
                      setValues({
                        ...values,
                        route: selectedItem?.referenceDrug_route?.toLowerCase() || '',
                        units: selectedItem?.referenceDrug_units || '',
                        notes: selectedItem?.referenceDrug_notes || '',
                      });
                    }}
                  />
                </StyledView>

                <Field
                  component={Checkbox}
                  name="isOngoing"
                  text={
                    <TranslatedText
                      stringId="medication.isOngoing.label"
                      fallback="Ongoing medication"
                    />
                  }
                  onChange={value => {
                    if (value) {
                      setValues({ ...values, durationValue: '', durationUnit: '' });
                    }
                  }}
                  fieldFontSize={14}
                  fieldColor={theme.colors.TEXT_DARK}
                />

                <Field
                  component={Checkbox}
                  name="isPrn"
                  text={
                    <TranslatedText stringId="medication.isPrn.label" fallback="PRN medication" />
                  }
                  fieldFontSize={14}
                  fieldColor={theme.colors.TEXT_DARK}
                />

                <StyledView style={styles.divider} />

                <StyledView style={styles.variableDoseContainer}>
                  <Field
                    component={Checkbox}
                    name="isVariableDose"
                    text={
                      <TranslatedText
                        stringId="medication.variableDose.label"
                        fallback="Variable dose"
                      />
                    }
                    onChange={value => {
                      if (value) {
                        setValues({ ...values, doseAmount: '' });
                      }
                    }}
                    fieldFontSize={14}
                    fieldColor={theme.colors.TEXT_DARK}
                  />
                </StyledView>

                <Field
                  component={NumberField}
                  name="doseAmount"
                  label={
                    <TranslatedText stringId="medication.doseAmount.label" fallback="Dose amount" />
                  }
                  min={0}
                  required={!values.isVariableDose}
                  disabled={values.isVariableDose}
                  labelColor={theme.colors.TEXT_DARK}
                  labelFontSize={14}
                  fieldFontSize={14}
                />

                <Field
                  component={Dropdown}
                  name="units"
                  label={<TranslatedText stringId="medication.units.label" fallback="Units" />}
                  selectPlaceholderText={getTranslation('general.placeholder.select', 'Select')}
                  options={unitOptions}
                  required
                  labelColor={theme.colors.TEXT_DARK}
                  labelFontSize={14}
                  fieldFontSize={14}
                  value={values.units}
                  allowResetSingleValue
                />

                <Field
                  component={FrequencySearchField}
                  name="frequency"
                  label={
                    <TranslatedText stringId="medication.frequency.label" fallback="Frequency" />
                  }
                  required
                  onChange={value => {
                    if (value === ADMINISTRATION_FREQUENCIES.IMMEDIATELY) {
                      setValues({
                        ...values,
                        durationValue: '',
                        durationUnit: '',
                      });
                    }
                  }}
                  labelColor={theme.colors.TEXT_DARK}
                  labelFontSize={14}
                  fieldFontSize={14}
                />
                <Field
                  component={Dropdown}
                  name="route"
                  label={<TranslatedText stringId="medication.route.label" fallback="Route" />}
                  selectPlaceholderText={getTranslation('general.placeholder.select', 'Select')}
                  options={routeOptions}
                  required
                  labelColor={theme.colors.TEXT_DARK}
                  labelFontSize={14}
                  fieldFontSize={14}
                  allowResetSingleValue
                />

                <Field
                  component={DateField}
                  name="date"
                  label={
                    <TranslatedText stringId="medication.date.label" fallback="Prescription date" />
                  }
                  required
                  labelColor={theme.colors.TEXT_DARK}
                  labelFontSize={14}
                  fieldFontSize={14}
                />

                <Field
                  component={DateField}
                  name="startDate"
                  label={
                    <TranslatedText
                      stringId="medication.startDatetime.label"
                      fallback="Start date & time"
                    />
                  }
                  mode="datetime"
                  required
                  labelColor={theme.colors.TEXT_DARK}
                  labelFontSize={14}
                  fieldFontSize={14}
                />

                <StyledView flexDirection="row" justifyContent="space-between">
                  <StyledView flex={1} marginRight={10}>
                    <Field
                      component={NumberField}
                      name="durationValue"
                      label={
                        <TranslatedText stringId="medication.duration.label" fallback="Duration" />
                      }
                      min={0}
                      disabled={
                        values.frequency === ADMINISTRATION_FREQUENCIES.IMMEDIATELY ||
                        values.isOngoing
                      }
                      labelColor={theme.colors.TEXT_DARK}
                      labelFontSize={14}
                      fieldFontSize={14}
                    />
                  </StyledView>
                  <StyledView flex={1}>
                    <Field
                      component={Dropdown}
                      name="durationUnit"
                      label={<StyledText fontSize={14}></StyledText>}
                      options={durationUnitOptions}
                      disabled={
                        values.frequency === ADMINISTRATION_FREQUENCIES.IMMEDIATELY ||
                        values.isOngoing
                      }
                      selectPlaceholderText={getTranslation('general.placeholder.select', 'Select')}
                      labelColor={theme.colors.TEXT_DARK}
                      labelFontSize={14}
                      fieldFontSize={14}
                    />
                  </StyledView>
                </StyledView>

                <Field
                  component={AutocompleteModalField}
                  name="prescriberId"
                  label={
                    <TranslatedText stringId="medication.prescriber.label" fallback="Prescriber" />
                  }
                  navigation={navigation}
                  suggester={practitionerSuggester}
                  required
                  labelColor={theme.colors.TEXT_DARK}
                  labelFontSize={14}
                  fieldFontSize={14}
                />

                <Field
                  component={TextField}
                  name="indication"
                  label={
                    <TranslatedText stringId="medication.indication.label" fallback="Indication" />
                  }
                  labelColor={theme.colors.TEXT_DARK}
                  labelFontSize={14}
                  fieldFontSize={14}
                />

                <Field
                  component={TextField}
                  name="notes"
                  label={<TranslatedText stringId="general.notes.label" fallback="Notes" />}
                  labelColor={theme.colors.TEXT_DARK}
                  labelFontSize={14}
                  fieldFontSize={14}
                />

                <SubmitButton
                  marginTop={screenPercentageToDP(1.22, Orientation.Height)}
                  marginBottom={screenPercentageToDP(1.22, Orientation.Height)}
                  backgroundColor={theme.colors.PRIMARY_MAIN}
                  buttonText={
                    <TranslatedText stringId="general.action.finalise" fallback="Finalise" />
                  }
                />
                <Button
                  marginBottom={screenPercentageToDP(1.22, Orientation.Height)}
                  borderColor={theme.colors.PRIMARY_MAIN}
                  backgroundColor={theme.colors.WHITE}
                  textColor={theme.colors.PRIMARY_MAIN}
                  outline
                  onPress={() => {
                    navigation.goBack();
                  }}
                  buttonText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
                />
              </ScrollView>
            </KeyboardAvoidingView>
          </FullView>
        )}
      </Formik>
    </FullView>
  );
};

export const PrescribeMedicationScreen = compose(withPatient)(DumbPrescribeMedicationScreen);
