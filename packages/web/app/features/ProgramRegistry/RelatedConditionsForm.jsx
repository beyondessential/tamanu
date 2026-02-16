import React, { useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import MuiDivider from '@material-ui/core/Divider';
import { Add } from '@material-ui/icons';
import {
  DateDisplay,
  DateField,
  Field,
  Heading5,
  TranslatedText,
  TranslatedReferenceData,
} from '../../components';
import { TextField, Form, Button, TextButton } from '@tamanu/ui-components';
import { trimToDate } from '@tamanu/utils/dateTime';
import { Colors } from '../../constants/styles';
import { ProgramRegistryConditionField } from './ProgramRegistryConditionField';
import { ProgramRegistryConditionCategoryField } from './ProgramRegistryConditionCategoryField';
import { RecordedInErrorWarningModal } from './RecordedInErrorWarningModal';
import { FormTable } from './FormTable';
import { useTranslation } from '../../contexts/Translation';
import { optionalForeignKey } from '../../utils/validation';
import { PROGRAM_REGISTRY_CONDITION_CATEGORIES, FORM_TYPES } from '@tamanu/constants';
import { usePatientProgramRegistryConditionsQuery } from '../../api/queries';
import { ConditionHistoryModal } from './ConditionHistoryModal';
import { useSettings } from '../../contexts/Settings';

const StyledFormTable = styled(FormTable)`
  overflow: auto;
  margin-bottom: 2rem;

  table tr td {
    border: none;
  }
`;

const Divider = styled(MuiDivider)`
  margin: 10px 0;
`;

const StyledTextField = styled(TextField)`
  .Mui-disabled {
    background-color: ${Colors.hoverGrey};
  }
`;

const AddButton = styled(Button)`
  position: absolute;
  padding-left: 10px;
  white-space: nowrap;

  .MuiSvgIcon-root,
  .MuiButton-startIcon {
    margin-right: 0;
  }
`;

const ViewHistoryButton = styled(TextButton)`
  color: ${Colors.primary};
  font-size: 0.6875rem;
  text-decoration: underline;
  padding: 0.3rem 1rem;
  text-transform: none;
  &:hover {
    text-decoration: underline;
  }
`;

const getConditionShape = getTranslation =>
  yup.object().shape({
    conditionId: yup.string().nullable(),
    conditionCategoryId: yup
      .string()
      .nullable()
      .when('conditionId', {
        is: value => Boolean(value),
        then: yup.string().required(getTranslation('validation.required.inline', '*Required')),
      }),
    date: yup
      .date()
      .nullable()
      .when('conditionId', {
        is: value => Boolean(value),
        then: yup.date().required(getTranslation('validation.required.inline', '*Required')),
      }),
    reasonForChange: yup.string(),
  });

const getGroupedData = rows => {
  const groupMapping = {
    // confirmedSection is for every other category
    resolvedSection: [
      PROGRAM_REGISTRY_CONDITION_CATEGORIES.DISPROVEN,
      PROGRAM_REGISTRY_CONDITION_CATEGORIES.RESOLVED,
    ],
    recordedInErrorSection: [PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR],
  };

  // Initialize result object
  const groupedData = { confirmedSection: [{}], resolvedSection: [], recordedInErrorSection: [] };

  // Process rows
  rows.forEach(({ id, programRegistryConditionCategory, date, programRegistryCondition, history }) => {
    const group = Object.entries(groupMapping).find(([, conditions]) =>
      conditions.includes(programRegistryConditionCategory.code),
    )?.[0] || 'confirmedSection';
    if (group) {
      groupedData[group].push({
        id,
        conditionId: programRegistryCondition.id,
        name: programRegistryCondition.name,
        date,
        conditionCategoryId: programRegistryConditionCategory.id,
        conditionCategoryName: programRegistryConditionCategory.name,
        programRegistryId: programRegistryConditionCategory.programRegistryId,
        history,
      });
    }
  });
  Object.keys(groupedData).forEach(group => {
    groupedData[group].sort((a, b) => a.name?.localeCompare(b?.name));
  });
  return groupedData;
};

// Because of importing validation we can guarantee the ID contains this code
const isRecordedInError = conditionCategoryId =>
  conditionCategoryId?.includes(PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR);

const getIsNewRecordedInError = conditions => {
  return [...conditions.confirmedSection, ...conditions.resolvedSection].some(
    ({ conditionCategoryId }) => isRecordedInError(conditionCategoryId),
  );
};

const getNewRecordedInErrorList = conditions => {
  return [...conditions.confirmedSection, ...conditions.resolvedSection].filter(
    ({ conditionCategoryId }) => isRecordedInError(conditionCategoryId),
  );
};

export const RelatedConditionsForm = ({
  patientProgramRegistration = {},
  children,
  onClose,
  onSubmit,
  FormActions,
  initialValues = {},
  validationSchema = {},
}) => {
  const [warningOpen, setWarningOpen] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState(null);
  const { getSetting } = useSettings();
  const { getTranslation } = useTranslation();

  const { id, programRegistryId, clinicalStatusId } = patientProgramRegistration;
  const areAuditChangesEnabled = getSetting('audit.changes.enabled');

  const { data: conditions = [], isLoading } = usePatientProgramRegistryConditionsQuery(id);

  const handleConfirmedSubmit = async data => {
    const updatedConditions = Object.values(data.conditions)
      .flatMap(group => group)
      .filter(({ conditionId }) => conditionId)
      .filter(condition => {
        // Find the matching condition in the initial values
        const initialCondition = conditions.find(
          initialCondition => initialCondition.id === condition.id,
        );

        // Consider a condition updated if:
        // 1. It's a new condition (not in initial values)
        // 2. The category has changed
        const initialCategory = initialCondition?.conditionCategoryId;
        const newCategory = condition.conditionCategoryId;
        return (
          !initialCondition || initialCategory !== newCategory
        );
      });

    await onSubmit({ ...data, conditions: updatedConditions });
    setWarningOpen(false);
    onClose();
  };

  const handleSubmit = async data => {
    if (getIsNewRecordedInError(data.conditions)) {
      setWarningOpen(true);
    } else {
      await handleConfirmedSubmit(data);
    }
  };

  if (!patientProgramRegistration || isLoading) return null;

  const totalInitialValues = {
    clinicalStatusId,
    conditions: getGroupedData(conditions),
    date: patientProgramRegistration.date,
    ...initialValues,
  };

  const totalValidationSchema = yup.object().shape({
    ...validationSchema,
    clinicalStatusId: optionalForeignKey().nullable(),
    conditions: yup.object().shape({
      confirmedSection: yup.array().of(getConditionShape(getTranslation)),
      resolvedSection: yup.array().of(getConditionShape(getTranslation)),
      recordedInErrorSection: yup.array().of(getConditionShape(getTranslation)),
    }),
  });

  return (
    <Form
      validationSchema={totalValidationSchema}
      initialValues={totalInitialValues}
      formType={FORM_TYPES.EDIT_FORM}
      showInlineErrorsOnly
      onSubmit={handleSubmit}
      render={({ setFieldValue, values, initialValues, dirty }) => {
        const groupedData = values.conditions;
        const columns = [
          {
            key: 'condition',
            width: 220,
            title: (
              <span id="condition-label">
                <TranslatedText
                  stringId="programRegistry.updateConditionModal.condition"
                  fallback="Condition"
                />
              </span>
            ),
            accessor: ({ name, conditionCategoryId, conditionId }, groupName, index) => {
              if (name) {
                return (
                  <span
                    style={{
                      textDecoration:
                        isRecordedInError(conditionCategoryId) ? 'line-through' : 'none',
                    }}
                  >
                    <TranslatedReferenceData
                      value={conditionId}
                      fallback={name}
                      category="programRegistryCondition"
                    />
                  </span>
                );
              }

              const onClear = () => {
                setFieldValue('conditions', {
                  ...groupedData,
                  // Clear the condition and category fields. Set to an empty object rather than
                  // removing from the array keep the order of the conditions consistent with the fields
                  [groupName]: groupedData[groupName].map((condition, i) =>
                    i === index ? {} : condition,
                  ),
                });
              };

              const isLastRow = index === groupedData.confirmedSection.length - 1;

              const usedValues = groupedData.confirmedSection
                ?.filter(
                  condition => condition.conditionId && condition.conditionId !== conditionId,
                )
                .map(condition => condition.conditionId);

              return (
                <div style={{ position: 'relative' }}>
                  <ProgramRegistryConditionField
                    name={`conditions[${groupName}][${index}].conditionId`}
                    programRegistryId={programRegistryId}
                    onClear={onClear}
                    ariaLabelledby="condition-label"
                    optionsFilter={condition => !usedValues.includes(condition.id)}
                  />
                  {isLastRow && (
                    <AddButton
                      startIcon={<Add />}
                      type="button"
                      variant="text"
                      onClick={() => {
                        // Add a new empty row to the end of the confirmed section
                        setFieldValue('conditions', {
                          ...values.conditions,
                          confirmedSection: [...values.conditions.confirmedSection, {}],
                        });
                      }}
                    >
                      Add additional
                    </AddButton>
                  )}
                </div>
              );
            },
          },
          {
            key: 'dateAdded',
            width: 135,
            title: (
              <span id="date-added-label">
                <TranslatedText
                  stringId="programRegistry.updateConditionModal.dateAdded"
                  fallback="Date added"
                />
                <span style={{ color: Colors.alert }}> *</span>
              </span>
            ),
            accessor: ({ date, conditionCategoryId }, groupName, index) => {
              const initialValue = initialValues.conditions[groupName][index]?.date;
              if (initialValue) {
                return (
                  <DateDisplay
                    date={trimToDate(date)}
                    style={{
                      textDecoration:
                        isRecordedInError(conditionCategoryId) ? 'line-through' : 'none',
                    }}
                  />
                );
              }
              return (
                <Field
                  name={`conditions[${groupName}][${index}].date`}
                  saveDateAsString
                  required
                  component={DateField}
                  aria-labelledby="date-added-label"
                />
              );
            },
          },
          {
            key: 'conditionCategory',
            title: (
              <span id="condition-category-label">
                <TranslatedText
                  stringId="programRegistry.updateConditionModal.category"
                  fallback="Category"
                />
                <span style={{ color: Colors.alert }}> *</span>
              </span>
            ),
            width: 180,
            accessor: ({ conditionId }, groupName, index) => {
              const initialValue = initialValues.conditions[groupName][index]?.conditionCategoryId;
              const fieldName = `conditions[${groupName}][${index}].conditionCategoryId`;
              const ariaLabelledby = 'condition-category-label';

              // other values
              if (groupName === 'resolvedSection') {
                const matchingCondition = values.conditions.confirmedSection.some(
                  condition => condition.conditionId === conditionId,
                );
                if (matchingCondition) {
                  return (
                    <ProgramRegistryConditionCategoryField
                      name={fieldName}
                      programRegistryId={programRegistryId}
                      ariaLabelledby={ariaLabelledby}
                      disabled
                      disabledTooltipText={getTranslation(
                        'programRegistry.disprovenCondition.tooltip',
                        'Please refer to current instance of condition above to update category.',
                      )}
                    />
                  );
                }
              }

              if (isRecordedInError(initialValue)) {
                return (
                  <ProgramRegistryConditionCategoryField
                    name={fieldName}
                    programRegistryId={programRegistryId}
                    ariaLabelledby={ariaLabelledby}
                    disabled
                    disabledTooltipText={getTranslation(
                      'programRegistry.recordedInError.tooltip',
                      'Cannot edit entry that has been recorded in error',
                    )}
                  />
                );
              }

              return (
                <ProgramRegistryConditionCategoryField
                  name={fieldName}
                  programRegistryId={programRegistryId}
                  ariaLabelledby={ariaLabelledby}
                  disabled={!conditionId}
                  disabledTooltipText={
                    !conditionId
                      ? getTranslation(
                          'programRegistry.conditionCategoryDisabled.tooltip',
                          'Select a related condition to record category',
                        )
                      : null
                  }
                  required
                />
              );
            },
          },
          {
            key: 'reasonForChange',
            title: (
              <span id="condition-category-change-reason-label">
                <TranslatedText
                  stringId="programRegistry.updateConditionModal.reasonForChange"
                  fallback="Reason for change (if applicable)"
                />
              </span>
            ),
            width: 250,
            accessor: (row, groupName, index) => {
              // Check for date as a proxy for whether the row is new
              const initialValue = initialValues.conditions[groupName][index]?.date;
              if (!initialValue) {
                return null;
              }
              return (
                <Field
                  name={`conditions[${groupName}][${index}].reasonForChange`}
                  ariaLabelledBy="condition-category-change-reason-label"
                  component={StyledTextField}
                  required
                  disabled={
                    values.conditions[groupName][index].conditionCategoryId ===
                    initialValues.conditions[groupName][index].conditionCategoryId
                  }
                />
              );
            },
          },
          {
            key: 'history',
            width: 100,
            accessor: (row, groupName, index) => {
              // Check for date as a proxy for whether the row is new
              const initialValue = initialValues.conditions[groupName][index]?.date;
              if (!initialValue || !areAuditChangesEnabled) {
                return null;
              }
              return (
                <ViewHistoryButton onClick={() => setSelectedCondition(row)}>
                  <TranslatedText stringId="programRegistry.viewHistory" fallback="View history" />
                </ViewHistoryButton>
              );
            },
          },
        ];
        return (
          <>
            {children}
            <Divider />
            <Heading5 mt={0} mb={1}>
              <TranslatedText
                stringId="programRegistry.relatedConditions.label"
                fallback="Related conditions"
              />
            </Heading5>
            <StyledFormTable columns={columns} data={groupedData} />
            <RecordedInErrorWarningModal
              open={warningOpen}
              onClose={() => setWarningOpen(false)}
              items={getNewRecordedInErrorList(values.conditions)}
              onConfirm={async () => {
                // Manually pass the values to the confirmed submit function
                await handleConfirmedSubmit(values);
              }}
            />
            {areAuditChangesEnabled && (
              <ConditionHistoryModal
                open={!!selectedCondition}
                onClose={() => setSelectedCondition(null)}
                condition={selectedCondition}
              />
            )}
            <FormActions isDirty={dirty} />
          </>
        );
      }}
    />
  );
};
