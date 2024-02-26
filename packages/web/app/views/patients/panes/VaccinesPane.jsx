import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { Button, ContentPane, TableButtonRow, TranslatedText } from '../../../components';
import { ViewAdministeredVaccineModal } from '../../../components/ViewAdministeredVaccineModal';
import { EditAdministeredVaccineModal } from '../../../components/EditAdministeredVaccineModal';
import { DeleteAdministeredVaccineModal } from '../../../components/DeleteAdministeredVaccineModal';
import { VaccineModal } from '../../../components/VaccineModal';
import {
  CovidVaccineCertificateModal,
  VaccineCertificateModal,
} from '../../../components/PatientPrinting';
import { ImmunisationsTable, ImmunisationScheduleTable } from '../../../features';
import { useAdministeredVaccines } from '../../../api/queries';

const CovidCertificateButton = styled(Button)`
  margin-left: 0;
  margin-right: auto;
`;

const CovidCertificateIcon = styled.i`
  margin-right: 4px;
`;

const TableWrapper = styled.div`
  margin-bottom: 1.5rem;
`;

export const VaccinesPane = React.memo(({ patient, readonly }) => {
  const [isAdministerModalOpen, setIsAdministerModalOpen] = useState(false);
  const [isCovidCertificateModalOpen, setIsCovidCertificateModalOpen] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [isViewAdministeredModalOpen, setIsViewAdministeredModalOpen] = useState(false);
  const [isEditAdministeredModalOpen, setIsEditAdministeredModalOpen] = useState(false);
  const [isDeleteAdministeredModalOpen, setIsDeleteAdministeredModalOpen] = useState(false);
  const [vaccineData, setVaccineData] = useState();

  const handleOpenDeleteModal = useCallback(async row => {
    setIsDeleteAdministeredModalOpen(true);
    setVaccineData(row);
  }, []);

  const handleOpenEditModal = useCallback(async row => {
    setIsEditAdministeredModalOpen(true);
    setVaccineData(row);
  }, []);

  const handleOpenViewModal = useCallback(async row => {
    setIsViewAdministeredModalOpen(true);
    setVaccineData(row);
  }, []);

  const handleOpenRecordModal = useCallback(row => {
    setIsAdministerModalOpen(true);
    setVaccineData(row);
  }, []);

  const handleCloseRecordModal = useCallback(() => {
    setIsAdministerModalOpen(false);
    setVaccineData(null);
  }, []);

  const { data: vaccines } = useAdministeredVaccines(patient.id);
  const vaccinations = vaccines?.data || [];
  const certifiable = vaccinations.some(v => v.certifiable);

  return (
    <>
      <VaccineModal
        open={isAdministerModalOpen}
        patientId={patient.id}
        vaccineRecord={vaccineData}
        onClose={handleCloseRecordModal}
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
      <DeleteAdministeredVaccineModal
        open={isDeleteAdministeredModalOpen}
        patientId={patient.id}
        vaccineRecord={vaccineData}
        onClose={() => setIsDeleteAdministeredModalOpen(false)}
      />
      <ContentPane>
        <TableButtonRow variant="small">
          {certifiable && (
            <CovidCertificateButton
              onClick={() => setIsCovidCertificateModalOpen(true)}
              variant="text"
            >
              <CovidCertificateIcon style={{ marginRight: 4 }} className="fa fa-clipboard-list" />
              <TranslatedText
                stringId="vaccine.action.viewCovidCertificate"
                fallback="COVID-19 certificate"
              />
            </CovidCertificateButton>
          )}
          {!!vaccinations.length && (
            <Button
              onClick={() => setIsCertificateModalOpen(true)}
              variant="outlined"
              disabled={!vaccinations.length}
            >
              <TranslatedText
                stringId="vaccine.action.viewVaccineCertificate"
                fallback="Immunisation certificate"
              />
            </Button>
          )}
          <Button onClick={() => setIsAdministerModalOpen(true)} disabled={readonly}>
            <TranslatedText stringId="vaccine.action.recordVaccine" fallback="Record vaccine" />
          </Button>
        </TableButtonRow>
        <TableWrapper>
          <ImmunisationScheduleTable
            patient={patient}
            onItemEdit={id => handleOpenRecordModal(id)}
          />
        </TableWrapper>
        <ImmunisationsTable
          patient={patient}
          onItemClick={id => handleOpenViewModal(id)}
          onItemEditClick={id => handleOpenEditModal(id)}
          onItemDeleteClick={id => handleOpenDeleteModal(id)}
        />
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
