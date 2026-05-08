import PrintIcon from '@mui/icons-material/Print';
import React from 'react';
import styled from 'styled-components';

import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { Button, Modal, TranslatedReferenceData, TranslatedText } from '@tamanu/ui-components';
import { isErrorUnknownAllow404s } from '../api';
import { useSurveyResponseQuery } from '../api/queries';
import { ModalCancelRow } from './ModalActionRow';
import { SurveyAnswerResult } from './SurveyAnswerResult';
import { Table } from './Table';

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

const isShowable = component =>
  component.dataElement.type !== PROGRAM_DATA_ELEMENT_TYPES.INSTRUCTION;

const PendingMessage = ({ isLoading, isNotFound }) => {
  if (isLoading) {
    return <TranslatedText stringId="general.table.loading" fallback="Loading…" />;
  }
  if (isNotFound) {
    return (
      <TranslatedText
        stringId="surveyResponse.modal.details.error.formDeleted"
        fallback="This form has been deleted and is no longer available."
      />
    );
  }
  return (
    <TranslatedText
      stringId="surveyResponse.modal.details.error.fetchErrorMessage"
      fallback="Error fetching response details"
    />
  );
};

export const SurveyResponseDetailsModal = ({ surveyResponseId, onClose, onPrint }) => {
  const {
    data: surveyDetails,
    isLoading,
    error,
  } = useSurveyResponseQuery(surveyResponseId, { isErrorUnknown: isErrorUnknownAllow404s });

  const isNotFound = error?.status === 404;
  const isPending = isLoading || !surveyDetails || error;

  const { components = [], answers = [] } = surveyDetails ?? {};
  const answerRows = components
    .map(component => {
      if (!isShowable(component)) return null; // Filter out

      const { dataElement, id, config } = component;
      const { type: originalType, name, id: dataElementId } = dataElement;
      const answerObject = answers.find(a => a.dataElementId === dataElement.id);
      const answer = answerObject?.body;

      if (answer === undefined) return null; // Filter out

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
    .filter(r => r !== null);

  return (
    <Modal
      title={
        <TranslatedText stringId="surveyResponse.modal.details.title" fallback="Form response" />
      }
      open={!!surveyResponseId}
      onClose={onClose}
      data-testid="modal-ag6a"
    >
      {isPending ? (
        <PendingMessage
          isLoading={isLoading || (!surveyDetails && !error)}
          isNotFound={isNotFound}
        />
      ) : (
        <>
          {onPrint && (
            <PrintButton
              onClick={onPrint}
              color="primary"
              variant="outlined"
              startIcon={<PrintIcon data-testid="printicon-t3sp" />}
              size="small"
              data-testid="printbutton-ywph"
            >
              <TranslatedText stringId="general.action.print" fallback="Print" />
            </PrintButton>
          )}
          <TableContainer data-testid="tablecontainer-csba">
            <Table
              data={answerRows}
              columns={COLUMNS}
              allowExport={false}
              data-testid="table-3xqx"
            />
          </TableContainer>
          <SectionSpacing data-testid="sectionspacing-gtmt" />
          <ModalCancelRow
            onConfirm={onClose}
            confirmText={<TranslatedText stringId="general.action.close" fallback="Close" />}
            data-testid="modalcancelrow-dpsx"
          />
        </>
      )}
    </Modal>
  );
};
