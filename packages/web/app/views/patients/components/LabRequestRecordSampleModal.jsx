import React from 'react';
import * as yup from 'yup';
import { LAB_REQUEST_STATUSES, SETTING_KEYS, FORM_TYPES } from '@tamanu/constants';
import styled from 'styled-components';
import { Form, FormGrid, TranslatedText, useDateTime } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import {
  AutocompleteField,
  DateTimeField,
  Field,
  FormModal,
  SuggesterSelectField,
} from '../../../components';
import { useSuggester } from '../../../api';
import { ModalFormActionRow } from '../../../components/ModalActionRow';
import { useSettings } from '../../../contexts/Settings';

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

const StyledDateTimeField = styled(DateTimeField)`
  .MuiInputBase-root {
    width: 241px;
  }
`;

const StyledField = styled(Field)`
  .label-field {
    margin-bottom: 31px;
  }
  .MuiInputBase-root.Mui-disabled {
    background: ${Colors.background};
  }
  .MuiOutlinedInput-root:hover.Mui-disabled .MuiOutlinedInput-notchedOutline {
    border-color: ${Colors.softOutline};
  }
  .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline {
    border-color: ${Colors.softOutline};
  }
`;

const FieldContainer = styled.div`
  position: relative;
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 5px;
  padding: 18px;
  margin-bottom: 28px;
`;

const HorizontalLine = styled.div`
  height: 1px;
  background-color: ${Colors.outline};
  position: absolute;
  top: 61px;
  left: 0;
  right: 0;
`;

const LabRequestRecordSampleForm = ({ submitForm, values, onClose }) => {
  const { getSetting } = useSettings();
  const mandateSpecimenType = getSetting(SETTING_KEYS.FEATURE_MANDATE_SPECIMEN_TYPE);

  const practitionerSuggester = useSuggester('practitioner');
  const specimenTypeSuggester = useSuggester('specimenType');
  return (
    <>
      <FieldContainer data-testid="fieldcontainer-9wpy">
        <HorizontalLine data-testid="horizontalline-3k6s" />
        <FormGrid columns={4} data-testid="formgrid-3btd">
          <StyledField
            name="sampleTime"
            label={
              <TranslatedText
                stringId="lab.modal.recordSample.sampleTime.label"
                fallback="Date & time collected"
                data-testid="translatedtext-qhdy"
              />
            }
            required
            component={StyledDateTimeField}
            data-testid="styledfield-dmjl"
          />
          <StyledField
            name="collectedById"
            label={
              <TranslatedText
                stringId="lab.sampleDetail.table.column.collectedBy"
                fallback="Collected by"
                data-testid="translatedtext-7xhj"
              />
            }
            suggester={practitionerSuggester}
            disabled={!values.sampleTime}
            component={AutocompleteField}
            data-testid="styledfield-v88m"
          />
          <StyledField
            name="specimenTypeId"
            label={
              <TranslatedText
                stringId="lab.sampleDetail.table.column.specimenType"
                fallback="Specimen type"
                data-testid="translatedtext-6d2j"
              />
            }
            component={AutocompleteField}
            suggester={specimenTypeSuggester}
            disabled={!values.sampleTime}
            required={mandateSpecimenType}
            data-testid="styledfield-0950"
          />
          <StyledField
            name="labSampleSiteId"
            label={
              <TranslatedText
                stringId="lab.site.label"
                fallback="Site"
                data-testid="translatedtext-kgvr"
              />
            }
            disabled={!values.sampleTime}
            component={SuggesterSelectField}
            endpoint="labSampleSite"
            data-testid="styledfield-lkqj"
          />
        </FormGrid>
      </FieldContainer>
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
        title={sampleNotCollected ? 'Record sample details' : 'Edit sample date and time'}
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
            specimenTypeId: labRequest.specimenTypeId,
            collectedById: labRequest.collectedById,
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
