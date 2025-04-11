import React from 'react';
import styled from 'styled-components';
import { PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS } from '@tamanu/constants';
import Divider from '@material-ui/core/Divider';
import {
  Modal,
  DateDisplay,
  TranslatedText,
  TranslatedReferenceData,
  TranslatedEnum,
  Heading5,
  Button,
  ModalGenericButtonRow,
} from '../../components';
import { Colors } from '../../constants';
import { FormTable } from './FormTable';

const StyledFormTable = styled(FormTable)`
  overflow: auto;
  margin-top: 1rem;
  margin-bottom: 1rem;

  table tr td {
    border: none;
  }
`;

const HistorySection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: ${Colors.white};
  padding: 1rem;
  border-radius: 3px;
  border: 1px solid ${Colors.outline};
  margin-bottom: 2rem;
`;

const HistoryItem = styled.div`
  font-size: 14px;
  line-height: 18px;
  flex: 1;
`;

const HistoryItemRow = styled.div`
  display: flex;
`;

const HistoryItemLabel = styled.div`
  color: ${Colors.darkText};
  margin-right: 1ch;
`;

const HistoryItemValue = styled.div`
  color: ${Colors.darkestText};
  font-weight: 500;
`;

const SmallText = styled.div`
  color: ${Colors.midText};
  font-size: 11px;
  span {
    margin-right: 1ch;
  }
`;

export const ConditionHistoryModal = ({ open, onClose, condition }) => {
  if (!condition) return null;

  const columns = [
    {
      id: 'name',
      title: <TranslatedText stringId="programRegistry.condition" fallback="Condition" />,
      width: '50%',
      accessor: ({ conditionId, name }) => (
        <TranslatedReferenceData
          value={conditionId}
          fallback={name}
          category="programRegistryCondition"
        />
      ),
    },
    {
      id: 'date',
      title: <TranslatedText stringId="programRegistry.dateAdded" fallback="Date added" />,
      width: '25%',
      accessor: ({ date }) => <DateDisplay date={date} />,
    },
    {
      id: 'category',
      title: <TranslatedText stringId="programRegistry.category" fallback="Category" />,
      width: '25%',
      accessor: ({ conditionCategory }) => (
        <TranslatedEnum
          value={conditionCategory}
          enumValues={PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS}
        />
      ),
    },
  ];

  const { history = [] } = condition;

  return (
    <Modal
      title={<TranslatedText stringId="programRegistry.viewHistory" fallback="View history" />}
      open={open}
      onClose={onClose}
      width="md"
    >
      <StyledFormTable columns={columns} data={[condition]} />
      <Divider />
      <Heading5 mb={1} mt={1}>
        <TranslatedText
          stringId="programRegistry.conditionCategoryHistory.title"
          fallback="Condition category history"
        />
      </Heading5>
      <HistorySection>
        {history.map(entry => (
          <HistoryItem key={entry.id}>
            <HistoryItemRow>
              <HistoryItemLabel>Category:</HistoryItemLabel>
              <HistoryItemValue>
                <TranslatedEnum
                  value={entry.data.conditionCategory}
                  enumValues={PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS}
                />
              </HistoryItemValue>
            </HistoryItemRow>
            {entry.data.reasonForChange && (
              <HistoryItemRow>
                <HistoryItemLabel>Reason for change:</HistoryItemLabel>
                <HistoryItemValue>{entry.data.reasonForChange}</HistoryItemValue>
              </HistoryItemRow>
            )}
            <SmallText>
              <span>{entry.clinician.displayName}</span>
              <DateDisplay date={entry.date} showTime />
            </SmallText>
          </HistoryItem>
        ))}
      </HistorySection>
      <ModalGenericButtonRow>
        <Button onClick={onClose}>Close</Button>
      </ModalGenericButtonRow>
    </Modal>
  );
};
