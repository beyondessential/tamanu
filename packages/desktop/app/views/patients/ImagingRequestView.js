import React, { useState, useCallback, useEffect } from 'react';
import { Form, Formik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import { push } from 'connected-react-router';
import { IMAGING_REQUEST_STATUS_TYPES } from 'shared/constants';
import { useParams } from 'react-router-dom';
import { useCertificate } from '../../utils/useCertificate';
import { Button } from '../../components/Button';
import { ContentPane } from '../../components/ContentPane';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ButtonRow } from '../../components/ButtonRow';
import { FormGrid } from '../../components/FormGrid';
import { Modal } from '../../components/Modal';
import {
  TextInput,
  SelectField,
  Field,
  AutocompleteField,
  DateTimeInput,
} from '../../components/Field';
import { useApi, useSuggester } from '../../api';
import { ImagingRequestPrintout } from '../../components/PatientPrinting/ImagingRequestPrintout';
import { useLocalisation } from '../../contexts/Localisation';
import { ENCOUNTER_TAB_NAMES } from './encounterTabNames';

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

const PrintButton = ({ imagingRequest, patient }) => {
  const api = useApi();
  const { modal } = useParams();
  const certificateData = useCertificate();
  const [isModalOpen, setModalOpen] = useState(modal === 'print');
  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);
  const [encounter, setEncounter] = useState();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    if (!imagingRequest.loading) {
      (async () => {
        const res = await api.get(`encounter/${imagingRequest.encounterId}`);
        setEncounter(res);
      })();
      setIsLoading(false);
    }
  }, [api, imagingRequest.encounterId, imagingRequest.loading]);

  return (
    <>
      <Modal title="Imaging Request" open={isModalOpen} onClose={closeModal} width="md" printable>
        {isLoading ? (
          <LoadingIndicator />
        ) : (
          <ImagingRequestPrintout
            imagingRequestData={imagingRequest}
            patientData={patient}
            encounterData={encounter}
            certificateData={certificateData}
          />
        )}
      </Modal>
      <Button
        variant="outlined"
        onClick={openModal}
        style={{ marginRight: '0.5rem', marginBottom: '30px' }}
      >
        Print request
      </Button>
    </>
  );
};

const ImagingRequestInfoPane = React.memo(
  ({ imagingRequest, onSubmit, practitionerSuggester, locationSuggester, imagingTypes }) => (
    <Formik
      // Only submit specific fields for update
      onSubmit={({ status, completedById, locationId, results }) => {
        const updatedImagingRequest = {
          status,
          completedById,
          locationId,
          results,
        };
        onSubmit(updatedImagingRequest);
      }}
      enableReinitialize // Updates form to reflect changes in initialValues
      initialValues={{
        ...imagingRequest,
      }}
    >
      {({ values, dirty, handleChange }) => (
        <Form>
          <FormGrid columns={3}>
            <TextInput value={imagingRequest.id} label="Request ID" disabled />
            <TextInput
              value={imagingTypes[imagingRequest.imagingType]?.label || 'Unknown'}
              label="Request type"
              disabled
            />
            <TextInput
              value={imagingRequest.urgent ? 'Urgent' : 'Standard'}
              label="Urgency"
              disabled
            />
            <Field name="status" label="Status" component={SelectField} options={statusOptions} />
            <DateTimeInput
              value={imagingRequest.requestedDate}
              label="Request date and time"
              disabled
            />
            <TextInput
              multiline
              value={
                // Either use free text area or multi-select areas data
                imagingRequest.areas?.length
                  ? imagingRequest.areas.map(area => area.name).join(', ')
                  : imagingRequest.areaNote
              }
              label="Areas to be imaged"
              style={{ gridColumn: '1 / -1', minHeight: '60px' }}
              disabled
            />
            <TextInput
              multiline
              value={imagingRequest.note}
              label="Notes"
              style={{ gridColumn: '1 / -1', minHeight: '60px' }}
              disabled
            />
            {(values.status === IMAGING_REQUEST_STATUS_TYPES.IN_PROGRESS ||
              values.status === IMAGING_REQUEST_STATUS_TYPES.COMPLETED) && (
              <>
                <Field
                  name="completedById"
                  label="Completed by"
                  component={AutocompleteField}
                  suggester={practitionerSuggester}
                />
                <Field
                  name="locationId"
                  label="Location"
                  component={AutocompleteField}
                  suggester={locationSuggester}
                />
              </>
            )}
            {values?.status === IMAGING_REQUEST_STATUS_TYPES.COMPLETED && (
              <TextInput
                name="results"
                label="Results Description"
                multiline
                value={values.results}
                onChange={handleChange}
                style={{ gridColumn: '1 / -1', minHeight: '60px' }}
              />
            )}
            <ButtonRow>
              {values.status === IMAGING_REQUEST_STATUS_TYPES.COMPLETED && (
                <Button color="secondary" disabled>
                  View image (external link)
                </Button>
              )}
              {dirty && <Button type="submit">Save</Button>}
            </ButtonRow>
          </FormGrid>
        </Form>
      )}
    </Formik>
  ),
);

export const ImagingRequestView = () => {
  const api = useApi();
  const dispatch = useDispatch();
  const params = useParams();
  const imagingRequest = useSelector(state => state.imagingRequest);
  const patient = useSelector(state => state.patient);
  const practitionerSuggester = useSuggester('practitioner');
  const locationSuggester = useSuggester('location', {
    baseQueryParameters: { filterByFacility: true },
  });

  const { getLocalisation } = useLocalisation();
  const imagingTypes = getLocalisation('imagingTypes') || {};

  const onSubmit = async data => {
    await api.put(`imagingRequest/${imagingRequest.id}`, data);
    dispatch(
      push(
        `/patients/${params.category}/${params.patientId}/encounter/${params.encounterId}?tab=${ENCOUNTER_TAB_NAMES.IMAGING}`,
      ),
    );
  };

  if (patient.loading) return <LoadingIndicator />;
  return (
    <ContentPane>
      <PrintButton imagingRequest={imagingRequest} patient={patient} />
      <ImagingRequestInfoPane
        imagingRequest={imagingRequest}
        onSubmit={onSubmit}
        practitionerSuggester={practitionerSuggester}
        locationSuggester={locationSuggester}
        imagingTypes={imagingTypes}
      />
    </ContentPane>
  );
};
