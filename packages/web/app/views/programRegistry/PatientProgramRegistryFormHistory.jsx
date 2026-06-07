import React, { useState, useMemo } from 'react';
import { SURVEY_TYPES } from '@tamanu/constants';
import { SurveyResultBadge, TranslatedText, DateDisplay } from '@tamanu/ui-components';
import { MenuButton, DataFetchingTable } from '../../components';
import { SurveyResponseDetailsModal } from '../../components/SurveyResponseDetailsModal';
import { SurveyResponsesPrintModal } from '../../components/PatientPrinting/modals/SurveyResponsesPrintModal';
import { usePatientDataQuery } from '../../api/queries/usePatientDataQuery';

export const PatientProgramRegistryFormHistory = ({ patientProgramRegistration }) => {
  const [selectedResponseId, setSelectedResponseId] = useState(null);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const { data: patient } = usePatientDataQuery(patientProgramRegistration.patientId);

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
        accessor: (row) => <DateDisplay date={row.endTime} data-testid="datedisplay-zqys" />,
        sortable: true,
      },
      {
        key: 'userId',
        title: (
          <TranslatedText
            stringId="programRegistry.modal.formHistory.submittedBy"
            fallback="Submitted By"
            data-testid="translatedtext-zjgw"
          />
        ),
        accessor: (row) => row.submittedBy,
        sortable: false,
      },
      {
        key: 'surveyName',
        title: (
          <TranslatedText
            stringId="programRegistry.modal.formHistory.form"
            fallback="Form"
            data-testid="translatedtext-2my1"
          />
        ),
        accessor: (row) => row.surveyName,
        sortable: false,
      },
      {
        key: 'result',
        title: (
          <TranslatedText
            stringId="programRegistry.modal.formHistory.result"
            fallback="Result"
            data-testid="translatedtext-gytw"
          />
        ),
        accessor: ({ resultText }) => (
          <SurveyResultBadge resultText={resultText} data-testid="surveyresultbadge-8a70" />
        ),
        sortable: false,
      },
      {
        key: '',
        title: '',
        dontCallRowInput: true,
        sortable: false,
        CellComponent: ({ data }) => (
          <MenuButton
            a11yLabel={
              <TranslatedText
                stringId="programRegistry.modal.formHistory.actions"
                fallback="Form response actions"
              />
            }
            actions={[
              {
                label: <TranslatedText stringId="general.action.print" fallback="Print" />,
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

  const onSelectResponse = (surveyResponse) => {
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
          title={selectedResponse.surveyName}
          submittedBy={selectedResponse.submittedBy}
          data-testid="surveyresponsesprintmodal-xem3"
        />
      )}
      <DataFetchingTable
        endpoint={`patient/${patientProgramRegistration.patientId}/programResponses`}
        columns={columns}
        initialSort={{
          orderBy: 'startTime',
          order: 'desc',
          surveyType: SURVEY_TYPES.PROGRAMS,
        }}
        fetchOptions={{ programId: patientProgramRegistration.programRegistry.programId }}
        onRowClick={onSelectResponse}
        noDataMessage={
          <TranslatedText
            stringId="programRegistry.modal.formHistory.noDataMessage"
            fallback="No Program registry responses found"
          />
        }
        data-testid="datafetchingtable-4uxw"
      />
    </>
  );
};
