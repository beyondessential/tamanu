import React, { useCallback, useEffect, useState } from 'react';
import { useApi } from '../../../api';
import { ContentPane, TableButtonRow, Button } from '../../../components';
import { ViewAdministeredVaccineModal } from '../../../components/ViewAdministeredVaccineModal';
import { EditAdministeredVaccineModal } from '../../../components/EditAdministeredVaccineModal';
import { ImmunisationCertificateModal } from '../../../components/PatientPrinting';
import { ImmunisationModal } from '../../../components/ImmunisationModal';
import { ImmunisationsTable } from '../../../components/ImmunisationsTable';

export const ImmunisationsPane = React.memo(({ patient, readonly }) => {
  const [isAdministerModalOpen, setIsAdministerModalOpen] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [isViewAdministeredModalOpen, setIsViewAdministeredModalOpen] = useState(false);
  const [isEditAdministeredModalOpen, setIsEditAdministeredModalOpen] = useState(false);
  const [vaccineData, setVaccineData] = useState();
  const [hasVaccines, setHasVaccines] = useState();

  const onOpenEditModal = useCallback(async row => {
    setIsEditAdministeredModalOpen(true);
    setVaccineData(row);
  }, []);

  const onOpenViewModal = useCallback(async row => {
    setIsViewAdministeredModalOpen(true);
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
      <ViewAdministeredVaccineModal
        open={isViewAdministeredModalOpen}
        patientId={patient.id}
        vaccineRecord={vaccineData}
        onClose={() => setIsViewAdministeredModalOpen(false)}
      />
      <EditAdministeredVaccineModal
        open={isEditAdministeredModalOpen}
        patientId={patient.id}
        vaccineRecord={vaccineData}
        onClose={() => setIsEditAdministeredModalOpen(false)}
      />
      <ContentPane>
        <TableButtonRow variant="small">
          <Button
            onClick={() => setIsCertificateModalOpen(true)}
            variant="outlined"
            disabled={!hasVaccines}
          >
            View certificate
          </Button>
          <Button onClick={() => setIsAdministerModalOpen(true)} disabled={readonly}>
            Give vaccine
          </Button>
        </TableButtonRow>
        <ImmunisationsTable patient={patient} onItemClick={id => onOpenViewModal(id)} />
      </ContentPane>
      <ImmunisationCertificateModal
        open={isCertificateModalOpen}
        patient={patient}
        onClose={() => setIsCertificateModalOpen(false)}
      />
    </>
  );
});
