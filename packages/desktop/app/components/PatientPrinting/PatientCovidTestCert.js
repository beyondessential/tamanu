import React, { useState, useEffect } from 'react';

import { Modal } from '../Modal';
import { Certificate, Table } from '../Print/Certificate';
import { DateDisplay } from '../DateDisplay';
import { getRequestId, getLaboratory } from '../LabRequestsTable';

import { connectApi } from '../../api';
import { useLocalisation } from '../../contexts/Localisation';

const DumbPatientCovidTestCert = ({ patient, getLabRequests, getLabTests }) => {
  const [open, setOpen] = useState(true);
  const [rows, setRows] = useState([]);
  const { getLocalisation } = useLocalisation();

  const columns = [
    {
      key: 'date-of-swab',
      title: 'Date of swab',
      accessor: ({ sampleTime }) => <DateDisplay date={sampleTime} />,
    },
    {
      key: 'date-of-test',
      title: 'Date of test',
    },
    {
      key: 'laboratory',
      title: 'Laboratory',
      accessor: getLaboratory,
    },
    {
      key: 'requestId',
      title: 'Request ID',
      accessor: getRequestId,
    },
    {
      key: 'laboratoryOfficer',
      title: 'Lab Officer',
    },
    {
      key: 'method',
      title: 'Method',
      accessor: ({ categoryName }) => categoryName,
    },
    {
      key: 'result',
      title: 'Result',
    },
  ];

  useEffect(() => {
    (async () => {
      const response = await getLabRequests();
      const requests = await Promise.all(
        response.data.map(async request => {
          const { data: tests } = await getLabTests(request.id);
          return {
            ...request,
            result: tests[0].result,
          };
        }),
      );
      setRows(
        requests.map(request => {
          return {
            rowId: request.id,
            cells: columns.map(({ key, accessor }) => ({
              key,
              value: accessor ? React.createElement(accessor, request) : request[key],
            })),
          };
        }),
      );
    })();
  }, []);
  return (
    <Modal open={open} onClose={() => setOpen(false)} width="md" printable>
      <Certificate
        patient={patient}
        header="COVID-19 Test History"
        primaryDetailsFields={[
          'firstName',
          'lastName',
          'dateOfBirth',
          'placeOfBirth',
          'countryOfBirthId',
          'sex',
        ]}
      >
        <Table>
          <thead>
            <tr>
              {columns.map(({ title, key }) => (
                <th key={key}>{title || getLocalisation(`fields.${key}.shortLabel`) || key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              return (
                <tr key={row.rowId}>
                  {row.cells.map(({ key, value }) => (
                    <td key={key}>{value}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Certificate>
    </Modal>
  );
};

export const PatientCovidTestCert = connectApi(api => ({
  getLabRequests: () =>
    api.get('/labRequest', {
      category: 'covid',
    }),
  getLabTests: id => api.get(`/labRequest/${id}/tests`),
}))(DumbPatientCovidTestCert);
