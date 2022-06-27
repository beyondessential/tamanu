import React, { useState, useCallback, useEffect } from 'react';
import { connect, useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { IMAGING_REQUEST_STATUS_TYPES } from 'shared/constants';
import { useParams } from 'react-router-dom';

import { Form, Formik } from 'formik';

import { Button } from '../../components/Button';
import { ContentPane } from '../../components/ContentPane';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PatientInfoPane } from '../../components/PatientInfoPane';
import { TwoColumnDisplay } from '../../components/TwoColumnDisplay';
import { TopBar } from '../../components/TopBar';
import { ButtonRow } from '../../components/ButtonRow';
import { FormGrid } from '../../components/FormGrid';
import {
  DateInput,
  TextInput,
  SelectField,
  Field,
  AutocompleteField,
} from '../../components/Field';
import { useApi } from '../../api';
import { Suggester } from '../../utils/suggester';

import { ImagingRequestPrintout } from '../../components/PatientPrinting/ImagingRequestPrintout';
import { Modal } from '../../components/Modal';
import { useCertificate } from '../../utils/useCertificate';

const BackLink = connect(null, dispatch => ({
  onClick: () => dispatch(push('/patients/encounter')),
}))(({ onClick }) => <Button onClick={onClick}>&lt; Back to encounter information</Button>);

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
        color="primary"
        onClick={openModal}
        style={{ marginRight: '0.5rem' }}
      >
        Print request
      </Button>
    </>
  );
};

const DumbImagingRequestInfoPane = React.memo(
  ({ imagingRequest, onSubmit, practitionerSuggester, locationSuggester }) => (
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
            <TextInput value={imagingRequest.imagingType?.name} label="Request type" disabled />
            <TextInput
              value={imagingRequest.urgent ? 'Urgent' : 'Standard'}
              label="Urgency"
              disabled
            />
            <Field name="status" label="Status" component={SelectField} options={statusOptions} />
            <DateInput value={imagingRequest.requestedDate} label="Request date" disabled />
            <TextInput
              multiline
              value={imagingRequest.areaToBeImaged}
              label="Area to be imaged"
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
            {/* Needs custom styling to properly display view image button to the left */}
            <ButtonRow style={{ gridTemplateColumns: '8rem auto 8rem' }}>
              <Button
                variant="contained"
                color="secondary"
                style={{
                  gridColumn: '1 / span 1',
                  // Change horizontal padding to fit text properly
                  paddingLeft: '10px',
                  paddingRight: '10px',
                  // Only show button when status is completed and keep it on the
                  // document layout to preserve correct row button display
                  visibility:
                    values.status === IMAGING_REQUEST_STATUS_TYPES.COMPLETED ? 'visible' : 'hidden',
                }}
                disabled
              >
                View image
                <br />
                (external link)
              </Button>
              {dirty && (
                <Button variant="contained" color="primary" type="submit">
                  Save
                </Button>
              )}
            </ButtonRow>
          </FormGrid>
        </Form>
      )}
    </Formik>
  ),
);

export const DumbImagingRequestView = React.memo(({ imagingRequest, patient }) => {
  const api = useApi();
  const dispatch = useDispatch();
  const practitionerSuggester = new Suggester(api, 'practitioner');
  const locationSuggester = new Suggester(api, 'location');

  const onSubmit = data => {
    api.put(`imagingRequest/${imagingRequest.id}`, { ...data });
    dispatch(push('/patients/encounter'));
  };

  if (patient.loading) return <LoadingIndicator />;
  return (
    <TwoColumnDisplay>
      <PatientInfoPane patient={patient} />
      <div>
        <TopBar title="Imaging request">
          <div>
            <PrintButton imagingRequest={imagingRequest} patient={patient} />
          </div>
        </TopBar>
        <BackLink />
        <ContentPane>
          <DumbImagingRequestInfoPane
            imagingRequest={imagingRequest}
            onSubmit={onSubmit}
            practitionerSuggester={practitionerSuggester}
            locationSuggester={locationSuggester}
          />
        </ContentPane>
      </div>
    </TwoColumnDisplay>
  );
});

export const ImagingRequestView = connect(state => ({
  imagingRequest: state.imagingRequest,
  patient: state.patient,
}))(DumbImagingRequestView);
