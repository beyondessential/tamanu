import React from 'react';

import { TranslatedText } from '../components/Translation/TranslatedText';
import styled from 'styled-components';
import { Colors, FORM_TYPES } from '../constants';
import { Box } from '@material-ui/core';
import { CheckSharp } from '@material-ui/icons';
import { DRUG_ROUTE_LABELS } from '@tamanu/constants';
import { formatShortest } from '@tamanu/utils/dateTime';
import { CheckField, Field, Form, TextField } from './Field';
import { FormModal } from './FormModal';
import { FormGrid } from './FormGrid';
import {
  findAdministrationTimeSlotFromIdealTime,
  getDateFromTimeString,
  formatTimeSlot,
} from '@tamanu/shared/utils/medication';
import { Button, OutlinedButton } from './Button';
import { useAuth } from '../contexts/Auth';
import { useApi } from '../api';

const StyledFormModal = styled(FormModal)`
  .MuiPaper-root {
    max-width: 670px;
  }
`;
const Container = styled.div`
  padding: 16px 8px;
`;

const DetailsContainer = styled(Box)`
  padding: 12px 20px;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  background-color: ${Colors.white};
`;

const MidText = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.midText};
`;

const DarkestText = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  font-weight: 500;
  color: ${Colors.darkestText};
`;

export const MedicationDetails = ({ medication, onClose, onReloadTable }) => {
  const { ability } = useAuth();
  const api = useApi();
  const canCreateMedicationPharmacyNote = ability?.can('create', 'MedicationPharmacyNote');
  const canUpdateMedicationPharmacyNote = ability?.can('write', 'MedicationPharmacyNote');

  const leftDetails = [
    {
      label: <TranslatedText stringId="medication.details.dose" fallback="Dose" />,
      value: medication.doseAmount || '-',
    },
    {
      label: <TranslatedText stringId="medication.details.route" fallback="Route" />,
      value: DRUG_ROUTE_LABELS[medication.route] || '-',
    },
    {
      label: (
        <TranslatedText stringId="medication.details.startDate" fallback="Start date & time" />
      ),
      value: `${formatShortest(medication.startDate)} ${formatTimeSlot(medication.startDate)}`,
    },
    {
      label: <TranslatedText stringId="medication.details.indication" fallback="Indication" />,
      value: medication.indication || '-',
    },
    {
      label: (
        <TranslatedText
          stringId="medication.details.dischargeQuantity"
          fallback="Discharge quantity"
        />
      ),
      value: medication.quantity ?? '-',
    },
  ];

  const rightDetails = [
    {
      label: <TranslatedText stringId="medication.details.frequency" fallback="Frequency" />,
      value: medication.frequency || '-',
    },
    {
      label: (
        <TranslatedText
          stringId="medication.details.prescriptionDate"
          fallback="Prescription date"
        />
      ),
      value: `${formatShortest(medication.date)}`,
    },
    {
      label: <TranslatedText stringId="medication.details.prescriber" fallback="Prescriber" />,
      value: medication.prescriber?.displayName || '-',
    },
    {
      label: <TranslatedText stringId="medication.details.phoneOrder" fallback="Phone order" />,
      value: medication.isPhoneOrder ? (
        <TranslatedText stringId="general.yes" fallback="Yes" />
      ) : (
        <TranslatedText stringId="general.no" fallback="No" />
      ),
    },
    {
      label: <TranslatedText stringId="medication.details.notes" fallback="Notes" />,
      value: medication.notes || '-',
    },
  ];

  const onSubmit = async data => {
    await api.put(`medication/${medication.id}/pharmacy-notes`, {
      ...data,
    });
    onReloadTable();
  };

  return (
    <StyledFormModal
      open
      title={<TranslatedText stringId="medication.details.title" fallback="Medication details" />}
      onClose={onClose}
    >
      <Form
        onSubmit={onSubmit}
        onSuccess={onClose}
        formType={FORM_TYPES.EDIT_FORM}
        initialValues={{
          pharmacyNotes: medication.pharmacyNotes,
          displayPharmacyNotesInMar: medication.displayPharmacyNotesInMar,
        }}
        render={values => (
          <>
            <Container>
              <DetailsContainer>
                <Box
                  py={1}
                  display={'flex'}
                  justifyContent={'space-between'}
                  borderBottom={`1px solid ${Colors.outline}`}
                >
                  <Box>
                    <MidText>
                      <TranslatedText
                        stringId="medication.details.medication"
                        fallback="Medication"
                      />
                    </MidText>
                    <DarkestText mt={0.5}>{medication.medication.name}</DarkestText>
                  </Box>
                  <Box display={'flex'} justifyContent={'flex-end'} height={'fit-content'}>
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
                </Box>
                <Box mt={1.5} display={'flex'}>
                  <Box flex={1.1}>
                    {leftDetails.map((detail, index) => (
                      <Box key={index} mb={index === leftDetails.length - 1 ? 0 : 2}>
                        <MidText>{detail.label}</MidText>
                        <DarkestText mt={0.5}>{detail.value}</DarkestText>
                      </Box>
                    ))}
                  </Box>
                  <Box flex={1} pl={2.5} borderLeft={`1px solid ${Colors.outline}`}>
                    {rightDetails.map((detail, index) => (
                      <Box key={index} mb={index === rightDetails.length - 1 ? 0 : 2}>
                        <MidText>{detail.label}</MidText>
                        <DarkestText mt={0.5}>{detail.value}</DarkestText>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </DetailsContainer>
              <Box my={2.5} height={'1px'} bgcolor={Colors.outline} />
              <FormGrid>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Field
                    name="pharmacyNotes"
                    label={
                      <TranslatedText
                        stringId="medication.details.pharmacyNotes"
                        fallback="Pharmacy notes"
                      />
                    }
                    component={TextField}
                    inputProps={{
                      readOnly:
                        !canCreateMedicationPharmacyNote ||
                        (!canUpdateMedicationPharmacyNote && values.pharmacyNotes),
                    }}
                  />
                </div>
                <div style={{ gridColumn: '1/-1', marginTop: '-12px' }}>
                  <Field
                    name="displayPharmacyNotesInMar"
                    label={
                      <MidText color={`${Colors.darkText} !important`}>
                        <TranslatedText
                          stringId="medication.details.displayInMarInstructions"
                          fallback="Display in MAR instructions"
                        />
                      </MidText>
                    }
                    component={CheckField}
                    disabled={!canCreateMedicationPharmacyNote}
                  />
                </div>
              </FormGrid>
              <Box mt={2.5}>
                <DarkestText color={`${Colors.darkText} !important`}>
                  <TranslatedText
                    stringId="medication.details.medicationAdministrationSchedule"
                    fallback="Medication administration schedule"
                  />
                </DarkestText>
                <DetailsContainer mt={0.5} width={'50%'} display={'flex'}>
                  <Box display={'flex'} flexDirection={'column'} mr={2.5} style={{ gap: '16px' }}>
                    {medication?.idealTimes?.map(time => {
                      const slot = findAdministrationTimeSlotFromIdealTime(time).timeSlot;
                      return (
                        <DarkestText key={time}>
                          {`${formatTimeSlot(
                            getDateFromTimeString(slot.startTime),
                          )} - ${formatTimeSlot(getDateFromTimeString(slot.endTime))} `}
                        </DarkestText>
                      );
                    })}
                  </Box>
                  <Box display={'flex'} flexDirection={'column'} style={{ gap: '16px' }}>
                    {medication?.idealTimes?.map(time => {
                      return (
                        <MidText key={time}>{formatTimeSlot(getDateFromTimeString(time))}</MidText>
                      );
                    })}
                  </Box>
                </DetailsContainer>
              </Box>
            </Container>

            <Box
              mx={-4}
              px={5}
              pt={2.5}
              borderTop={`1px solid ${Colors.outline}`}
              display={'flex'}
              justifyContent={'space-between'}
            >
              <Box display={'flex'} style={{ gap: '10px' }}>
                <OutlinedButton>
                  <TranslatedText
                    stringId="medication.details.discontinue"
                    fallback="Discontinue"
                  />
                </OutlinedButton>
                <OutlinedButton>
                  <TranslatedText stringId="medication.details.pause" fallback="Pause" />
                </OutlinedButton>
              </Box>
              <Box display={'flex'} style={{ gap: '10px' }}>
                <OutlinedButton onClick={onClose}>
                  <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
                </OutlinedButton>
                <Button type="submit">
                  <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
                </Button>
              </Box>
            </Box>
          </>
        )}
      />
    </StyledFormModal>
  );
};
