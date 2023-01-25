import React, { useState, useCallback, useEffect } from 'react';
import { Form, Formik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import { push } from 'connected-react-router';
import { useParams } from 'react-router-dom';
import { shell } from 'electron';
import { pick } from 'lodash';
import styled from 'styled-components';

import { IMAGING_REQUEST_STATUS_TYPES } from 'shared/constants';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';

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
  DateTimeField,
  TextField,
} from '../../components/Field';
import { useApi, useSuggester } from '../../api';
import { ImagingRequestPrintout } from '../../components/PatientPrinting/ImagingRequestPrintout';
import { useLocalisation } from '../../contexts/Localisation';
import { ENCOUNTER_TAB_NAMES } from './encounterTabNames';

const STATUS_OPTIONS = [
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

const ImagingRequestSection = ({ values, imagingRequest, imagingPriorities, imagingTypes }) => {
  const locationGroupSuggester = useSuggester('facilityLocationGroup');

  return (
    <FormGrid columns={3}>
      <TextInput value={imagingRequest.id} label="Request ID" disabled />
      <TextInput
        value={imagingTypes[imagingRequest.imagingType]?.label || 'Unknown'}
        label="Request type"
        disabled
      />
      <TextInput
        value={imagingPriorities.find(p => p.value === imagingRequest.priority)?.label || ''}
        label="Priority"
        disabled
      />
      <Field name="status" label="Status" component={SelectField} options={STATUS_OPTIONS} />
      <DateTimeInput value={imagingRequest.requestedDate} label="Request date and time" disabled />
      {(values.status === IMAGING_REQUEST_STATUS_TYPES.IN_PROGRESS ||
        values.status === IMAGING_REQUEST_STATUS_TYPES.COMPLETED) && (
        <Field
          label="Facility area"
          name="locationGroupId"
          component={AutocompleteField}
          suggester={locationGroupSuggester}
          required
        />
      )}
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
    </FormGrid>
  );
};

const BottomAlignFormGrid = styled(FormGrid)`
  align-items: end;

  > button {
    margin-bottom: 2px;
  }
`;

const ImagingResultsSection = ({ values, practitionerSuggester }) => {
  const openExternalUrl = useCallback(url => () => shell.openExternal(url), []);

  return (
    <>
      {values.results?.length ? <h3>Results</h3> : null}
      {values.results?.map(result => (
        <BottomAlignFormGrid columns={result.externalUrl ? 3 : 2}>
          <TextInput
            label="Completed by"
            value={
              result.completedBy?.displayName ?? (result.externalUrl && 'External provider') ?? ''
            }
            disabled
          />
          <DateTimeInput label="Completed" value={result.completedAt} disabled />
          {result.externalUrl && (
            <Button color="secondary" onClick={openExternalUrl(result.externalUrl)}>
              View image (external link)
            </Button>
          )}

          <TextInput
            label="Result description"
            value={result.description}
            multiline
            disabled
            style={{ gridColumn: '1 / -1', minHeight: '3em' }}
          />
          <hr />
        </BottomAlignFormGrid>
      ))}

      <h4>{values.results?.length > 0 ? 'Add additional result' : 'Add result'}</h4>
      <FormGrid columns={2}>
        <Field
          label="Completed by"
          name="newResultCompletedBy"
          placeholder="Search"
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field label="Completed" name="newResultDate" saveDateAsString component={DateTimeField} />
        <Field
          label="Result description"
          name="newResultDescription"
          placeholder="Result description..."
          multiline
          component={TextField}
          style={{ gridColumn: '1 / -1', minHeight: '3em' }}
        />
      </FormGrid>
    </>
  );
};

const ImagingRequestInfoPane = React.memo(
  ({ imagingRequest, onSubmit, practitionerSuggester, imagingTypes }) => {
    const { getLocalisation } = useLocalisation();
    const imagingPriorities = getLocalisation('imagingPriorities') || [];

    return (
      <Formik
        // Only submit specific fields for update
        onSubmit={fields =>
          onSubmit(
            pick(
              fields,
              'status',
              'completedById',
              'locationGroupId',
              'newResultCompletedBy',
              'newResultDate',
              'newResultDescription',
            ),
          )
        }
        enableReinitialize // Updates form to reflect changes in initialValues
        initialValues={{
          ...imagingRequest,
          newResultCompletedBy: null,
          newResultDate: getCurrentDateTimeString(),
          newResultDescription: '',
        }}
      >
        {({ values, dirty, handleChange }) => {
          return (
            <Form>
              <ImagingRequestSection
                {...{
                  values,
                  imagingRequest,
                  imagingPriorities,
                  imagingTypes,
                }}
              />
              {values.status === IMAGING_REQUEST_STATUS_TYPES.COMPLETED && (
                <ImagingResultsSection
                  {...{
                    dirty,
                    values,
                    handleChange,
                    practitionerSuggester,
                  }}
                />
              )}
              <ButtonRow>{dirty && <Button type="submit">Save</Button>}</ButtonRow>
            </Form>
          );
        }}
      </Formik>
    );
  },
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
