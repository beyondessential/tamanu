import React from 'react';

import { Modal } from '../Modal';
import { Certificate, Table } from '../Print/Certificate';

export const PatientCovidTestCert = ({ patient }) => {
  return (
    <Modal open width="md" printable>
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
              <td>Result</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </Table>
      </Certificate>
    </Modal>
  );
};
