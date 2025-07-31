import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import Collapse from '@material-ui/core/Collapse';
import Typography from '@material-ui/core/Typography';
import MuiDivider from '@material-ui/core/Divider';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import {
  AutocompleteField,
  CheckField,
  DateField,
  Field,
  Form,
  LocationField,
  TextField,
  TimeField,
} from '../../components/Field';
import { MultiAutocompleteField } from '../../components/Field/MultiAutocompleteField';
import { FormGrid } from '../../components/FormGrid';
import { FormSubmitCancelRow } from '../../components/ButtonRow';
import { foreignKey, optionalForeignKey } from '../../utils/validation';
import { FORM_TYPES } from '../../constants/index.js';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { useAuth } from '../../contexts/Auth';
import { ProcedureAdditionalData } from './ProcedureAdditionalData';
import { DataFetchingProgramsTable } from '../../components/ProgramResponsesTable';
import { usePatientDataQuery } from '../../api/queries/usePatientDataQuery';
import { useRefreshCount } from '../../hooks/useRefreshCount';

const suggesterType = PropTypes.shape({
  fetchSuggestions: PropTypes.func,
  fetchCurrentOption: PropTypes.func,
});

const Heading = styled(Typography)`
  margin-bottom: 10px;
  font-weight: 500;
  font-size: 18px;
  line-height: 24px;
`;

const SubHeading = styled(Typography)`
  font-size: 14px;
  line-height: 18px;
  margin-bottom: 20px;
  color: ${props => props.theme.palette.text.tertiary};
`;

const ProgramsTable = styled(DataFetchingProgramsTable)`
  margin-bottom: 20px;
  .MuiTableRow-root {
    &:last-child {
      .MuiTableCell-body {
        border-bottom: none;
      }
    }
  }
`;

const Divider = styled(MuiDivider)`
  margin: 10px 0 20px;
`;

export const ProcedureForm = React.memo(
  ({
    onCancel,
    onSubmit,
    editedObject,
    departmentSuggester,
    anaestheticSuggester,
    procedureSuggester,
    physicianSuggester,
    anaesthetistSuggester,
    assistantSuggester,
    selectedSurveyId,
    setSelectedSurveyId,
  }) => {
    const [refreshCount, updateRefreshCount] = useRefreshCount();
    const { currentUser } = useAuth();
    const { patientId } = useParams();
    const { data: patient } = usePatientDataQuery(patientId);
    const procedureId = editedObject?.id;

    return (
      <Form
        onSubmit={onSubmit}
        render={({ submitForm, values }) => {
          const handleCancel = () => onCancel && onCancel();

          const isCompleted = !!values.completed;
          return (
            <>
              <Heading>
                <TranslatedText stringId="procedure.form.heading" fallback="Procedure details" />
              </Heading>
              <SubHeading>
                <TranslatedText
                  stringId="procedure.form.subHeading"
                  fallback="Record relevant procedure details below."
                />
              </SubHeading>
              <FormGrid data-testid="formgrid-6sdo">
                <div style={{ gridColumn: 'span 2' }}>
                  <Field
                    name="procedureTypeId"
                    label={
                      <TranslatedText
                        stringId="procedure.procedureType.label"
                        fallback="Procedure"
                      />
                    }
                    required
                    component={AutocompleteField}
                    suggester={procedureSuggester}
                    data-testid="field-87c2"
                  />
                </div>
                <Field
                  name="date"
                  label={
                    <TranslatedText stringId="procedure.date.label" fallback="Procedure date" />
                  }
                  saveDateAsString
                  required
                  component={DateField}
                  data-testid="field-3a5v"
                />
                <Field
                  name="departmentId"
                  label={
                    <TranslatedText stringId="procedure.department.label" fallback="Department" />
                  }
                  suggester={departmentSuggester}
                  component={AutocompleteField}
                  data-testid="field-3a5v1"
                />
                <Field
                  locationGroupLabel={
                    <TranslatedText stringId="procedure.area.label" fallback="Procedure area" />
                  }
                  label={
                    <TranslatedText
                      stringId="procedure.location.label"
                      fallback="Procedure location"
                    />
                  }
                  name="locationId"
                  enableLocationStatus={false}
                  required
                  component={LocationField}
                  data-testid="field-p4ef"
                />
                <Field
                  name="physicianId"
                  label={
                    <TranslatedText
                      stringId="general.localisedField.clinician.label.short"
                      fallback="Lead clinician"
                    />
                  }
                  required
                  component={AutocompleteField}
                  suggester={physicianSuggester}
                  data-testid="field-lit6"
                />
                <Field
                  name="assistantClinicianIds"
                  label={
                    <TranslatedText
                      stringId="procedure.assistantClinicians.label"
                      fallback="Assistant clinicians"
                    />
                  }
                  component={MultiAutocompleteField}
                  suggester={assistantSuggester}
                  data-testid="field-f3l4"
                />
                <Field
                  name="anaesthetistId"
                  label={
                    <TranslatedText
                      stringId="procedure.anaesthetist.label"
                      fallback="Anaesthetist"
                    />
                  }
                  component={AutocompleteField}
                  suggester={anaesthetistSuggester}
                  data-testid="field-96eg"
                />
                <Field
                  name="assistantAnaesthetistId"
                  label={
                    <TranslatedText
                      stringId="procedure.assistantAnaesthetist.label"
                      fallback="Assistant Anaesthetist"
                    />
                  }
                  component={AutocompleteField}
                  suggester={anaesthetistSuggester}
                  data-testid="field-96eg1"
                />
                <Field
                  name="anaestheticId"
                  label={
                    <TranslatedText
                      stringId="procedure.anaesthetic.label"
                      fallback="Anaesthetic type"
                    />
                  }
                  component={AutocompleteField}
                  suggester={anaestheticSuggester}
                  data-testid="field-w9b5"
                />
                {/* Empty div to make the time in field start on a new row */}
                <div />
                <Field
                  name="timeIn"
                  label={<TranslatedText stringId="procedure.timeIn.label" fallback="Time in" />}
                  component={TimeField}
                  saveDateAsString
                  data-testid="field-khml1"
                />
                <Field
                  name="timeOut"
                  label={<TranslatedText stringId="procedure.timeOut.label" fallback="Time out" />}
                  component={TimeField}
                  saveDateAsString
                  data-testid="field-hgzz1"
                />
                <Field
                  name="startTime"
                  label={
                    <TranslatedText stringId="procedure.startTime.label" fallback="Time started" />
                  }
                  component={TimeField}
                  saveDateAsString
                  data-testid="field-khml"
                />
                <Field
                  name="endTime"
                  label={
                    <TranslatedText stringId="procedure.endTime.label" fallback="Time ended" />
                  }
                  component={TimeField}
                  saveDateAsString
                  data-testid="field-hgzz"
                />
                <Field
                  name="note"
                  label={
                    <TranslatedText
                      stringId="procedure.noteOrInstruction.label"
                      fallback="Notes or additional instructions"
                    />
                  }
                  component={TextField}
                  multiline
                  minRows={4}
                  style={{ gridColumn: 'span 2' }}
                  data-testid="field-7en7"
                />
                <Field
                  name="completed"
                  label={<TranslatedText stringId="general.completed.label" fallback="Completed" />}
                  component={CheckField}
                  data-testid="field-uaz4"
                />
                <Collapse
                  in={isCompleted}
                  style={{ gridColumn: 'span 2' }}
                  data-testid="collapse-e9ow"
                >
                  <Field
                    name="completedNote"
                    label={
                      <TranslatedText
                        stringId="procedure.completedNote.label"
                        fallback="Notes on completed procedure"
                      />
                    }
                    component={TextField}
                    multiline
                    minRows={4}
                    data-testid="field-qrv7"
                  />
                </Collapse>
              </FormGrid>
              <Divider />
              <ProcedureAdditionalData
                procedureId={procedureId}
                patient={patient}
                procedureTypeId={values?.procedureTypeId}
                updateRefreshCount={updateRefreshCount}
                selectedSurveyId={selectedSurveyId}
                setSelectedSurveyId={setSelectedSurveyId}
              />
              <Divider />
              <ProgramsTable
                endpoint={`patient/${patientId}/programResponses`}
                patient={patient}
                fetchOptions={{ procedureId }}
                tableOptions={{
                  disablePagination: true,
                  allowExport: false,
                  refreshTable: updateRefreshCount,
                  refreshCount,
                }}
              />
              <Divider />
              <FormSubmitCancelRow
                onCancel={handleCancel}
                onConfirm={submitForm}
                confirmText={
                  <TranslatedText
                    stringId="general.action.submit"
                    fallback="Save procedure"
                    data-testid="translatedtext-162m"
                  />
                }
                data-testid="formsubmitcancelrow-8gtl"
              />
            </>
          );
        }}
        initialValues={{
          date: getCurrentDateTimeString(),
          startTime: getCurrentDateTimeString(),
          physicianId: currentUser.id,
          assistantClinicianIds:
            editedObject?.assistantClinicians?.map(clinician => clinician.id) || [],
          ...editedObject,
        }}
        formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
        validationSchema={yup.object().shape({
          procedureTypeId: foreignKey().translatedLabel(
            <TranslatedText stringId="procedure.procedureType.label" fallback="Procedure" />,
          ),
          locationId: foreignKey().translatedLabel(
            <TranslatedText stringId="general.location.label" fallback="Location" />,
          ),
          date: yup
            .date()
            .required()
            .translatedLabel(<TranslatedText stringId="general.date.label" fallback="Date" />),
          startTime: yup
            .date()
            .translatedLabel(
              <TranslatedText stringId="general.startTime.label" fallback="Start time" />,
            ),
          endTime: yup.date(),
          timeIn: yup.date(),
          timeOut: yup.date(),
          physicianId: foreignKey().translatedLabel(
            <TranslatedText
              stringId="general.localisedField.clinician.label"
              fallback="Clinician"
            />,
          ),
          assistantClinicianIds: yup.array().of(yup.string()),
          anaesthetistId: optionalForeignKey(),
          assistantAnaesthetistId: optionalForeignKey(),
          anaestheticId: optionalForeignKey(),
          departmentId: optionalForeignKey(),
          note: yup.string(),
          completed: yup.boolean(),
          completedNote: yup.string(),
        })}
        data-testid="form-u2fq"
      />
    );
  },
);

ProcedureForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  editedObject: PropTypes.shape({}),
  anaestheticSuggester: suggesterType.isRequired,
  procedureSuggester: suggesterType.isRequired,
  physicianSuggester: suggesterType.isRequired,
  anaesthetistSuggester: suggesterType.isRequired,
  assistantSuggester: suggesterType.isRequired,
};

ProcedureForm.defaultProps = {
  editedObject: null,
};
