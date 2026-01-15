import React from 'react';
import styled from 'styled-components';

import { Modal, TranslatedText, TranslatedReferenceData } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';

import { useLabTestQuery } from '../../api/queries/useLabTestQuery';
import { useLabTestResultHistoryQuery } from '../../api/queries';
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
  <ValueContainer data-testid="valuecontainer-re0h">
    <TitleLabel data-testid="titlelabel-j7eo">{title}</TitleLabel>
    <ValueLabel data-testid="valuelabel-mwpw">{value || '-'}</ValueLabel>
  </ValueContainer>
);

const HistorySection = styled.div`
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid ${Colors.outline};
`;

const HistoryTitle = styled(BodyText)`
  font-weight: 500;
  margin-bottom: 15px;
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const HistoryItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background-color: ${Colors.background};
  border-radius: 4px;
`;

const HistoryItemText = styled(BodyText)`
  font-size: 14px;
`;

const HistoryItemLabel = styled(HistoryItemText)`
  color: ${Colors.midText};
`;

const HistoryItemValue = styled(HistoryItemText)`
  font-weight: 500;
`;

export const LabTestResultModal = React.memo(({ open, onClose, labTestId }) => {
  const { data: labTest } = useLabTestQuery(labTestId);
  const { data: history = [] } = useLabTestResultHistoryQuery(labTestId);

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
        <div>
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
        </div>
        <VerticalDivider data-testid="verticaldivider-n6md" />
        <div>
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
        </div>
      </ModalBody>
      {history.length > 0 && (
        <HistorySection data-testid="historysection-hist">
          <HistoryTitle data-testid="historytitle-hist">
            <TranslatedText
              stringId="lab.modal.testResult.history.title"
              fallback="Result History"
              data-testid="translatedtext-hist"
            />
          </HistoryTitle>
          <HistoryList data-testid="historylist-hist">
            {history.map((item) => (
              <HistoryItem key={item.id} data-testid="historyitem-hist">
                <HistoryItemValue data-testid="historyitemvalue-result">
                  {item.result}
                </HistoryItemValue>
                <HistoryItemLabel data-testid="historyitemlabel-user">
                  Updated by: {item.updatedByDisplayName || 'Unknown'}
                </HistoryItemLabel>
                <HistoryItemLabel data-testid="historyitemlabel-time">
                  {DateDisplay.stringFormat(item.loggedAt)}
                </HistoryItemLabel>
              </HistoryItem>
            ))}
          </HistoryList>
        </HistorySection>
      )}
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
