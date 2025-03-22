import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import {
  AutocompleteField,
  BaseModal,
  Field,
  Form,
  formatShortest,
  FormCancelButton,
  FormGrid,
  FormSubmitButton,
  TextField,
  TranslatedEnum,
  TranslatedReferenceData,
  TranslatedText,
} from '..';
import { Colors, FORM_TYPES } from '../../constants';
import { Box } from '@mui/material';
import { CheckSharp } from '@material-ui/icons';
import { getDose, getTranslatedFrequency } from '../../utils/medications';
import { useTranslation } from '../../contexts/Translation';
import { DRUG_ROUTE_LABELS } from '@tamanu/constants';
import { add } from 'date-fns';
import { formatTimeSlot } from '@tamanu/shared/utils/medication';
import { useApi, useSuggester } from '../../api';
import { foreignKey } from '../../utils/validation';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

const StyledBaseModal = styled(BaseModal)`
  .MuiPaper-root {
    max-width: 670px;
  }
`;

const MidText = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.midText};
`;

const DarkestText = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.darkestText};
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
});

export const MedicationDiscontinueModal = ({ medication, onDiscontinue, onClose }) => {
  const api = useApi();
  const { getTranslation, getEnumTranslation } = useTranslation();
  const practitionerSuggester = useSuggester('practitioner');

  const endDateAndTime =
    medication.isOngoing || !medication.durationValue
      ? null
      : (function() {
          const endDate = add(new Date(medication.startDate), {
            [medication.durationUnit]: medication.durationValue,
          });
          return `${formatShortest(endDate)} ${formatTimeSlot(endDate)}`;
        })();

  const onSubmit = async data => {
    const dataToSend = {
      ...data,
      discontinuedDate: getCurrentDateTimeString(),
    };
    const updatedMedication = await api.put(`medication/${medication.id}/discontinue`, dataToSend);
    onDiscontinue(updatedMedication);
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
              <Box>
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
              <Box
                my={3}
                px={2.5}
                py={2}
                border={`1px solid ${Colors.outline}`}
                borderRadius={'3px'}
                bgcolor={Colors.white}
                display={'flex'}
                justifyContent={'space-between'}
              >
                <Box display={'flex'} flexDirection={'column'} gap={0.5}>
                  <MidText>
                    <TranslatedText
                      stringId="medication.details.medication"
                      fallback="Medication"
                    />
                  </MidText>
                  <DarkestText fontWeight={500}>
                    <TranslatedReferenceData
                      fallback={medication.medication.name}
                      value={medication.medication.id}
                      category={medication.medication.type}
                    />
                  </DarkestText>
                  <DarkestText>
                    {getDose(medication, getTranslation, getEnumTranslation)},{' '}
                    {getTranslatedFrequency(medication.frequency, getTranslation)},{' '}
                    <TranslatedEnum value={medication.route} enumValues={DRUG_ROUTE_LABELS} />
                  </DarkestText>
                  {medication.notes && <MidText>{medication.notes}</MidText>}
                </Box>
                <Box
                  display={'flex'}
                  flexDirection={'column'}
                  justifyContent={'space-between'}
                  alignItems={'flex-end'}
                >
                  <Box display={'flex'}>
                    {medication.isPrn && (
                      <Box display={'flex'} alignItems={'center'} color={Colors.primary}>
                        <CheckSharp style={{ fontSize: '18px' }} />
                        <MidText ml={0.5}>
                          <TranslatedText
                            stringId="medication.details.prnMedication"
                            fallback="PRN medication"
                          />
                        </MidText>
                      </Box>
                    )}
                    {medication.isOngoing && (
                      <Box ml={'5px'} display={'flex'} alignItems={'center'} color={Colors.primary}>
                        <CheckSharp style={{ fontSize: '18px' }} />
                        <MidText ml={0.5}>
                          <TranslatedText
                            stringId="medication.details.ongoingMedication"
                            fallback="Ongoing medication"
                          />
                        </MidText>
                      </Box>
                    )}
                  </Box>
                  {endDateAndTime && (
                    <Box mt={3}>
                      <MidText>
                        <TranslatedText
                          stringId="medication.details.endDate"
                          fallback="End date & time"
                        />
                      </MidText>
                      <DarkestText fontWeight={500} mt={0.5}>
                        {endDateAndTime}
                      </DarkestText>
                    </Box>
                  )}
                </Box>
              </Box>
              <FormGrid>
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
            >
              <FormCancelButton onClick={onClose}>
                <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
              </FormCancelButton>
              <FormSubmitButton
                color="primary"
                onClick={data => {
                  submitForm(data);
                }}
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
