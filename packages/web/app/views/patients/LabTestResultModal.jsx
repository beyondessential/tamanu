import React from 'react';
import styled from 'styled-components';

import { Modal, TranslatedText, TranslatedReferenceData } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';

import { useLabTestQuery } from '../../api/queries/useLabTestQuery';
import { DateDisplay } from '../../components/DateDisplay';
import { ModalActionRow } from '../../components/ModalActionRow';
import { BodyText } from '../../components/Typography';

const ModalBody = styled.div`
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  grid-column-gap: 30px;
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 5px;
  padding: 20px 30px;
  margin: 20px 0px 40px;
`;
const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  min-height: 55px;
`;

// TODO: sort this out
const VerticalDivider = styled.div`
  border-left: 1px solid ${Colors.outline};
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;
const TitleLabel = styled(BodyText)`
  color: ${Colors.midText};
`;
const ValueLabel = styled(BodyText)`
  font-weight: 500;
`;

const ValueDisplay = ({ title, value }) => (
  <div>
    <TitleLabel data-testid="titlelabel-j7eo">{title}</TitleLabel>
    <ValueLabel data-testid="valuelabel-mwpw">{value || '-'}</ValueLabel>
  </div>
);

export const LabTestResultModal = React.memo(({ open, onClose, labTestId }) => {
  const { data: labTest } = useLabTestQuery(labTestId);
  return (
    <Modal
      title={
        <ModalHeader data-testid="modalheader-82wy">
          <TranslatedText
            stringId="lab.modal.testResult.title"
            fallback=":testName | Test ID :testId"
            replacements={{
              testName: labTest?.labTestType?.name,
              testId: labTest?.labRequest?.displayId,
            }}
            data-testid="translatedtext-o58r"
          />
        </ModalHeader>
      }
      open={open}
      onClose={onClose}
      data-testid="modal-zwic"
    >
      <ModalBody data-testid="modalbody-bzy6">
        <Column>
          <ValueDisplay
            title={
              <TranslatedText
                stringId="lab.modal.testResult.value.result"
                fallback="Result"
                data-testid="translatedtext-t8x2"
              />
            }
            value={labTest?.result}
            data-testid="valuedisplay-upbf"
          />
          <ValueDisplay
            title={
              <TranslatedText
                stringId="lab.modal.testResult.value.laboratoryOfficer"
                fallback="Laboratory Officer"
                data-testid="translatedtext-s10n"
              />
            }
            value={labTest?.laboratoryOfficer}
            data-testid="valuedisplay-n6cd"
          />
          <ValueDisplay
            title={
              <TranslatedText
                stringId="lab.modal.testResult.value.verification"
                fallback="Verification"
                data-testid="translatedtext-72qj"
              />
            }
            value={labTest?.verification}
            data-testid="valuedisplay-9a0t"
          />
        </Column>
        <VerticalDivider data-testid="verticaldivider-n6md" />
        <Column>
          {labTest?.labTestType?.supportsSecondaryResults && (
            <ValueDisplay
              title={
                <TranslatedText
                  stringId="lab.modal.testResult.value.secondaryResult"
                  fallback="Secondary result"
                  data-testid="translatedtext-secondary-result"
                />
              }
              value={labTest?.secondaryResult}
              data-testid="valuedisplay-secondary-result"
            />
          )}
          <ValueDisplay
            title={
              <TranslatedText
                stringId="labs.modal.testResult.value.completed"
                fallback="Completed"
                data-testid="translatedtext-pqqs"
              />
            }
            value={DateDisplay.stringFormat(labTest?.completedDate)}
            data-testid="valuedisplay-9ppd"
          />
          <ValueDisplay
            title={
              <TranslatedText
                stringId="lab.modal.testResult.value.testMethod"
                fallback="Test Method"
                data-testid="translatedtext-xhkj"
              />
            }
            value={
              labTest?.labTestMethod?.name && (
                <TranslatedReferenceData
                  fallback={labTest.labTestMethod.name}
                  value={labTest.labTestMethod.id}
                  category="labTestMethod"
                  data-testid="translatedreferencedata-8ker"
                />
              )
            }
            data-testid="valuedisplay-op8r"
          />
        </Column>
      </ModalBody>
      <ModalActionRow
        confirmText={
          <TranslatedText
            stringId="general.action.close"
            fallback="Close"
            data-testid="translatedtext-fb7o"
          />
        }
        onConfirm={onClose}
        data-testid="modalactionrow-cwje"
      />
    </Modal>
  );
});
