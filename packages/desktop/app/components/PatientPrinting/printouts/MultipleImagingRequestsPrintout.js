import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { NOTE_TYPES } from 'shared/constants';

import { LoadingIndicator } from '../../LoadingIndicator';
import { useCertificate } from '../../../utils/useCertificate';
import { useApi } from '../../../api';

import { StyledDivider } from './MultipleLabRequestsPrintout';
import { CertificateWrapper } from './reusable/CertificateWrapper';
import { PrintLetterhead } from './reusable/PrintLetterhead';
import { PatientDetailPrintout } from './reusable/PatientDetailPrintout';
import { ListTable } from './reusable/ListTable';
import { NotesPagesSection } from './reusable/NotesPagesSection';

import { PRINTOUT_COLUMNS } from '../modals/multipleImagingRequestsColumns';

export const MultipleImagingRequestsPrintout = ({ encounter, imagingRequests }) => {
  const { title, subTitle, logo } = useCertificate();
  const api = useApi();
  const { data: patient, isLoading: isPatientLoading } = useQuery(
    ['patient', encounter.patientId],
    () => api.get(`patient/${encodeURIComponent(encounter.patientId)}`),
  );
  if (isPatientLoading) {
    return <LoadingIndicator />;
  }
  const idsAndNotePages = imagingRequests.map(ir => [
    ir.id,
    ir.notePages.filter(np => np.noteType === NOTE_TYPES.OTHER),
  ]);
  return (
    <CertificateWrapper>
      <PrintLetterhead
        title={title}
        subTitle={subTitle}
        logoSrc={logo}
        pageTitle="Imaging Request"
      />
      <PatientDetailPrintout patientData={patient} />

      <StyledDivider />

      <ListTable data={imagingRequests} columns={PRINTOUT_COLUMNS} />
      <NotesPagesSection idsAndNotePages={idsAndNotePages} />
    </CertificateWrapper>
  );
};
