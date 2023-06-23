import React, { useState, useCallback } from 'react';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { push } from 'connected-react-router';
import { useParams } from 'react-router-dom';
import { shell } from 'electron';
import { pick } from 'lodash';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';

import { IMAGING_REQUEST_STATUS_TYPES, LAB_REQUEST_STATUS_CONFIG } from '@tamanu/shared/constants';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

import { CancelModal } from '../../components/CancelModal';
import { IMAGING_REQUEST_STATUS_OPTIONS, Colors } from '../../constants';
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
  Form,
} from '../../components/Field';
import { useApi, useSuggester, combineQueries } from '../../api';
import { useEncounterData } from '../../api/queries';
import { MultipleImagingRequestsPrintout as ImagingRequestPrintout } from '../../components/PatientPrinting';
import { useLocalisation } from '../../contexts/Localisation';
import { ENCOUNTER_TAB_NAMES } from '../../constants/encounterTabNames';
import { SimpleTopBar } from '../../components';

const PrintModalButton = ({ imagingRequest, patient }) => {
  const { modal } = useParams();
  const certificate = useCertificate();
  const [isModalOpen, setModalOpen] = useState(modal === 'print');
  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);
  const api = useApi();
  const encounterQuery = useEncounterData(imagingRequest.encounterId);
  const additionalDataQuery = useQuery(
    ['additionalData', patient.id],
    () => api.get(`patient/${encodeURIComponent(patient.id)}/additionalData`),
  );
  const villageQuery = useQuery(
    ['village', patient.villageId],
    () => api.get(`referenceData/${encodeURIComponent(patient.villageId)}`),
    {
      enabled: !!patient?.villageId,
    },
  );
  const isLoading = combineQueries([
    encounterQuery,
    additionalDataQuery,
    villageQuery,
  ]).isFetching;

  return (
    <>
      <Modal
        title="Imaging Request"
        open={isModalOpen}
        onClose={closeModal}
        width="md"
        color={Colors.white}
        printable
      >
        {isLoading ? (
          <LoadingIndicator />
        ) : (
          <ImagingRequestPrintout
            imagingRequests={[imagingRequest]}
            patient={patient}
            village={villageQuery.data}
            additionalData={additionalDataQuery.data}
            encounter={encounterQuery.data}
            certificate={certificate}
          />
        )}
      </Modal>
      <Button variant="outlined" onClick={openModal} style={{ marginLeft: '0.5rem' }}>
        Print request
      </Button>
    </>
  );
};

const ImagingRequestSection = ({ currentStatus, imagingRequest }) => {
  const { getLocalisation } = useLocalisation();
  const imagingPriorities = getLocalisation('imagingPriorities') || [];
  const imagingTypes = getLocalisation('imagingTypes') || {};
    
  const locationGroupSuggester = useSuggester('facilityLocationGroup');
  const isCancelled = imagingRequest.status === IMAGING_REQUEST_STATUS_TYPES.CANCELLED;
  // Just needed for read only state
  const cancelledOption = [
    {
      label: LAB_REQUEST_STATUS_CONFIG[IMAGING_REQUEST_STATUS_TYPES.CANCELLED].label,
      value: IMAGING_REQUEST_STATUS_TYPES.CANCELLED,
    },
  ];

  const allowLocationChange = [
    IMAGING_REQUEST_STATUS_TYPES.IN_PROGRESS,
    IMAGING_REQUEST_STATUS_TYPES.COMPLETED
  ].includes(currentStatus);

  return (
    <FormGrid columns={3}>
      <TextInput value={imagingRequest.displayId} label="Request ID" disabled />
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
      <Field
        name="status"
        label="Status"
        component={SelectField}
        options={isCancelled ? cancelledOption : IMAGING_REQUEST_STATUS_OPTIONS}
        disabled={isCancelled}
        isClearable={false}
        required
      />
      <DateTimeInput value={imagingRequest.requestedDate} label="Request date and time" disabled />
      {allowLocationChange && (
        <Field
          label="Facility area"
          name="locationGroupId"
          component={AutocompleteField}
          suggester={locationGroupSuggester}
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

const NewResultSection = ({ disabled = false }) => {
  const practitionerSuggester = useSuggester('practitioner');
  
  return (
    <FormGrid columns={2}>
      <Field
        label="Completed by"
        name="newResult.completedById"
        placeholder="Search"
        component={AutocompleteField}
        suggester={practitionerSuggester}
        disabled={disabled}
      />
      <Field
        label="Completed"
        name="newResult.completedAt"
        saveDateAsString
        component={DateTimeField}
        disabled={disabled}
      />
      <Field
        label="Result description"
        name="newResult.description"
        placeholder="Result description..."
        multiline
        component={TextField}
        style={{ gridColumn: '1 / -1', minHeight: '3em' }}
        disabled={disabled}
      />
    </FormGrid>
  );
}

const ImagingResultsSection = ({ results }) => {
  const openExternalUrl = useCallback(url => () => shell.openExternal(url), []);

  if (results.length === 0) return null;

  return (
    <>
      <h3>Results</h3>
      {results.map(result => (
        <BottomAlignFormGrid 
          key={result.id} 
          columns={result.externalUrl ? 3 : 2}
        >
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
    </>
  );
};

const ImagingRequestInfoPane = React.memo(({ imagingRequest, onSubmit }) => {
  const isCancelled = imagingRequest.status === IMAGING_REQUEST_STATUS_TYPES.CANCELLED;
  const getCanAddResult = values => values.status === IMAGING_REQUEST_STATUS_TYPES.COMPLETED;

  return (
    <Form
      // Only submit specific fields for update
      onSubmit={values => {
        const updatedValues = pick(
          values,
          'status',
          'completedById',
          'locationGroupId',
        );
        if (getCanAddResult(values) && (values.newResult?.description?.trim())) {
          updatedValues.newResult = values.newResult;
        }

        onSubmit(updatedValues);
      }}
      enableReinitialize // Updates form to reflect changes in initialValues
      initialStatus={{}}
      initialValues={{
        ...imagingRequest,
        newResult: {
          completedAt: getCurrentDateTimeString(),
        },
      }}
      validationSchema={yup.object().shape({
        status: yup.string().required('Status is required'),
      })}
      render={({ values }) => {
        const canAddResult = getCanAddResult(values);
        return (
          <>
            <ImagingRequestSection
              currentStatus={values.status}
              imagingRequest={imagingRequest}
            />
            <ImagingResultsSection results={imagingRequest.results} />
            <h4>{imagingRequest.results.length > 0 ? 'Add additional result' : 'Add result'}</h4>
            <NewResultSection disabled={!canAddResult} />
            <ButtonRow style={{ marginTop: 20 }}>
              {!isCancelled && <Button type="submit">Save</Button>}
            </ButtonRow>
          </>
        );
      }}
    />
  );
});

function getReasonForCancellationStatus(reasonForCancellation) {
  // these values are set in localisation
  switch (reasonForCancellation) {
    case 'duplicate':
      return IMAGING_REQUEST_STATUS_TYPES.DELETED;
    case 'entered-in-error':
      return IMAGING_REQUEST_STATUS_TYPES.ENTERED_IN_ERROR;
    default:
      return IMAGING_REQUEST_STATUS_TYPES.CANCELLED;
  }
}

const CancelModalButton = ({ imagingRequest }) => { 
  const isCancellable = ![
    IMAGING_REQUEST_STATUS_TYPES.CANCELLED,
    IMAGING_REQUEST_STATUS_TYPES.ENTERED_IN_ERROR,
    IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
  ].includes(imagingRequest.status);

  if (!isCancellable) return null;

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const api = useApi();
  const { getLocalisation } = useLocalisation();
  const cancellationReasonOptions = getLocalisation('imagingCancellationReasons') || [];  

  const onConfirmCancel = async ({ reasonForCancellation }) => {
    const reasonText = cancellationReasonOptions.find(x => x.value === reasonForCancellation).label;
    const note = `Request cancelled. Reason: ${reasonText}.`;
    const status = getReasonForCancellationStatus(reasonForCancellation);
    await api.put(`imagingRequest/${imagingRequest.id}`, {
      status,
      reasonForCancellation,
      note,
    });
    dispatch(
      push(
        `/patients/${params.category}/${params.patientId}/encounter/${params.encounterId}?tab=${ENCOUNTER_TAB_NAMES.IMAGING}`,
      ),
    );
  };

  return (
    <>
      <Button variant="text" onClick={() => setIsCancelModalOpen(true)}>
        Cancel request
      </Button>
      <CancelModal
        title="Cancel imaging request"
        helperText="This reason will permanently delete the imaging request record"
        bodyText="Please select reason for cancelling imaging request and click 'Confirm'"
        options={cancellationReasonOptions}
        open={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={onConfirmCancel}
      />
    </>
  );
};

export const ImagingRequestView = () => {
  const imagingRequest = useSelector(state => state.imagingRequest);
  const patient = useSelector(state => state.patient);
 
  const api = useApi();
  const dispatch = useDispatch();
  const params = useParams();
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
    <>
      <SimpleTopBar title="Imaging request">
        <CancelModalButton imagingRequest={imagingRequest} />
        <PrintModalButton imagingRequest={imagingRequest} patient={patient} />
      </SimpleTopBar>
      <ContentPane>
        <ImagingRequestInfoPane
          imagingRequest={imagingRequest}
          onSubmit={onSubmit}
        />
      </ContentPane>
    </>
  );
};
