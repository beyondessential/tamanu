import React from 'react';
import PropTypes from 'prop-types';
import { DataFetchingTable } from '../../components/Table/DataFetchingTable';
import { DateDisplay } from '../../components/DateDisplay';
import { MenuButton } from '../../components/MenuButton';

export const ProgramRegistryFormHistory = ({ programRegistry, patient }) => {
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
      endpoint={`patient/${patient.id}/programRegistration/${programRegistry.id}/surveyResponses`}
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
  patient: PropTypes.shape({
    id: PropTypes.string,
  }),
  programRegistry: PropTypes.shape({
    id: PropTypes.string,
  }),
};

ProgramRegistryFormHistory.defaultProps = {
  patient: null,
  programRegistry: null,
};
