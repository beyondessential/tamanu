import React, { useCallback } from 'react';
import styled from 'styled-components';

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
  const [isAdministerModalOpen, setIsAdministerModalOpen] = React.useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = React.useState(false);
  const [isEditAdministeredModalOpen, setIsEditAdministeredModalOpen] = React.useState(false);
  const [vaccineData, setVaccineData] = React.useState();
  const onOpenEditModal = useCallback(
    async row => {
      setIsEditAdministeredModalOpen(true);
      setVaccineData(row);
    },
    [patient],
  );

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
        <Button onClick={() => setIsCertificateModalOpen(true)} variant="outlined" color="primary">
          View certificate
        </Button>
      </ContentPane>
    </div>
  );
});
