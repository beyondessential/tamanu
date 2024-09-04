import React, { useState } from 'react';
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
  SelectField,
  SuggesterSelectField,
  TextField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { FormSubmitCancelRow } from '../components/ButtonRow';

import { TranslatedText } from '../components/Translation/TranslatedText';
import { useSuggester } from '../api';
import {
  REFERENCE_DATA_TYPE_TO_LABEL,
  TASK_FREQUENCY_UNIT_OPTIONS,
  TASK_FREQUENCY_UNIT_TO_VALUE,
} from '../constants/task';
import { Colors, FORM_TYPES } from '../constants';
import { foreignKey } from '../utils/validation';
import { preventInvalidNumber } from '../utils';
import { TaskSetTable } from '../components/Tasks/TaskSetTable';
import { useCreateTask, useCreateTaskSet } from '../api/mutations/useTaskMutation';
import { useEncounter } from '../contexts/Encounter';
import { useAuth } from '../contexts/Auth';

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

const taskFrequencyUnitOptions = Object.entries(TASK_FREQUENCY_UNIT_OPTIONS).map(
  ([key, label]) => ({
    label,
    value: TASK_FREQUENCY_UNIT_TO_VALUE[label],
  }),
);

export const TaskForm = React.memo(({ onClose, onCreateTaskSuccess }) => {
  const practitionerSuggester = useSuggester('practitioner');
  const { mutate: createTask } = useCreateTask();
  const { mutate: createTaskSet } = useCreateTaskSet();
  const { encounter } = useEncounter();
  const { currentUser } = useAuth();

  const combinedTaskSuggester = useSuggester('multiReferenceData', {
    baseQueryParameters: { types: ['taskTemplate', 'taskSet'], relationType: 'task' },
    formatter: ({ id, name, ...other }) => ({ label: name, value: id, ...other }),
    baseBodyParameters: { type: 'taskTemplate' },
  });

  const [selectedTask, setSelectedTask] = useState('');

  const onSubmit = values => {
    if (selectedTask.type === 'taskTemplate') {
      createTask(
        {
          ...values,
          encounterId: encounter.id,
          name: selectedTask.label,
        },
        {
          onSuccess: onCreateTaskSuccess,
        },
      );
    } else if (selectedTask.type === 'taskSet') {
      const tasks = selectedTask.children.map(({ name, taskTemplate }) => ({
        name,
        frequencyValue: taskTemplate.frequencyValue,
        frequencyUnit: taskTemplate.frequencyUnit,
        highPriority: taskTemplate.highPriority,
        designations: taskTemplate.designations.map(item => item.designationId),
      }));

      createTaskSet(
        {
          ...values,
          tasks,
          encounterId: encounter.id,
        },
        {
          onSuccess: onCreateTaskSuccess,
        },
      );
    }
    
  };

  const handleTaskChange = e => {
    setSelectedTask(e.target);
  };

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
                  onChange={handleTaskChange}
                />
                <Field
                  name="startTime"
                  label={
                    <TranslatedText
                      stringId="encounter.task.startTime.label"
                      fallback="Start date & time"
                    />
                  }
                  saveDateAsString
                  required
                  component={DateTimeField}
                  min={getCurrentDateTimeString().slice(0, -3)}
                />
              </FormGrid>
              <FormGrid style={{ gridColumn: 'span 2' }}>
                <Field
                  name="requestedByUserId"
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
                  name="requestTime"
                  label={
                    <TranslatedText
                      stringId="encounter.task.requestTime.label"
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
            </FormGrid>
            {selectedTask && <Divider style={{ margin: '20px 0 20px 0' }} />}
            {selectedTask.type === 'taskTemplate' && (
              <FormGrid style={{ gridColumn: 'span 2' }}>
                <Field
                  name="designations"
                  label={
                    <TranslatedText
                      stringId="general.localisedField.assignedTo.label"
                      fallback="Assigned to"
                    />
                  }
                  component={SuggesterSelectField}
                  endpoint="designation"
                  isMulti
                />
                <NestedFormGrid>
                  <Field
                    name="frequencyValue"
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
                    component={SelectField}
                    options={taskFrequencyUnitOptions}
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
            )}
            {selectedTask.type === 'taskSet' && <TaskSetTable tasks={selectedTask.children} />}

            <Divider style={{ margin: '28px -32px 20px -32px' }} />
            <FormSubmitCancelRow
              onCancel={handleCancel}
              onConfirm={submitForm}
              confirmText={<TranslatedText stringId="general.action.confirm" fallback="Confirm" />}
            />
          </div>
        );
      }}
      formType={FORM_TYPES.CREATE_FORM}
      validationSchema={yup.object().shape({
        taskId: foreignKey()
          .required()
          .translatedLabel(<TranslatedText stringId="encounter.task.task.label" fallback="Task" />),
        startTime: yup
          .date()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="encounter.task.startTime.label"
              fallback="Start date & time"
            />,
          ),
        requestedByUserId: foreignKey()
          .required()
          .translatedLabel(
            <TranslatedText stringId="encounter.task.requestedBy.label" fallback="Requested by" />,
          ),
        requestTime: yup
          .date()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="encounter.task.requestTime.label"
              fallback="Request date & time"
            />,
          ),
        note: yup.string(),
        highPriority: yup.boolean(),
      })}
      initialValues={{
        taskId: selectedTask?.value,
        startTime: getCurrentDateTimeString(),
        requestTime: getCurrentDateTimeString(),
        requestedByUserId: currentUser?.id,
        designations: selectedTask?.taskTemplate?.designations?.map(item => item.designationId),
        highPriority: selectedTask?.taskTemplate?.highPriority,
        frequencyValue: selectedTask?.taskTemplate?.frequencyValue,
        frequencyUnit: selectedTask?.taskTemplate?.frequencyUnit,
      }}
      enableReinitialize
    />
  );
});
