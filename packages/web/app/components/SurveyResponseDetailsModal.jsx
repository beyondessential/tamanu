import React from 'react';
import PrintIcon from '@material-ui/icons/Print';
import styled from 'styled-components';
import { Button, Modal, TranslatedText, TranslatedReferenceData } from '@tamanu/ui-components';
import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';

import { Table } from './Table';
import { useSurveyResponseQuery } from '../api/queries/useSurveyResponseQuery';
import { ModalCancelRow } from './ModalActionRow';
import { SurveyAnswerResult } from './SurveyAnswerResult';
import { isErrorUnknownAllow404s } from '../api/index.js';

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
        data-testid="translatedtext-62uq"
      />
    ),
    accessor: ({ name }) => name,
  },
  {
    key: 'value',
    title: (
      <TranslatedText
        stringId="surveyResponse.details.table.column.value"
        fallback="Value"
        data-testid="translatedtext-fah5"
      />
    ),
    accessor: ({ answer, type, originalBody, componentConfig, dataElementId }) => (
      <SurveyAnswerResult
        answer={answer}
        type={type}
        data-testid="surveyanswerresult-dhnv"
        originalBody={originalBody}
        componentConfig={componentConfig}
        dataElementId={dataElementId}
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
  const {
    data: surveyDetails,
    isLoading,
    error,
  } = useSurveyResponseQuery(surveyResponseId, { isErrorUnknown: isErrorUnknownAllow404s });

  if (isLoading || !surveyDetails || error) {
    const isNotFound = error?.status === 404;

    return (
      <Modal
        title={
          <TranslatedText
            stringId="surveyResponse.modal.details.title"
            fallback="Form response"
            data-testid="translatedtext-0lad"
          />
        }
        open={!!surveyResponseId}
        onClose={onClose}
        data-testid="modal-qnfv"
      >
        {isNotFound ? (
          <TranslatedText
            stringId={
              isNotFound
                ? 'surveyResponse.modal.details.error.formDeleted'
                : 'surveyResponse.modal.details.error.fetchErrorMessage'
            }
            fallback={
              isNotFound
                ? 'This form has been deleted and is no longer available.'
                : 'Error fetching response details'
            }
            data-testid="translatedtext-b9js"
          />
        ) : (
          <TranslatedText
            stringId="general.table.loading"
            fallback="Loading…"
            data-testid="translatedtext-ec13"
          />
        )}
      </Modal>
    );
  }

  const { components, answers } = surveyDetails;
  const answerRows = components
    .filter(shouldShow)
    .map(component => {
      const { dataElement, id, config } = component;
      const { type: originalType, name, id: dataElementId } = dataElement;
      const answerObject = answers.find(a => a.dataElementId === dataElement.id);
      const answer = answerObject?.body;
      const originalBody = answerObject?.originalBody;
      const sourceType = answerObject?.sourceType;
      const sourceConfig = answerObject?.sourceConfig;
      const componentConfig =
        originalType === PROGRAM_DATA_ELEMENT_TYPES.SURVEY_ANSWER ? sourceConfig : config;
      const type =
        originalType === PROGRAM_DATA_ELEMENT_TYPES.SURVEY_ANSWER ? sourceType : originalType;

      return {
        id,
        dataElementId,
        type,
        answer,
        originalBody,
        name: (
          <TranslatedReferenceData
            category="programDataElement"
            value={dataElementId}
            fallback={name}
          />
        ),
        componentConfig,
      };
    })
    .filter(r => r.answer !== undefined);

  return (
    <Modal
      title={
        <TranslatedText
          stringId="surveyResponse.modal.details.title"
          fallback="Form response"
          data-testid="translatedtext-bnqe"
        />
      }
      open={!!surveyResponseId}
      onClose={onClose}
      data-testid="modal-ag6a"
    >
      {onPrint && (
        <PrintButton
          onClick={onPrint}
          color="primary"
          variant="outlined"
          startIcon={<PrintIcon data-testid="printicon-t3sp" />}
          size="small"
          data-testid="printbutton-ywph"
        >
          <TranslatedText
            stringId="general.action.print"
            fallback="Print"
            data-testid="translatedtext-gct8"
          />
        </PrintButton>
      )}
      <TableContainer data-testid="tablecontainer-csba">
        <Table data={answerRows} columns={COLUMNS} allowExport={false} data-testid="table-3xqx" />
      </TableContainer>
      <SectionSpacing data-testid="sectionspacing-gtmt" />
      <ModalCancelRow
        onConfirm={onClose}
        confirmText={
          <TranslatedText
            stringId="general.action.close"
            fallback="Close"
            data-testid="translatedtext-mhfm"
          />
        }
        data-testid="modalcancelrow-dpsx"
      />
    </Modal>
  );
};
