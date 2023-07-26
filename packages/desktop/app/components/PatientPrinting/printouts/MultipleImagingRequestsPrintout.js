import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { NOTE_TYPES } from '@tamanu/constants';

import { LoadingIndicator } from '../../LoadingIndicator';
import { useCertificate } from '../../../utils/useCertificate';
import { useApi } from '../../../api';
import { PRINTOUT_COLUMNS } from '../modals/multipleImagingRequestsColumns';

import { Divider } from './reusable/Divider';
import { CertificateWrapper } from './reusable/CertificateWrapper';
import { PrintLetterhead } from './reusable/PrintLetterhead';
import { PatientDetailPrintout } from './reusable/PatientDetailPrintout';
import { ListTable } from './reusable/ListTable';
import { NotesPagesSection } from './reusable/NotesPagesSection';
import { DateFacilitySection } from './reusable/DateFacilitySection';

export const MultipleImagingRequestsPrintout = ({ encounter, imagingRequests }) => {
  const { title, subTitle, logo } = useCertificate();
  const api = useApi();
  const { data: patient, isLoading: isPatientLoading } = useQuery(
    ['patient', encounter.patientId],
    () => api.get(`patient/${encodeURIComponent(encounter.patientId)}`),
  );
  const { data: additionalData, isLoading: isAdditionalDataLoading } = useQuery(
    ['additionalData', encounter.patientId],
    () => api.get(`patient/${encodeURIComponent(encounter.patientId)}/additionalData`),
  );
  const isVillageEnabled = !!patient?.villageId;
  const { data: village = {}, isLoading: isVillageLoading } = useQuery(
    ['village', encounter.patientId],
    () => api.get(`referenceData/${encodeURIComponent(patient.villageId)}`),
    {
      enabled: isVillageEnabled,
    },
  );
  const isLoading =
    isPatientLoading || isAdditionalDataLoading || (isVillageEnabled && isVillageLoading);
  if (isLoading) {
    return <LoadingIndicator />;
  }
  const idsAndNotePages = imagingRequests.map(ir => [
    ir.displayId,
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
      <PatientDetailPrintout patient={patient} village={village} additionalData={additionalData} />

      <Divider />
      <DateFacilitySection encounter={encounter} />

      <ListTable data={imagingRequests} columns={PRINTOUT_COLUMNS} />
      <NotesPagesSection idsAndNotePages={idsAndNotePages} />
    </CertificateWrapper>
  );
};
