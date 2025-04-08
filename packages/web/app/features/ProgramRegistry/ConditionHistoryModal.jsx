import React from 'react';
import styled from 'styled-components';
import { PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS } from '@tamanu/constants';
import {
  Modal,
  DateDisplay,
  TranslatedText,
  TranslatedReferenceData,
  TranslatedEnum,
  Heading5,
} from '../../components';
import { Colors } from '../../constants';
import { FormTable } from './FormTable';

const StyledFormTable = styled(FormTable)`
  overflow: auto;
  margin-bottom: 2rem;

  table tr td {
    border: none;
  }
`;

const HistorySection = styled.section`
  background-color: ${Colors.white};
  padding: 1.25rem;
  border-radius: 3px;
`;

const HistoryItem = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${Colors.outline};

  &:last-child {
    border-bottom: none;
  }
`;

const Category = styled.div`
  font-weight: bold;
  margin-bottom: 0.5rem;
`;

const Reason = styled.div`
  margin-bottom: 0.5rem;
`;

const MetaInfo = styled.div`
  display: flex;
  justify-content: space-between;
  color: ${Colors.text.light};
  font-size: 0.875rem;
`;

export const ConditionHistoryModal = ({ open, onClose, condition }) => {
  if (!condition) return null;

  console.log('ConditionHistoryModal', condition);

  const { history = [], programRegistryCondition, date, conditionCategory } = condition;

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

  return (
    <Modal
      title={<TranslatedText stringId="programRegistry.viewHistory" fallback="View history" />}
      open={open}
      onClose={onClose}
      width="md"
    >
      <StyledFormTable columns={columns} data={[condition]} />
      <Heading5 mt={0} mb={1}>
        <TranslatedText
          stringId="programRegistry.conditionCategoryHistory.title"
          fallback="Condition category history"
        />
      </Heading5>
      <HistorySection>
        {history.map(entry => (
          <HistoryItem key={entry.id}>
            <Category>
              <TranslatedEnum
                value={entry.data.conditionCategory}
                enumValues={PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS}
              />
            </Category>
            {entry.data.reasonForChange && <Reason>{entry.data.reasonForChange}</Reason>}
            <MetaInfo>
              <span>{entry.clinician.displayName}</span>
              <DateDisplay date={entry.date} />
            </MetaInfo>
          </HistoryItem>
        ))}
      </HistorySection>
    </Modal>
  );
};
