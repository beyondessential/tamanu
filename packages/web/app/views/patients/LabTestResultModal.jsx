import React from 'react';
import styled from 'styled-components';
import { useNavigate, useParams } from 'react-router';

import { Modal, TranslatedText, TranslatedReferenceData, Button } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';

import { useLabTestQuery } from '../../api/queries/useLabTestQuery';
import { useLabTestResultHistoryQuery } from '../../api/queries';
import { DateDisplay } from '../../components/DateDisplay';
import { ModalActionRow } from '../../components/ModalActionRow';
import { BodyText } from '../../components/Typography';
import { useLabRequest } from '../../contexts/LabRequest';

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

const HistoryTitle = styled(BodyText)`
  font-weight: 500;
  margin-bottom: 5px;
  margin-top: 20px;
  font-size: 14px;
  color: ${Colors.darkText};
`;

const HistorySection = styled.div`
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 5px;
  padding: 12px 20px;
  margin: 0px 0px 40px;
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
`;

const HistoryItem = styled.div`
  padding: 10px;
`;

const HistoryItemLabel = styled(BodyText)`
  color: ${Colors.midText};
  font-size: 12px;
  cursor: default;
`;

const HistoryItemValue = styled(BodyText)`
  font-weight: 500;
  font-size: 14px;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-bottom: 20px;
`;

export const LabTestResultModal = React.memo(({ open, onClose, labTestId }) => {
  const { data: labTest } = useLabTestQuery(labTestId);
  const { data: history = [] } = useLabTestResultHistoryQuery(labTestId);
  const { loadLabRequest } = useLabRequest();
  const navigate = useNavigate();
  const { category = 'all' } = useParams();

  // Don't show the initial empty result in the history (oldest item, since history is DESC ordered)
  const visibleHistory = React.useMemo(() => {
    const lastItem = history.at(-1);
    const isEmpty = lastItem?.result === '' || lastItem?.result == null;
    return isEmpty ? history.slice(0, -1) : history;
  }, [history]);

  const handleViewLabRequest = async () => {
    const { labRequest } = labTest;
    const {
      encounter: { id: encounterId, patientId },
    } = labRequest;

    await loadLabRequest(labRequest.id);
    navigate(
      `/patients/${category}/${patientId}/encounter/${encounterId}/lab-request/${labRequest.id}`,
    );
    onClose();
  };

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
      {labTest?.labRequest?.id && (
        <ButtonContainer data-testid="buttoncontainer-viewlabrequest">
          <Button
            variant="outlined"
            color="primary"
            onClick={handleViewLabRequest}
            data-testid="button-viewlabrequest"
          >
            <TranslatedText
              stringId="lab.modal.testResult.viewLabRequest"
              fallback="View Lab Request"
              data-testid="translatedtext-viewlabrequest"
            />
          </Button>
        </ButtonContainer>
      )}
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
            value={<DateDisplay date={labTest?.completedDate} />}
            data-testid="valuedisplay-9ppd"
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
        </Column>
      </ModalBody>
      {visibleHistory.length > 1 && (
        <>
          <HistoryTitle data-testid="historytitle-hist">
            <TranslatedText
              stringId="general.history"
              fallback="History"
              data-testid="translatedtext-hist"
            />
          </HistoryTitle>
          <HistorySection data-testid="historysection-hist">
            <HistoryList data-testid="historylist-hist">
              {visibleHistory.map(item => (
                <HistoryItem key={item.id} data-testid="historyitem-hist">
                  <HistoryItemValue data-testid="historyitemvalue-result">
                    <TranslatedText
                      stringId="lab.modal.testResult.history.result"
                      fallback="Result: "
                      data-testid="translatedtext-result"
                    />
                    {item.result || '-'}
                  </HistoryItemValue>
                  <HistoryItemLabel data-testid="historyitemlabel-time">
                    {item.updatedByDisplayName || (
                      <TranslatedText
                        stringId="general.unknown"
                        fallback="Unknown"
                        data-testid="translatedtext-unknown"
                      />
                    )}{' '}
                    <DateDisplay date={item.loggedAt} showTime data-testid="datedisplay-loggedat" />
                  </HistoryItemLabel>
                </HistoryItem>
              ))}
            </HistoryList>
          </HistorySection>
        </>
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
