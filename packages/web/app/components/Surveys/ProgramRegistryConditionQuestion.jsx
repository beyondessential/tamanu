import FormHelperText from '@mui/material/FormHelperText';
import React, { createContext, useContext, useId } from 'react';
import styled from 'styled-components';

import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { parseProgramRegistryConditionAnswer } from '@tamanu/shared/utils/fields';
import { getReferenceDataStringId } from '@tamanu/shared/utils/translation';
import {
  SelectInput,
  checkVisibility,
  isProgramRegistryConditionAnswerable,
  isProgramRegistryConditionRequired,
} from '@tamanu/ui-components';
import { useTranslation } from '../../contexts/Translation';

export const ProgramRegistryConditionContext = createContext(null);

const Container = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;

  > * {
    flex: 1;
  }
`;

const getAnswerValue = (conditionId, categoryId) =>
  conditionId ? JSON.stringify({ conditionId, categoryId: categoryId ?? null }) : null;

const useConditionQuestionState = (name, values) => {
  const { registryOptions, components } = useContext(ProgramRegistryConditionContext) ?? {};
  if (!registryOptions) return { isLoading: true };

  const conditionQuestions = components.filter(
    component =>
      component.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.PROGRAM_REGISTRY_CONDITION &&
      checkVisibility(component, values, components),
  );
  const conditionIdsChosenElsewhere = conditionQuestions
    .filter(question => question.dataElementId !== name)
    .map(
      question => parseProgramRegistryConditionAnswer(values[question.dataElementId])?.conditionId,
    )
    .filter(Boolean);

  return {
    registryOptions,
    isAnswerable: isProgramRegistryConditionAnswerable(registryOptions, components),
    isFirstRequiredQuestion:
      isProgramRegistryConditionRequired(registryOptions, components) &&
      conditionQuestions[0]?.dataElementId === name,
    conditionIdsChosenElsewhere,
  };
};

export const ProgramRegistryConditionQuestionField = ({
  field,
  form,
  label,
  required,
  disabled,
  error,
  helperText,
}) => {
  const { getTranslation } = useTranslation();
  const categoryInputId = useId();
  const { name } = field;
  const answer = parseProgramRegistryConditionAnswer(field.value) ?? {};
  const {
    isLoading,
    registryOptions,
    isAnswerable,
    isFirstRequiredQuestion,
    conditionIdsChosenElsewhere,
  } = useConditionQuestionState(name, form.values);

  const setAnswer = (conditionId, categoryId) => {
    form.setFieldValue(name, getAnswerValue(conditionId, categoryId));
    form.setFieldTouched(name, true, false);
  };

  const renderUnavailable = message => (
    <div>
      <SelectInput name={name} label={label} value="" onChange={() => {}} disabled />
      {message && <FormHelperText>{message}</FormHelperText>}
    </div>
  );

  if (isLoading) return renderUnavailable(null);
  if (!isAnswerable) {
    return renderUnavailable(
      getTranslation(
        'program.question.programRegistryCondition.notRegistered',
        'Patient is not registered in this program registry',
      ),
    );
  }

  const unavailableConditionIds = new Set([
    ...registryOptions.recordedConditionIds,
    ...conditionIdsChosenElsewhere,
  ]);
  unavailableConditionIds.delete(answer.conditionId);

  const conditionOptions = registryOptions.conditions
    .filter(condition => !unavailableConditionIds.has(condition.id))
    .map(condition => ({
      label: getTranslation(
        getReferenceDataStringId(condition.id, 'programRegistryCondition'),
        condition.name,
      ),
      value: condition.id,
    }));
  const categoryOptions = registryOptions.conditionCategories.map(category => ({
    label: getTranslation(
      getReferenceDataStringId(category.id, 'programRegistryConditionCategory'),
      category.name,
    ),
    value: category.id,
  }));
  const isCategoryMissing = Boolean(answer.conditionId) && !answer.categoryId;
  const isAlreadyRecorded = registryOptions.recordedConditionIds.includes(answer.conditionId);

  if (conditionOptions.length === 0) {
    return renderUnavailable(
      getTranslation(
        'program.question.programRegistryCondition.allRecorded',
        "All of this registry's conditions are already recorded for this patient",
      ),
    );
  }

  return (
    <Container>
      <SelectInput
        name={name}
        label={label}
        value={answer.conditionId ?? ''}
        options={conditionOptions}
        onChange={event => setAnswer(event.target.value, null)}
        required={required || isFirstRequiredQuestion}
        disabled={disabled}
        error={error && !isCategoryMissing}
        helperText={isCategoryMissing && error ? undefined : helperText}
      />
      {answer.conditionId && (
        <div>
          <SelectInput
            id={categoryInputId}
            name={`${name}-category`}
            label={getTranslation('programRegistry.relatedConditionsCategory.label', 'Category')}
            value={answer.categoryId ?? ''}
            options={categoryOptions}
            onChange={event => setAnswer(answer.conditionId, event.target.value)}
            required
            disabled={disabled || isAlreadyRecorded}
            error={error && isCategoryMissing}
            helperText={isCategoryMissing && error ? helperText : undefined}
          />
          {isAlreadyRecorded && (
            <FormHelperText>
              {getTranslation(
                'program.question.programRegistryCondition.alreadyRecorded',
                'This condition is already recorded. Change its category in the program registry.',
              )}
            </FormHelperText>
          )}
        </div>
      )}
    </Container>
  );
};
