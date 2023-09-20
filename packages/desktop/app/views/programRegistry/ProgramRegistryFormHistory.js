import React from 'react';
import PropTypes from 'prop-types';
import { DataFetchingTable } from '../../components/Table/DataFetchingTable';
import { DateDisplay } from '../../components/DateDisplay';
import { MenuButton } from '../../components/MenuButton';

export const ProgramRegistryFormHistory = ({ patientProgramRegistration }) => {
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
      accessor: row => row.user.displayName,
      sortable: false,
    },
    {
      key: 'surveyId',
      title: 'Form',
      accessor: row => row.survey.name,
      sortable: false,
    },
    {
      key: 'result',
      title: 'Result',
      accessor: row => row.result || row.resultText,
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
      endpoint={`patient/${patientProgramRegistration.patientId}/programRegistration/${patientProgramRegistration.id}/surveyResponses`}
      columns={columns}
      initialSort={{
        orderBy: 'date',
        order: 'asc',
      }}
      noDataMessage="No Program registry responses found"
      elevated={false}
    />
  );
};

ProgramRegistryFormHistory.propTypes = {
  patientProgramRegistration: PropTypes.shape({
    id: PropTypes.string,
  }),
};

ProgramRegistryFormHistory.defaultProps = {
  patientProgramRegistration: null,
};
