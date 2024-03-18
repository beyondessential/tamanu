import React from 'react';
import styled from 'styled-components';
import { useLabTest } from '../../api/queries/useLabTest';

import { Colors } from '../../constants';
import { DateDisplay } from '../../components/DateDisplay';
import { Modal } from '../../components/Modal';
import { ModalActionRow } from '../../components/ModalActionRow';
import { BodyText } from '../../components/Typography';
import { TranslatedText } from '../../components/Translation/TranslatedText';

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
const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  min-height: 55px;
`;

const VerticalDivider = styled.div`
  border-left: 1px solid ${Colors.outline};
  height: 60%;
`;

const ValueContainer = styled.div`
  margin-bottom: 20px;
`;
const TitleLabel = styled(BodyText)`
  color: ${Colors.midText};
`;
const ValueLabel = styled(BodyText)`
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
      title={
        <ModalHeader>
          <TranslatedText
            stringId="lab.modal.testResult.title"
            fallback=":testName | Test ID :testId"
            replacements={{
              testName: labTest?.labTestType?.name,
              testId: labTest?.labRequest?.displayId,
            }}
          />
        </ModalHeader>
      }
      open={open}
      onClose={onClose}
    >
      <ModalBody>
        <div>
          <ValueDisplay
            title={
              <TranslatedText stringId="lab.modal.testResult.value.result" fallback="Result" />
            }
            value={labTest?.result}
          />
          <ValueDisplay
            title={
              <TranslatedText
                stringId="lab.modal.testResult.value.laboratoryOfficer"
                fallback="Laboratory Officer"
              />
            }
            value={labTest?.laboratoryOfficer}
          />
          <ValueDisplay
            title={
              <TranslatedText
                stringId="lab.modal.testResult.value.verification"
                fallback="Verification"
              />
            }
            value={labTest?.verification}
          />
        </div>
        <VerticalDivider />
        <div>
          <ValueDisplay
            title={
              <TranslatedText
                stringId="labs.modal.testResult.value.completed"
                fallback="Completed"
              />
            }
            value={DateDisplay.stringFormat(labTest?.completedDate)}
          />
          <ValueDisplay
            title={
              <TranslatedText
                stringId="lab.modal.testResult.value.testMethod"
                fallback="Test Method"
              />
            }
            value={labTest?.labTestMethod?.name}
          />
        </div>
      </ModalBody>
      <ModalActionRow
        confirmText={<TranslatedText stringId="general.action.close" fallback="Close" />}
        onConfirm={onClose}
      />
    </Modal>
  );
});
