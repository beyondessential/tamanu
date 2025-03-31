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
        data-test-id='translatedtext-bkps' />
    ),
    accessor: ({ name }) => name,
  },
  {
    key: 'value',
    title: <TranslatedText
      stringId="surveyResponse.details.table.column.value"
      fallback="Value"
      data-test-id='translatedtext-24nv' />,
    accessor: ({ answer, sourceType, type }) => (
      <SurveyAnswerResult answer={answer} sourceType={sourceType} type={type} />
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
          <TranslatedText
            stringId="surveyResponse.modal.details.title"
            fallback="Form response"
            data-test-id='translatedtext-j345' />
        }
        open={!!surveyResponseId}
        onClose={onClose}
      >
        <h3 data-test-id='h3-4tr0'>
          <TranslatedText
            stringId="surveyResponse.modal.details.error.fetchErrorMessage"
            fallback="Error fetching response details"
            data-test-id='translatedtext-us73' />
        </h3>
        <pre>{error.stack}</pre>
      </Modal>
    );
  }

  if (isLoading || !surveyDetails) {
    return (
      <Modal
        title={
          <TranslatedText
            stringId="surveyResponse.modal.details.title"
            fallback="Form response"
            data-test-id='translatedtext-2yrm' />
        }
        open={!!surveyResponseId}
        onClose={onClose}
      >
        <TranslatedText
          stringId="general.table.loading"
          fallback="Loading..."
          data-test-id='translatedtext-3eis' />
      </Modal>
    );
  }

  const { components, answers } = surveyDetails;
  const answerRows = components
    .filter(shouldShow)
    .map(component => {
      const { dataElement, id } = component;
      const { type, name } = dataElement;
      const answerObject = answers.find(a => a.dataElementId === dataElement.id);
      const answer = answerObject?.body;
      const sourceType = answerObject?.sourceType;
      return {
        id,
        type,
        answer,
        name,
        sourceType,
      };
    })
    .filter(r => r.answer !== undefined);

  return (
    <Modal
      title={
        <TranslatedText
          stringId="surveyResponse.modal.details.title"
          fallback="Form response"
          data-test-id='translatedtext-8sxw' />
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
          <TranslatedText
            stringId="general.action.print"
            fallback="Print"
            data-test-id='translatedtext-fvt4' />
        </PrintButton>
      )}
      <TableContainer>
        <Table data={answerRows} columns={COLUMNS} allowExport={false} />
      </TableContainer>
      <SectionSpacing />
      <ModalCancelRow
        onConfirm={onClose}
        confirmText={<TranslatedText
          stringId="general.action.close"
          fallback="Close"
          data-test-id='translatedtext-7p2u' />}
      />
    </Modal>
  );
};
