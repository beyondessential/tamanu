import React, { useState } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Add } from '@material-ui/icons';
import { PROGRAM_REGISTRY_CONDITION_CATEGORIES } from '@tamanu/constants';
import MuiDivider from '@material-ui/core/Divider';
import {
  AutocompleteField,
  Button,
  DateDisplay,
  DateField,
  Field,
  Form,
  Heading5,
  Modal,
  ModalFormActionRow,
  TextButton,
  TextField,
  TranslatedText,
} from '../../components';
import { useApi, useSuggester } from '../../api';
import { optionalForeignKey } from '../../utils/validation';
import { PANE_SECTION_IDS } from '../../components/PatientInfoPane/paneSections';
import { Colors, FORM_TYPES } from '../../constants';
import { ProgramRegistryConditionCategoryField } from './ProgramRegistryConditionCategoryField';
import { FormTable } from './FormTable';
import { usePatientProgramRegistryConditionsQuery } from '../../api/queries';
import { ProgramRegistryConditionField } from './ProgramRegistryConditionField';
import { useTranslation } from '../../contexts/Translation';
import { RecordedInErrorWarningModal } from './RecordedInErrorWarningModal';

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

const StyledAutocompleteField = styled(AutocompleteField)`
  width: 300px;
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
    conditionCategory: yup
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

const getValidationSchema = getTranslation => {
  return yup.object().shape({
    clinicalStatusId: optionalForeignKey().nullable(),
    conditions: yup.object().shape({
      confirmedSection: yup.array().of(getConditionShape(getTranslation)),
      resolvedSection: yup.array().of(getConditionShape(getTranslation)),
      recordedInErrorSection: yup.array().of(getConditionShape(getTranslation)),
    }),
  });
};

const useUpdateProgramRegistryMutation = (patientId, registrationId) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation(
    data => {
      return api.put(`patient/programRegistration/${registrationId}`, data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([`infoPaneListItem-${PANE_SECTION_IDS.PROGRAM_REGISTRY}`]);
        queryClient.invalidateQueries(['patient', patientId]);
      },
    },
  );
};

const getGroupedData = rows => {
  const groupMapping = {
    confirmedSection: [
      PROGRAM_REGISTRY_CONDITION_CATEGORIES.SUSPECTED,
      PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNDER_INVESTIGATION,
      PROGRAM_REGISTRY_CONDITION_CATEGORIES.CONFIRMED,
      PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN,
      PROGRAM_REGISTRY_CONDITION_CATEGORIES.IN_REMISSION,
      PROGRAM_REGISTRY_CONDITION_CATEGORIES.NOT_APPLICABLE,
    ],
    resolvedSection: [
      PROGRAM_REGISTRY_CONDITION_CATEGORIES.DISPROVEN,
      PROGRAM_REGISTRY_CONDITION_CATEGORIES.RESOLVED,
    ],
    recordedInErrorSection: [PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR],
  };

  // Initialize result object
  const groupedData = { confirmedSection: [{}], resolvedSection: [], recordedInErrorSection: [] };

  // Process rows
  rows.forEach(({ id, conditionCategory, date, programRegistryCondition }) => {
    const group = Object.entries(groupMapping).find(([, conditions]) =>
      conditions.includes(conditionCategory),
    )?.[0];
    if (group) {
      groupedData[group].push({
        id,
        conditionId: programRegistryCondition.id,
        name: programRegistryCondition.name,
        date,
        conditionCategory,
      });
    }
  });
  Object.keys(groupedData).forEach(group => {
    groupedData[group].sort((a, b) => a.name?.localeCompare(b?.name));
  });
  return groupedData;
};

const getIsNewRecordedInError = conditions => {
  return [...conditions.confirmedSection, ...conditions.resolvedSection].some(
    ({ conditionCategory }) =>
      conditionCategory === PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR,
  );
};

const getNewRecordedInErrorList = conditions => {
  return [...conditions.confirmedSection, ...conditions.resolvedSection].filter(
    ({ conditionCategory }) =>
      conditionCategory === PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR,
  );
};

export const PatientProgramRegistryUpdateFormModal = ({
  patientProgramRegistration = {},
  onClose,
  open,
}) => {
  const {
    id: registrationId,
    programRegistryId,
    patientId,
    clinicalStatusId,
  } = patientProgramRegistration;
  const { getTranslation } = useTranslation();
  const [warningOpen, setWarningOpen] = useState(false);
  const { mutateAsync: submit, isLoading: isSubmitting } = useUpdateProgramRegistryMutation(
    patientId,
    registrationId,
  );
  const { data: conditions = [], isLoading } = usePatientProgramRegistryConditionsQuery(
    patientId,
    programRegistryId,
  );
  const programRegistryStatusSuggester = useSuggester('programRegistryClinicalStatus', {
    baseQueryParameters: { programRegistryId },
  });

  const handleConfirmedSubmit = async data => {
    const updatedConditions = Object.values(data.conditions)
      .flatMap(group => group)
      .filter(({ conditionId }) => conditionId);
    await submit({ ...data, conditions: updatedConditions });
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

  return (
    <Modal
      title={
        <TranslatedText
          stringId="patientProgramRegistry.updateModal.title"
          fallback="Update program registry"
        />
      }
      open={open}
      onClose={onClose}
      width="lg"
    >
      <Form
        showInlineErrorsOnly
        onSubmit={handleSubmit}
        render={({ setFieldValue, values, initialValues, dirty }) => {
          const groupedData = values.conditions;
          const columns = [
            {
              key: 'condition',
              width: 200,
              title: (
                <span id="condition-label">
                  <TranslatedText
                    stringId="patientProgramRegistry.updateConditionModal.condition"
                    fallback="Condition"
                  />
                </span>
              ),
              accessor: ({ name, conditionCategory, conditionId }, groupName, index) => {
                if (name) {
                  return (
                    <span
                      style={{
                        textDecoration:
                          conditionCategory === 'recordedInError' ? 'line-through' : 'none',
                      }}
                    >
                      {name}
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
                    stringId="patientProgramRegistry.updateConditionModal.dateAdded"
                    fallback="Date added"
                  />
                  <span style={{ color: Colors.alert }}> *</span>
                </span>
              ),
              accessor: ({ date, conditionCategory }, groupName, index) => {
                const initialValue = initialValues.conditions[groupName][index]?.date;
                if (initialValue) {
                  return (
                    <DateDisplay
                      date={date}
                      style={{
                        textDecoration:
                          conditionCategory === 'recordedInError' ? 'line-through' : 'none',
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
                    stringId="patientProgramRegistry.updateConditionModal.category"
                    fallback="Category"
                  />
                  <span style={{ color: Colors.alert }}> *</span>
                </span>
              ),
              width: 180,
              accessor: ({ conditionId }, groupName, index) => {
                const initialValue = initialValues.conditions[groupName][index]?.conditionCategory;
                const fieldName = `conditions[${groupName}][${index}].conditionCategory`;
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
                        ariaLabelledby={ariaLabelledby}
                        disabled
                        disabledTooltipText={getTranslation(
                          'patientProgramRegistry.disprovenCondition.tooltip',
                          'Please refer to current instance of condition above to update category.',
                        )}
                      />
                    );
                  }
                }

                if (initialValue === 'recordedInError') {
                  return (
                    <ProgramRegistryConditionCategoryField
                      name={fieldName}
                      ariaLabelledby={ariaLabelledby}
                      disabled
                      disabledTooltipText={getTranslation(
                        'patientProgramRegistry.recordedInError.tooltip',
                        'Cannot edit entry that has been recorded in error',
                      )}
                    />
                  );
                }

                return (
                  <ProgramRegistryConditionCategoryField
                    name={fieldName}
                    ariaLabelledby={ariaLabelledby}
                    disabled={!conditionId}
                    disabledTooltipText={
                      !conditionId
                        ? getTranslation(
                            'patientProgramRegistry.conditionCategoryDisabled.tooltip',
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
                    stringId="patientProgramRegistry.updateConditionModal.reasonForChange"
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
                      values.conditions[groupName][index].conditionCategory ===
                      initialValues.conditions[groupName][index].conditionCategory
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
                if (!initialValue) {
                  return null;
                }
                return (
                  <ViewHistoryButton>
                    <TranslatedText
                      stringId="patientProgramRegistry.viewHistory"
                      fallback="View history"
                    />
                  </ViewHistoryButton>
                );
              },
            },
          ];

          return (
            <>
              <Field
                name="clinicalStatusId"
                label={<TranslatedText stringId="general.status.label" fallback="Status" />}
                component={StyledAutocompleteField}
                suggester={programRegistryStatusSuggester}
              />
              <Divider />
              <Heading5 mt={0} mb={1}>
                <TranslatedText
                  stringId="programRegistry.relatedConditions"
                  fallback="Related conditions"
                />
              </Heading5>
              <StyledFormTable columns={columns} data={groupedData} />
              <ModalFormActionRow onCancel={onClose} confirmDisabled={!dirty || isSubmitting} />
              <RecordedInErrorWarningModal
                open={warningOpen}
                onClose={() => setWarningOpen(false)}
                items={getNewRecordedInErrorList(values.conditions)}
                onConfirm={async () => {
                  // Manually pass the values to the confirmed submit function
                  await handleConfirmedSubmit(values);
                }}
              />
            </>
          );
        }}
        initialValues={{
          clinicalStatusId: clinicalStatusId,
          conditions: getGroupedData(conditions),
        }}
        formType={FORM_TYPES.EDIT_FORM}
        validationSchema={getValidationSchema(getTranslation)}
      />
    </Modal>
  );
};
