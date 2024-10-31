import React, { useState } from 'react';
import PrintIcon from '@material-ui/icons/Print';
import styled from 'styled-components';

import { Modal } from './Modal';
import { DateDisplay } from './DateDisplay';
import { Table } from './Table';
import { SurveyResultBadge } from './SurveyResultBadge';
import { ViewPhotoLink } from './ViewPhotoLink';
import { Button } from './Button';
import { TranslatedText } from './Translation/TranslatedText';
import { useSurveyResponse } from '../api/queries/useSurveyResponse';
import { ModalCancelRow } from './ModalActionRow';

const SectionSpacing = styled.div`
  height: 14px;
`;

const TableContainer = styled.div`
  max-height: calc(100vh - 298px);
  overflow: auto;
`;

const convertBinaryToYesNo = value => {
  switch (value) {
    case 'true':
    case '1':
      return 'Yes';
    case 'false':
    case '0':
      return 'No';
    default:
      return value;
  }
};

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
    accessor: ({ answer, type }) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [surveyLink, setSurveyLink] = useState(null);
      switch (type) {
        case 'Result':
          return <SurveyResultBadge resultText={answer} />;
        case 'Calculated':
          return parseFloat(answer).toFixed(1);
        case 'Photo':
          return <ViewPhotoLink imageId={answer} />;
        case 'Checkbox':
          return convertBinaryToYesNo(answer);
        case 'SubmissionDate':
          return <DateDisplay date={answer} />;
        case 'Date':
          return <DateDisplay date={answer} />;
        case 'SurveyLink':
          return (
            <>
              <Button onClick={() => setSurveyLink(answer)} variant="contained" color="primary">
                Show Form
              </Button>
              <SurveyResponseDetailsModal
                surveyResponseId={surveyLink}
                onClose={() => setSurveyLink(null)}
              />
            </>
          );
        case 'MultiSelect':
          return JSON.parse(answer).map(element => (
            <>
              {element}
              <br />
            </>
          ));
        default:
          return answer;
      }
    },
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
  const { data: surveyDetails, isLoading, error } = useSurveyResponse(surveyResponseId);
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
      const { dataElement, id } = component;
      const { type, name } = dataElement;
      const answerObject = answers.find(a => a.dataElementId === dataElement.id);
      const answer = answerObject?.body;
      return {
        id,
        type,
        answer,
        name,
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
