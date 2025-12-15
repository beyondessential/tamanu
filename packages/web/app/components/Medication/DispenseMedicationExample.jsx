import React, { useState } from 'react';
import { DispenseMedicationModal } from './DispenseMedicationModal';
import { DispenseMedicationPrintLabelModal } from './DispenseMedicationPrintLabelModal';

/**
 * Example component demonstrating how to use the dispense medication modals
 * This shows the workflow:
 * 1. Open DispenseMedicationModal to select medications
 * 2. Click Review to open DispenseMedicationPrintLabelModal
 * 3. Click Back to return to DispenseMedicationModal
 * 4. Click Dispense & print to complete
 */
export const DispenseMedicationExample = ({ patient }) => {
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [showPrintLabelModal, setShowPrintLabelModal] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [dispensedById, setDispensedById] = useState('');

  const handleReview = (requests, dispensedBy) => {
    setSelectedRequests(requests);
    setDispensedById(dispensedBy);
    setShowDispenseModal(false);
    setShowPrintLabelModal(true);
  };

  const handleBack = () => {
    setShowPrintLabelModal(false);
    setShowDispenseModal(true);
  };

  const handleDispense = (requests) => {
    // Mark medications as dispensed
    console.log('Dispensing medications:', requests);
    // In real implementation, this would call an API to mark medications as dispensed
    setShowPrintLabelModal(false);
  };

  const handleClose = () => {
    setShowDispenseModal(false);
    setShowPrintLabelModal(false);
    setSelectedRequests([]);
    setDispensedById('');
  };

  return (
    <>
      <button onClick={() => setShowDispenseModal(true)}>
        Open Dispense Medication Modal
      </button>

      <DispenseMedicationModal
        open={showDispenseModal}
        onClose={handleClose}
        patient={patient}
        onReview={handleReview}
      />

      <DispenseMedicationPrintLabelModal
        open={showPrintLabelModal}
        onClose={handleClose}
        medicationRequests={selectedRequests}
        dispensedById={dispensedById}
        patient={patient}
        onBack={handleBack}
        onDispense={handleDispense}
      />
    </>
  );
};
