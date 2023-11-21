import React from 'react';
import PropTypes from 'prop-types';
import { SURVEY_TYPES } from '@tamanu/constants';
import { DataFetchingTable } from '../../components/Table/DataFetchingTable';
import { DateDisplay } from '../../components/DateDisplay';
import { MenuButton } from '../../components/MenuButton';

export const PatientProgramRegistryFormHistory = ({ patientProgramRegistration }) => {
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
        <MenuButton
          actions={{
            Print: () => {},
            Edit: () => {},
            Delete: () => {},
          }}
        />
      ),
      required: false,
    },
  ];
  return (
    <DataFetchingTable
      endpoint={`patient/${patientProgramRegistration.patientId}/programResponses`}
      columns={columns}
      initialSort={{
        orderBy: 'date',
        order: 'asc',
        surveyType: SURVEY_TYPES.PROGRAMS,
        programId: patientProgramRegistration.programRegistry.programId,
      }}
      noDataMessage="No Program registry responses found"
      elevated={false}
    />
  );
};

PatientProgramRegistryFormHistory.propTypes = {
  patientProgramRegistration: PropTypes.shape({
    id: PropTypes.string,
  }).isRequired,
};
