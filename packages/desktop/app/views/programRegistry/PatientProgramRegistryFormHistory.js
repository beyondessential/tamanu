import React, { useCallback, useState } from 'react';
import { SURVEY_TYPES } from '@tamanu/constants';
import { DataFetchingTable } from '../../components/Table/DataFetchingTable';
import { DateDisplay } from '../../components/DateDisplay';
import { SurveyResponseDetailsModal } from '../../components/SurveyResponseDetailsModal';

export const PatientProgramRegistryFormHistory = ({ patientProgramRegistration }) => {
  const [selectedResponseId, setSelectedResponseId] = useState(null);
  const columns = [
    {
      key: 'date',
      title: 'Date submitted',
      accessor: row => <DateDisplay date={row.endTime} />,
      sortable: true,
    },
    {
      key: 'userId',
      title: 'Submitted By',
      accessor: row => row.submittedBy,
      sortable: false,
    },
    {
      key: 'surveyName',
      title: 'Form',
      accessor: row => row.surveyName,
      sortable: false,
    },
    {
      key: 'result',
      title: 'Result',
      accessor: row => row.resultText,
      sortable: false,
    },
    // {
    //   sortable: false,
    //   dontCallRowInput: true,
    //   accessor: () => (
    //     <div
    //       style={{
    //         display: 'flex',
    //         justifyContent: 'flex-end',
    //       }}
    //     >
    //       <MenuButton
    //         actions={{
    //           Print: () => {},
    //           Edit: () => {},
    //           Delete: () => {},
    //         }}
    //       />
    //     </div>
    //   ),
    //   required: false,
    // },
  ];

  const onSelectResponse = useCallback(surveyResponse => {
    setSelectedResponseId(surveyResponse.id);
  }, []);

  const cancelResponse = useCallback(() => setSelectedResponseId(null), []);

  return (
    <>
      <SurveyResponseDetailsModal surveyResponseId={selectedResponseId} onClose={cancelResponse} />
      <DataFetchingTable
        endpoint={`patient/${patientProgramRegistration.patientId}/programResponses`}
        columns={columns}
        initialSort={{
          orderBy: 'date',
          order: 'asc',
          surveyType: SURVEY_TYPES.PROGRAMS,
        }}
        fetchOptions={{ programId: patientProgramRegistration.programRegistry.programId }}
        onRowClick={onSelectResponse}
        noDataMessage="No Program registry responses found"
      />
    </>
  );
};
