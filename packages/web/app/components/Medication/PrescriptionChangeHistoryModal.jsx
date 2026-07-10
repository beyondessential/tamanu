import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { useQuery } from '@tanstack/react-query';

import { DRUG_ROUTE_LABELS, MEDICATION_DURATION_DISPLAY_UNITS_LABELS } from '@tamanu/constants';
import { getMedicationDoseDisplay, getTranslatedFrequency } from '@tamanu/shared/utils/medication';
import { BaseModal, Button, TranslatedText } from '@tamanu/ui-components';

import { useApi } from '../../api';
import { useTranslation } from '../../contexts/Translation';
import { notifyError, singularize } from '../../utils';
import { TranslatedEnum, TranslatedReferenceData } from '../Translation';
import { Colors } from '../../constants';

const StyledModal = styled(BaseModal)`
  .MuiPaper-root {
    max-width: 670px;
  }
`;

const SectionTitle = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${Colors.darkestText};
  margin: 20px 0 10px;
`;

const DetailsCard = styled.div`
  background: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 5px;
  padding: 16px 20px;
`;

const MedicationLine = styled.div`
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid ${Colors.outline};
`;

const FieldsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 24px;
  row-gap: 12px;
`;

const FieldLabel = styled.div`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.midText};
`;

const FieldValue = styled.div`
  font-size: 14px;
  font-weight: 500;
  line-height: 18px;
  color: ${Colors.darkestText};
  word-break: break-word;
`;

const DetailField = ({ label, children }) => (
  <div>
    <FieldLabel>{label}</FieldLabel>
    <FieldValue>{children ?? '-'}</FieldValue>
  </div>
);

const MedicationName = ({ medication }) =>
  medication ? (
    <TranslatedReferenceData
      value={medication.id}
      fallback={medication.name}
      category={medication.type ?? 'drug'}
    />
  ) : (
    '-'
  );

/**
 * Shows what a fill was actually dispensed with (the pharmacy-modified details) alongside the
 * original prescription, which is never altered by dispensing modifications. Only the original
 * and the dispensed details are shown — intermediate edits are intentionally not displayed.
 */
export const PrescriptionChangeHistoryModal = ({ open, dispenseId, onClose }) => {
  const api = useApi();
  const { getTranslation, getEnumTranslation } = useTranslation();

  const { data } = useQuery(
    ['medicationDispenseModifyHistory', dispenseId],
    () => api.get(`medication/medication-dispenses/${dispenseId}/modify-history`),
    {
      enabled: open && Boolean(dispenseId),
      onError: err => notifyError(err?.message),
    },
  );

  const renderDose = details =>
    details ? getMedicationDoseDisplay(details, getTranslation, getEnumTranslation) : '-';
  const renderFrequency = details =>
    details?.frequency ? getTranslatedFrequency(details.frequency, getTranslation) : '-';
  const renderRoute = details =>
    details?.route ? <TranslatedEnum value={details.route} enumValues={DRUG_ROUTE_LABELS} /> : '-';
  const renderDuration = details =>
    details?.durationValue
      ? `${details.durationValue} ${singularize(
          getEnumTranslation(MEDICATION_DURATION_DISPLAY_UNITS_LABELS, details.durationUnit),
          details.durationValue,
        ).toLowerCase()}`
      : '-';

  const { original, current } = data ?? {};

  return (
    <StyledModal
      open={open}
      onClose={onClose}
      title={
        <TranslatedText
          stringId="medication.modifyHistory.title"
          fallback="Modify prescription history"
        />
      }
      actions={
        <Button onClick={onClose} data-testid="modify-history-close">
          <TranslatedText stringId="general.action.close" fallback="Close" />
        </Button>
      }
    >
      {!data ? (
        <Box p={4} textAlign="center">
          <TranslatedText stringId="general.table.loading" fallback="Loading…" />
        </Box>
      ) : (
        <>
          <SectionTitle>
            <TranslatedText
              stringId="medication.modifyHistory.current"
              fallback="Current prescription details"
            />
          </SectionTitle>
          <DetailsCard data-testid="modify-history-current">
            <MedicationLine>
              <DetailField
                label={
                  <TranslatedText stringId="medication.medication.label" fallback="Medication" />
                }
              >
                <MedicationName medication={current?.medication} />
              </DetailField>
            </MedicationLine>
            <FieldsGrid>
              <DetailField
                label={<TranslatedText stringId="medication.details.dose" fallback="Dose" />}
              >
                {renderDose(current)}
              </DetailField>
              <DetailField
                label={
                  <TranslatedText stringId="medication.details.frequency" fallback="Frequency" />
                }
              >
                {renderFrequency(current)}
              </DetailField>
              <DetailField
                label={<TranslatedText stringId="medication.details.route" fallback="Route" />}
              >
                {renderRoute(current)}
              </DetailField>
              <DetailField
                label={
                  <TranslatedText stringId="medication.details.duration" fallback="Duration" />
                }
              >
                {renderDuration(current)}
              </DetailField>
              <DetailField
                label={
                  <TranslatedText
                    stringId="medication.dispensingQuantity.label"
                    fallback="Dispensing quantity"
                  />
                }
              >
                {current?.quantity ?? '-'}
              </DetailField>
              <DetailField
                label={
                  <TranslatedText stringId="medication.labelNotes.label" fallback="Label notes" />
                }
              >
                {current?.notes || '-'}
              </DetailField>
              <DetailField
                label={
                  <TranslatedText
                    stringId="medication.modificationReason.label"
                    fallback="Reason for modification"
                  />
                }
              >
                {current?.modifiedReason ? (
                  <TranslatedReferenceData
                    value={current.modifiedReason.id}
                    fallback={current.modifiedReason.name}
                    category="medicationDispenseModifyReason"
                  />
                ) : (
                  '-'
                )}
              </DetailField>
              <DetailField
                label={
                  <TranslatedText stringId="medication.modifiedBy.label" fallback="Modified by" />
                }
              >
                {current?.modifiedBy?.displayName ?? '-'}
              </DetailField>
              <div style={{ gridColumn: '1 / -1' }}>
                <DetailField
                  label={
                    <TranslatedText
                      stringId="medication.details.pharmacyNotes"
                      fallback="Pharmacy notes"
                    />
                  }
                >
                  {current?.pharmacyNotes || '-'}
                </DetailField>
              </div>
            </FieldsGrid>
          </DetailsCard>

          <SectionTitle>
            <TranslatedText
              stringId="medication.modifyHistory.original"
              fallback="Original prescription details"
            />
          </SectionTitle>
          <DetailsCard data-testid="modify-history-original">
            <MedicationLine>
              <DetailField
                label={
                  <TranslatedText stringId="medication.medication.label" fallback="Medication" />
                }
              >
                <MedicationName medication={original?.medication} />
              </DetailField>
            </MedicationLine>
            <FieldsGrid>
              <DetailField
                label={<TranslatedText stringId="medication.details.dose" fallback="Dose" />}
              >
                {renderDose(original)}
              </DetailField>
              <DetailField
                label={
                  <TranslatedText stringId="medication.details.frequency" fallback="Frequency" />
                }
              >
                {renderFrequency(original)}
              </DetailField>
              <DetailField
                label={<TranslatedText stringId="medication.details.route" fallback="Route" />}
              >
                {renderRoute(original)}
              </DetailField>
              <DetailField
                label={
                  <TranslatedText stringId="medication.details.duration" fallback="Duration" />
                }
              >
                {renderDuration(original)}
              </DetailField>
              <DetailField
                label={
                  <TranslatedText
                    stringId="medication.dispensingQuantity.label"
                    fallback="Dispensing quantity"
                  />
                }
              >
                {original?.quantity ?? '-'}
              </DetailField>
              <DetailField
                label={
                  <TranslatedText
                    stringId="medication.modifyHistory.originalPrescriber"
                    fallback="Original prescriber"
                  />
                }
              >
                {original?.prescriber?.displayName ?? '-'}
              </DetailField>
              <DetailField
                label={<TranslatedText stringId="medication.details.notes" fallback="Notes" />}
              >
                {original?.notes || '-'}
              </DetailField>
              <DetailField
                label={
                  <TranslatedText
                    stringId="medication.details.pharmacyNotes"
                    fallback="Pharmacy notes"
                  />
                }
              >
                {original?.pharmacyNotes || '-'}
              </DetailField>
            </FieldsGrid>
          </DetailsCard>
        </>
      )}
    </StyledModal>
  );
};

PrescriptionChangeHistoryModal.propTypes = {
  open: PropTypes.bool.isRequired,
  // The medication dispense (fill) whose modification is shown against the original prescription.
  dispenseId: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

PrescriptionChangeHistoryModal.defaultProps = {
  dispenseId: null,
};
