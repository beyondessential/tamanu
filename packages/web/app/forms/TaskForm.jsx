import React, { useState } from 'react';
import * as yup from 'yup';

import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import styled from 'styled-components';
import PriorityHighIcon from '@material-ui/icons/PriorityHigh';
import { Divider } from '@material-ui/core';
import {
  REFERENCE_DATA_RELATION_TYPES,
  REFERENCE_TYPES,
  TASK_FREQUENCY_UNIT_LABELS,
} from '@tamanu/constants';

import {
  AutocompleteField,
  CheckField,
  DateTimeField,
  Field,
  Form,
  NumberField,
  SuggesterSelectField,
  TextField,
  TranslatedSelectField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { FormSubmitCancelRow } from '../components/ButtonRow';

import { TranslatedText } from '../components/Translation/TranslatedText';
import { useSuggester } from '../api';
import { REFERENCE_DATA_TYPE_TO_LABEL } from '../constants/task';
import { Colors, FORM_TYPES } from '../constants';
import { foreignKey } from '../utils/validation';
import { preventInvalidNumber } from '../utils';
import { TaskSetTable } from '../components/Tasks/TaskSetTable';
import { useCreateTasks } from '../api/mutations/useTaskMutation';
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

export const TaskForm = React.memo(({ onClose, refreshTaskTable }) => {
  const practitionerSuggester = useSuggester('practitioner');
  const { mutate: createTasks, isLoading: isCreatingTasks } = useCreateTasks();
  const { encounter } = useEncounter();
  const { currentUser } = useAuth();

  const combinedTaskSuggester = useSuggester('multiReferenceData', {
    baseQueryParameters: {
      types: [REFERENCE_TYPES.TASK_TEMPLATE, REFERENCE_TYPES.TASK_SET],
      relationType: REFERENCE_DATA_RELATION_TYPES.TASK,
    },
    formatter: ({ id, name, ...other }) => ({ label: name, value: id, ...other }),
    baseBodyParameters: { type: REFERENCE_TYPES.TASK_TEMPLATE },
  });

  const [selectedTask, setSelectedTask] = useState({});

  const onSubmit = values => {
    const {
      designationIds,
      requestTime,
      startTime,
      highPriority,
      frequencyValue,
      frequencyUnit,
      ...other
    } = values;
    const requestTimeString = new Date(requestTime).toISOString();
    const startTimeString = new Date(startTime).toISOString();

    let payload;

    if (selectedTask.type === REFERENCE_TYPES.TASK_TEMPLATE) {
      payload = {
        ...other,
        requestTime: requestTimeString,
        startTime: startTimeString,
        encounterId: encounter.id,
        tasks: [
          {
            name: selectedTask.label,
            highPriority: !!highPriority,
            frequencyValue,
            frequencyUnit,
            designationIds:
              typeof designationIds === 'string' ? JSON.parse(designationIds) : designationIds,
          },
        ],
      };
    } else if (selectedTask.type === REFERENCE_TYPES.TASK_SET) {
      const tasks = selectedTask.children.map(({ name, taskTemplate }) => ({
        name,
        ...(taskTemplate.frequencyValue && { frequencyValue: Number(taskTemplate.frequencyValue) }),
        frequencyUnit: taskTemplate.frequencyUnit,
        highPriority: !!taskTemplate.highPriority,
        designationIds: taskTemplate.designations.map(item => item.designationId),
      }));

      payload = {
        ...values,
        requestTime: requestTimeString,
        startTime: startTimeString,
        tasks,
        encounterId: encounter.id,
      };
    }
    createTasks(payload, {
      onSuccess: () => {
        refreshTaskTable();
        onClose();
      },
    });
  };

  const handleTaskChange = (e, { setFieldValue }) => {
    const selectedTask = e.target;
    setSelectedTask(selectedTask);

    if (selectedTask?.type === REFERENCE_TYPES.TASK_TEMPLATE) {
      const { taskTemplate = {} } = selectedTask;
      const { designations, highPriority, frequencyValue, frequencyUnit } = taskTemplate;

      setFieldValue(
        'designationIds',
        designations?.map(item => item.designationId),
      );
      setFieldValue('highPriority', highPriority);
      setFieldValue('frequencyValue', Number(frequencyValue));
      setFieldValue('frequencyUnit', frequencyUnit);
    }
  };

  return (
    <Form
      onSubmit={onSubmit}
      render={({ submitForm, setFieldValue }) => {
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
                  orderByValues={[REFERENCE_TYPES.TASK_SET, REFERENCE_TYPES.TASK_TEMPLATE]}
                  required
                  onChange={e => handleTaskChange(e, { setFieldValue })}
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
                label={<TranslatedText stringId="general.notes.label" fallback="Notes" />}
                component={TextField}
                multiline
                minRows={4}
                style={{ gridColumn: 'span 2' }}
              />
            </FormGrid>
            {selectedTask?.value && <Divider style={{ margin: '20px 0 20px 0' }} />}
            {selectedTask.type === REFERENCE_TYPES.TASK_TEMPLATE && (
              <FormGrid style={{ gridColumn: 'span 2' }}>
                <Field
                  name="designationIds"
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
                    component={TranslatedSelectField}
                    enumValues={TASK_FREQUENCY_UNIT_LABELS}
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
            {selectedTask.type === REFERENCE_TYPES.TASK_SET && (
              <TaskSetTable tasks={selectedTask.children} />
            )}

            <Divider style={{ margin: '28px -32px 20px -32px' }} />
            <FormSubmitCancelRow
              onCancel={onClose}
              onConfirm={submitForm}
              confirmText={<TranslatedText stringId="general.action.confirm" fallback="Confirm" />}
              confirmDisabled={isCreatingTasks}
            />
          </div>
        );
      }}
      formType={FORM_TYPES.CREATE_FORM}
      validationSchema={yup.object().shape(
        {
          taskId: foreignKey()
            .translatedLabel(
              <TranslatedText stringId="encounter.task.task.label" fallback="Task" />,
            )
            .required(),
          startTime: yup
            .date()
            .translatedLabel(
              <TranslatedText
                stringId="encounter.task.startTime.label"
                fallback="Start date & time"
              />,
            )
            .required(),
          requestedByUserId: foreignKey()
            .translatedLabel(
              <TranslatedText
                stringId="encounter.task.requestedBy.label"
                fallback="Requested by"
              />,
            )
            .required(),
          requestTime: yup
            .date()
            .translatedLabel(
              <TranslatedText
                stringId="encounter.task.requestTime.label"
                fallback="Request date & time"
              />,
            )
            .required(),
          note: yup.string(),
          highPriority: yup.boolean(),
          frequencyValue: yup.number().when('frequencyUnit', {
            is: unit => !!unit,
            then: yup
              .number()
              .translatedLabel(
                <TranslatedText stringId="task.frequency.label.short" fallback="Frequency" />,
              )
              .required(),
          }),
          frequencyUnit: yup.string().when('frequencyValue', {
            is: value => !!value,
            then: yup
              .string()
              .translatedLabel(
                <TranslatedText stringId="task.frequencyUnit.label" fallback="Frequency unit" />,
              )
              .required(),
          }),
        },
        ['frequencyValue', 'frequencyUnit'],
      )}
      initialValues={{
        startTime: getCurrentDateTimeString(),
        requestTime: getCurrentDateTimeString(),
        requestedByUserId: currentUser?.id,
      }}
    />
  );
});
