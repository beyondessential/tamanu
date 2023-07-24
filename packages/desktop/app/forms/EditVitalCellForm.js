import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { Box, IconButton, Typography } from '@material-ui/core';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import { useQueryClient } from '@tanstack/react-query';
import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/shared/constants';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { ConfirmCancelRow } from '../components/ButtonRow';
import { SelectField, Form, Field, OuterLabelFieldWrapper } from '../components/Field';
import { useConfig } from '../contexts/Localisation';
import { FormGrid } from '../components/FormGrid';
import { FormSeparatorLine } from '../components/FormSeparatorLine';
import { SurveyQuestion } from '../components/Surveys';
import { getValidationSchema } from '../utils';
import { Colors } from '../constants';
import { useApi } from '../api';
import { useEncounter } from '../contexts/Encounter';
import { DateDisplay } from '../components/DateDisplay';

const Text = styled(Typography)`
  font-size: 14px;
  line-height: 24px;
  font-weight: 500;
  text-decoration: underline;
`;

const DeleteEntryButton = ({ disabled, onClick }) => (
  <Box display="flex" alignSelf="end">
    <IconButton color="primary" edge="start" disabled={disabled} onClick={onClick} disableRipple>
      <DeleteOutlineIcon fontSize="small" />
      <Text>Delete entry</Text>
    </IconButton>
  </Box>
);

const getEditVitalData = (vitalComponent, mandatoryVitalEditReason) => {
  const reasonForChangeMockComponent = {
    dataElement: { type: PROGRAM_DATA_ELEMENT_TYPES.SELECT },
    validationCriteria: JSON.stringify({ mandatory: mandatoryVitalEditReason }),
    dataElementId: 'reasonForChange',
  };
  const editVitalData = [reasonForChangeMockComponent];
  if (vitalComponent) editVitalData.push(vitalComponent);
  return { components: editVitalData };
};

const LogContainer = styled(Box)`
  & + & {
    margin-top: 10px;
  }
`;
const LogText = styled(Typography)`
  font-size: 14px;
  line-height: 18px;
`;

const LogTextSmall = styled(Typography)`
  font-size: 11px;
  line-height: 15px;
  font-weight: 500;
  letter-spacing: 0;
  color: ${Colors.softText};
`;

const HistoryLog = ({ logData, vitalLabel, vitalEditReasons }) => {
  const { date, newValue, reasonForChange, userDisplayName } = logData;
  const reasonForChangeOption = vitalEditReasons.find(option => option.value === reasonForChange);
  const reasonForChangeLabel = reasonForChangeOption?.label ?? 'Unknown';
  return (
    <LogContainer>
      <LogText>
        {vitalLabel}: {newValue === '' ? 'Entry deleted' : newValue}
      </LogText>
      {reasonForChange && <LogText>Reason for change to record: {reasonForChangeLabel}</LogText>}
      <LogTextSmall>
        {userDisplayName} <DateDisplay date={date} showTime shortYear />
      </LogTextSmall>
    </LogContainer>
  );
};

export const EditVitalCellForm = ({ vitalLabel, dataPoint, handleClose }) => {
  const [isDeleted, setIsDeleted] = useState(false);
  const api = useApi();
  const queryClient = useQueryClient();
  const { encounter } = useEncounter();
  const [vitalEditReasons = [], mandatoryVitalEditReason] = useConfig([
    'vitalEditReasons',
    'features.mandatoryVitalEditReason',
  ]);
  const initialValue = dataPoint.value;
  const showDeleteEntryButton = ['', undefined].includes(initialValue) === false;
  const valueName = dataPoint.component.dataElement.id;
  const editVitalData = getEditVitalData(dataPoint.component, mandatoryVitalEditReason);
  const validationSchema = getValidationSchema(editVitalData);
  const handleDeleteEntry = useCallback(
    setFieldValue => {
      setFieldValue(valueName, '');
      setIsDeleted(true);
    },
    [valueName],
  );
  const handleSubmit = async data => {
    const newShapeData = {
      date: getCurrentDateTimeString(),
    };
    Object.entries(data).forEach(([key, value]) => {
      if (key === valueName) newShapeData.newValue = value;
      else newShapeData[key] = value;
    });

    // The survey response answer might not exist
    if (dataPoint.answerId) {
      await api.put(`surveyResponseAnswer/vital/${dataPoint.answerId}`, newShapeData);
    } else {
      const newVitalData = {
        ...newShapeData,
        dataElementId: valueName,
        encounterId: encounter.id,
        recordedDate: dataPoint.recordedDate,
      };
      await api.post('surveyResponseAnswer/vital', newVitalData);
    }
    queryClient.invalidateQueries(['encounterVitals', encounter.id]);
    handleClose();
  };
  const validateFn = values => {
    const errors = {};
    if (values[valueName] === initialValue) {
      errors[valueName] = 'New value cannot be the same as previous value.';
    }
    return errors;
  };

  return (
    <Form
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
      initialValues={{ [valueName]: initialValue }}
      validate={validateFn}
      render={({ setFieldValue, submitForm }) => (
        <FormGrid columns={4}>
          <SurveyQuestion component={dataPoint.component} disabled={isDeleted} />
          {showDeleteEntryButton && (
            <DeleteEntryButton
              disabled={isDeleted}
              onClick={() => handleDeleteEntry(setFieldValue)}
            />
          )}
          <Field
            required={mandatoryVitalEditReason}
            component={SelectField}
            label="Reason for change to record"
            name="reasonForChange"
            options={vitalEditReasons}
            style={{ gridColumn: '1 / 4' }}
          />
          <FormSeparatorLine />
          <OuterLabelFieldWrapper label="History" style={{ gridColumn: '1 / -1' }}>
            <Box
              height="162px"
              overflow="auto"
              padding="13px 12px 13px 15px"
              bgcolor="white"
              border="1px solid #dedede"
              borderRadius="3px"
            >
              {dataPoint.historyLogs.map(log => (
                <HistoryLog
                  key={log.date}
                  vitalLabel={vitalLabel}
                  vitalEditReasons={vitalEditReasons}
                  logData={log}
                />
              ))}
            </Box>
          </OuterLabelFieldWrapper>
          <ConfirmCancelRow onCancel={handleClose} onConfirm={submitForm} confirmText="Save" />
        </FormGrid>
      )}
    />
  );
};
