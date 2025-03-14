import React, { useState, useMemo } from 'react';
import { SURVEY_TYPES } from '@tamanu/constants';
import { TranslatedText, MenuButton, DateDisplay, DataFetchingTable } from '../../components';
import { SurveyResponseDetailsModal } from '../../components/SurveyResponseDetailsModal';
import { SurveyResultBadge } from '../../components/SurveyResultBadge';
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
        title: 'Date submitted',
        accessor: (row) => <DateDisplay date={row.endTime} />,
        sortable: true,
      },
      {
        key: 'userId',
        title: 'Submitted By',
        accessor: (row) => row.submittedBy,
        sortable: false,
      },
      {
        key: 'surveyName',
        title: 'Form',
        accessor: (row) => row.surveyName,
        sortable: false,
      },
      {
        key: 'result',
        title: 'Result',
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
                label: <TranslatedText stringId="general.action.print" fallback="Print" />,
                action: () => {
                  setSelectedResponse(data);
                  setPrintModalOpen(true);
                },
              },
            ]}
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
      />
      {patient && selectedResponse && (
        <SurveyResponsesPrintModal
          open={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          patient={patient}
          surveyResponseId={selectedResponse.id}
          submittedBy={selectedResponse.submittedBy}
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
        noDataMessage="No Program registry responses found"
        elevated={false}
      />
    </>
  );
};
