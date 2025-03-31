import React, { useState } from 'react';
import styled from 'styled-components';
import { Avatar } from '@material-ui/core';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { Colors } from '../../constants/index';
import { DateDisplay } from '../../components/DateDisplay';
import { programsIcon } from '../../constants/images';
import { MenuButton } from '../../components/MenuButton';
import { ChangeStatusFormModal } from './ChangeStatusFormModal';
import { ActivatePatientProgramRegistry } from './ActivatePatientProgramRegistry';
import { DeleteProgramRegistryFormModal } from './DeleteProgramRegistryFormModal';
import { RemoveProgramRegistryFormModal } from './RemoveProgramRegistryFormModal';
import { OutlinedButton } from '../../components';
import { ClinicalStatusDisplay } from './ClinicalStatusDisplay';
import { ConditionalTooltip } from '../../components/Tooltip';
import { TranslatedText } from '../../components/Translation/TranslatedText';

const DisplayContainer = styled.div`
  display: flex;
  height: 74px;
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border: 1px solid ${Colors.softOutline};
  border-radius: 5px;
  font-size: 11px;
  padding: 10px;
  background-color: ${Colors.white};
`;
const LogoContainer = styled.div`
  width: 5%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 10px;
  margin-left: 17px;
`;

const DividerVertical = styled.div`
  border-left: 1px solid ${Colors.softOutline};
  height: 44px;
  margin-right: 10px;
`;

const MenuContainer = styled.div`
  width: 10%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-right: 10px;
  .menu {
    border-radius: 100px;
  }
`;

const TextColumnsContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  margin-right: 10px;
`;
const TextColumns = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin-right: 5px;
  font-weight: 400;
  font-size: 11px;
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
      label: <TranslatedText
        stringId="general.action.remove"
        fallback="Remove"
        data-testid='translatedtext-w3cm' />,
      action: () => setOpenRemoveProgramRegistryFormModal(true),
    },
    {
      label: <TranslatedText
        stringId="general.action.delete"
        fallback="Delete"
        data-testid='translatedtext-dn2x' />,
      action: () => setOpenDeleteProgramRegistryFormModal(true),
    },
  ];

  if (isRemoved)
    actions = [
      {
        label: <TranslatedText
          stringId="general.action.activate"
          fallback="Activate"
          data-testid='translatedtext-qldi' />,
        action: () => setOpenActivateProgramRegistryFormModal(true),
      },
      {
        label: <TranslatedText
          stringId="general.action.delete"
          fallback="Delete"
          data-testid='translatedtext-x9pp' />,
        action: () => setOpenDeleteProgramRegistryFormModal(true),
      },
    ];

  if (isDeleted)
    actions = [
      {
        label: <TranslatedText
          stringId="general.action.activate"
          fallback="Activate"
          data-testid='translatedtext-fpft' />,
        action: () => setOpenActivateProgramRegistryFormModal(true),
      },
      {
        label: <TranslatedText
          stringId="general.action.remove"
          fallback="Remove"
          data-testid='translatedtext-4h47' />,
        action: () => setOpenRemoveProgramRegistryFormModal(true),
      },
    ];

  return (
    <DisplayContainer>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        <LogoContainer>
          <Avatar src={programsIcon} style={{ height: '22px', width: '22px', margin: '5px' }} />
        </LogoContainer>
        <TextColumnsContainer>
          <TextColumns>
            <div>
              <TranslatedText
                stringId="programRegistry.registrationDate.label"
                fallback="Date of registration"
                data-testid='translatedtext-k4xc' />
              :
            </div>
            <div>
              <TranslatedText
                stringId="programRegistry.registeredBy.label"
                fallback="Registered by"
                data-testid='translatedtext-ge6t' />
              :
            </div>
          </TextColumns>
          <TextColumns style={{ fontWeight: 500 }}>
            <DateDisplay
              date={patientProgramRegistration.registrationDate}
              data-testid='datedisplay-y8yd' />
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
                    data-testid='translatedtext-p5bv' />
                  :
                </div>
                <div>
                  <TranslatedText
                    stringId="programRegistry.removedBy.label"
                    fallback="Removed by"
                    data-testid='translatedtext-ubm0' />
                  :
                </div>
              </TextColumns>
              <TextColumns style={{ fontWeight: 500 }}>
                <DateDisplay
                  date={patientProgramRegistration.dateRemoved}
                  data-testid='datedisplay-189e' />
                <div>{patientProgramRegistration.removedBy?.displayName}</div>
              </TextColumns>
            </TextColumnsContainer>
          </>
        )}

        <DividerVertical />
        <ClinicalStatusDisplay clinicalStatus={patientProgramRegistration.clinicalStatus} />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <ConditionalTooltip
          title={
            <TranslatedText
              stringId="programRegistry.patientInactive.tooltip"
              fallback="Patient must be active"
              data-testid='translatedtext-scrg' />
          }
          visible={isRemoved}
        >
          <OutlinedButton
            onClick={() => setOpenChangeStatusFormModal(true)}
            disabled={isRemoved}
            data-testid='outlinedbutton-1ozk'>
            <TranslatedText
              stringId="general.action.changeStatus"
              fallback="Change status"
              data-testid='translatedtext-mcdq' />
          </OutlinedButton>
        </ConditionalTooltip>
        <ChangeStatusFormModal
          patientProgramRegistration={patientProgramRegistration}
          open={openChangeStatusFormModal}
          onClose={() => setOpenChangeStatusFormModal(false)}
        />
        <MenuContainer>
          <div className="menu">
            <MenuButton actions={actions} data-testid='menubutton-4hxl' />
          </div>
        </MenuContainer>
      </div>
      <ActivatePatientProgramRegistry
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
    </DisplayContainer>
  );
};
