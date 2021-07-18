import React, { useState, useEffect } from 'react';

import { Modal } from '../Modal';
import { Certificate, Table } from '../Print/Certificate';
import { mapDataToColumns } from '../Table/Table';

import { connectApi } from '../../api';
import { useLocalisation } from '../../contexts/Localisation';

const DumbPatientCovidTestCert = ({ patient, getLabRequests }) => {
  const [open, setOpen] = useState(true);
  const [rows, setRows] = useState([]);
  const { getLocalisation } = useLocalisation();

  const columns = [
    {
      key: 'date-of-swab',
      title: 'Date of swab',
    },
    {
      key: 'date-of-test',
      title: 'Date of test',
    },
    {
      key: 'laboratory',
      title: 'Laboratory',
    },
    {
      key: 'displayId',
      title: 'Request ID',
    },
    {
      key: 'laboratoryOfficer',
      title: 'Lab Officer',
    },
    {
      key: 'method',
      title: 'Method',
    },
    {
      key: 'result',
      title: 'Result',
    },
  ];

  useEffect(() => {
    (async () => {
      const response = await getLabRequests();
      const requests = await Promise.all(response.data.map(r => mapDataToColumns(r, columns)));
      setRows(requests);
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
                <tr key={row.displayId}>
                  {Object.entries(row).map(([key, value]) => (
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
}))(DumbPatientCovidTestCert);
