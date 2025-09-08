import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { Box, IconButton, Typography } from '@material-ui/core';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import { useQueryClient } from '@tanstack/react-query';
import { subject } from '@casl/ability';
import { PROGRAM_DATA_ELEMENT_TYPES, SETTING_KEYS } from '@tamanu/constants';
import { SurveyQuestion, getValidationSchema } from '@tamanu/ui-components';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { DateDisplay, FormSeparatorLine, FormSubmitCancelRow, TranslatedText } from '../components';
import { BaseSelectField, Field, Form, OuterLabelFieldWrapper } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { Colors, FORM_TYPES } from '../constants';
import { useApi } from '../api';
import { useEncounter } from '../contexts/Encounter';
import { useSettings } from '../contexts/Settings';
import { useTranslation } from '../contexts/Translation';
import { useAuth } from '../contexts/Auth';
import { TranslatedOption } from '../components/Translation/TranslatedOptions';

const Text = styled(Typography)`
  font-size: 14px;
  line-height: 24px;
  font-weight: 500;
  text-decoration: underline;
`;

const DeleteEntryButton = ({ disabled, onClick }) => (
  <Box display="flex" alignSelf="start" marginTop="18px" data-testid="box-bp7f">
    <IconButton
      color="primary"
      edge="start"
      disabled={disabled}
      onClick={onClick}
      disableRipple
      data-testid="iconbutton-o9qe"
    >
      <DeleteOutlineIcon fontSize="small" data-testid="deleteoutlineicon-cb9o" />
      <Text data-testid="text-pcnu">
        <TranslatedText
          stringId="encounter.vitals.action.deleteEntry"
          fallback="Delete entry"
          data-testid="translatedtext-y4vi"
        />
      </Text>
    </IconButton>
  </Box>
);

const getEditVitalData = (vitalComponent, isReasonMandatory) => {
  const reasonForChangeMockComponent = {
    dataElement: { type: PROGRAM_DATA_ELEMENT_TYPES.SELECT },
    validationCriteria: JSON.stringify({ mandatory: isReasonMandatory }),
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

  const translatedOption = newValue ? (
    <TranslatedOption
      value={newValue}
      referenceDataId={vitalLabel?.props.value}
      referenceDataCategory="programDataElement"
    />
  ) : (
    <TranslatedText stringId="vitals.logEntry.deleted" fallback="Entry deleted" />
  );

  return (
    <LogContainer data-testid="logcontainer-7d64">
      <LogText data-testid="logtext-bgs3">
        {vitalLabel}: {translatedOption}
      </LogText>
      {reasonForChange && (
        <LogText data-testid="logtext-kd9w">
          <TranslatedText
            stringId="encounter.vitals.editReason.label"
            fallback="Reason for change to record"
            data-testid="translatedtext-2rlu"
          />
          : {reasonForChangeLabel}
        </LogText>
      )}
      <LogTextSmall data-testid="logtextsmall-2hok">
        {userDisplayName}{' '}
        <DateDisplay date={date} showTime shortYear data-testid="datedisplay-tviy" />
      </LogTextSmall>
    </LogContainer>
  );
};

export const EditVitalCellForm = ({ vitalLabel, dataPoint, handleClose, isVital }) => {
  const { getTranslation } = useTranslation();
  const [isDeleted, setIsDeleted] = useState(false);
  const api = useApi();
  const queryClient = useQueryClient();
  const { encounter } = useEncounter();
  const { ability, facilityId } = useAuth();

  const { getSetting } = useSettings();
  const isReasonMandatory = isVital
    ? getSetting(SETTING_KEYS.FEATURES_MANDATORY_VITAL_EDIT_REASON)
    : getSetting(SETTING_KEYS.FEATURES_MANDATORY_CHARTING_EDIT_REASON);
  const vitalEditReasons = getSetting(SETTING_KEYS.VITAL_EDIT_REASONS);
  const permissionVerb = dataPoint.answerId ? 'write' : 'create';
  const permissionSubject = isVital
    ? 'Vitals'
    : subject('Charting', { id: dataPoint.component.surveyId });
  const hasPermission = ability.can(permissionVerb, permissionSubject);

  const initialValue = dataPoint.value;
  const showDeleteEntryButton = !['', undefined].includes(initialValue);
  const valueName = dataPoint.component.dataElement.id;
  const editVitalData = getEditVitalData(dataPoint.component, isReasonMandatory);
  const validationSchema = getValidationSchema(editVitalData, getTranslation, {
    encounterType: encounter.encounterType,
  });
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
      surveyId: dataPoint.component.surveyId,
    };
    Object.entries(data).forEach(([key, value]) => {
      if (key === valueName) newShapeData.newValue = value;
      else newShapeData[key] = value;
    });
    const directory = isVital ? 'vital' : 'chart';

    // The survey response answer might not exist
    if (dataPoint.answerId) {
      await api.put(`surveyResponseAnswer/${directory}/${dataPoint.answerId}`, {
        facilityId,
        ...newShapeData,
      });
    } else {
      const newVitalData = {
        ...newShapeData,
        dataElementId: valueName,
        encounterId: encounter.id,
        recordedDate: dataPoint.recordedDate,
      };
      await api.post(`surveyResponseAnswer/${directory}`, { facilityId, ...newVitalData });
    }
    const primaryQueryKey = isVital ? 'encounterVitals' : 'encounterCharts';
    queryClient.invalidateQueries([primaryQueryKey, encounter.id]);
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
      formType={FORM_TYPES.EDIT_FORM}
      validate={validateFn}
      render={({ setFieldValue, submitForm }) => (
        <FormGrid columns={4} data-testid="formgrid-yjyh">
          <Box style={{ gridColumn: '1 / 3' }}>
            <SurveyQuestion
              component={dataPoint.component}
              disabled={isDeleted || !hasPermission}
              data-testid="surveyquestion-2f43"
            />
          </Box>
          {showDeleteEntryButton && (
            <DeleteEntryButton
              disabled={isDeleted || !hasPermission}
              onClick={() => handleDeleteEntry(setFieldValue)}
              data-testid="deleteentrybutton-xq4v"
            />
          )}
          <Field
            required={isReasonMandatory}
            component={BaseSelectField}
            label={
              <TranslatedText
                stringId="encounter.vitals.editReason.label"
                fallback="Reason for change to record"
                data-testid="translatedtext-3919"
              />
            }
            name="reasonForChange"
            options={vitalEditReasons}
            style={{ gridColumn: '1 / 4' }}
            disabled={!hasPermission}
            data-testid="field-fvqv"
          />
          <FormSeparatorLine data-testid="formseparatorline-fvhu" />
          <OuterLabelFieldWrapper
            label={
              <TranslatedText
                stringId="encounter.vitals.history.label"
                fallback="History"
                data-testid="translatedtext-98dr"
              />
            }
            style={{ gridColumn: '1 / -1' }}
            data-testid="outerlabelfieldwrapper-u60n"
          >
            <Box
              height="162px"
              overflow="auto"
              padding="13px 12px 13px 15px"
              bgcolor="white"
              border="1px solid #dedede"
              borderRadius="3px"
              data-testid="box-mzpp"
            >
              {dataPoint.historyLogs.map((log, index) => (
                <HistoryLog
                  key={log.date}
                  vitalLabel={vitalLabel}
                  vitalEditReasons={vitalEditReasons}
                  logData={log}
                  data-testid={`historylog-obnm-${index}`}
                />
              ))}
            </Box>
          </OuterLabelFieldWrapper>
          <FormSubmitCancelRow
            onCancel={handleClose}
            onConfirm={submitForm}
            confirmText={
              <TranslatedText
                stringId="general.action.save"
                fallback="Save"
                data-testid="translatedtext-ghq4"
              />
            }
            confirmDisabled={!hasPermission}
            data-testid="formsubmitcancelrow-bdsb"
          />
        </FormGrid>
      )}
      data-testid="form-e7pg"
    />
  );
};
