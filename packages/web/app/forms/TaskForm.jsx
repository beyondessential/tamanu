import React from 'react';
import * as yup from 'yup';

import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import styled from 'styled-components';
import {
  AutocompleteField,
  CheckField,
  DateTimeField,
  Field,
  Form,
  TextField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { FormSubmitCancelRow } from '../components/ButtonRow';

import { TranslatedText } from '../components/Translation/TranslatedText';
import { useSuggester } from '../api';
import { Box, Divider } from '@material-ui/core';
import { REFERENCE_DATA_TYPE_TO_LABEL } from '../constants/task';

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

export const TaskForm = React.memo(
  ({ onCancel, onSubmit = () => {}, editedObject, anaestheticSuggester, procedureSuggester }) => {
    const practitionerSuggester = useSuggester('practitioner');
    const designationSuggester = useSuggester('designation');

    const combinedSuggester = useSuggester('multiReferenceData', {
      baseQueryParameters: { types: ['taskTemplate', 'taskSet'] },
      formatter: ({ id, name, type }) => ({ label: name, value: id, type }),
      createSuggestionPayload: { type: 'taskTemplate' },
    });

    return (
      <Form
        onSubmit={onSubmit}
        render={({ submitForm, values }) => {
          const handleCancel = () => onCancel && onCancel();

          return (
            <div>
              <FormGrid>
                <FormGrid style={{ gridColumn: 'span 2' }}>
                  <Field
                    name="taskId"
                    label={<TranslatedText stringId="task.task.label" fallback="Task" />}
                    component={AutocompleteField}
                    suggester={combinedSuggester}
                    multiSection
                    allowCreatingCustomValue
                    groupByKey="type"
                    getSectionTitle={section => REFERENCE_DATA_TYPE_TO_LABEL[section.type]}
                    orderByValues={['taskSet', 'taskTemplate']}
                  />
                  <Field
                    name="startDatetime"
                    label={
                      <TranslatedText
                        stringId="task.startDatetime.label"
                        fallback="Start date & time"
                      />
                    }
                    saveDateAsString
                    required
                    component={DateTimeField}
                  />
                </FormGrid>
                <FormGrid style={{ gridColumn: 'span 2' }}>
                  <Field
                    name="clinicianId"
                    label={
                      <TranslatedText stringId="task.requestedBy.label" fallback="Requested by" />
                    }
                    required
                    component={AutocompleteField}
                    suggester={practitionerSuggester}
                  />
                  <Field
                    name="requestDatetime"
                    label={
                      <TranslatedText
                        stringId="task.requestDatetime.label"
                        fallback="Request date & time"
                      />
                    }
                    saveDateAsString
                    required
                    component={DateTimeField}
                    min={getCurrentDateTimeString()}
                  />
                </FormGrid>
                <Field
                  name="note"
                  label={<TranslatedText stringId="task.notes.label" fallback="Notes" />}
                  component={TextField}
                  multiline
                  minRows={4}
                  style={{ gridColumn: 'span 2' }}
                />
                {/* <Field
                  name="completed"
                  label={<TranslatedText stringId="general.completed.label" fallback="Completed" />}
                  component={CheckField}
                /> */}
                <Divider style={{ gridColumn: 'span 2' }} />
                <FormGrid style={{ gridColumn: 'span 2' }}>
                  <Field
                    name="assignedToId"
                    label={
                      <TranslatedText
                        stringId="general.localisedField.assignedTo.label"
                        fallback="Assigned to"
                      />
                    }
                    required
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
                      required
                      component={TextField}
                    />
                    <Field
                      name="frequencyUnit"
                      required
                      component={AutocompleteField}
                      suggester={practitionerSuggester}
                    />
                  </NestedFormGrid>
                </FormGrid>
                <FormSubmitCancelRow
                  onCancel={handleCancel}
                  onConfirm={submitForm}
                  confirmText={
                    <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
                  }
                />
              </FormGrid>
            </div>
          );
        }}
      />
    );
  },
);
