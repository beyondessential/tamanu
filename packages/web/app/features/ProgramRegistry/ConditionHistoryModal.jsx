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
  Button,
  ModalGenericButtonRow,
} from '../../components';
import { FormTable } from './FormTable';
import { ConditionHistoryTable } from './ConditionHistoryTable';

const StyledFormTable = styled(FormTable)`
  overflow: auto;
  margin-top: 1rem;
  margin-bottom: 1rem;

  table tr td {
    border: none;

    // This table doesn't have form fields so don't need to move the spans and buttons down for alignment
    > span,
    > button {
      position: static;
      top: 0;
    }
  }
`;

export const ConditionHistoryModal = ({ open, onClose, condition }) => {
  if (!condition) return null;

  const columns = [
    {
      id: 'name',
      title: <TranslatedText stringId="programRegistry.condition.label" fallback="Condition" />,
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
      <ConditionHistoryTable historyData={history} />
      <ModalGenericButtonRow>
        <Button onClick={onClose} data-testid="conditionHistoryCloseButton">
          Close
        </Button>
      </ModalGenericButtonRow>
    </Modal>
  );
};
