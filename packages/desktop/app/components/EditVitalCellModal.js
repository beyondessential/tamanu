import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { Box, IconButton, Typography } from '@material-ui/core';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import { PROGRAM_DATA_ELEMENT_TYPES } from 'shared/constants';
import { Modal } from './Modal';
import { ConfirmCancelRow } from './ButtonRow';
import { SelectField, Form, Field, OuterLabelFieldWrapper } from './Field';
import { useLocalisation } from '../contexts/Localisation';
import { FormGrid } from './FormGrid';
import { FormSeparatorLine } from './FormSeparatorLine';
import { formatShortest, formatTime } from './DateDisplay';
import { SurveyQuestion } from './Surveys';
import { getValidationSchema } from '../utils';
import { Colors } from '../constants';

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
    validationCriteria: JSON.stringify({ mandatory: mandatoryVitalEditReason || true }),
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
  const { date, previousValue, reasonForChange, userDisplayName } = logData;
  const reasonForChangeOption = vitalEditReasons.find(option => option.value === reasonForChange);
  const reasonForChangeLabel = reasonForChangeOption?.label ?? 'N/A';
  return (
    <LogContainer>
      <LogText>
        {vitalLabel}: {previousValue}
      </LogText>
      <LogText>Reason for change to record: {reasonForChangeLabel}</LogText>
      <LogTextSmall>
        {userDisplayName} {date}
      </LogTextSmall>
    </LogContainer>
  );
};

export const EditVitalCellModal = ({ open, dataPoint, onConfirm, onClose }) => {
  const [isDeleted, setIsDeleted] = useState(false);
  const handleClose = useCallback(() => {
    setIsDeleted(false);
    onClose();
  }, [onClose]);
  const { getLocalisation } = useLocalisation();
  const vitalEditReasons = getLocalisation('vitalEditReasons') || [];
  const mandatoryVitalEditReason = getLocalisation('mandatoryVitalEditReason');
  const vitalLabel = dataPoint?.component.dataElement.name;
  const date = formatShortest(dataPoint?.recordedDate);
  const time = formatTime(dataPoint?.recordedDate);
  const title = `${vitalLabel} | ${date} | ${time}`;
  const initialValue = dataPoint?.value;
  const showDeleteEntryButton = initialValue !== '';
  const valueName = dataPoint?.component.dataElement.id;
  const editVitalData = getEditVitalData(dataPoint?.component, mandatoryVitalEditReason);
  const validationSchema = getValidationSchema(editVitalData);
  const handleDeleteEntry = useCallback(
    setFieldValue => {
      setFieldValue(valueName, '');
      setIsDeleted(true);
    },
    [valueName],
  );

  return (
    <Modal width="sm" title={title} onClose={handleClose} open={open}>
      <Form
        onSubmit={onConfirm}
        validationSchema={validationSchema}
        initialValues={{ [valueName]: initialValue }}
        render={({
          // value: formValue,
          setFieldValue,
          submitForm,
        }) => (
          <FormGrid columns={4}>
            <SurveyQuestion component={dataPoint?.component} disabled={isDeleted} />
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
                {dataPoint?.historyLogs.map(log => (
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
    </Modal>
  );
};
