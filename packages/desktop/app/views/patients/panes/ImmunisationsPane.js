import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { useApi } from '../../../api';
import { Button } from '../../../components/Button';
import { ContentPane } from '../../../components/ContentPane';
import { EditAdministeredVaccineModal } from '../../../components/EditAdministeredVaccineModal';
import { ImmunisationCertificateModal } from '../../../components/ImmunisationCertificateModal';
import { ImmunisationModal } from '../../../components/ImmunisationModal';
import { ImmunisationsTable } from '../../../components/ImmunisationsTable';

const ButtonSpacer = styled.div`
  display: inline;
  margin-right: 10px;
`;

export const ImmunisationsPane = React.memo(({ patient, readonly }) => {
  const [isAdministerModalOpen, setIsAdministerModalOpen] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
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
    <div>
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
      <ImmunisationsTable patient={patient} onItemClick={id => onOpenEditModal(id)} />
      <ImmunisationCertificateModal
        open={isCertificateModalOpen}
        patient={patient}
        onClose={() => setIsCertificateModalOpen(false)}
      />
      <ContentPane>
        <Button
          onClick={() => setIsAdministerModalOpen(true)}
          variant="contained"
          color="primary"
          disabled={readonly}
        >
          Give vaccine
        </Button>
        <ButtonSpacer />
        <Button
          onClick={() => setIsCertificateModalOpen(true)}
          variant="outlined"
          color="primary"
          disabled={!hasVaccines}
        >
          View certificate
        </Button>
      </ContentPane>
    </div>
  );
});
