import React from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { useLabTest } from '../api/queries/useLabTest';
import { formatShort } from './DateDisplay';

import { Modal } from './Modal';
import { Colors } from '../constants';
import { ModalActionRow } from './ModalActionRow';

const ModalBody = styled.div`
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  grid-column-gap: 30px;
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 5px;
  padding: 20px 30px 0px;
  margin: 20px 0px 40px;
`;

const VerticalDivider = styled.div`
  border-left: 1px solid ${Colors.outline};
  height: 60%;
`;

const ValueContainer = styled.div`
  margin-bottom: 20px;
`;
const Label = styled(Typography)`
  font-size: 14px;
  line-height: 18px;
`;
const TitleLabel = styled(Label)`
  color: ${Colors.midText};
`;
const ValueLabel = styled(Label)`
  font-weight: 500;
`;

const ValueDisplay = ({ title, value }) => (
  <ValueContainer>
    <TitleLabel>{title}</TitleLabel>
    <ValueLabel>{value || '-'}</ValueLabel>
  </ValueContainer>
);

export const LabTestResultModal = React.memo(({ open, onClose, labTestId }) => {
  const { data: labTest } = useLabTest(labTestId);
  return (
    <Modal
      title={`${labTest?.labTestType?.name} | Test ID ${labTest?.labRequest?.displayId}`}
      open={open}
      onClose={onClose}
    >
      <ModalBody>
        <div>
          <ValueDisplay title="Result" value={labTest?.result} />
          <ValueDisplay title="Laboratory Officer" value={labTest?.laboratoryOfficer} />
          <ValueDisplay title="Verification" value={labTest?.verification} />
        </div>
        <VerticalDivider />
        <div>
          <ValueDisplay title="Completed" value={formatShort(labTest?.completedDate)} />
          <ValueDisplay title="Test Method" value={labTest?.labTestMethod?.name} />
        </div>
      </ModalBody>
      <ModalActionRow confirmText="Close" onConfirm={onClose} />
    </Modal>
  );
});
