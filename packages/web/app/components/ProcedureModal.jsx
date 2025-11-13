import React, { useState } from 'react';
import { addDays, parseISO } from 'date-fns';
import styled from 'styled-components';
import { Form, ButtonRow, FormCancelButton, FormSubmitButton } from '@tamanu/ui-components';
import Typography from '@material-ui/core/Typography';
import MuiDivider from '@material-ui/core/Divider';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { FormModal } from './FormModal';
import { useApi } from '../api';
import { TranslatedText } from './Translation/TranslatedText';
import { toDateTimeString, getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { foreignKey, optionalForeignKey } from '../utils/validation';
import { FORM_TYPES } from '@tamanu/constants';
import { useAuth } from '../contexts/Auth';
import { ProcedureAdditionalData } from '../forms/ProcedureForm/ProcedureAdditionalData';
import { DataFetchingProgramsTable } from '../components/ProgramResponsesTable';
import { usePatientDataQuery } from '../api/queries/usePatientDataQuery';
import { useRefreshCount } from '../hooks/useRefreshCount';
import {
  UnSavedChangesModal,
  UnSavedProcedureProgramModal,
} from '../forms/ProcedureForm/ProcedureFormModals';
import { ProcedureFormFields } from '../forms/ProcedureForm';

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

// Both date and startTime only keep track of either date or time, accordingly.
// This grabs both relevant parts for the table.
const getActualDateTime = (date, time) => {
  return `${date.slice(0, 10)} ${time.slice(-8)}`;
};

// endTime has the same caveat as startTime, this will fix it and
// make an educated guess if the procedure ended the next day.
const getEndDateTime = ({ date, startTime, endTime }) => {
  if (!endTime) return undefined;
  const actualEndDateTime = getActualDateTime(date, endTime);
  const startTimeString = startTime.slice(-8);
  const endTimeString = endTime.slice(-8);
  const isEndTimeEarlier = endTimeString < startTimeString;

  if (isEndTimeEarlier === false) return actualEndDateTime;
  return toDateTimeString(addDays(parseISO(actualEndDateTime), 1));
};

const useProcedureProgramResponsesQuery = (patientId, procedureId, refreshCount) => {
  const api = useApi();
  return useQuery(
    ['patient', patientId, 'programResponses', procedureId, refreshCount],
    () => api.get(`patient/${patientId}/programResponses`, { procedureId }),
    { enabled: Boolean(procedureId) },
  );
};

export const ProcedureModal = ({
  onClose,
  onSaved,
  encounterId,
  editedProcedure,
  setEditedProcedure,
}) => {
  const api = useApi();
  const { currentUser } = useAuth();
  const { patientId } = useParams();
  const { data: patient } = usePatientDataQuery(patientId);
  const [refreshCount, updateRefreshCount] = useRefreshCount();
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [unsavedChangesModalOpen, setUnSavedChangesModalOpen] = useState(false);
  const [unsavedProgramFormOpen, setUnsavedProgramFormOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null); // Add this line
  const procedureId = editedProcedure?.id;
  const { data: programResponses } = useProcedureProgramResponsesQuery(
    patientId,
    procedureId,
    refreshCount,
  );

  const onSubmit = async data => {
    const actualDateTime = getActualDateTime(data.date, data.startTime);
    const updatedData = {
      ...data,
      date: actualDateTime,
      startTime: actualDateTime,
      endTime: getEndDateTime(data),
      encounterId,
    };

    if (updatedData.id) {
      await api.put(`procedure/${updatedData.id}`, updatedData);
    } else {
      await api.post('procedure', updatedData);
    }

    onSaved();
  };

  return (
    <Form
      onSubmit={async data => {
        if (selectedSurveyId) {
          setPendingFormData(data); // Store the form data
          setUnsavedProgramFormOpen(true);
        } else {
          await onSubmit(data);
        }
      }}
      render={({ submitForm, values, dirty, setFieldValue }) => {
        const handleCancel = () => {
          if (dirty) {
            setUnSavedChangesModalOpen(true);
          } else {
            onClose();
          }
        };

        // A procedure is new if editedProcedure has an id key and any other key
        const isNewProcedure =
          editedProcedure && editedProcedure.id && Object.keys(editedProcedure).length > 1;

        return (
          <>
            <FormModal
              width="md"
              title={
                <TranslatedText
                  stringId="procedure.modal.title"
                  fallback=":action procedure"
                  replacements={{
                    action: isNewProcedure ? (
                      <TranslatedText
                        stringId="general.action.update"
                        fallback="Update"
                        data-testid="translatedtext-l65z"
                      />
                    ) : (
                      <TranslatedText
                        stringId="general.action.new"
                        fallback="New"
                        data-testid="translatedtext-c8x5"
                      />
                    ),
                  }}
                  data-testid="translatedtext-om64"
                />
              }
              open={Boolean(editedProcedure)}
              onClose={handleCancel}
              data-testid="formmodal-otam"
            >
              <Heading>
                <TranslatedText stringId="procedure.form.heading" fallback="Procedure details" />
              </Heading>
              <SubHeading>
                <TranslatedText
                  stringId="procedure.form.subHeading"
                  fallback="Record relevant procedure details below."
                />
              </SubHeading>
              <ProcedureFormFields values={values} />
              <ProcedureAdditionalData
                procedureId={procedureId}
                patient={patient}
                procedureTypeId={values?.procedureTypeId}
                selectedSurveyId={selectedSurveyId}
                setSelectedSurveyId={setSelectedSurveyId}
                onSuccess={id => {
                  setEditedProcedure({ id });
                  setFieldValue('id', id);
                  updateRefreshCount();
                  toast.success(
                    <TranslatedText
                      stringId="procedure.form.saved.message"
                      fallback="Additional data successfully saved"
                    />,
                  );
                }}
              />
              {programResponses?.data?.length > 0 && (
                <>
                  <ProgramsTable
                    endpoint={`patient/${patientId}/programResponses`}
                    patient={patient}
                    onDelete={() => {
                      updateRefreshCount();
                      toast.success(
                        <TranslatedText
                          stringId="procedure.form.deleted.message"
                          fallback="Additional data successfully deleted"
                        />,
                      );
                    }}
                    fetchOptions={{ procedureId }}
                    tableOptions={{
                      disablePagination: true,
                      allowExport: false,
                      refreshCount,
                    }}
                  />
                  <Divider />
                </>
              )}
              <ButtonRow>
                {!procedureId || dirty ? (
                  <FormCancelButton onClick={handleCancel}>
                    <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
                  </FormCancelButton>
                ) : (
                  <FormCancelButton onClick={handleCancel} variant="contained">
                    <TranslatedText stringId="general.action.close" fallback="Close" />
                  </FormCancelButton>
                )}
                {!procedureId || dirty ? (
                  <FormSubmitButton onSubmit={submitForm}>
                    <TranslatedText
                      stringId="procedure.form.action.submit"
                      fallback="Save procedure"
                      data-testid="translatedtext-162m"
                    />
                  </FormSubmitButton>
                ) : null}
              </ButtonRow>
            </FormModal>
            <UnSavedProcedureProgramModal
              open={unsavedProgramFormOpen}
              onCancel={() => {
                setUnsavedProgramFormOpen(false);
                setPendingFormData(null);
              }}
              onConfirm={async () => {
                setUnsavedProgramFormOpen(false);
                if (pendingFormData) {
                  await onSubmit(pendingFormData);
                  setPendingFormData(null);
                }
              }}
            />
            <UnSavedChangesModal
              open={unsavedChangesModalOpen}
              onCancel={() => {
                setUnSavedChangesModalOpen(false);
              }}
              onConfirm={() => {
                setUnSavedChangesModalOpen(false);
                onClose();
              }}
            />
          </>
        );
      }}
      initialValues={{
        date: getCurrentDateTimeString(),
        startTime: getCurrentDateTimeString(),
        physicianId: currentUser.id,
        assistantClinicianIds:
          editedProcedure?.assistantClinicians?.map(clinician => clinician.id) || [],
        ...editedProcedure,
      }}
      formType={procedureId ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
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
          <TranslatedText stringId="general.localisedField.clinician.label" fallback="Clinician" />,
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
};
