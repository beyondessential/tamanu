import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generate } from 'shortid';
import { Add } from '@material-ui/icons';
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

const StyledFormTable = styled(FormTable)`
  table tr td {
    border: none;
  }
`;

const Divider = styled(MuiDivider)`
  margin: 10px 0;
`;

const StyledTextField = styled(TextField)`
  .Mui-disabled {
    background-color: #f3f5f7;
  }
`;

const StyledAutocompleteField = styled(AutocompleteField)`
  width: 300px;
`;

const AddButton = styled(Button)`
  position: absolute;
  padding-left: 10px;

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

const useUpdateProgramRegistryMutation = patientId => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation(
    data => {
      return api.post(`patient/${patientId}/programRegistration`, data);
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
    group1: [
      'suspected',
      'underInvestigation',
      'confirmed',
      'unknown',
      'inRemission',
      'notApplicable',
    ],
    group2: ['disproven', 'resolved'],
    group3: ['recordedInError'],
  };

  // Initialize result object
  // const emptyRow = { id: '', name: '', date: '', conditionCategory: '' };
  const groupedData = { group1: [], group2: [], group3: [] };

  // Process rows
  rows.forEach(row => {
    if (!row.id || !row.conditionCategory) return; // Skip invalid entries

    for (const [group, conditions] of Object.entries(groupMapping)) {
      if (conditions.includes(row.conditionCategory)) {
        groupedData[group].push(row);
        break;
      }
    }
  });
  Object.keys(groupedData).forEach(group => {
    groupedData[group].sort((a, b) => a.name.localeCompare(b.name));
  });

  return groupedData;
};

export const PatientProgramRegistryUpdateFormModal = ({
  patientProgramRegistration = {},
  onClose,
  open,
}) => {
  const { programRegistryId, patientId, clinicalStatusId } = patientProgramRegistration;
  const { mutateAsync: submit, isLoading: isSubmitting } = useUpdateProgramRegistryMutation(
    patientId,
  );
  const { data: conditions = [], isLoading } = usePatientProgramRegistryConditionsQuery(
    patientId,
    programRegistryId,
  );
  const programRegistryStatusSuggester = useSuggester('programRegistryClinicalStatus', {
    baseQueryParameters: { programRegistryId },
  });

  const handleSubmit = async data => {
    await submit(data);
    onClose();
  };

  if (!patientProgramRegistration) return null;

  if (isLoading) {
    return null;
  }

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
          const getIsDirty = index => {
            return (
              values.conditions[index]?.conditionCategory !==
              initialValues.conditions[index]?.conditionCategory
            );
          };

          const columns = [
            {
              key: 'condition',
              title: (
                <span id="condition-label">
                  <TranslatedText
                    stringId="patientProgramRegistry.updateConditionModal.condition"
                    fallback="Condition"
                  />
                </span>
              ),
              accessor: ({ name }, index) => {
                if (name) {
                  return name;
                }

                const fieldName = `conditions[${index}]`;

                const onClear = () => {
                  console.log('clearing', fieldName);
                };

                const isLastRow = index === groupedData.group1.length - 1;

                return (
                  <div style={{ position: 'relative' }}>
                    <ProgramRegistryConditionField
                      name={`conditions[${index}].id`}
                      programRegistryId={programRegistryId}
                      onClear={onClear}
                      ariaLabelledby="condition-label"
                    />
                    {isLastRow && (
                      <AddButton
                        startIcon={<Add />}
                        type="button"
                        variant="text"
                        onClick={() => {
                          setFieldValue('conditions', [...values.conditions, { id: generate() }]);
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
              width: 120,
              title: (
                <span id="date-added-label">
                  <TranslatedText
                    stringId="patientProgramRegistry.updateConditionModal.dateAdded"
                    fallback="Date added"
                  />
                </span>
              ),
              accessor: ({ date }, index) => {
                if (date) {
                  return <DateDisplay date={date} />;
                }
                return (
                  <Field
                    name={`conditions[${index}].date`}
                    saveDateAsString
                    required
                    component={DateField}
                    ariaLabelledby="date-added-label"
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
              width: 200,
              accessor: ({ id }, index) => {
                return (
                  <ProgramRegistryConditionCategoryField
                    name={`conditions[${index}].conditionCategory`}
                    conditionId={id}
                    ariaLabelledby="condition-category-label"
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
              width: 320,
              accessor: (row, index) => (
                <Field
                  name={`conditions[${index}].reasonForChange`}
                  ariaLabelledBy="condition-category-change-reason-label"
                  component={StyledTextField}
                  required
                  disabled={!getIsDirty(index)}
                />
              ),
            },
            {
              key: 'history',
              width: 100,
              accessor: () => <ViewHistoryButton>View history</ViewHistoryButton>,
            },
          ];

          const rows = values.conditions;
          const groupedData = getGroupedData(rows);

          // console.log('groupedRows', groupedData);
          console.log('VALUES', values);

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
            </>
          );
        }}
        initialValues={{
          clinicalStatusId: clinicalStatusId,
          conditions: [
            ...conditions.map(({ programRegistryCondition, date, conditionCategory }) => ({
              id: programRegistryCondition.id,
              name: programRegistryCondition.name,
              date,
              conditionCategory,
            })),
            // Add an empty row for adding new conditions
            {},
          ],
        }}
        formType={FORM_TYPES.EDIT_FORM}
        validationSchema={yup.object().shape({
          clinicalStatusId: optionalForeignKey(),
        })}
      />
    </Modal>
  );
};
