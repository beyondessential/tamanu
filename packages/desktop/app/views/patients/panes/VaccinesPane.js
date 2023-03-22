import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { ContentPane, TableButtonRow, Button } from '../../../components';
import { EditAdministeredVaccineModal } from '../../../components/EditAdministeredVaccineModal';
import {
  CovidVaccineCertificateModal,
  VaccineCertificateModal,
} from '../../../components/PatientPrinting';
import { ImmunisationModal } from '../../../components/ImmunisationModal';
import { ImmunisationsTable } from '../../../components/ImmunisationsTable';
import { useAdministeredVaccines } from '../../../api/queries/useAdministeredVaccines';

const CovidCertificateButton = styled(Button)`
  margin-left: 0;
  margin-right: auto;
`;

const CovidCertificateIcon = styled.i`
  margin-right: 4px;
`;

export const VaccinesPane = React.memo(({ patient, readonly }) => {
  const [isAdministerModalOpen, setIsAdministerModalOpen] = useState(false);
  const [isCovidCertificateModalOpen, setIsCovidCertificateModalOpen] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [isEditAdministeredModalOpen, setIsEditAdministeredModalOpen] = useState(false);
  const [vaccineData, setVaccineData] = useState();

  const onOpenEditModal = useCallback(async row => {
    setIsEditAdministeredModalOpen(true);
    setVaccineData(row);
  }, []);

  const { data: vaccine } = useAdministeredVaccines(patient.id);
  const vaccinations = vaccine?.data || [];
  const certifiable = vaccinations.some(v => v.certifiable);

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
            disabled={!certifiable}
          >
            <CovidCertificateIcon style={{ marginRight: 4 }} className="fa fa-clipboard-list" />
            COVID-19 certificate
          </CovidCertificateButton>
          <Button
            onClick={() => setIsCertificateModalOpen(true)}
            variant="outlined"
            disabled={!vaccinations.length}
          >
            View certificate
          </Button>
          <Button onClick={() => setIsAdministerModalOpen(true)} disabled={readonly}>
            Give vaccine
          </Button>
        </TableButtonRow>
        <ImmunisationsTable patient={patient} onItemClick={id => onOpenEditModal(id)} />
      </ContentPane>
      <CovidVaccineCertificateModal
        open={isCovidCertificateModalOpen}
        patient={patient}
        onClose={() => setIsCovidCertificateModalOpen(false)}
      />
      <VaccineCertificateModal
        open={isCertificateModalOpen}
        patient={patient}
        onClose={() => setIsCertificateModalOpen(false)}
      />
    </>
  );
});
