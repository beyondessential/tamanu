import React, { useState, useEffect } from 'react';

import { Modal } from '../Modal';
import { Certificate, Table } from '../Print/Certificate';

import { connectApi } from '../../api';

const DumbPatientCovidTestCert = ({ patient, getLabRequests }) => {
  const [open, setOpen] = useState(true);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    (async () => {
      const response = await getLabRequests();
      setRequests(response.data);
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
              <td>Date of swab</td>
              <td>Date of test</td>
              <td>Laboratory</td>
              <td>Request ID</td>
              <td>Lab Officer</td>
              <td>Method</td>
              <td>Result</td>
            </tr>
          </thead>
          <tbody>
            {requests.map(request => (
              <tr>
                <td></td>
                <td></td>
                <td></td>
                <td key="displayId">{request.displayId}</td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Certificate>
    </Modal>
  );
};

export const PatientCovidTestCert = connectApi(api => ({
  getLabRequests: () => api.get('/labRequest', {}),
}))(DumbPatientCovidTestCert);
