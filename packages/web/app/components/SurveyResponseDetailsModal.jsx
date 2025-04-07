import React from 'react';
import PrintIcon from '@material-ui/icons/Print';
import styled from 'styled-components';

import { Modal } from './Modal';
import { Table } from './Table';
import { Button } from './Button';
import { TranslatedText } from './Translation/TranslatedText';
import { useSurveyResponseQuery } from '../api/queries/useSurveyResponseQuery';
import { ModalCancelRow } from './ModalActionRow';
import { SurveyAnswerResult } from './SurveyAnswerResult';

const SectionSpacing = styled.div`
  height: 14px;
`;

const TableContainer = styled.div`
  max-height: calc(100vh - 298px);
  overflow: auto;
`;

const PrintButton = styled(Button)`
  position: absolute;
  right: 70px;
  top: 21px;
`;

const COLUMNS = [
  {
    key: 'text',
    title: (
      <TranslatedText
        stringId="surveyResponse.details.table.column.indicator"
        fallback="Indicator"
      />
    ),
    accessor: ({ name }) => name,
  },
  {
    key: 'value',
    title: <TranslatedText stringId="surveyResponse.details.table.column.value" fallback="Value" />,
    accessor: ({ answer, sourceType, type, originalBody, componentConfig }) => (
      <SurveyAnswerResult
        answer={answer}
        sourceType={sourceType}
        type={type}
        originalBody={originalBody}
        componentConfig={componentConfig}
      />
    ),
  },
];

function shouldShow(component) {
  switch (component.dataElement.type) {
    case 'Instruction':
      return false;
    default:
      return true;
  }
}

export const SurveyResponseDetailsModal = ({ surveyResponseId, onClose, onPrint }) => {
  const { data: surveyDetails, isLoading, error } = useSurveyResponseQuery(surveyResponseId);
  if (error) {
    return (
      <Modal
        title={
          <TranslatedText stringId="surveyResponse.modal.details.title" fallback="Form response" />
        }
        open={!!surveyResponseId}
        onClose={onClose}
      >
        <h3>
          <TranslatedText
            stringId="surveyResponse.modal.details.error.fetchErrorMessage"
            fallback="Error fetching response details"
          />
        </h3>
        <pre>{error.stack}</pre>
      </Modal>
    );
  }

  if (isLoading || !surveyDetails) {
    return (
      <Modal
        title={
          <TranslatedText stringId="surveyResponse.modal.details.title" fallback="Form response" />
        }
        open={!!surveyResponseId}
        onClose={onClose}
      >
        <TranslatedText stringId="general.table.loading" fallback="Loading..." />
      </Modal>
    );
  }

  const { components, answers } = surveyDetails;
  const answerRows = components
    .filter(shouldShow)
    .map(component => {
      const { dataElement, id, config } = component;
      const { type, name } = dataElement;
      const answerObject = answers.find(a => a.dataElementId === dataElement.id);
      const answer = answerObject?.body;
      const originalBody = answerObject?.originalBody;
      const sourceType = answerObject?.sourceType;
      return {
        id,
        type,
        answer,
        originalBody,
        name,
        sourceType,
        componentConfig: config,
      };
    })
    .filter(r => r.answer !== undefined);

  return (
    <Modal
      title={
        <TranslatedText stringId="surveyResponse.modal.details.title" fallback="Form response" />
      }
      open={!!surveyResponseId}
      onClose={onClose}
    >
      {onPrint && (
        <PrintButton
          onClick={onPrint}
          color="primary"
          variant="outlined"
          startIcon={<PrintIcon />}
          size="small"
        >
          <TranslatedText stringId="general.action.print" fallback="Print" />
        </PrintButton>
      )}
      <TableContainer>
        <Table data={answerRows} columns={COLUMNS} allowExport={false} />
      </TableContainer>
      <SectionSpacing />
      <ModalCancelRow
        onConfirm={onClose}
        confirmText={<TranslatedText stringId="general.action.close" fallback="Close" />}
      />
    </Modal>
  );
};
