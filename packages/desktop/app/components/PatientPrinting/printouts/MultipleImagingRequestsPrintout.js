import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { NOTE_TYPES } from 'shared/constants';

import { LoadingIndicator } from '../../LoadingIndicator';
import { useCertificate } from '../../../utils/useCertificate';
import { useApi } from '../../../api';
import { DateDisplay } from '../../DateDisplay';
import { getImagingRequestType } from '../../../utils/getImagingRequestType';
import { useLocalisation } from '../../../contexts/Localisation';
import { getAreaNote } from '../../../utils/areaNote';

import { StyledDivider } from './MultipleLabRequestsPrintout';
import { CertificateWrapper } from './reusable/CertificateWrapper';
import { PrintLetterhead } from './reusable/PrintLetterhead';
import { PatientDetailPrintout } from './reusable/PatientDetailPrintout';
import { ListTable } from './reusable/ListTable';
import { NotesPagesSection } from './reusable/NotesPagesSection';

const COLUMN_KEYS = {
  ID: 'id',
  REQUESTED_DATE: 'requestedDate',
  REQUESTED_BY: 'requestedBy',
  TYPE: 'imagingType',
  AREAS: 'areas',
};

export const MultipleImagingRequestsPrintout = ({ encounter, imagingRequests }) => {
  const { getLocalisation } = useLocalisation();
  const imagingTypes = getLocalisation('imagingTypes') || {};
  // TODO: deduplicate and align with selection form
  const COLUMNS = [
    {
      key: COLUMN_KEYS.ID,
      title: 'Request ID',
      sortable: false,
    },
    {
      key: COLUMN_KEYS.REQUESTED_DATE,
      title: 'Request date',
      sortable: false,
      accessor: ({ requestedDate }) => <DateDisplay date={requestedDate} />,
    },
    {
      key: COLUMN_KEYS.REQUESTED_BY,
      title: 'Requesting clinician',
      sortable: false,
      maxWidth: 300,
      accessor: ({ requestedBy }) => requestedBy?.displayName || '',
    },
    {
      key: COLUMN_KEYS.TYPE,
      title: 'Type',
      sortable: false,
      maxWidth: 70,
      accessor: getImagingRequestType(imagingTypes),
    },
    {
      key: COLUMN_KEYS.AREAS,
      title: 'Areas to be imaged',
      sortable: false,
      accessor: getAreaNote,
    },
  ];

  // TODO: why are we loading this here and not where it's needed?
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
      {/* TODO: why patientData instead of patient? */}
      <PatientDetailPrintout patientData={patient} />

      <StyledDivider />

      {/* TODO: move the RowContainer stuff out */}

      <ListTable data={imagingRequests} columns={COLUMNS} />
      <NotesPagesSection idsAndNotePages={idsAndNotePages} />
    </CertificateWrapper>
  );
};
