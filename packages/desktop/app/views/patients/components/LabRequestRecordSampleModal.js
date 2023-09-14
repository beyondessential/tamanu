import React from 'react';
import * as yup from 'yup';
import { LAB_REQUEST_STATUSES } from '@tamanu/constants';
import styled from 'styled-components';
import {
  FormGrid,
  Modal,
  SuggesterSelectField,
  Form,
  Field,
  DateTimeField,
  AutocompleteField,
} from '../../../components';
import { Colors } from '../../../constants';
import { useSuggester } from '../../../api';
import { ModalFormActionRow } from '../../../components/ModalActionRow';

const validationSchema = yup.object().shape({
  sampleTime: yup.date().required(),
  labSampleSiteId: yup.string(),
});

const StyledModal = styled(Modal)`
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
  const practitionerSuggester = useSuggester('practitioner');
  const specimenTypeSuggester = useSuggester('specimenType');
  return (
    <>
      <FieldContainer>
        <HorizontalLine />
        <FormGrid columns={4}>
          <StyledField
            name="sampleTime"
            label="Data & time collected"
            required
            saveDateAsString
            component={StyledDateTimeField}
          />
          <StyledField
            name="collectedById"
            label="Collected by"
            suggester={practitionerSuggester}
            disabled={!values.sampleTime}
            component={AutocompleteField}
          />
          <StyledField
            name="specimenTypeId"
            label="Specimen type"
            component={AutocompleteField}
            suggester={specimenTypeSuggester}
            disabled={!values.sampleTime}
          />
          <StyledField
            name="labSampleSiteId"
            label="Site"
            disabled={!values.sampleTime}
            component={SuggesterSelectField}
            endpoint="labSampleSite"
          />
        </FormGrid>
      </FieldContainer>
      <ModalFormActionRow onConfirm={submitForm} confirmText="Confirm" onCancel={onClose} />
    </>
  );
};

export const LabRequestRecordSampleModal = React.memo(
  ({ updateLabReq, labRequest, open, onClose }) => {
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
      >
        <Form
          onSubmit={updateSample}
          validationSchema={validationSchema}
          showInlineErrorsOnly
          initialValues={{
            sampleTime: labRequest.sampleTime,
            labSampleSiteId: labRequest.labSampleSiteId,
            specimenTypeId: labRequest.specimenTypeId,
            collectedById: labRequest.collectedById,
          }}
          render={props => <LabRequestRecordSampleForm {...props} onClose={onClose} />}
        />
      </StyledModal>
    );
  },
);
