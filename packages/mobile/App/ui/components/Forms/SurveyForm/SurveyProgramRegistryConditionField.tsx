import { useFormikContext } from 'formik';
import { useQuery } from '@tanstack/react-query';
import React, { createContext, type ReactElement, useContext, useMemo } from 'react';

import type { ISurveyScreenComponent } from '~/types';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { FieldTypes } from '~/ui/helpers/fields';
import { getProgramRegistryConditionOptions } from '~/ui/helpers/programRegistryConditions';
import { registrationKeys } from '~/ui/hooks/queries/queryKeys';
import {
  getVisibleConditionQuestions,
  isProgramRegistryConditionAnswerable,
  isProgramRegistryConditionRequired,
  parseProgramRegistryConditionAnswer,
  type ProgramRegistryConditionOptions,
} from '~/ui/helpers/programRegistryConditionRules';
import { StyledText, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { Dropdown } from '../../Dropdown';
import { getReferenceDataStringId } from '../../Translations/TranslatedReferenceData';
import { TranslatedText } from '../../Translations/TranslatedText';

export const ProgramRegistryConditionContext = createContext<{
  options?: ProgramRegistryConditionOptions;
  components: ISurveyScreenComponent[];
} | null>(null);

export const useProgramRegistryConditionForm = (
  components: ISurveyScreenComponent[],
  patientId: string,
) => {
  const surveyId = components.find(
    component => component.dataElement.type === FieldTypes.PROGRAM_REGISTRY_CONDITION,
  )?.surveyId;
  const { data: options } = useQuery({
    queryKey: registrationKeys.formConditionOptions(surveyId, patientId),
    queryFn: () => getProgramRegistryConditionOptions(surveyId, patientId),
    enabled: Boolean(surveyId),
  });
  const conditionContext = useMemo(() => ({ options, components }), [options, components]);
  return {
    conditionContext,
    isConditionRequired: isProgramRegistryConditionRequired(options, components),
  };
};

interface SurveyProgramRegistryConditionFieldProps {
  name: string;
  value?: string | null;
  onChange: (value: string | null) => void;
  error?: string;
  disabled?: boolean;
}

export const SurveyProgramRegistryConditionField = ({
  name,
  value,
  onChange,
  error,
  disabled,
}: SurveyProgramRegistryConditionFieldProps): ReactElement => {
  const { getTranslation } = useTranslation();
  const { values } = useFormikContext<Record<string, any>>();
  const { options, components = [] } = useContext(ProgramRegistryConditionContext) ?? {};
  const answer = parseProgramRegistryConditionAnswer(value) ?? {
    conditionId: null,
    categoryId: null,
  };

  if (!options) return null;

  if (!isProgramRegistryConditionAnswerable(options, components)) {
    return (
      <StyledText color={theme.colors.TEXT_MID}>
        <TranslatedText
          stringId="program.question.programRegistryCondition.notRegistered"
          fallback="Patient is not registered in this program registry"
        />
      </StyledText>
    );
  }

  const conditionQuestions = getVisibleConditionQuestions(components, values);
  const conditionIdsChosenElsewhere = conditionQuestions
    .filter(question => question.dataElement.code !== name)
    .map(
      question =>
        parseProgramRegistryConditionAnswer(values[question.dataElement.code])?.conditionId,
    );
  const unavailableConditionIds = new Set([
    ...options.recordedConditionIds,
    ...conditionIdsChosenElsewhere,
  ]);
  unavailableConditionIds.delete(answer.conditionId);

  const isRequired =
    isProgramRegistryConditionRequired(options, components) &&
    conditionQuestions[0]?.dataElement.code === name;
  const isCategoryMissing = Boolean(answer.conditionId) && !answer.categoryId;
  const conditionOptions = options.conditions.filter(
    condition => !unavailableConditionIds.has(condition.id),
  );

  if (conditionOptions.length === 0) {
    return (
      <StyledText color={theme.colors.TEXT_MID}>
        <TranslatedText
          stringId="program.question.programRegistryCondition.allRecorded"
          fallback="All conditions in this registry are already recorded for this patient"
        />
      </StyledText>
    );
  }

  const setAnswer = (conditionId: string | null, categoryId: string | null) =>
    onChange(conditionId ? JSON.stringify({ conditionId, categoryId }) : null);

  return (
    <StyledView>
      <Dropdown
        value={answer.conditionId ?? ''}
        options={conditionOptions.map(condition => ({
          label: getTranslation(
            getReferenceDataStringId(condition.id, 'programRegistryCondition'),
            condition.name,
          ),
          value: condition.id,
        }))}
        onChange={conditionId => setAnswer(conditionId || null, null)}
        required={isRequired}
        disabled={disabled}
        clearable
        error={isCategoryMissing ? undefined : error}
      />
      {answer.conditionId && (
        <StyledView marginTop={12}>
          <Dropdown
            label={
              <TranslatedText
                stringId="programRegistry.relatedConditionsCategory.label"
                fallback="Category"
              />
            }
            value={answer.categoryId ?? ''}
            options={options.conditionCategories.map(category => ({
              label: getTranslation(
                getReferenceDataStringId(category.id, 'programRegistryConditionCategory'),
                category.name,
              ),
              value: category.id,
            }))}
            onChange={categoryId => setAnswer(answer.conditionId, categoryId || null)}
            required
            disabled={disabled}
            error={isCategoryMissing ? error : undefined}
          />
        </StyledView>
      )}
    </StyledView>
  );
};
