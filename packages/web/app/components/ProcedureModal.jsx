import React, { useState } from 'react';
import styled from 'styled-components';
import {
  Form,
  ButtonRow,
  FormCancelButton,
  FormSubmitButton,
  useDateTimeFormat,
} from '@tamanu/ui-components';
import Typography from '@material-ui/core/Typography';
import MuiDivider from '@material-ui/core/Divider';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { FormModal } from './FormModal';
import { useApi } from '../api';
import { TranslatedText } from './Translation/TranslatedText';
import { foreignKey, optionalForeignKey } from '../utils/validation';
import { FORM_TYPES } from '@tamanu/constants';
import { useAuth } from '../contexts/Auth';
import { ProcedureAdditionalData } from '../forms/ProcedureForm/ProcedureAdditionalData';
import { DataFetchingProgramsTable } from '../components/ProgramResponsesTable';
import { usePatientDataQuery } from '../api/queries/usePatientDataQuery';
import { useRefreshCount } from '../hooks/useRefreshCount';
import {
  UnsavedChangesModal,
  SaveWithoutAdditionalDataModal,
  CloseWithoutAdditionalDataModal,
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
  const {
    getCurrentDate,
    getCurrentDateTime,
    toDateTimeStringForPersistence,
    formatForDateTimeInput,
  } = useDateTimeFormat();
  const { patientId } = useParams();
  const { data: patient } = usePatientDataQuery(patientId);
  const [refreshCount, updateRefreshCount] = useRefreshCount();
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [unsavedChangesModalOpen, setUnsavedChangesModalOpen] = useState(false);
  const [saveWithoutAdditionalDataModalOpen, setSaveWithoutAdditionalDataModalOpen] =
    useState(false);
  const [closeWithoutAdditionalDataModalOpen, setCloseWithoutAdditionalDataModalOpen] =
    useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);
  const [surveyFormDirty, setSurveyFormDirty] = useState(false);
  const procedureId = editedProcedure?.id;
  const { data: programResponses } = useProcedureProgramResponsesQuery(
    patientId,
    procedureId,
    refreshCount,
  );

  // Convert countryTimeZone → facilityTimeZone for display
  const toFacilityTz = val => (val ? formatForDateTimeInput(val) : undefined);

  // Form values already have correct dates (ProcedureDateSync handles rollover),
  // so submit just needs to convert from facility timezone to country timezone.
  const onSubmit = async data => {
    const toPersisted = val => (val ? toDateTimeStringForPersistence(val) : undefined);
    const startDateTime = toPersisted(data.startTime);

    await api[data.id ? 'put' : 'post'](data.id ? `procedure/${data.id}` : 'procedure', {
      ...data,
      date: startDateTime,
      startTime: startDateTime,
      endTime: toPersisted(data.endTime),
      timeIn: toPersisted(data.timeIn),
      timeOut: toPersisted(data.timeOut),
      encounterId,
    });

    onSaved();
  };

  return (
    <Form
      onSubmit={async data => {
        if (selectedSurveyId) {
          setPendingFormData(data); // Store the form data
          setSaveWithoutAdditionalDataModalOpen(true);
        } else {
          await onSubmit(data);
        }
      }}
      render={({ submitForm, values, dirty, setFieldValue }) => {
        const handleCancel = () => {
          if (dirty) {
            setUnsavedChangesModalOpen(true);
          } else if (surveyFormDirty) {
            setCloseWithoutAdditionalDataModalOpen(true);
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
                surveyFormDirty={surveyFormDirty}
                setSurveyFormDirty={setSurveyFormDirty}
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
            <CloseWithoutAdditionalDataModal
              open={closeWithoutAdditionalDataModalOpen}
              onCancel={() => {
                setCloseWithoutAdditionalDataModalOpen(false);
              }}
              onConfirm={() => {
                setCloseWithoutAdditionalDataModalOpen(false);
                onClose();
              }}
            />
            <SaveWithoutAdditionalDataModal
              open={saveWithoutAdditionalDataModalOpen}
              onCancel={() => {
                setSaveWithoutAdditionalDataModalOpen(false);
                setPendingFormData(null);
              }}
              onConfirm={async () => {
                setSaveWithoutAdditionalDataModalOpen(false);
                if (pendingFormData) {
                  await onSubmit(pendingFormData);
                  setPendingFormData(null);
                }
              }}
            />
            <UnsavedChangesModal
              open={unsavedChangesModalOpen}
              onCancel={() => {
                setUnsavedChangesModalOpen(false);
              }}
              onConfirm={() => {
                setUnsavedChangesModalOpen(false);
                setSurveyFormDirty(false);
                onClose();
              }}
            />
          </>
        );
      }}
      initialValues={
        editedProcedure?.id
          ? {
              // Edit: spread existing data, convert date/time from country timezone to facility timezone
              ...editedProcedure,
              date: toFacilityTz(editedProcedure.date)?.slice(0, 10),
              startTime: toFacilityTz(editedProcedure.startTime),
              endTime: toFacilityTz(editedProcedure.endTime),
              timeIn: toFacilityTz(editedProcedure.timeIn),
              timeOut: toFacilityTz(editedProcedure.timeOut),
              assistantClinicianIds: editedProcedure.assistantClinicians?.map(c => c.id) || [],
            }
          : {
              date: getCurrentDate(),
              startTime: getCurrentDateTime(),
              physicianId: currentUser.id,
              assistantClinicianIds: [],
            }
      }
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
