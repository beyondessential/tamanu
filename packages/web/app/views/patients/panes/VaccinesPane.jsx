import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { ButtonWithPermissionCheck, Button } from '@tamanu/ui-components';
import {
  ContentPane,
  TableButtonRow,
  TranslatedText,
  NoteModalActionBlocker,
} from '../../../components';
import { ViewAdministeredVaccineModal } from '../../../components/ViewAdministeredVaccineModal';
import { EditAdministeredVaccineModal } from '../../../components/EditAdministeredVaccineModal';
import { DeleteAdministeredVaccineModal } from '../../../components/DeleteAdministeredVaccineModal';
import { VaccineModal } from '../../../components/VaccineModal';
import {
  CovidVaccineCertificateModal,
  VaccineCertificateModal,
} from '../../../components/PatientPrinting';
import { ImmunisationsTable, ImmunisationScheduleTable } from '../../../features';
import { useAdministeredVaccinesQuery } from '../../../api/queries';
import { useSettings } from '../../../contexts/Settings';

const CovidCertificateButton = styled(Button)`
  margin-left: 0;
  margin-right: auto;
`;

const CovidCertificateIcon = styled.i`
  margin-right: 4px;
`;

const TableWrapper = styled.div`
  margin-bottom: 1.5rem;

  tbody {
    max-height: 300px;
  }
`;

export const VaccinesPane = React.memo(({ patient, readonly }) => {
  const { getSetting } = useSettings();
  const [hideUpcomingVaccines, setHideUpcomingVaccines] = useState(
    getSetting('features.hideUpcomingVaccines'),
  );
  const [isAdministerModalOpen, setIsAdministerModalOpen] = useState(false);
  const [isCovidCertificateModalOpen, setIsCovidCertificateModalOpen] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [isViewAdministeredModalOpen, setIsViewAdministeredModalOpen] = useState(false);
  const [isEditAdministeredModalOpen, setIsEditAdministeredModalOpen] = useState(false);
  const [isDeleteAdministeredModalOpen, setIsDeleteAdministeredModalOpen] = useState(false);
  const [vaccineData, setVaccineData] = useState();

  const handleShowUpcomingVaccines = useCallback(() => {
    setHideUpcomingVaccines(false);
  }, []);

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

  const { data: vaccines } = useAdministeredVaccinesQuery(patient.id);
  const vaccinations = vaccines?.data || [];
  const certifiable = vaccinations.some(v => v.certifiable);

  return (
    <>
      <VaccineModal
        open={isAdministerModalOpen}
        patientId={patient.id}
        vaccineRecord={{
          ...vaccineData,
          vaccineLabel: vaccineData?.label,
        }}
        onClose={handleCloseRecordModal}
        data-testid="vaccinemodal-uxlc"
      />
      <ViewAdministeredVaccineModal
        open={isViewAdministeredModalOpen}
        patientId={patient.id}
        vaccineRecord={vaccineData}
        onClose={() => setIsViewAdministeredModalOpen(false)}
        data-testid="viewadministeredvaccinemodal-mckw"
      />
      <EditAdministeredVaccineModal
        open={isEditAdministeredModalOpen}
        patientId={patient.id}
        vaccineRecord={vaccineData}
        onClose={() => setIsEditAdministeredModalOpen(false)}
        data-testid="editadministeredvaccinemodal-krbw"
      />
      <DeleteAdministeredVaccineModal
        open={isDeleteAdministeredModalOpen}
        patientId={patient.id}
        vaccineRecord={vaccineData}
        onClose={() => setIsDeleteAdministeredModalOpen(false)}
        data-testid="deleteadministeredvaccinemodal-k9i2"
      />
      <ContentPane data-testid="contentpane-9tqb">
        <TableButtonRow variant="small" data-testid="tablebuttonrow-grvp">
          {certifiable && (
            <CovidCertificateButton
              onClick={() => setIsCovidCertificateModalOpen(true)}
              variant="text"
              data-testid="covidcertificatebutton-vnau"
            >
              <CovidCertificateIcon
                style={{ marginRight: 4 }}
                className="fa fa-clipboard-list"
                data-testid="covidcertificateicon-o54c"
              />
              <TranslatedText
                stringId="vaccine.action.viewCovidCertificate"
                fallback="COVID-19 certificate"
                data-testid="translatedtext-lsxv"
              />
            </CovidCertificateButton>
          )}
          {!!vaccinations.length && (
            <Button
              onClick={() => setIsCertificateModalOpen(true)}
              variant="outlined"
              disabled={!vaccinations.length}
              data-testid="button-i4cv"
            >
              <TranslatedText
                stringId="vaccine.action.viewVaccineCertificate"
                fallback="Immunisation certificate"
                data-testid="translatedtext-u89m"
              />
            </Button>
          )}
          <NoteModalActionBlocker>
            <ButtonWithPermissionCheck
              verb="create"
              noun="PatientVaccine"
              onClick={() => setIsAdministerModalOpen(true)}
              disabled={readonly}
              data-testid="buttonwithpermissioncheck-zmgl"
            >
              <TranslatedText
                stringId="vaccine.action.recordVaccine"
                fallback="Record vaccine"
                data-testid="translatedtext-4e9m"
              />
            </ButtonWithPermissionCheck>
          </NoteModalActionBlocker>
        </TableButtonRow>
        <TableWrapper data-testid="tablewrapper-rbs7">
          {hideUpcomingVaccines ? (
              <Button onClick={handleShowUpcomingVaccines}>
                <TranslatedText
                  stringId="vaccine.action.showUpcomingVaccines"
                  fallback="Show upcoming vaccines"
                />
              </Button>
            ) : (
              <ImmunisationScheduleTable
                patient={patient}
                onItemEdit={id => handleOpenRecordModal(id)}
                data-testid="immunisationscheduletable-8nat"
              />
          )}
        </TableWrapper>
        <ImmunisationsTable
          patient={patient}
          onItemClick={id => handleOpenViewModal(id)}
          onItemEditClick={id => handleOpenEditModal(id)}
          onItemDeleteClick={id => handleOpenDeleteModal(id)}
          data-testid="immunisationstable-q9jd"
        />
      </ContentPane>
      <CovidVaccineCertificateModal
        open={isCovidCertificateModalOpen}
        patient={patient}
        onClose={() => setIsCovidCertificateModalOpen(false)}
        data-testid="covidvaccinecertificatemodal-dzug"
      />
      <VaccineCertificateModal
        open={isCertificateModalOpen}
        patient={patient}
        onClose={() => setIsCertificateModalOpen(false)}
        data-testid="vaccinecertificatemodal-mfeh"
      />
    </>
  );
});
