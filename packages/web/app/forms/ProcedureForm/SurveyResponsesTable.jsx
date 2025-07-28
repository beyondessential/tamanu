import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SURVEY_TYPES } from '@tamanu/constants';
import { DataFetchingTable, DateDisplay, MenuButton, TranslatedText } from '../../components';
import { SurveyResultBadge } from '../../components/SurveyResultBadge';
import { SurveyResponseDetailsModal } from '../../components/SurveyResponseDetailsModal';
import { SurveyResponsesPrintModal } from '../../components/PatientPrinting/modals/SurveyResponsesPrintModal';
import { usePatientDataQuery } from '../../api/queries/usePatientDataQuery';
import { denseTableStyle } from '../../constants/index.js';

export const SurveyResponsesTable = ({ procedureId }) => {
  const [selectedResponseId, setSelectedResponseId] = useState(null);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const { patientId } = useParams();
  const { data: patient } = usePatientDataQuery(patientId);

  const columns = useMemo(
    () => [
      {
        key: 'date',
        title: (
          <TranslatedText
            stringId="programRegistry.modal.formHistory.date"
            fallback="Date submitted"
          />
        ),
        accessor: row => <DateDisplay date={row.endTime} />,
        sortable: true,
      },
      {
        key: 'userId',
        title: (
          <TranslatedText
            stringId="programRegistry.modal.formHistory.submittedBy"
            fallback="Submitted By"
          />
        ),
        accessor: row => row.submittedBy,
        sortable: false,
      },
      {
        key: 'surveyName',
        title: <TranslatedText stringId="programRegistry.modal.formHistory.form" fallback="Form" />,
        accessor: row => row.surveyName,
        sortable: false,
      },
      {
        key: 'result',
        title: (
          <TranslatedText stringId="programRegistry.modal.formHistory.result" fallback="Results" />
        ),
        accessor: ({ resultText }) => <SurveyResultBadge resultText={resultText} />,
        sortable: false,
      },
      {
        key: '',
        title: '',
        dontCallRowInput: true,
        sortable: false,
        CellComponent: ({ data }) => (
          <MenuButton
            actions={[
              {
                label: (
                  <TranslatedText
                    stringId="general.action.print"
                    fallback="Print"
                    data-testid="translatedtext-ugko"
                  />
                ),
                action: () => {
                  setSelectedResponse(data);
                  setPrintModalOpen(true);
                },
              },
            ]}
            data-testid="menubutton-dpsb"
          />
        ),
        required: false,
      },
    ],
    [],
  );

  const onSelectResponse = surveyResponse => {
    setSelectedResponseId(surveyResponse?.id);
    setSelectedResponse(surveyResponse);
  };

  return (
    <>
      <SurveyResponseDetailsModal
        surveyResponseId={selectedResponseId}
        onClose={() => setSelectedResponseId(null)}
        onPrint={() => setPrintModalOpen(true)}
        data-testid="surveyresponsedetailsmodal-efwj"
      />
      {patient && selectedResponse && (
        <SurveyResponsesPrintModal
          open={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          patient={patient}
          surveyResponseId={selectedResponse.id}
          submittedBy={selectedResponse.submittedBy}
          data-testid="surveyresponsesprintmodal-xem3"
        />
      )}
      <DataFetchingTable
        endpoint={`patient/${patientId}/programResponses`}
        columns={columns}
        initialSort={{
          orderBy: 'startTime',
          order: 'desc',
          surveyType: SURVEY_TYPES.PROGRAMS,
        }}
        fetchOptions={{ procedureId }}
        onRowClick={onSelectResponse}
        noDataMessage={
          <TranslatedText
            stringId="programRegistry.modal.formHistory.noDataMessage"
            fallback="No Program registry responses found"
          />
        }
        allowExport={false}
        elevated={false}
        disablePagination
      />
    </>
  );
};
