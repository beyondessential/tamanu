import React, { useState } from 'react';
import * as yup from 'yup';

import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import styled from 'styled-components';
import PriorityHighIcon from '@material-ui/icons/PriorityHigh';
import { Divider } from '@material-ui/core';
import { useQueryClient } from '@tanstack/react-query';
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
import { useTranslation } from '../contexts/Translation';

const NestedFormGrid = styled.div`
  display: flex;
  gap: 5px;
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

const InvisibleTitle = styled.div`
  opacity: 0;
`;

export const TaskForm = React.memo(({ onClose, refreshTaskTable }) => {
  const practitionerSuggester = useSuggester('practitioner');
  const { mutate: createTasks, isLoading: isCreatingTasks } = useCreateTasks();
  const { encounter } = useEncounter();
  const { ability, currentUser } = useAuth();
  const { getTranslation } = useTranslation();
  const queryClient = useQueryClient();
  const canCreateReferenceData = ability.can('create', 'ReferenceData');

  const combinedTaskSuggester = useSuggester('multiReferenceData', {
    baseQueryParameters: {
      types: [REFERENCE_TYPES.TASK_SET, REFERENCE_TYPES.TASK_TEMPLATE],
      relationType: REFERENCE_DATA_RELATION_TYPES.TASK,
    },
    formatter: ({ id, name, ...other }) => ({ label: name, value: id, ...other }),
    baseBodyParameters: { type: REFERENCE_TYPES.TASK_TEMPLATE },
  });

  const [selectedTask, setSelectedTask] = useState({});

  const onSubmit = values => {
    const {
      designationIds,
      highPriority,
      frequencyValue,
      frequencyUnit,
      startTime,
      ...other
    } = values;
    let payload;

    const startTimeString = startTime.substring(0, startTime.length - 2) + '00';

    if (selectedTask.type === REFERENCE_TYPES.TASK_TEMPLATE) {
      payload = {
        ...other,
        encounterId: encounter.id,
        tasks: [
          {
            name: selectedTask.label,
            highPriority: !!highPriority,
            ...(frequencyValue && { frequencyValue }),
            ...(frequencyUnit && { frequencyUnit }),
            designationIds:
              typeof designationIds === 'string' ? JSON.parse(designationIds) : designationIds,
          },
        ],
        startTime: startTimeString,
      };
    } else if (selectedTask.type === REFERENCE_TYPES.TASK_SET) {
      const tasks = selectedTask.children.map(({ name, taskTemplate }) => ({
        name,
        ...(taskTemplate.frequencyValue && { frequencyValue: Number(taskTemplate.frequencyValue) }),
        frequencyUnit: taskTemplate.frequencyUnit,
        highPriority: !!taskTemplate.highPriority,
        designationIds: taskTemplate.designations.map(item => item.designationId),
        startTime: startTimeString,
      }));

      payload = {
        ...values,
        tasks,
        encounterId: encounter.id,
      };
    }
    createTasks(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries([`user/tasks`]);
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
      frequencyValue ? setFieldValue('frequencyValue', Number(frequencyValue)) : null;
      setFieldValue('frequencyUnit', frequencyUnit);
    }
  };

  return (
    <Form
      showInlineErrorsOnly
      onSubmit={onSubmit}
      render={({ submitForm, setFieldValue }) => {
        return (
          <div>
            <FormGrid>
              <FormGrid style={{ gridColumn: 'span 2' }}>
                <Field
                  name="taskId"
                  label={<TranslatedText
                    stringId="encounter.task.task.label"
                    fallback="Task"
                    data-test-id='translatedtext-lab0' />}
                  component={AutocompleteField}
                  suggester={combinedTaskSuggester}
                  multiSection
                  allowCreatingCustomValue={canCreateReferenceData}
                  groupByKey="type"
                  getSectionTitle={section => REFERENCE_DATA_TYPE_TO_LABEL[section.type]}
                  required
                  onChange={e => handleTaskChange(e, { setFieldValue })}
                  data-test-id='field-uxad' />
                <Field
                  name="startTime"
                  label={
                    <TranslatedText
                      stringId="encounter.task.startTime.label"
                      fallback="Start date & time"
                      data-test-id='translatedtext-mmlw' />
                  }
                  saveDateAsString
                  required
                  component={DateTimeField}
                  min={getCurrentDateTimeString().slice(0, -3)}
                  data-test-id='field-sc8c' />
              </FormGrid>
              <FormGrid style={{ gridColumn: 'span 2' }}>
                <Field
                  name="requestedByUserId"
                  label={
                    <TranslatedText
                      stringId="encounter.task.requestedBy.label"
                      fallback="Requested by"
                      data-test-id='translatedtext-oonz' />
                  }
                  required
                  component={AutocompleteField}
                  suggester={practitionerSuggester}
                  data-test-id='field-xiwj' />
                <Field
                  name="requestTime"
                  label={
                    <TranslatedText
                      stringId="encounter.task.requestTime.label"
                      fallback="Request date & time"
                      data-test-id='translatedtext-psme' />
                  }
                  saveDateAsString
                  required
                  component={DateTimeField}
                  data-test-id='field-f3x4' />
              </FormGrid>
              <Field
                name="note"
                label={<TranslatedText
                  stringId="general.notes.label"
                  fallback="Notes"
                  data-test-id='translatedtext-qkzg' />}
                component={TextField}
                multiline
                minRows={4}
                style={{ gridColumn: 'span 2' }}
                data-test-id='field-9tai' />
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
                      data-test-id='translatedtext-a383' />
                  }
                  component={SuggesterSelectField}
                  endpoint="designation"
                  isMulti
                  data-test-id='field-3yna' />
                <NestedFormGrid>
                  <Field
                    name="frequencyValue"
                    label={
                      <TranslatedText
                        stringId="task.frequency.label"
                        fallback="Frequency (if repeating task)"
                        data-test-id='translatedtext-2vk2' />
                    }
                    min={0}
                    component={NumberField}
                    onInput={preventInvalidNumber}
                    data-test-id='field-2x3x' />
                  <Field
                    name="frequencyUnit"
                    label={<InvisibleTitle>.</InvisibleTitle>}
                    component={TranslatedSelectField}
                    enumValues={TASK_FREQUENCY_UNIT_LABELS}
                    data-test-id='field-beam' />
                </NestedFormGrid>
                <StyledCheckField
                  name="highPriority"
                  label={
                    <span>
                      <StyledPriorityHighIcon />
                      <TranslatedText
                        stringId="encounter.task.highPriority.label"
                        fallback="High priority task"
                        data-test-id='translatedtext-hrgk' />
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
              confirmText={<TranslatedText
                stringId="general.action.confirm"
                fallback="Confirm"
                data-test-id='translatedtext-suri' />}
              confirmDisabled={isCreatingTasks}
              data-test-id='formsubmitcancelrow-qcoh' />
          </div>
        );
      }}
      formType={FORM_TYPES.CREATE_FORM}
      validationSchema={yup.object().shape(
        {
          taskId: foreignKey().required(getTranslation('validation.required.inline', '*Required')),
          startTime: yup
            .date()
            .required(getTranslation('validation.required.inline', '*Required'))
            .min(
              new Date(new Date().setHours(0, 0, 0, 0)),
              getTranslation('general.validation.date.cannotInPast', 'Date cannot be in the past'),
            ),
          requestedByUserId: foreignKey().required(
            getTranslation('validation.required.inline', '*Required'),
          ),
          requestTime: yup
            .date()
            .required(getTranslation('validation.required.inline', '*Required'))
            .min(
              new Date(new Date().setHours(0, 0, 0, 0)),
              getTranslation('general.validation.date.cannotInPast', 'Date cannot be in the past'),
            ),
          note: yup.string(),
          highPriority: yup.boolean(),
          frequencyValue: yup.number().when('frequencyUnit', {
            is: unit => !!unit,
            then: yup.number().required(getTranslation('validation.required.inline', '*Required')),
          }),
          frequencyUnit: yup.string().when('frequencyValue', {
            is: value => !!value,
            then: yup.string().required(getTranslation('validation.required.inline', '*Required')),
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
