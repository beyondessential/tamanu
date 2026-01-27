import React, { useState } from 'react';
import * as yup from 'yup';
import {
  TextField,
  TranslatedSelectField,
  Form,
  FormGrid,
  FormSubmitCancelRow,
  useDateTimeFormat,
} from '@tamanu/ui-components';
import { Colors } from '../constants/styles';
import styled from 'styled-components';
import PriorityHighIcon from '@material-ui/icons/PriorityHigh';
import { Box, Divider } from '@material-ui/core';
import { useQueryClient } from '@tanstack/react-query';
import {
  REFERENCE_DATA_RELATION_TYPES,
  REFERENCE_TYPES,
  TASK_FREQUENCY_UNIT_LABELS,
  TASK_DURATION_UNIT_LABELS,
  FORM_TYPES,
} from '@tamanu/constants';

import {
  AutocompleteField,
  CheckField,
  DateTimeField,
  Field,
  NumberField,
  SuggesterSelectField,
} from '../components/Field';

import { TranslatedText } from '../components/Translation/TranslatedText';
import { useSuggester } from '../api';
import { REFERENCE_DATA_TYPE_TO_LABEL } from '../constants/task';
import { foreignKey } from '../utils/validation';
import { preventInvalidNumber } from '../utils';
import { TaskSetTable } from '../components/Tasks/TaskSetTable';
import { useCreateTasks } from '../api/mutations/useTaskMutation';
import { useEncounter } from '../contexts/Encounter';
import { useAuth } from '../contexts/Auth';
import { useTranslation } from '../contexts/Translation';
import { ConditionalTooltip } from '../components/Tooltip';

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
  display: flex;
  justify-content: center;
  height: 100%;
  margin-top: 10px;
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
  const { getCountryCurrentDateTimeString, getFacilityCurrentDateTimeString } = useDateTimeFormat();
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
      durationValue,
      durationUnit,
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
            ...(frequencyValue &&
              frequencyUnit && { frequencyValue: Number(frequencyValue), frequencyUnit }),
            ...(durationValue && durationUnit && { durationValue, durationUnit }),
            designationIds:
              typeof designationIds === 'string' ? JSON.parse(designationIds) : designationIds,
          },
        ],
        startTime: startTimeString,
      };
    } else if (selectedTask.type === REFERENCE_TYPES.TASK_SET) {
      const tasks = selectedTask.children.map(({ name, taskTemplate }) => ({
        name,
        ...(taskTemplate.frequencyValue &&
          taskTemplate.frequencyUnit && {
            frequencyValue: Number(taskTemplate.frequencyValue),
            frequencyUnit: taskTemplate.frequencyUnit,
          }),
        highPriority: !!taskTemplate.highPriority,
        designationIds: taskTemplate.designations.map(item => item.designationId),
        startTime: startTimeString,
        ...(durationValue && durationUnit && { durationValue, durationUnit }),
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
      render={({ submitForm, setFieldValue, values }) => {
        return (
          <div>
            <FormGrid data-testid="formgrid-6mdj">
              <FormGrid style={{ gridColumn: 'span 2' }} data-testid="formgrid-xzvu">
                <Field
                  name="taskId"
                  label={
                    <TranslatedText
                      stringId="encounter.task.task.label"
                      fallback="Task"
                      data-testid="translatedtext-5mtn"
                    />
                  }
                  component={AutocompleteField}
                  suggester={combinedTaskSuggester}
                  multiSection
                  allowCreatingCustomValue={canCreateReferenceData}
                  groupByKey="type"
                  getSectionTitle={section => REFERENCE_DATA_TYPE_TO_LABEL[section.type]}
                  required
                  onChange={e => handleTaskChange(e, { setFieldValue })}
                  data-testid="field-hp09"
                />
                <Field
                  name="startTime"
                  label={
                    <TranslatedText
                      stringId="encounter.task.startTime.label"
                      fallback="Start date & time"
                      data-testid="translatedtext-as4z"
                    />
                  }
                  saveDateAsString
                  required
                  component={DateTimeField}
                  min={getFacilityCurrentDateTimeString().slice(0, -3)}
                  data-testid="field-om46"
                />
              </FormGrid>
              <FormGrid style={{ gridColumn: 'span 2' }} data-testid="formgrid-qmek">
                <Field
                  name="requestedByUserId"
                  label={
                    <TranslatedText
                      stringId="encounter.task.requestedBy.label"
                      fallback="Requested by"
                      data-testid="translatedtext-qqag"
                    />
                  }
                  required
                  component={AutocompleteField}
                  suggester={practitionerSuggester}
                  data-testid="field-xhot"
                />
                <Field
                  name="requestTime"
                  label={
                    <TranslatedText
                      stringId="encounter.task.requestTime.label"
                      fallback="Request date & time"
                      data-testid="translatedtext-342j"
                    />
                  }
                  saveDateAsString
                  required
                  component={DateTimeField}
                  data-testid="field-yduo"
                />
              </FormGrid>
              <Field
                name="note"
                label={
                  <TranslatedText
                    stringId="general.notes.label"
                    fallback="Notes"
                    data-testid="translatedtext-h0ro"
                  />
                }
                component={TextField}
                multiline
                minRows={4}
                style={{ gridColumn: 'span 2' }}
                data-testid="field-e475"
              />
            </FormGrid>
            {selectedTask?.value && (
              <Divider style={{ margin: '20px 0 20px 0' }} data-testid="divider-ce3j" />
            )}
            {selectedTask.type === REFERENCE_TYPES.TASK_TEMPLATE && (
              <FormGrid style={{ gridColumn: 'span 2' }} data-testid="formgrid-2sm7">
                <NestedFormGrid data-testid="nestedformgrid-0y7w">
                  <Field
                    name="frequencyValue"
                    label={
                      <TranslatedText
                        stringId="task.frequency.label"
                        fallback="Frequency (if repeating task)"
                        data-testid="translatedtext-o2sl"
                      />
                    }
                    min={0}
                    component={NumberField}
                    onInput={preventInvalidNumber}
                    data-testid="field-7vdy"
                    onChange={e => {
                      if (!e.target.value) {
                        setFieldValue('durationValue', '');
                        setFieldValue('durationUnit', '');
                      }
                    }}
                  />
                  <Field
                    name="frequencyUnit"
                    label={<InvisibleTitle data-testid="invisibletitle-ioaf">.</InvisibleTitle>}
                    component={TranslatedSelectField}
                    enumValues={TASK_FREQUENCY_UNIT_LABELS}
                    data-testid="field-tadr"
                    onChange={e => {
                      if (!e.target.value) {
                        setFieldValue('durationValue', '');
                        setFieldValue('durationUnit', '');
                      }
                    }}
                  />
                </NestedFormGrid>
                <ConditionalTooltip
                  PopperProps={{
                    modifiers: {
                      flip: {
                        enabled: false,
                      },
                      offset: {
                        enabled: true,
                        offset: '0, -25',
                      },
                    },
                  }}
                  visible={!values.frequencyUnit || !values.frequencyValue}
                  title={
                    <Box fontWeight={400} maxWidth={155}>
                      <TranslatedText
                        stringId="task.duration.tooltip"
                        fallback="Select a frequency first in order to set the duration"
                      />
                    </Box>
                  }
                >
                  <NestedFormGrid>
                    <Field
                      name="durationValue"
                      label={<TranslatedText stringId="task.duration.label" fallback="Duration" />}
                      min={0}
                      component={NumberField}
                      onInput={preventInvalidNumber}
                      disabled={!values.frequencyUnit || !values.frequencyValue}
                      data-testid="field-0n8f"
                    />
                    <Field
                      name="durationUnit"
                      label={<InvisibleTitle>.</InvisibleTitle>}
                      component={TranslatedSelectField}
                      enumValues={TASK_DURATION_UNIT_LABELS}
                      disabled={!values.frequencyUnit || !values.frequencyValue}
                      data-testid="field-qy5a"
                    />
                  </NestedFormGrid>
                </ConditionalTooltip>
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
                <StyledCheckField
                  name="highPriority"
                  label={
                    <span>
                      <StyledPriorityHighIcon data-testid="styledpriorityhighicon-cntl" />
                      <TranslatedText
                        stringId="encounter.task.highPriority.label"
                        fallback="High priority task"
                        data-testid="translatedtext-fyjp"
                      />
                    </span>
                  }
                  component={CheckField}
                  data-testid="styledcheckfield-qicr"
                />
              </FormGrid>
            )}
            {selectedTask.type === REFERENCE_TYPES.TASK_SET && (
              <TaskSetTable tasks={selectedTask.children} data-testid="tasksettable-oltp" />
            )}
            <Divider style={{ margin: '28px -32px 20px -32px' }} data-testid="divider-s2ki" />
            <FormSubmitCancelRow
              onCancel={onClose}
              onConfirm={submitForm}
              confirmText={
                <TranslatedText
                  stringId="general.action.confirm"
                  fallback="Confirm"
                  data-testid="translatedtext-fdxl"
                />
              }
              confirmDisabled={isCreatingTasks}
              data-testid="formsubmitcancelrow-jcmz"
            />
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
            then: yup
              .number()
              .positive(
                getTranslation('general.validation.number.positive', 'Number must be positive'),
              )
              .required(getTranslation('validation.required.inline', '*Required')),
          }),
          frequencyUnit: yup.string().when('frequencyValue', {
            is: value => !!value,
            then: yup.string().required(getTranslation('validation.required.inline', '*Required')),
          }),
          durationValue: yup
            .number()
            .positive(
              getTranslation('general.validation.number.positive', 'Number must be positive'),
            ),
          durationUnit: yup.string(),
        },
        ['frequencyValue', 'frequencyUnit'],
      )}
      initialValues={{
        startTime: getCountryCurrentDateTimeString(),
        requestTime: getCountryCurrentDateTimeString(),
        requestedByUserId: currentUser?.id,
      }}
      data-testid="form-gy7l"
    />
  );
});
