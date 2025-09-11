import React, { useState } from 'react';

import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { CheckSharp } from '@material-ui/icons';
import {
  ADMINISTRATION_FREQUENCIES,
  DRUG_ROUTE_LABELS,
  MEDICATION_DURATION_DISPLAY_UNITS_LABELS,
} from '@tamanu/constants';
import { formatShortest } from '@tamanu/utils/dateTime';
import {
  findAdministrationTimeSlotFromIdealTime,
  getDateFromTimeString,
  getMedicationDoseDisplay,
  getTranslatedFrequency,
} from '@tamanu/shared/utils/medication';

import { TranslatedText } from '../Translation/TranslatedText';
import { Colors, FORM_TYPES } from '../../constants';
import { CheckField, Field, Form, TextField } from '../Field';
import { FormModal } from '../FormModal';
import { FormGrid } from '../FormGrid';
import { Button, OutlinedButton } from '../Button';
import { useAuth } from '../../contexts/Auth';
import { useApi } from '../../api';
import { MedicationDiscontinueModal } from './MedicationDiscontinueModal';
import { useTranslation } from '../../contexts/Translation';
import { TranslatedEnum, TranslatedReferenceData } from '../Translation';
import { formatTimeSlot } from '../../utils/medications';
import { MedicationPauseModal } from './MedicationPauseModal';
import { usePausePrescriptionQuery } from '../../api/queries/usePausePrescriptionQuery';
import { useEncounter } from '../../contexts/Encounter';
import { MedicationResumeModal } from './MedicationResumeModal';
import { singularize } from '../../utils';
import { NoteModalActionBlocker } from '../NoteModalActionBlocker';

const StyledFormModal = styled(FormModal)`
  .MuiPaper-root {
    max-width: 670px;
  }
  .MuiTypography-root {
    padding: 0 8px;
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

const DiscontinuedText = styled(Box)`
  font-size: 18px;
  line-height: 24px;
  font-weight: 500;
  color: ${Colors.alert};
`;

const PausedText = styled(Box)`
  font-size: 18px;
  line-height: 24px;
  font-weight: 500;
  color: ${Colors.primary};
`;

export const MedicationDetails = ({
  initialMedication,
  onClose,
  onReloadTable,
  isOngoingPrescription,
  allowDiscontinue = true,
}) => {
  const { encounter } = useEncounter();
  const { ability } = useAuth();
  const api = useApi();
  const { getTranslation, getEnumTranslation } = useTranslation();
  const canDiscontinueMedication = allowDiscontinue && ability?.can('write', 'Medication');
  const canPauseMedication = ability?.can('write', 'Medication');
  const canCreateMedicationPharmacyNote = ability?.can('create', 'MedicationPharmacyNote');
  const canUpdateMedicationPharmacyNote = ability?.can('write', 'MedicationPharmacyNote');
  const canWriteSensitiveMedication = ability?.can('write', 'SensitiveMedication');

  const [openDiscontinueModal, setOpenDiscontinueModal] = useState(false);
  const [openPauseModal, setOpenPauseModal] = useState(false);
  const [openResumeModal, setOpenResumeModal] = useState(false);
  const [medication, setMedication] = useState(initialMedication);

  const { data, refetch: refetchPauseData } = usePausePrescriptionQuery(
    {
      prescriptionId: medication.id,
      encounterId: encounter?.id,
    },
    {
      enabled: !!medication.id && !!encounter?.id && !isOngoingPrescription,
    },
  );
  const pauseData = data?.pauseRecord;
  const isPausing = !!pauseData && !medication.discontinued;
  const isSensitive = medication?.medication?.referenceDrug?.isSensitive;

  const leftDetails = [
    {
      label: <TranslatedText stringId="medication.details.dose" fallback="Dose" />,
      value: getMedicationDoseDisplay(medication, getTranslation, getEnumTranslation),
    },
    {
      label: <TranslatedText stringId="medication.details.route" fallback="Route" />,
      value: <TranslatedEnum value={medication.route} enumValues={DRUG_ROUTE_LABELS} />,
    },
    {
      label: (
        <TranslatedText stringId="medication.details.startDate" fallback="Start date & time" />
      ),
      value: `${formatShortest(medication.startDate)} ${formatTimeSlot(medication.startDate)}`,
    },
    ...(medication.isOngoing || medication.discontinued
      ? []
      : [
          {
            label: <TranslatedText stringId="medication.details.duration" fallback="Duration" />,
            value: medication.durationValue
              ? `${medication.durationValue} ${singularize(
                  getEnumTranslation(
                    MEDICATION_DURATION_DISPLAY_UNITS_LABELS,
                    medication.durationUnit,
                  ),
                  medication.durationValue,
                ).toLowerCase()}`
              : '-',
          },
        ]),
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
      value: medication.frequency
        ? getTranslatedFrequency(medication.frequency, getTranslation)
        : '-',
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
    ...(medication.isOngoing || medication.discontinued || !medication.endDate
      ? []
      : [
          {
            label: (
              <TranslatedText stringId="medication.details.endDate" fallback="End date & time" />
            ),
            value: `${formatShortest(medication.endDate)} ${formatTimeSlot(medication.endDate)}`,
          },
        ]),
    {
      label: <TranslatedText stringId="medication.details.prescriber" fallback="Prescriber" />,
      value: medication.prescriber?.displayName || '-',
    },
    {
      label: <TranslatedText stringId="medication.details.phoneOrder" fallback="Phone order" />,
      value:
        medication.isPhoneOrder == undefined ? (
          '-'
        ) : medication.isPhoneOrder ? (
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

  const onDiscontinue = async updatedMedication => {
    setMedication(updatedMedication);
    onReloadTable();
  };

  const onPause = async () => {
    refetchPauseData();
    onReloadTable();
  };

  return (
    <StyledFormModal
      open
      title={<TranslatedText stringId="medication.details.title" fallback="Medication details" />}
      onClose={onClose}
      isClosable
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
              {medication.discontinued && (
                <>
                  <DiscontinuedText>
                    <TranslatedText
                      stringId="medication.details.medicationDiscontinued"
                      fallback="Medication discontinued"
                    />
                  </DiscontinuedText>
                  <DetailsContainer mt={0.5} display={'flex'} justifyContent={'space-between'}>
                    <Box flex={1.1}>
                      <MidText>
                        <TranslatedText
                          stringId="medication.details.discontinuedBy"
                          fallback="Discontinued by"
                        />
                      </MidText>
                      <DarkestText mt={0.5}>
                        {medication.discontinuingClinician?.displayName}
                      </DarkestText>
                      <MidText mt={2}>
                        <TranslatedText
                          stringId="medication.details.discontinueReason"
                          fallback="Discontinue reason"
                        />
                      </MidText>
                      <DarkestText mt={0.5}>{medication.discontinuingReason || '-'}</DarkestText>
                    </Box>
                    <Box flex={1} pl={2.5} borderLeft={`1px solid ${Colors.outline}`}>
                      <MidText>
                        <TranslatedText
                          stringId="medication.details.discontinueDate"
                          fallback="Discontinue date & time"
                        />
                      </MidText>
                      <DarkestText mt={0.5}>{`${formatShortest(
                        new Date(medication.discontinuedDate),
                      )} ${formatTimeSlot(new Date(medication.discontinuedDate))}`}</DarkestText>
                    </Box>
                  </DetailsContainer>
                  <Box my={2.5} height={'1px'} bgcolor={Colors.outline} />
                </>
              )}
              {isPausing && (
                <>
                  <PausedText>
                    <TranslatedText
                      stringId="medication.details.medicationPaused"
                      fallback="Medication paused"
                    />
                  </PausedText>
                  <DetailsContainer mt={0.5} display={'flex'} justifyContent={'space-between'}>
                    <Box flex={1.1}>
                      <MidText>
                        <TranslatedText
                          stringId="medication.details.duration"
                          fallback="Duration"
                        />
                      </MidText>
                      <DarkestText mt={0.5}>
                        {pauseData.pauseDuration}{' '}
                        {singularize(
                          getEnumTranslation(
                            MEDICATION_DURATION_DISPLAY_UNITS_LABELS,
                            pauseData.pauseTimeUnit,
                          ),
                          pauseData.pauseDuration,
                        ).toLowerCase()}{' '}
                        - {<TranslatedText stringId="medication.details.until" fallback="until" />}{' '}
                        {`${formatShortest(pauseData.pauseEndDate)} ${formatTimeSlot(
                          pauseData.pauseEndDate,
                        )}`}
                      </DarkestText>
                    </Box>
                    <Box flex={1} pl={2.5} borderLeft={`1px solid ${Colors.outline}`}>
                      <MidText>
                        <TranslatedText stringId="medication.details.notes" fallback="Notes" />
                      </MidText>
                      <DarkestText mt={0.5}>{pauseData.notes || '-'}</DarkestText>
                    </Box>
                  </DetailsContainer>
                  <Box my={2.5} height={'1px'} bgcolor={Colors.outline} />
                </>
              )}
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
                    <DarkestText mt={0.5}>
                      <TranslatedReferenceData
                        fallback={medication.medication.name}
                        value={medication.medication.id}
                        category={medication.medication.type}
                      />
                    </DarkestText>
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
                  <NoteModalActionBlocker>
                    <Field
                      name="pharmacyNotes"
                      label={
                        <TranslatedText
                          stringId="medication.details.pharmacyNotes"
                          fallback="Pharmacy notes"
                        />
                      }
                      component={TextField}
                      disabled={
                        !canCreateMedicationPharmacyNote ||
                        (!canUpdateMedicationPharmacyNote && values.pharmacyNotes) ||
                        medication.discontinued ||
                        isPausing ||
                        isOngoingPrescription
                      }
                    />
                  </NoteModalActionBlocker>
                </div>
                {!medication.discontinued && !isPausing && !isOngoingPrescription && (
                  <div style={{ gridColumn: '1/-1', marginTop: '-12px' }}>
                    <NoteModalActionBlocker>
                      <Field
                        name="displayPharmacyNotesInMar"
                        label={
                          <MidText color={`${Colors.darkText} !important`}>
                            <TranslatedText
                              stringId="medication.details.displayInMarInstructions"
                              fallback="Display pharmacy notes on MAR"
                            />
                          </MidText>
                        }
                        component={CheckField}
                        disabled={!canCreateMedicationPharmacyNote}
                      />
                    </NoteModalActionBlocker>
                  </div>
                )}
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
                    {medication?.idealTimes?.slice().sort((a, b) => {
                      const timeA = getDateFromTimeString(a);
                      const timeB = getDateFromTimeString(b);
                      return timeA - timeB;
                    }).map(time => {
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
                    {medication?.idealTimes?.slice().sort((a, b) => {
                      const timeA = getDateFromTimeString(a);
                      const timeB = getDateFromTimeString(b);
                      return timeA - timeB;
                    }).map(time => {
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
              {medication.discontinued ? (
                <>
                  <div />
                  <Button onClick={onClose}>
                    <TranslatedText stringId="general.action.close" fallback="Close" />
                  </Button>
                </>
              ) : (
                <>
                  {isSensitive && !canWriteSensitiveMedication ? (
                    <div />
                  ) : (
                    <Box display={'flex'} style={{ gap: '10px' }}>
                      {canDiscontinueMedication && (
                        <NoteModalActionBlocker>
                          <OutlinedButton onClick={() => setOpenDiscontinueModal(true)}>
                            <TranslatedText
                              stringId="medication.details.discontinue"
                              fallback="Discontinue"
                            />
                          </OutlinedButton>
                        </NoteModalActionBlocker>
                      )}
                      {canPauseMedication &&
                        !isOngoingPrescription &&
                        (isPausing ? (
                          <NoteModalActionBlocker>
                            <OutlinedButton onClick={() => setOpenResumeModal(true)}>
                              <TranslatedText
                                stringId="medication.details.resume"
                                fallback="Resume"
                              />
                            </OutlinedButton>
                          </NoteModalActionBlocker>
                        ) : (
                          <NoteModalActionBlocker>
                            <OutlinedButton
                              onClick={() => setOpenPauseModal(true)}
                              disabled={
                                medication.frequency === ADMINISTRATION_FREQUENCIES.IMMEDIATELY
                              }
                            >
                              <TranslatedText
                                stringId="medication.details.pause"
                                fallback="Pause"
                              />
                            </OutlinedButton>
                          </NoteModalActionBlocker>
                        ))}
                    </Box>
                  )}
                  {isPausing || isOngoingPrescription || !canCreateMedicationPharmacyNote ? (
                    <Button onClick={onClose}>
                      <TranslatedText stringId="general.action.close" fallback="Close" />
                    </Button>
                  ) : (
                    <Box display={'flex'} style={{ gap: '10px' }}>
                      <OutlinedButton onClick={onClose}>
                        <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
                      </OutlinedButton>
                      <NoteModalActionBlocker>
                        <Button type="submit">
                          <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
                        </Button>
                      </NoteModalActionBlocker>
                    </Box>
                  )}
                </>
              )}
            </Box>

            {openDiscontinueModal && (
              <MedicationDiscontinueModal
                medication={medication}
                onDiscontinue={onDiscontinue}
                onClose={() => setOpenDiscontinueModal(false)}
              />
            )}

            {openPauseModal && (
              <MedicationPauseModal
                medication={medication}
                onPause={onPause}
                onClose={() => setOpenPauseModal(false)}
              />
            )}

            {openResumeModal && (
              <MedicationResumeModal
                medication={medication}
                onResume={onPause}
                onClose={() => setOpenResumeModal(false)}
              />
            )}
          </>
        )}
      />
    </StyledFormModal>
  );
};
