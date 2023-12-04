import React, { useEffect } from 'react';
import { SURVEY_TYPES } from '@tamanu/constants';
import { DataFetchingTable } from '../../components/Table/DataFetchingTable';
import { DateDisplay } from '../../components/DateDisplay';
import { MenuButton } from '../../components/MenuButton';
import { useRefreshCount } from '../../hooks/useRefreshCount';

export const PatientProgramRegistryFormHistory = ({ patientProgramRegistration }) => {
  const [refreshCount, updateRefreshCount] = useRefreshCount();
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
    {
      sortable: false,
      accessor: () => (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <MenuButton
            actions={{
              Print: () => {},
              Edit: () => {},
              Delete: () => {},
            }}
          />
        </div>
      ),
      required: false,
    },
  ];

  useEffect(() => {
    updateRefreshCount();
  }, [patientProgramRegistration.programRegistry.programId, updateRefreshCount]);

  return (
    <DataFetchingTable
      endpoint={`patient/${patientProgramRegistration.patientId}/programResponses`}
      columns={columns}
      refreshCount={refreshCount}
      initialSort={{
        orderBy: 'date',
        order: 'asc',
        surveyType: SURVEY_TYPES.PROGRAMS,
      }}
      fetchOptions={{ programId: patientProgramRegistration.programRegistry.programId }}
      noDataMessage="No Program registry responses found"
    />
  );
};
