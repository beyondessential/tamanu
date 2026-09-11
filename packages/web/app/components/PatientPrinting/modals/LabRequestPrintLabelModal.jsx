import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Modal, TranslatedText, ConfirmCancelRow } from '@tamanu/ui-components';
import { LabRequestPrintLabel } from '../printouts/LabRequestPrintLabel';
import { LabRequestLabelPrintFrame } from '../printouts/LabRequestLabelPrintFrame';
import { getPatientNameAsString } from '../../PatientNameDisplay';
import { CheckInput } from '../../Field';
import { Colors } from '../../../constants';
import { usePatient } from '../../../contexts/Patient';

const StyledModal = styled(Modal)`
  .MuiDialogActions-root {
    position: sticky;
    bottom: 0;
    background: ${Colors.background};
    border-top: 1px solid ${Colors.outline};
    padding: 10px 40px 20px 40px;
  }
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding-top: 10px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const PreviewCard = styled.div`
  border: 1px solid ${Colors.outline};
  border-radius: 5px;
  padding: 24px 40px;
`;

const toLabelData = (patient, lab) => ({
  patientName: getPatientNameAsString(patient),
  requestId: lab.displayId,
  patientId: patient.displayId,
  patientDateOfBirth: patient.dateOfBirth,
  date: lab.sampleTime,
  collectedBy: lab.collectedBy?.displayName,
});

export const LabRequestPrintLabelModal = ({ open, onClose, labRequests, selectable = false }) => {
  const { patient } = usePatient();
  const frameRef = useRef(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set(labRequests.map(lab => lab.id)));
  const [prevOpen, setPrevOpen] = useState(open);

  // Re-select every label each time the screen is opened, without an Effect.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setSelectedIds(new Set(labRequests.map(lab => lab.id)));
  }

  if (!patient) return null;

  const toggle = id =>
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Without selection the caller has already chosen what to print; otherwise print the ticked rows.
  const printedLabels = (selectable ? labRequests.filter(lab => selectedIds.has(lab.id)) : labRequests)
    .map(lab => toLabelData(patient, lab));

  const handlePrint = async () => {
    await frameRef.current.print();
    onClose();
  };

  return (
    <StyledModal
      title={<TranslatedText stringId="lab.modal.printLabel.title" fallback="Print label" />}
      width="md"
      open={open}
      onClose={onClose}
      actions={
        <ConfirmCancelRow
          onCancel={onClose}
          onConfirm={handlePrint}
          confirmDisabled={printedLabels.length === 0}
          cancelText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
          confirmText={<TranslatedText stringId="lab.action.printLabels" fallback="Print labels" />}
        />
      }
    >
      <List>
        {labRequests.map(lab => (
          <Row key={lab.id}>
            {selectable && (
              <CheckInput
                value={selectedIds.has(lab.id)}
                name={`select-${lab.id}`}
                onChange={() => toggle(lab.id)}
                data-testid={`labelselect-${lab.id}`}
              />
            )}
            <PreviewCard>
              <LabRequestPrintLabel data={toLabelData(patient, lab)} />
            </PreviewCard>
          </Row>
        ))}
      </List>
      <LabRequestLabelPrintFrame ref={frameRef} labels={printedLabels} />
    </StyledModal>
  );
};

LabRequestPrintLabelModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  labRequests: PropTypes.array.isRequired,
  // When true, each label carries a checkbox and only the ticked ones print (the auto-print screen).
  selectable: PropTypes.bool,
};
