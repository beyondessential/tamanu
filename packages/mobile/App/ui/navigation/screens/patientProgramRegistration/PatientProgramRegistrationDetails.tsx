import React from 'react';
import { sortBy, groupBy } from 'lodash';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PROGRAM_REGISTRY_CONDITION_CATEGORIES } from '~/constants/programRegistries';
import {
  TranslatedReferenceData,
  getReferenceDataStringId,
} from '~/ui/components/Translations/TranslatedReferenceData';
import { TranslatedText, TranslatedTextElement } from '~/ui/components/Translations/TranslatedText';

import { DateFormats } from '~/ui/helpers/constants';
import { useBackendEffect } from '~/ui/hooks';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { useDateFormatter } from '~/ui/hooks/useDateFormatter';
import { theme } from '~/ui/styled/theme';
import { useTranslation } from '~/ui/contexts/TranslationContext';

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: theme.colors.WHITE,
  },
  divider: {
    borderBottomWidth: 1,
    borderColor: theme.colors.BOX_OUTLINE,
  },
  row: {
    marginHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: theme.colors.BOX_OUTLINE,
  },
  labelContainer: {
    width: '40%',
  },
  valueContainer: {
    width: '60%',
  },
  label: {
    fontSize: 14,
    color: theme.colors.TEXT_MID,
    fontWeight: '400',
  },
  value: {
    fontSize: 14,
    color: theme.colors.TEXT_SUPER_DARK,
    fontWeight: '500',
  },
  conditionValue: {
    fontSize: 14,
    color: theme.colors.TEXT_SUPER_DARK,
    fontWeight: '500',
    marginBottom: 10,
  },
});

const DataRow = ({
  label,
  value,
}: {
  label: TranslatedTextElement;
  value: TranslatedTextElement;
}) => (
  <View style={styles.row}>
    <View style={styles.labelContainer}>
      <Text style={styles.label}>{label}</Text>
    </View>
    <View style={styles.valueContainer}>
      <Text style={styles.value}>{value}</Text>
    </View>
  </View>
);

const HorizontalLine = ({ marginTop = 0, marginBottom = 0 }) => (
  <View style={[styles.divider, { marginTop, marginBottom }]} />
);

const TranslatedCondition = ({ condition }) => (
  <Text style={styles.conditionValue}>
    <TranslatedReferenceData
      fallback={condition.programRegistryCondition.name}
      value={condition.programRegistryCondition.id}
      category="programRegistryCondition"
    />
    {` `}(
    <TranslatedReferenceData
      fallback={condition.programRegistryConditionCategory.name}
      value={condition.programRegistryConditionCategory.id}
      category="programRegistryConditionCategory"
    />
    )
  </Text>
);

const PatientProgramRegistrationConditionsDetailsRow = ({ conditions }) => {
  const { getTranslation } = useTranslation();

  const initConditions = Array.isArray(conditions) ? conditions : [];
  const filteredConditions = initConditions.filter(
    ({ programRegistryConditionCategory }) =>
      programRegistryConditionCategory.code !== PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR,
  );

  const sortedConditions = sortBy(filteredConditions, ({ programRegistryCondition }) => {
    const stringId = getReferenceDataStringId(
      programRegistryCondition.id,
      'programRegistryCondition',
    );
    return getTranslation(stringId, programRegistryCondition.name);
  });

  const groupedConditions = groupBy(sortedConditions, ({ programRegistryConditionCategory }) =>
    [
      PROGRAM_REGISTRY_CONDITION_CATEGORIES.DISPROVEN,
      PROGRAM_REGISTRY_CONDITION_CATEGORIES.RESOLVED,
    ].includes(programRegistryConditionCategory.code)
      ? 'closed'
      : 'open',
  );
  const needsDivider = groupedConditions.closed && groupedConditions.open;

  return (
    <View style={styles.row}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          <TranslatedText stringId="programRegistry.conditions.label" fallback="Conditions" />
        </Text>
      </View>
      <View style={styles.valueContainer}>
        {initConditions.length === 0 && <Text style={styles.value}>—</Text>}
        {groupedConditions.open &&
          groupedConditions.open.map((condition, i) => (
            <TranslatedCondition key={`open-condition-${i}`} condition={condition} />
          ))}
        {needsDivider && <HorizontalLine marginBottom={10} />}
        {groupedConditions.closed &&
          groupedConditions.closed.map((condition, i) => (
            <TranslatedCondition key={`closed-condition-${i}`} condition={condition} />
          ))}
      </View>
    </View>
  );
};

export const PatientProgramRegistrationDetails = ({ route }) => {
  const { formatStringDate } = useDateFormatter();
  const preloadedRegistration = route.params.patientProgramRegistration;
  const patientProgramRegistrationId =
    route.params.patientProgramRegistrationId ?? preloadedRegistration?.id;

  const [fetchedRegistration, registrationError, isRegistrationLoading] = useBackendEffect(
    async ({ models }) => {
      if (preloadedRegistration) {
        return preloadedRegistration;
      }
      return models.PatientProgramRegistration.getFullPprById(patientProgramRegistrationId);
    },
    [patientProgramRegistrationId, preloadedRegistration],
  );
  const patientProgramRegistration = preloadedRegistration ?? fetchedRegistration;

  const [pprCondition, conditionsError, isConditionsLoading] = useBackendEffect(
    async ({ models }) =>
      models.PatientProgramRegistrationCondition.findForRegistration(patientProgramRegistrationId),
    [patientProgramRegistrationId],
  );

  if ((!preloadedRegistration && isRegistrationLoading) || isConditionsLoading) {
    return <LoadingScreen />;
  }
  if (registrationError) return <ErrorScreen error={registrationError} />;
  if (conditionsError) return <ErrorScreen error={conditionsError} />;

  return (
    <ScrollView style={styles.scroll}>
      <HorizontalLine />
      <DataRow
        label={
          <TranslatedText
            stringId="programRegistry.registrationDate.label"
            fallback="Date of registration"
          />
        }
        value={formatStringDate(patientProgramRegistration.date, DateFormats.DDMMYY)}
      />
      <DataRow
        label={
          <TranslatedText stringId="programRegistry.registeredBy.label" fallback="Registered by" />
        }
        value={patientProgramRegistration?.clinician?.displayName}
      />
      <DataRow
        label={
          <TranslatedText
            stringId="programRegistry.registeringFacility.label"
            fallback="Registering facility"
          />
        }
        value={
          <TranslatedReferenceData
            fallback={patientProgramRegistration.registeringFacility?.name}
            value={patientProgramRegistration.registeringFacility?.id}
            category="facility"
          />
        }
      />
      <DataRow
        label={<TranslatedText stringId="programRegistry.clinicalStatus.label" fallback="Status" />}
        value={
          <TranslatedReferenceData
            fallback={patientProgramRegistration.clinicalStatus?.name}
            value={patientProgramRegistration.clinicalStatus?.id}
            category="programRegistryClinicalStatus"
            placeholder="—"
          />
        }
      />
      <PatientProgramRegistrationConditionsDetailsRow conditions={pprCondition} />
    </ScrollView>
  );
};
