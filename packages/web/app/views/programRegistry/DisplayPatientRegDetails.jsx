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
import { NoteModalActionBlocker } from '../../components/NoteModalActionBlocker';

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
      label: (
        <TranslatedText
          stringId="general.action.remove"
          fallback="Remove"
          data-testid="translatedtext-c6f1"
        />
      ),
      action: () => setOpenRemoveProgramRegistryFormModal(true),
      wrapper: children => <NoteModalActionBlocker>{children}</NoteModalActionBlocker>,
    },
    {
      label: (
        <TranslatedText
          stringId="general.action.delete"
          fallback="Delete"
          data-testid="translatedtext-0d1d"
        />
      ),
      action: () => setOpenDeleteProgramRegistryFormModal(true),
      wrapper: children => <NoteModalActionBlocker>{children}</NoteModalActionBlocker>,
    },
  ];

  if (isRemoved)
    actions = [
      {
        label: (
          <TranslatedText
            stringId="general.action.activate"
            fallback="Activate"
            data-testid="translatedtext-t1yc"
          />
        ),
        action: () => setOpenActivateProgramRegistryFormModal(true),
      },
      {
        label: (
          <TranslatedText
            stringId="general.action.delete"
            fallback="Delete"
            data-testid="translatedtext-fdyq"
          />
        ),
        action: () => setOpenDeleteProgramRegistryFormModal(true),
      },
    ];

  if (isDeleted)
    actions = [
      {
        label: (
          <TranslatedText
            stringId="general.action.activate"
            fallback="Activate"
            data-testid="translatedtext-5shb"
          />
        ),
        action: () => setOpenActivateProgramRegistryFormModal(true),
      },
      {
        label: (
          <TranslatedText
            stringId="general.action.remove"
            fallback="Remove"
            data-testid="translatedtext-odoc"
          />
        ),
        action: () => setOpenRemoveProgramRegistryFormModal(true),
      },
    ];

  return (
    <DisplayContainer data-testid="displaycontainer-ulkb">
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        <LogoContainer data-testid="logocontainer-jly9">
          <Avatar
            src={programsIcon}
            style={{ height: '22px', width: '22px', margin: '5px' }}
            data-testid="avatar-5k1g"
          />
        </LogoContainer>
        <TextColumnsContainer data-testid="textcolumnscontainer-makj">
          <TextColumns data-testid="textcolumns-vdil">
            <div>
              <TranslatedText
                stringId="programRegistry.registrationDate.label"
                fallback="Date of registration"
                data-testid="translatedtext-wjnn"
              />
              :
            </div>
            <div>
              <TranslatedText
                stringId="programRegistry.registeredBy.label"
                fallback="Registered by"
                data-testid="translatedtext-0vpo"
              />
              :
            </div>
          </TextColumns>
          <TextColumns style={{ fontWeight: 500 }} data-testid="textcolumns-z5en">
            <DateDisplay
              date={patientProgramRegistration.registrationDate}
              data-testid="datedisplay-z920"
            />
            <div>
              {patientProgramRegistration.registrationClinician
                ? patientProgramRegistration.registrationClinician.displayName
                : patientProgramRegistration.clinician.displayName}
            </div>
          </TextColumns>
        </TextColumnsContainer>
        {isRemoved && (
          <>
            <DividerVertical data-testid="dividervertical-vh04" />
            <TextColumnsContainer data-testid="textcolumnscontainer-i1ke">
              <TextColumns data-testid="textcolumns-6zla">
                <div>
                  <TranslatedText
                    stringId="programRegistry.dateRemoved.label"
                    fallback="Date removed"
                    data-testid="translatedtext-6czg"
                  />
                  :
                </div>
                <div>
                  <TranslatedText
                    stringId="programRegistry.removedBy.label"
                    fallback="Removed by"
                    data-testid="translatedtext-txyo"
                  />
                  :
                </div>
              </TextColumns>
              <TextColumns style={{ fontWeight: 500 }} data-testid="textcolumns-kho7">
                <DateDisplay
                  date={patientProgramRegistration.dateRemoved}
                  data-testid="datedisplay-4rsh"
                />
                <div>{patientProgramRegistration.removedBy?.displayName}</div>
              </TextColumns>
            </TextColumnsContainer>
          </>
        )}

        <DividerVertical data-testid="dividervertical-7rex" />
        <ClinicalStatusDisplay
          clinicalStatus={patientProgramRegistration.clinicalStatus}
          data-testid="clinicalstatusdisplay-0l56"
        />
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
              data-testid="translatedtext-3uno"
            />
          }
          visible={isRemoved}
          data-testid="conditionaltooltip-80xi"
        >
          <NoteModalActionBlocker>
            <OutlinedButton
              onClick={() => setOpenChangeStatusFormModal(true)}
              disabled={isRemoved}
              data-testid="outlinedbutton-ixex"
            >
              <TranslatedText
                stringId="general.action.changeStatus"
                fallback="Change status"
                data-testid="translatedtext-hexl"
              />
            </OutlinedButton>
          </NoteModalActionBlocker>
        </ConditionalTooltip>
        <ChangeStatusFormModal
          patientProgramRegistration={patientProgramRegistration}
          open={openChangeStatusFormModal}
          onClose={() => setOpenChangeStatusFormModal(false)}
          data-testid="changestatusformmodal-ltyf"
        />
        <MenuContainer data-testid="menucontainer-3144">
          <div className="menu">
            <MenuButton actions={actions} data-testid="menubutton-uze1" />
          </div>
        </MenuContainer>
      </div>
      <ActivatePatientProgramRegistry
        open={openActivateProgramRegistryFormModal}
        patientProgramRegistration={patientProgramRegistration}
        onClose={() => setOpenActivateProgramRegistryFormModal(false)}
        data-testid="activatepatientprogramregistry-so3s"
      />
      <RemoveProgramRegistryFormModal
        open={openRemoveProgramRegistryFormModal}
        patientProgramRegistration={patientProgramRegistration}
        onClose={() => setOpenRemoveProgramRegistryFormModal(false)}
        data-testid="removeprogramregistryformmodal-56dt"
      />
      <DeleteProgramRegistryFormModal
        open={openDeleteProgramRegistryFormModal}
        patientProgramRegistration={patientProgramRegistration}
        onClose={({ success }) => {
          setOpenDeleteProgramRegistryFormModal(false);
          if (success) navigateToPatient(patientProgramRegistration.patientId);
        }}
        data-testid="deleteprogramregistryformmodal-dhyr"
      />
    </DisplayContainer>
  );
};
