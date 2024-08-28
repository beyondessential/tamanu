import React from 'react';
import * as yup from 'yup';

import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import styled from 'styled-components';
import PriorityHighIcon from '@material-ui/icons/PriorityHigh';
import { Divider } from '@material-ui/core';
import {
  AutocompleteField,
  CheckField,
  DateTimeField,
  Field,
  Form,
  NumberField,
  TextField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { FormSubmitCancelRow } from '../components/ButtonRow';

import { TranslatedText } from '../components/Translation/TranslatedText';
import { useSuggester } from '../api';
import { REFERENCE_DATA_TYPE_TO_LABEL } from '../constants/task';
import { Colors, FORM_TYPES } from '../constants';
import { foreignKey } from '../utils/validation';
import { preventInvalidNumber } from '../utils';

const NestedFormGrid = styled.div`
  display: flex;
  gap: 5px;
  align-items: end;
  .label-field {
    white-space: nowrap;
  }
  > div {
    flex: 1;
    align-items: end;
  }
`;

const StyledCheckField = styled(Field)`
  label {
    display: flex;
    align-items: center;
  }
  .MuiTypography-root {
    font-size: 14px;
  }
`;

const StyledPriorityHighIcon = styled(PriorityHighIcon)`
  color: ${Colors.alert};
  font-size: 16px;
  vertical-align: sub;
`;

export const TaskForm = React.memo(
  ({ onClose, onSubmit = () => {} }) => {
    const practitionerSuggester = useSuggester('practitioner');
    const designationSuggester = useSuggester('designation');

    const combinedTaskSuggester = useSuggester('multiReferenceData', {
      baseQueryParameters: { types: ['taskTemplate', 'taskSet'] },
      formatter: ({ id, name, type }) => ({ label: name, value: id, type }),
      createSuggestionPayload: { type: 'taskTemplate' },
    });

    return (
      <Form
        onSubmit={onSubmit}
        render={({ submitForm, values }) => {
          const handleCancel = () => onClose && onClose();

          return (
            <div>
              <FormGrid>
                <FormGrid style={{ gridColumn: 'span 2' }}>
                  <Field
                    name="taskId"
                    label={<TranslatedText stringId="encounter.task.task.label" fallback="Task" />}
                    component={AutocompleteField}
                    suggester={combinedTaskSuggester}
                    multiSection
                    allowCreatingCustomValue
                    groupByKey="type"
                    getSectionTitle={section => REFERENCE_DATA_TYPE_TO_LABEL[section.type]}
                    orderByValues={['taskSet', 'taskTemplate']}
                    required
                  />
                  <Field
                    name="startDatetime"
                    label={
                      <TranslatedText
                        stringId="encounter.task.startDatetime.label"
                        fallback="Start date & time"
                      />
                    }
                    saveDateAsString
                    required
                    component={DateTimeField}
                    min={getCurrentDateTimeString()}
                  />
                </FormGrid>
                <FormGrid style={{ gridColumn: 'span 2' }}>
                  <Field
                    name="clinicianId"
                    label={
                      <TranslatedText
                        stringId="encounter.task.requestedBy.label"
                        fallback="Requested by"
                      />
                    }
                    required
                    component={AutocompleteField}
                    suggester={practitionerSuggester}
                  />
                  <Field
                    name="requestDatetime"
                    label={
                      <TranslatedText
                        stringId="encounter.task.requestDatetime.label"
                        fallback="Request date & time"
                      />
                    }
                    saveDateAsString
                    required
                    component={DateTimeField}
                  />
                </FormGrid>
                <Field
                  name="note"
                  label={<TranslatedText stringId="encounter.task.notes.label" fallback="Notes" />}
                  component={TextField}
                  multiline
                  minRows={4}
                  style={{ gridColumn: 'span 2' }}
                />
                <Divider style={{ gridColumn: 'span 2' }} />
                <FormGrid style={{ gridColumn: 'span 2' }}>
                  <Field
                    name="designationId"
                    label={
                      <TranslatedText
                        stringId="general.localisedField.assignedTo.label"
                        fallback="Assigned to"
                      />
                    }
                    component={AutocompleteField}
                    suggester={designationSuggester}
                  />
                  <NestedFormGrid>
                    <Field
                      name="frequencyNumber"
                      label={
                        <TranslatedText
                          stringId="task.frequency.label"
                          fallback="Frequency (if repeating task)"
                        />
                      }
                      min={0}
                      component={NumberField}
                      onInput={preventInvalidNumber}
                    />
                    <Field
                      name="frequencyUnit"
                      required
                      component={AutocompleteField}
                      suggester={practitionerSuggester}
                    />
                  </NestedFormGrid>
                  <StyledCheckField
                    name="highPriority"
                    label={
                      <span>
                        <StyledPriorityHighIcon />
                        <TranslatedText
                          stringId="encounter.task.highPriority.label"
                          fallback="High priority task"
                        />
                      </span>
                    }
                    component={CheckField}
                  />
                </FormGrid>
              </FormGrid>
              <Divider style={{ margin: '28px -32px 20px -32px' }} />
              <FormSubmitCancelRow
                onCancel={handleCancel}
                onConfirm={submitForm}
                confirmText={
                  <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
                }
              />
            </div>
          );
        }}
        formType={FORM_TYPES.CREATE_FORM}
        validationSchema={yup.object().shape({
          taskId: foreignKey()
            .required()
            .translatedLabel(
              <TranslatedText stringId="encounter.task.task.label" fallback="Task" />,
            ),
          startDatetime: yup
            .date()
            .required()
            .translatedLabel(
              <TranslatedText
                stringId="encounter.task.startDatetime.label"
                fallback="Start date & time"
              />,
            ),
          clinicianId: foreignKey()
            .required()
            .translatedLabel(
              <TranslatedText
                stringId="encounter.task.requestedBy.label"
                fallback="Requested by"
              />,
            ),
          requestDatetime: yup
            .date()
            .required()
            .translatedLabel(
              <TranslatedText
                stringId="encounter.task.requestDatetime.label"
                fallback="Request date & time"
              />,
            ),
          note: yup.string(),
          highPriority: yup.boolean(),
        })}
      />
    );
  },
);
