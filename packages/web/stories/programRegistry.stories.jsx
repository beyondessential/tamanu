// @ts-check

import React from 'react';
import { action } from '@storybook/addon-actions';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { ChangeStatusFormModal } from '../app/views/programRegistry/ChangeStatusFormModal';
import { ApiContext } from '../app/api';
import { Modal } from '../app/components/Modal';
import { InfoPaneList } from '../app/components/PatientInfoPane/InfoPaneList';
import { PatientProgramRegistryForm } from '../app/views/programRegistry/PatientProgramRegistryForm';
import { ProgramRegistryListItem } from '../app/views/programRegistry/ProgramRegistryListItem';
import { PatientProgramRegistryFormHistory } from '../app/views/programRegistry/PatientProgramRegistryFormHistory';
import { DisplayPatientRegDetails } from '../app/views/programRegistry/DisplayPatientRegDetails';
import { ProgramRegistryStatusHistory } from '../app/views/programRegistry/ProgramRegistryStatusHistory';
import { DeleteProgramRegistryFormModal } from '../app/views/programRegistry/DeleteProgramRegistryFormModal';
import { ActivatePatientProgramRegistry } from '../app/views/programRegistry/ActivatePatientProgramRegistry';
import { RemoveProgramRegistryFormModal } from '../app/views/programRegistry/RemoveProgramRegistryFormModal';
import {
  dummyApi,
  patient,
  patientProgramRegistration,
  programRegistryConditions,
} from './utils/mockProgramRegistryData';
import { ConditionSection } from '../app/views/programRegistry/ConditionSection';
import { AddConditionFormModal } from '../app/views/programRegistry/AddConditionFormModal';
import { RemoveConditionFormModal } from '../app/views/programRegistry/RemoveConditionFormModal';
import { PatientProgramRegistrationSelectSurvey } from '../app/views/programRegistry/PatientProgramRegistrationSelectSurvey';
import { PANE_SECTION_TITLES, PANE_SECTION_IDS } from '../app/components/PatientInfoPane/paneSections';

export default {
  title: 'Program Registry',
};

export const ProgramRegistryInfoPaneList = {
  render: () => {
    return (
      <ApiContext.Provider value={dummyApi}>
        <div style={{ width: '250px', backgroundColor: 'white', padding: '10px' }}>
          <InfoPaneList
            patient={patient}
            readonly={false}
            id={PANE_SECTION_IDS.PROGRAM_REGISTRY}
            title={PANE_SECTION_TITLES[PANE_SECTION_IDS.PROGRAM_REGISTRY]}
            endpoint="programRegistry"
            getEndpoint={`patient/${patient.id}/programRegistration`}
            Form={PatientProgramRegistryForm}
            ListItemComponent={ProgramRegistryListItem}
            behavior="modal"
            itemTitle="Add program registry"
            getEditFormName={programRegistry => `Program registry: ${programRegistry.name}`}
            CustomEditForm={undefined}
          />
        </div>
      </ApiContext.Provider>
    );
  },
};

export const PatientProgramRegistryFormStory = {
  render: () => (
    <ApiContext.Provider value={dummyApi}>
      <Modal width="md" title="Add program registry" open>
        <PatientProgramRegistryForm
          onSubmit={action('submit')}
          onCancel={action('cancel')}
          patient={patient}
        />
      </Modal>
    </ApiContext.Provider>
  ),
};

export const DisplayPatientRegDetailsLowRisk = {
  render: () => (
    <div style={{ width: '797px' }}>
      <DisplayPatientRegDetails patientProgramRegistration={patientProgramRegistration} />
    </div>
  ),
};

export const DisplayPatientRegDetailsCritical = {
  render: () => (
    <div style={{ width: '797px' }}>
      <DisplayPatientRegDetails
        patientProgramRegistration={{
          ...patientProgramRegistration,
          registrationStatus: REGISTRATION_STATUSES.INACTIVE,
          clinicalStatus: {
            id: '1',
            code: 'critical',
            name: 'Critical',
            color: 'red',
          },
        }}
      />
    </div>
  ),
};

export const DisplayPatientRegDetailsNeedsReview = {
  render: () => (
    <div style={{ width: '797px' }}>
      <DisplayPatientRegDetails
        patientProgramRegistration={{
          ...patientProgramRegistration,
          registrationStatus: 'active',
          clinicalStatus: {
            id: '1',
            code: 'needs_review',
            name: 'Needs review',
            color: 'yellow',
          },
        }}
      />
    </div>
  ),
};

export const ConditionSectionStory = {
  render: () => (
    <ApiContext.Provider value={dummyApi}>
      <div style={{ width: '262px' }}>
        <ConditionSection patientProgramRegistration={patientProgramRegistration} />
      </div>
    </ApiContext.Provider>
  ),
};

export const AddCondition = {
  render: () => (
    <ApiContext.Provider value={dummyApi}>
      <AddConditionFormModal
        patientProgramRegistration={patientProgramRegistration}
        onClose={action('cancel')}
        open
      />
    </ApiContext.Provider>
  ),
};

export const RemoveCondition = {
  render: () => (
    <ApiContext.Provider value={dummyApi}>
      <RemoveConditionFormModal
        condition={programRegistryConditions[0]}
        onSubmit={action('submit')}
        onCancel={action('cancel')}
        open
      />
    </ApiContext.Provider>
  ),
};

export const ProgramRegistryStatusHistoryRemovedNever = {
  render: () => (
    <ApiContext.Provider value={dummyApi}>
      <ProgramRegistryStatusHistory patientProgramRegistration={patientProgramRegistration} />
    </ApiContext.Provider>
  ),
};

export const ProgramRegistryStatusHistoryRemovedOnce = {
  render: () => (
    <ApiContext.Provider value={dummyApi}>
      <ProgramRegistryStatusHistory patientProgramRegistration={patientProgramRegistration} />
    </ApiContext.Provider>
  ),
};

export const PatientProgramRegistryFormHistoryStory = {
  render: () => (
    <ApiContext.Provider value={dummyApi}>
      <PatientProgramRegistryFormHistory patientProgramRegistration={patientProgramRegistration} />
    </ApiContext.Provider>
  ),
};

export const ProgramRegistryStatusChange = {
  render: () => {
    return (
      <ApiContext.Provider value={dummyApi}>
        <ChangeStatusFormModal
          patientProgramRegistration={patientProgramRegistration}
          onSubmit={action('submit')}
          onCancel={action('cancel')}
          open
        />
      </ApiContext.Provider>
    );
  },
};

export const ProgramRegistryDeleteModal = {
  render: () => {
    return (
      <DeleteProgramRegistryFormModal
        open
        programRegistry={{ name: 'Hepatitis B' }}
        onSubmit={action('submit')}
        onCancel={action('cancel')}
      />
    );
  },
};

export const ActivatePatientProgramRegistryStory = {
  render: () => (
    <ApiContext.Provider value={dummyApi}>
      <ActivatePatientProgramRegistry
        onSubmit={action('submit')}
        onCancel={action('cancel')}
        patientProgramRegistration={patientProgramRegistration}
        open
      />
    </ApiContext.Provider>
  ),
};

export const RemoveProgramRegistryFormModalStory = {
  render: () => (
    <ApiContext.Provider value={dummyApi}>
      <RemoveProgramRegistryFormModal
        patientProgramRegistration={patientProgramRegistration}
        onSubmit={action('submit')}
        onCancel={action('cancel')}
        open
      />
    </ApiContext.Provider>
  ),
};

export const PatientProgramRegistrationSelectSurveyStory = {
  render: () => (
    <ApiContext.Provider value={dummyApi}>
      <PatientProgramRegistrationSelectSurvey
        patientProgramRegistration={patientProgramRegistration}
      />
    </ApiContext.Provider>
  ),
};
