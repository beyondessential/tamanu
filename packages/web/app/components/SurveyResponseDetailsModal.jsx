import PrintIcon from '@mui/icons-material/Print';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import {
  Button,
  EditedOrnament,
  EditedReference,
  Modal,
  TranslatedReferenceData,
  TranslatedText,
  UnstyledHtmlButton,
} from '@tamanu/ui-components';
import { isErrorUnknownAllow404s } from '../api';
import { useSurveyResponseQuery } from '../api/queries';
import { useSurveyResponseChangesQuery } from '../api/queries/useSurveyResponseChangesQuery';
import { ModalCancelRow } from './ModalActionRow';
import { SurveyAnswerResult } from './SurveyAnswerResult';
import { Table } from './Table';

const TableContainer = styled.div`
  max-height: calc(100vh - 298px);
  overflow: auto;
`;

const PrintButton = styled(Button).attrs({
  'data-testid': 'printbutton-ywph',
  color: 'primary',
  size: 'small',
  startIcon: <PrintIcon data-testid="printicon-t3sp" />,
  variant: 'outlined',
})`
  position: absolute;
  right: 70px;
  top: 21px;
`;

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

/** @privateRemarks Looks like an `<a>`, but has `<button>` semantics. */
const ViewChangeLogButton = styled(UnstyledHtmlButton).attrs({
  children: (
    <TranslatedText
      stringId="general.action.viewChangeLog"
      fallback="View change log"
      casing="lower"
    />
  ),
})`
  cursor: pointer;
  text-decoration-line: underline;
  &:focus-visible,
  &:hover {
    color: ${p => p.theme.palette.primary.main};
  }
`;

export const SurveyResponseDetailsModal = ({ surveyResponseId, onClose, onPrint }) => {
  const {
    data: surveyDetails,
    isLoading,
    error,
  } = useSurveyResponseQuery(surveyResponseId, { isErrorUnknown: isErrorUnknownAllow404s });
  const isNotFound = error?.status === 404;
  const isPending = isLoading || !surveyDetails || error;

  const { data: changesData } = useSurveyResponseChangesQuery(surveyResponseId, {
    enabled: Boolean(surveyResponseId && surveyDetails && !error),
  });
  const editedAnswerIds = useMemo(() => {
    const ids = new Set();
    for (const ch of changesData?.changes ?? []) {
      if (ch.tableName === 'survey_response_answers') ids.add(ch.recordId);
    }
    return ids;
  }, [changesData]);
  const hasChanges = Boolean(changesData?.changes?.length);

  const columns = useMemo(
    () => [
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
        title: (
          <TranslatedText stringId="surveyResponse.details.table.column.value" fallback="Value" />
        ),
        accessor: ({ answer, type, originalBody, componentConfig, dataElementId, wasEdited }) => (
          <>
            <SurveyAnswerResult
              answer={answer}
              type={type}
              data-testid="surveyanswerresult-dhnv"
              originalBody={originalBody}
              componentConfig={componentConfig}
              dataElementId={dataElementId}
            />
            {wasEdited ? <EditedOrnament style={{ marginInlineStart: '0.25em' }} /> : null}
          </>
        ),
      },
    ],
    [],
  );

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

      const wasEdited =
        answerObject?.id && editedAnswerIds.size > 0 && editedAnswerIds.has(answerObject.id);

      return {
        id,
        dataElementId,
        type,
        answer,
        originalBody,
        wasEdited,
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
            <PrintButton onClick={onPrint}>
              <TranslatedText stringId="general.action.print" fallback="Print" />
            </PrintButton>
          )}
          <TableContainer data-testid="tablecontainer-csba">
            <Table
              data={answerRows}
              columns={columns}
              allowExport={false}
              data-testid="table-3xqx"
            />
          </TableContainer>
          {hasChanges && <EditedReference style={{ marginBlockStart: 4, textAlign: 'end' }} />}
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
