import React, { useEffect } from 'react';

import { useElectron } from '../../contexts/Electron';

import { PrintPortal, LetterPage } from '../Print';

export const PatientCovidTestCert = ({ patient }) => {
  const { printPage } = useElectron();
  useEffect(() => {
    printPage();
  });

  return (
    <PrintPortal>
      <LetterPage>
        <div>
          {patient.firstName}
          {patient.lastName}
        </div>
      </LetterPage>
    </PrintPortal>
  );
};
