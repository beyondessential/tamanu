import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useApi } from '../../../api';
import { ContentPane, TableButtonRow, Button } from '../../../components';
import { EditAdministeredVaccineModal } from '../../../components/EditAdministeredVaccineModal';
import { CovidImmunisationCertificateModal } from '../../../components/PatientPrinting';
// import { GeneralImmunisationCertificateModal } from '../../../components/PatientPrinting';
import { ImmunisationModal } from '../../../components/ImmunisationModal';
import { ImmunisationsTable } from '../../../components/ImmunisationsTable';

const CovidCertificateButton = styled(Button)`
  margin-left: 0;
  margin-right: auto;
`;

const CovidCertificateIcon = styled.i`
  margin-right: 4px;
`;

export const ImmunisationsPane = React.memo(({ patient, readonly }) => {
  const [isAdministerModalOpen, setIsAdministerModalOpen] = useState(false);
  const [isCovidCertificateModalOpen, setIsCovidCertificateModalOpen] = useState(false);
  // const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [isEditAdministeredModalOpen, setIsEditAdministeredModalOpen] = useState(false);
  const [vaccineData, setVaccineData] = useState();
  const [hasVaccines, setHasVaccines] = useState();

  const onOpenEditModal = useCallback(async row => {
    setIsEditAdministeredModalOpen(true);
    setVaccineData(row);
  }, []);

  const api = useApi();
  useEffect(() => {
    api.get(`patient/${patient.id}/administeredVaccines`).then(response => {
      setHasVaccines(response.data.length > 0);
    });
  }, [api, patient.id]);

  return (
    <>
      <ImmunisationModal
        open={isAdministerModalOpen}
        patientId={patient.id}
        onClose={() => setIsAdministerModalOpen(false)}
      />
      <EditAdministeredVaccineModal
        open={isEditAdministeredModalOpen}
        patientId={patient.id}
        vaccineRecord={vaccineData}
        onClose={() => setIsEditAdministeredModalOpen(false)}
      />
      <ContentPane>
        <TableButtonRow variant="small">
          <CovidCertificateButton
            onClick={() => setIsCovidCertificateModalOpen(true)}
            variant="text"
            disabled={readonly}
          >
            <CovidCertificateIcon style={{ marginRight: 4 }} className="fa fa-clipboard-list" />
            COVID-19 certificate
          </CovidCertificateButton>
          <Button
            // onClick={() => setIsCertificateModalOpen(true)}
            variant="outlined"
            disabled={!hasVaccines}
          >
            View certificate
          </Button>
          <Button onClick={() => setIsAdministerModalOpen(true)} disabled={readonly}>
            Give vaccine
          </Button>
        </TableButtonRow>
        <ImmunisationsTable patient={patient} onItemClick={id => onOpenEditModal(id)} />
      </ContentPane>
      <CovidImmunisationCertificateModal
        open={isCovidCertificateModalOpen}
        patient={patient}
        onClose={() => setIsCovidCertificateModalOpen(false)}
      />
      {/* <GeneralImmunisationCertificateModal
        open={isCertificateModalOpen}
        patient={patient}
        onClose={() => setIsCertificateModalOpen(false)}
      /> */}
    </>
  );
});
