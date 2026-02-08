import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { Box } from '@mui/material';

import {
  TextField,
  Form,
  FormCancelButton,
  FormGrid,
  FormSubmitButton,
  BaseModal,
  TranslatedText,
  useDateTimeFormat,
} from '@tamanu/ui-components';
import { FORM_TYPES } from '@tamanu/constants';
import { Colors } from '../../constants';
import { MedicationSummary } from './MedicationSummary';
import { AutocompleteField, Field } from '..';
import { useApi, useSuggester } from '../../api';
import { foreignKey } from '../../utils/validation';
import { useEncounter } from '../../contexts/Encounter';

const StyledBaseModal = styled(BaseModal)`
  .MuiPaper-root {
    max-width: 670px;
  }
`;

const DarkText = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.darkText};
`;

const validationSchema = yup.object().shape({
  discontinuingClinicianId: foreignKey(
    <TranslatedText stringId="validation.required.inline" fallback="*Required" />,
  ),
  discontinuingReason: foreignKey(
    <TranslatedText stringId="validation.required.inline" fallback="*Required" />,
  ),
});

export const MedicationDiscontinueModal = ({ medication, onDiscontinue, onClose }) => {
  const { getCountryCurrentDateTimeString } = useDateTimeFormat();
  const api = useApi();
  const practitionerSuggester = useSuggester('practitioner');
  const { encounter, loadEncounter } = useEncounter();

  const onSubmit = async data => {
    const updatedMedication = await api.post(`medication/${medication.id}/discontinue`, {
      ...data,
      discontinuingDate: getCountryCurrentDateTimeString(),
    });
    onDiscontinue(updatedMedication);
    if (loadEncounter && encounter) {
      loadEncounter(encounter.id, false);
    }
    onClose();
  };

  return (
    <StyledBaseModal
      open
      onClose={onClose}
      title={
        <TranslatedText
          stringId="medication.discontinueModal.title"
          fallback="Discontinue medication"
        />
      }
      data-testid="medicationdiscontinuemodal-abc123"
    >
      <Form
        suppressErrorDialog
        onSubmit={onSubmit}
        onSuccess={onClose}
        formType={FORM_TYPES.CREATE_FORM}
        initialValues={{}}
        validationSchema={validationSchema}
        render={({ submitForm }) => (
          <>
            <Box px={1} pt={2.75} pb={5}>
              {medication.isOngoing ? (
                <Box data-testid="box-ongoingmedication-warning-xyz789">
                  <DarkText fontWeight={700} display={'inline-block'}>
                    <TranslatedText
                      stringId="medication.discontinueModal.description1"
                      fallback="Please note this is an ongoing medication."
                    />
                  </DarkText>{' '}
                  <DarkText display={'inline-block'}>
                    <TranslatedText
                      stringId="medication.discontinueModal.description2"
                      fallback="Are you sure you would like to discontinue it?"
                    />
                  </DarkText>
                </Box>
              ) : (
                <DarkText data-testid="darktext-discontinue-description-abc123">
                  <TranslatedText
                    stringId="medication.discontinueModal.description"
                    fallback="Are you sure you would like to discontinue the below medication?"
                  />
                </DarkText>
              )}
              <MedicationSummary medication={medication} />
              <FormGrid data-testid="formgrid-discontinuemedication-xyz789">
                <Field
                  name="discontinuingClinicianId"
                  label={
                    <TranslatedText
                      stringId="medication.discontinueModal.discontinuedBy.label"
                      fallback="Discontinued by"
                    />
                  }
                  component={AutocompleteField}
                  suggester={practitionerSuggester}
                  required
                  data-testid="field-discontinuingclinicianid-input"
                />
                <Field
                  name="discontinuingReason"
                  label={
                    <TranslatedText
                      stringId="medication.discontinueModal.discontinueReason.label"
                      fallback="Discontinue reason"
                    />
                  }
                  component={TextField}
                  required
                  data-testid="field-discontinuingreason-input"
                />
              </FormGrid>
            </Box>
            <Box
              mx={-4}
              mb={-1.5}
              px={5}
              pt={2.5}
              borderTop={`1px solid ${Colors.outline}`}
              display={'flex'}
              justifyContent={'flex-end'}
              gap={2}
              data-testid="box-formactions-discontinue-def456"
            >
              <FormCancelButton 
                onClick={onClose}
                data-testid="formcancelbutton-cancel-xyz789"
              >
                <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
              </FormCancelButton>
              <FormSubmitButton
                color="primary"
                onClick={data => {
                  submitForm(data);
                }}
                data-testid="formsubmitbutton-discontinue-def456"
              >
                <TranslatedText stringId="medication.details.discontinue" fallback="Discontinue" />
              </FormSubmitButton>
            </Box>
          </>
        )}
      />
    </StyledBaseModal>
  );
};
