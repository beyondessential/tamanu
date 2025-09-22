import React from 'react';
import { action } from '@storybook/addon-actions';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { ApiContext, Modal } from '@tamanu/ui-components';
import { PatientProgramRegistryUpdateModal } from '../app/features/ProgramRegistry/PatientProgramRegistryUpdateModal.jsx';
import { InfoPaneList } from '../app/components/PatientInfoPane/InfoPaneList';
import { PatientProgramRegistryForm } from '../app/views/programRegistry/PatientProgramRegistryForm';
import { ProgramRegistryListItem } from '../app/views/programRegistry/ProgramRegistryListItem';
import { PatientProgramRegistryFormHistory } from '../app/views/programRegistry/PatientProgramRegistryFormHistory';
import { DisplayPatientRegDetails } from '../app/views/programRegistry/DisplayPatientRegDetails';
import { ProgramRegistryStatusHistory } from '../app/views/programRegistry/ProgramRegistryStatusHistory';
import { PatientProgramRegistryView } from '../app/views/programRegistry/PatientProgramRegistryView';
import { RemoveProgramRegistryFormModal } from '../app/views/programRegistry/RemoveProgramRegistryFormModal';
import { dummyApi, patient, patientProgramRegistration } from './utils/mockProgramRegistryData';
import { ConditionSection } from '../app/views/programRegistry/ConditionSection';
import {
  PatientProgramRegistryActivateModal,
  DeleteProgramRegistryFormModal,
  UpdateConditionFormModal,
} from '../app/features/ProgramRegistry';
import { PatientProgramRegistrationSelectSurvey } from '../app/views/programRegistry/PatientProgramRegistrationSelectSurvey';
import { ProgramRegistrySurveyView } from '../app/views/programRegistry/ProgramRegistrySurveyView';
import { ProgramRegistryView } from '../app/views/programRegistry/ProgramRegistryView';
import { MockSettingsProvider } from './utils/mockSettingsProvider';
import {
  PANE_SECTION_TITLES,
  PANE_SECTION_IDS,
} from '../app/components/PatientInfoPane/paneSections';

const StoryProviders = ({ children }) => {
  return (
    <ApiContext.Provider value={dummyApi}>
      <MockSettingsProvider mockSettings={{}}>{children}</MockSettingsProvider>
    </ApiContext.Provider>
  );
};

export default {
  title: 'Program Registry',
  decorators: [
    Story => (
      <StoryProviders>
        <Story />
      </StoryProviders>
    ),
  ],
};

export const ProgramRegistry = {
  name: 'Program Registry',
  render: () => (
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
  ),
};

export const PatientProgramRegistryFormStory = {
  name: 'Patient Program Registry Form',
  render: () => (
    <Modal width="md" title="Add program registry" open>
      <PatientProgramRegistryForm
        onSubmit={() => {
          action('submit');
        }}
        onCancel={action('cancel')}
        patient={patient}
      />
    </Modal>
  ),
};

export const DisplayPatientRegDetailsLowRiskStory = {
  name: 'Display Patient Reg Details Low risk',
  render: () => (
    <div style={{ width: '797px' }}>
      <DisplayPatientRegDetails patientProgramRegistration={patientProgramRegistration} />
    </div>
  ),
};

export const DisplayPatientRegDetailsCriticalStory = {
  name: 'Display Patient Reg Details Critical',
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

export const DisplayPatientRegDetailsNeedsReviewStory = {
  name: 'Display Patient Reg Details Needs review',
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
  name: 'Condition Section',
  render: () => (
    <div style={{ width: '262px' }}>
      <ConditionSection patientProgramRegistration={patientProgramRegistration} />
    </div>
  ),
};

export const UpdateConditionStory = {
  name: 'Update Condition',
  render: () => (
    <UpdateConditionFormModal
      patientProgramRegistration={patientProgramRegistration}
      onClose={action('cancel')}
      open
    />
  ),
};

export const ProgramRegistryStatusHistoryNeverStory = {
  name: 'Program Registry Status History removed never',
  render: () => (
    <ProgramRegistryStatusHistory patientProgramRegistration={patientProgramRegistration} />
  ),
};

export const ProgramRegistryStatusHistoryOnceStory = {
  name: 'Program Registry Status History removed once',
  render: () => (
    <ProgramRegistryStatusHistory patientProgramRegistration={patientProgramRegistration} />
  ),
};

export const PatientProgramRegistryFormHistoryStory = {
  name: 'Patient Program Registry Form History',
  render: () => (
    <PatientProgramRegistryFormHistory patientProgramRegistration={patientProgramRegistration} />
  ),
};

export const ProgramRegistryStatusChangeStory = {
  name: 'Patient Program Registry Update Form Modal',
  render: () => (
    <PatientProgramRegistryUpdateModal
      patientProgramRegistration={patientProgramRegistration}
      onSubmit={action('submit')}
      onCancel={action('cancel')}
      open
    />
  ),
};

export const ProgramRegistryDeleteModalStory = {
  name: 'Program Registry Delete Modal',
  render: () => (
    <DeleteProgramRegistryFormModal
      open
      programRegistry={{ name: 'Hepatitis B' }}
      onSubmit={action('submit')}
      onCancel={action('cancel')}
    />
  ),
};

export const ActivatePatientProgramRegistryStory = {
  name: 'Activate Patient Program Registry',
  render: () => (
    <PatientProgramRegistryActivateModal
      onSubmit={action('submit')}
      onCancel={action('cancel')}
      patientProgramRegistration={patientProgramRegistration}
      open
    />
  ),
};

export const RemoveProgramRegistryFormModalStory = {
  name: 'Remove Program Registry Form Modal',
  render: () => (
    <RemoveProgramRegistryFormModal
      patientProgramRegistration={patientProgramRegistration}
      onSubmit={action('submit')}
      onCancel={action('cancel')}
      open
    />
  ),
};

export const PatientProgramRegistrationSelectSurveyStory = {
  name: 'PatientProgram Registration Select Survey',
  render: () => (
    <PatientProgramRegistrationSelectSurvey
      patientProgramRegistration={patientProgramRegistration}
    />
  ),
};

export const ProgramRegistrySurveyViewStory = {
  name: 'Program Registry Survey View',
  render: () => <ProgramRegistrySurveyView />,
};

export const PatientProgramRegistryViewStory = {
  name: 'Patient Program Registry View',
  render: () => <PatientProgramRegistryView />,
};

export const ProgramRegistryViewStory = {
  name: 'Program Registry View',
  render: () => <ProgramRegistryView />,
};
