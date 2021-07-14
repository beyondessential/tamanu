import React, { useEffect } from 'react';

import { PrintPortal, LetterPage } from '../../print';
import { useElectron } from '../../contexts/Electron';

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
