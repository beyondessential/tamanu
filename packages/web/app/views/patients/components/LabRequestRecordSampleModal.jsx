import React from 'react';
import * as yup from 'yup';
import { LAB_REQUEST_STATUSES, SETTING_KEYS, FORM_TYPES } from '@tamanu/constants';
import styled from 'styled-components';
import { Form, TranslatedText, useDateTime } from '@tamanu/ui-components';
import { AutocompleteField, DateTimeField, FormModal } from '../../../components';
import { useSuggester } from '../../../api';
import { ModalFormActionRow } from '../../../components/ModalActionRow';
import { useAuth } from '../../../contexts/Auth';
import { useSettings } from '../../../contexts/Settings';
import {
  SampleDetailsCell,
  SampleDetailsContainer,
  SampleDetailsDateTimeField,
  SampleDetailsHeaders,
  SampleDetailsStyledField,
} from '../../labRequest/SampleDetailsTable';

const validationSchema = yup.object().shape({
  sampleTime: yup
    .date()
    .required(<TranslatedText stringId="validation.required.inline" fallback="*Required" />)
    .translatedLabel(
      <TranslatedText
        stringId="lab.modal.recordSample.sampleTime.label"
        fallback="Date & time collected"
        data-testid="translatedtext-c3v8"
      />,
    ),
  labSampleSiteId: yup.string(),
  specimenTypeId: yup.string().when('mandateSpecimenType', {
    is: true,
    then: schema =>
      schema
        .translatedLabel(
          <TranslatedText
            stringId="lab.specimenType.label"
            fallback="Specimen type"
            data-testid="translatedtext-nd1u"
          />,
        )
        .required(),
  }),
});

const StyledModal = styled(FormModal)`
  .MuiPaper-root {
    max-width: 1000px;
  }
`;

const LabRequestRecordSampleForm = ({ submitForm, values, setFieldValue, onClose }) => {
  const { getSetting } = useSettings();
  const mandateSpecimenType = getSetting(SETTING_KEYS.FEATURE_MANDATE_SPECIMEN_TYPE);

  const practitionerSuggester = useSuggester('practitioner');
  const specimenTypeSuggester = useSuggester('specimenType');
  const labSampleSiteSuggester = useSuggester('labSampleSite');

  const isSampleCollected = Boolean(values.sampleTime);

  return (
    <>
      <SampleDetailsContainer $showTestColumns={false} data-testid="container-recordsample">
        <SampleDetailsHeaders mandateSpecimenType={mandateSpecimenType} showTestColumns={false} />
        <SampleDetailsCell data-testid="cell-collectiondatetime">
          <SampleDetailsDateTimeField
            name="sampleTime"
            required
            component={DateTimeField}
            onChange={({ target: { value } }) => {
              // Clearing the collection time clears the sibling fields (matches the request form).
              if (!value) {
                setFieldValue('collectedById', undefined);
                setFieldValue('specimenTypeId', undefined);
                setFieldValue('labSampleSiteId', undefined);
              }
            }}
            data-testid="styledfield-sampletime"
          />
        </SampleDetailsCell>
        <SampleDetailsCell data-testid="cell-collectedby">
          <SampleDetailsStyledField
            name="collectedById"
            disabled={!isSampleCollected}
            component={AutocompleteField}
            suggester={practitionerSuggester}
            data-testid="styledfield-collectedby"
          />
        </SampleDetailsCell>
        <SampleDetailsCell data-testid="cell-specimentype">
          <SampleDetailsStyledField
            name="specimenTypeId"
            disabled={!isSampleCollected}
            component={AutocompleteField}
            suggester={specimenTypeSuggester}
            required={mandateSpecimenType}
            data-testid="styledfield-specimentype"
          />
        </SampleDetailsCell>
        <SampleDetailsCell data-testid="cell-site">
          <SampleDetailsStyledField
            name="labSampleSiteId"
            disabled={!isSampleCollected}
            component={AutocompleteField}
            suggester={labSampleSiteSuggester}
            data-testid="styledfield-site"
          />
        </SampleDetailsCell>
      </SampleDetailsContainer>
      <ModalFormActionRow
        onConfirm={submitForm}
        confirmText={
          <TranslatedText
            stringId="general.action.confirm"
            fallback="Confirm"
            data-testid="translatedtext-yzpm"
          />
        }
        onCancel={onClose}
        data-testid="modalformactionrow-4l9j"
      />
    </>
  );
};

export const LabRequestRecordSampleModal = React.memo(
  ({ updateLabReq, labRequest, open, onClose }) => {
    const { getSetting } = useSettings();
    const { getCurrentDateTime } = useDateTime();
    const { currentUser } = useAuth();
    const mandateSpecimenType = getSetting(SETTING_KEYS.FEATURE_MANDATE_SPECIMEN_TYPE);

    const sampleNotCollected = labRequest.status === LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED;
    const updateSample = async formValues => {
      await updateLabReq({
        ...formValues,
        // If lab request sample is marked as not collected in initial form - mark it as reception pending on submission
        ...(sampleNotCollected && {
          status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
          specimenCollected: true,
        }),
      });
      onClose();
    };

    return (
      <StyledModal
        open={open}
        onClose={onClose}
        title={
          sampleNotCollected ? (
            <TranslatedText
              stringId="lab.modal.recordSample.title"
              fallback="Record sample details"
            />
          ) : (
            <TranslatedText
              stringId="lab.modal.editSample.title"
              fallback="Edit sample date and time"
            />
          )
        }
        data-testid="styledmodal-8ee1"
      >
        <Form
          onSubmit={updateSample}
          validationSchema={validationSchema}
          showInlineErrorsOnly
          formType={FORM_TYPES.EDIT_FORM}
          initialValues={{
            sampleTime: labRequest.sampleTime || getCurrentDateTime(),
            labSampleSiteId: labRequest.labSampleSiteId,
            // Default the specimen type to the category's default unless one is already recorded.
            specimenTypeId: labRequest.specimenTypeId ?? labRequest.category?.defaultSpecimenTypeId,
            // Default the collector to the current user unless one is already recorded.
            collectedById: labRequest.collectedById ?? currentUser?.id,
            mandateSpecimenType,
          }}
          render={props => (
            <LabRequestRecordSampleForm
              {...props}
              onClose={onClose}
              data-testid="labrequestrecordsampleform-z2w7"
            />
          )}
          data-testid="form-5p3k"
        />
      </StyledModal>
    );
  },
);
