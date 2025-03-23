import React, { useState } from 'react';
import styled from 'styled-components';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { Colors } from '../../constants/index';
import { programsIcon } from '../../constants/images';
import {
  ActivatePatientProgramRegistryModal,
  PatientProgramRegistryUpdateFormModal,
} from '../../features/ProgramRegistry';
import { DeleteProgramRegistryFormModal } from './DeleteProgramRegistryFormModal';
import { RemoveProgramRegistryFormModal } from './RemoveProgramRegistryFormModal';
import { TranslatedText, OutlinedButton, DateDisplay, MenuButton } from '../../components';
import { ClinicalStatusDisplay } from './ClinicalStatusDisplay';
import { ConditionalTooltip } from '../../components/Tooltip';

const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const Container = styled(Row)`
  justify-content: space-between;
  padding: 6px 0 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid ${Colors.softOutline};
`;

const TreeIcon = styled.img`
  width: 30px;
  height: 30px;
  margin-right: 10px;
`;

const DividerVertical = styled.div`
  border-left: 1px solid ${Colors.softOutline};
  height: 44px;
  margin-right: 10px;
`;

const MenuContainer = styled(Row)`
  width: 10%;
  justify-content: space-between;
  margin-right: 10px;
  .menu {
    border-radius: 100px;
  }
`;

const TextColumnsContainer = styled(Row)`
  justify-content: flex-start;
  margin-right: 10px;
`;

const TextColumns = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin-right: 5px;
  font-weight: 400;
  font-size: 14px;
`;

export const DisplayPatientRegDetails = ({ patientProgramRegistration }) => {
  const { navigateToPatient } = usePatientNavigation();
  const [openChangeStatusFormModal, setOpenChangeStatusFormModal] = useState(false);
  const [openDeleteProgramRegistryFormModal, setOpenDeleteProgramRegistryFormModal] = useState(
    false,
  );
  const [openActivateProgramRegistryFormModal, setOpenActivateProgramRegistryFormModal] = useState(
    false,
  );
  const [openRemoveProgramRegistryFormModal, setOpenRemoveProgramRegistryFormModal] = useState(
    false,
  );

  const isRemoved =
    patientProgramRegistration.registrationStatus === REGISTRATION_STATUSES.INACTIVE;
  const isDeleted =
    patientProgramRegistration.registrationStatus === REGISTRATION_STATUSES.RECORDED_IN_ERROR;

  let actions = [
    {
      label: <TranslatedText stringId="general.action.remove" fallback="Remove" />,
      action: () => setOpenRemoveProgramRegistryFormModal(true),
    },
    {
      label: <TranslatedText stringId="general.action.delete" fallback="Delete" />,
      action: () => setOpenDeleteProgramRegistryFormModal(true),
    },
  ];

  if (isRemoved)
    actions = [
      {
        label: <TranslatedText stringId="general.action.activate" fallback="Activate" />,
        action: () => setOpenActivateProgramRegistryFormModal(true),
      },
      {
        label: <TranslatedText stringId="general.action.delete" fallback="Delete" />,
        action: () => setOpenDeleteProgramRegistryFormModal(true),
      },
    ];

  if (isDeleted)
    actions = [
      {
        label: <TranslatedText stringId="general.action.activate" fallback="Activate" />,
        action: () => setOpenActivateProgramRegistryFormModal(true),
      },
      {
        label: <TranslatedText stringId="general.action.remove" fallback="Remove" />,
        action: () => setOpenRemoveProgramRegistryFormModal(true),
      },
    ];

  return (
    <Container>
      <Row
        style={{
          justifyContent: 'flex-start',
        }}
      >
        <TreeIcon src={programsIcon} />
        <TextColumnsContainer>
          <TextColumns>
            <div>
              <TranslatedText
                stringId="programRegistry.registrationDate.label"
                fallback="Date of registration"
              />
              :
            </div>
            <div>
              <TranslatedText
                stringId="programRegistry.registeredBy.label"
                fallback="Registered by"
              />
              :
            </div>
          </TextColumns>
          <TextColumns style={{ fontWeight: 500 }}>
            <DateDisplay date={patientProgramRegistration.registrationDate} />
            <div>
              {patientProgramRegistration.registrationClinician
                ? patientProgramRegistration.registrationClinician.displayName
                : patientProgramRegistration.clinician.displayName}
            </div>
          </TextColumns>
        </TextColumnsContainer>
        {isRemoved && (
          <>
            <DividerVertical />
            <TextColumnsContainer>
              <TextColumns>
                <div>
                  <TranslatedText
                    stringId="programRegistry.dateRemoved.label"
                    fallback="Date removed"
                  />
                  :
                </div>
                <div>
                  <TranslatedText
                    stringId="programRegistry.removedBy.label"
                    fallback="Removed by"
                  />
                  :
                </div>
              </TextColumns>
              <TextColumns style={{ fontWeight: 500 }}>
                <DateDisplay date={patientProgramRegistration.dateRemoved} />
                <div>{patientProgramRegistration.removedBy?.displayName}</div>
              </TextColumns>
            </TextColumnsContainer>
          </>
        )}
        <DividerVertical />
        <ClinicalStatusDisplay clinicalStatus={patientProgramRegistration.clinicalStatus} />
      </Row>
      <Row
        style={{
          justifyContent: 'flex-end',
        }}
      >
        <ConditionalTooltip
          title={
            <TranslatedText
              stringId="programRegistry.patientInactive.tooltip"
              fallback="Patient must be active"
            />
          }
          visible={isRemoved}
        >
          <OutlinedButton onClick={() => setOpenChangeStatusFormModal(true)} disabled={isRemoved}>
            <TranslatedText stringId="general.action.update" fallback="Update" />
          </OutlinedButton>
        </ConditionalTooltip>
        <PatientProgramRegistryUpdateFormModal
          patientProgramRegistration={patientProgramRegistration}
          open={openChangeStatusFormModal}
          onClose={() => setOpenChangeStatusFormModal(false)}
        />
        <MenuContainer>
          <div className="menu">
            <MenuButton actions={actions} />
          </div>
        </MenuContainer>
      </Row>
      <ActivatePatientProgramRegistryModal
        open={openActivateProgramRegistryFormModal}
        patientProgramRegistration={patientProgramRegistration}
        onClose={() => setOpenActivateProgramRegistryFormModal(false)}
      />
      <RemoveProgramRegistryFormModal
        open={openRemoveProgramRegistryFormModal}
        patientProgramRegistration={patientProgramRegistration}
        onClose={() => setOpenRemoveProgramRegistryFormModal(false)}
      />
      <DeleteProgramRegistryFormModal
        open={openDeleteProgramRegistryFormModal}
        patientProgramRegistration={patientProgramRegistration}
        onClose={({ success }) => {
          setOpenDeleteProgramRegistryFormModal(false);
          if (success) navigateToPatient(patientProgramRegistration.patientId);
        }}
      />
    </Container>
  );
};
