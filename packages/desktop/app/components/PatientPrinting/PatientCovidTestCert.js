import React, { useEffect } from 'react';

import { useElectron } from '../../contexts/Electron';

import { PrintPortal } from '../Print';
import { Certificate } from '../Print/Certificate';

export const PatientCovidTestCert = ({ patient }) => {
  const { printPage } = useElectron();
  useEffect(() => {
    printPage();
  });

  return (
    <PrintPortal>
      <Certificate patient={patient} header="COVID-19 Test History">
        <table>
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
        </table>
      </Certificate>
    </PrintPortal>
  );
};
