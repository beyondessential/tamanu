import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { Box } from '@material-ui/core';
import { Modal } from '@tamanu/ui-components';
import { ConfirmCancelBackRow, TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../constants';
import { useApi } from '../../api';
import { useAuth } from '../../contexts/Auth';
import { useSettings } from '../../contexts/Settings';
import { MedicationLabel } from './MedicationLabel';
import { getCurrentDateString } from '@tamanu/utils/dateTime';
import { PHARMACY_PRESCRIPTION_TYPES } from '@tamanu/constants';
import { BodyText } from '../Typography';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-height: 600px;
  overflow-y: auto;
  padding: 20px 0;

  @media print {
    max-height: none;
    overflow: visible;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;
    padding: 0;

    > div {
      margin: 15px;
    }
  }
`;

const LabelWrapper = styled.div`
  margin-bottom: 20px;

  @media print {
    margin: 15px;
  }
`;

const SubmitButtonsWrapper = styled.div`
  border-top: 1px solid ${Colors.outline};
  padding-top: 10px;
  margin-top: 20px;
`;

// Generate a request number (in real implementation, this would come from the medication request)
const generateRequestNumber = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const DispenseMedicationPrintLabelModal = React.memo(
  ({ open, onClose, medicationRequests, dispensedById, patient, onBack, onDispense }) => {
    const { getSetting } = useSettings();
    const api = useApi();
    const { facilityId } = useAuth();
    const [prescriber, setPrescriber] = useState(null);
    const [facility, setFacility] = useState(null);
    const [dateOfDispensing] = useState(getCurrentDateString());

    // Get label size from settings (default: 80mm x 40mm)
    const labelWidth = getSetting('medications.medicationsDispensing.prescriptionLabelSize.width') || 80;
    const labelHeight = getSetting('medications.medicationsDispensing.prescriptionLabelSize.height') || 40;

    // Fetch facility data
    const { data: facilityData, isLoading: isFacilityLoading } = useQuery(
      ['facility', facilityId],
      () => api.get(`facility/${encodeURIComponent(facilityId)}`),
      {
        enabled: !!facilityId && open,
      },
    );

    // Fetch prescriber data (using first medication request's prescriber if available)
    useEffect(() => {
      if (open && medicationRequests?.[0]?.prescriberId) {
        (async () => {
          try {
            const res = await api.get(`user/${encodeURIComponent(medicationRequests[0].prescriberId)}`);
            setPrescriber(res);
          } catch (error) {
            console.error('Error fetching prescriber:', error);
          }
        })();
      }
    }, [open, medicationRequests, api]);

    useEffect(() => {
      if (facilityData) {
        setFacility(facilityData);
      }
    }, [facilityData]);

    const handleDispenseAndPrint = () => {
      // Open print dialog
      window.print();

      // Call onDispense callback to mark medications as dispensed
      if (onDispense) {
        onDispense(medicationRequests);
      }
    };

    const patientName = patient?.displayName || patient?.firstName
      ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
      : 'Unknown Patient';

    const prescriberName = prescriber?.displayName || prescriber?.firstName
      ? `${prescriber.firstName || ''} ${prescriber.lastName || ''}`.trim()
      : '';

    return (
      <Modal
        title={
          <TranslatedText
            stringId="medication.dispense.printLabel.title"
            fallback="Dispense medication & print label"
          />
        }
        width="lg"
        open={open}
        onClose={onClose}
        printable
        data-testid="dispense-medication-print-label-modal"
      >
        <BodyText color={Colors.darkText} style={{ marginBottom: '20px' }}>
          <TranslatedText
            stringId="medication.dispense.printLabel.description"
            fallback="Please review the medication label/s below. Select Back to make changes, or Dispense & print to complete."
          />
        </BodyText>

        <Container>
          {medicationRequests?.map((request, index) => {
            // Generate request number (in real implementation, this would come from the request)
            const requestNumber = request.requestNumber || generateRequestNumber();

            // Calculate remaining repeats
            // For inpatient: always 0
            // For outpatient/discharge: 
            //   - First dispensing: no change
            //   - Subsequent: decrement by 1
            let remainingRepeats = request.prescriptionType === PHARMACY_PRESCRIPTION_TYPES.INPATIENT
              ? 0
              : request.remainingRepeats;

            // If this is not the first dispensing, decrement repeats
            if (request.prescriptionType !== PHARMACY_PRESCRIPTION_TYPES.INPATIENT && request.lastDispensed) {
              remainingRepeats = Math.max(0, remainingRepeats - 1);
            }

            return (
              <LabelWrapper key={request.id || index}>
                <MedicationLabel
                  medicationName={request.medication.name}
                  instructions={request.instructions}
                  patientName={patientName}
                  dateOfDispensing={dateOfDispensing}
                  quantity={request.quantity}
                  repeatsRemaining={remainingRepeats}
                  prescriber={prescriberName}
                  requestNumber={requestNumber}
                  facility={facility}
                  width={labelWidth}
                  height={labelHeight}
                />
              </LabelWrapper>
            );
          })}
        </Container>

        <SubmitButtonsWrapper>
          <ConfirmCancelBackRow
            onBack={onBack}
            onCancel={onClose}
            onConfirm={handleDispenseAndPrint}
            confirmText={
              <TranslatedText
                stringId="medication.dispense.printLabel.action.dispenseAndPrint"
                fallback="Dispense & print"
              />
            }
            backText={
              <TranslatedText
                stringId="general.action.back"
                fallback="Back"
              />
            }
            cancelText={
              <TranslatedText
                stringId="general.action.cancel"
                fallback="Cancel"
              />
            }
          />
        </SubmitButtonsWrapper>
      </Modal>
    );
  },
);

DispenseMedicationPrintLabelModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  medicationRequests: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      medication: PropTypes.shape({
        name: PropTypes.string.isRequired,
      }).isRequired,
      instructions: PropTypes.string.isRequired,
      quantity: PropTypes.number.isRequired,
      remainingRepeats: PropTypes.number,
      prescriptionType: PropTypes.string,
      lastDispensed: PropTypes.string,
      prescriberId: PropTypes.string,
      requestNumber: PropTypes.string,
    }),
  ).isRequired,
  dispensedById: PropTypes.string.isRequired,
  patient: PropTypes.object,
  onBack: PropTypes.func.isRequired,
  onDispense: PropTypes.func,
};
