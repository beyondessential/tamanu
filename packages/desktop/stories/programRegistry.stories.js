// @ts-check

import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { ChangeStatusFormModal } from '../app/views/programRegistry/ChangeStatusFormModal';
import { ApiContext } from '../app/api';
import { Modal } from '../app/components/Modal';
import { PROGRAM_REGISTRY } from '../app/components/PatientInfoPane/paneTitles';
import { InfoPaneList } from '../app/components/PatientInfoPane/InfoPaneList';
import { ProgramRegistryForm } from '../app/views/programRegistry/ProgramRegistryForm';
import { ProgramRegistryListItem } from '../app/views/programRegistry/ProgramRegistryListItem';
import { PatientProgramRegistryFormHistory } from '../app/views/programRegistry/PatientProgramRegistryFormHistory';
import { DisplayPatientRegDetails } from '../app/views/programRegistry/DisplayPatientRegDetails';
import { ProgramRegistryStatusHistory } from '../app/views/programRegistry/ProgramRegistryStatusHistory';
import { DeleteProgramRegistryFormModal } from '../app/views/programRegistry/DeleteProgramRegistryFormModal';
import { ActivatePatientProgramRegistry } from '../app/views/programRegistry/ActivatePatientProgramRegistry';
import { PatientProgramRegistryView } from '../app/views/programRegistry/PatientProgramRegistryView';
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
import { ProgramRegistrySurveyView } from '../app/views/programRegistry/ProgramRegistrySurveyView';

//#region InfoPaneList
storiesOf('Program Registry', module).add('ProgramRegistry Info Panlist', () => {
  return (
    <ApiContext.Provider value={dummyApi}>
      <div style={{ width: '250px', backgroundColor: 'white', padding: '10px' }}>
        <InfoPaneList
          patient={patient}
          readonly={false}
          title={PROGRAM_REGISTRY}
          endpoint="programRegistry"
          getEndpoint={`patient/${patient.id}/patientRegistration`}
          Form={ProgramRegistryForm}
          ListItemComponent={ProgramRegistryListItem}
          behavior="modal"
          itemTitle="Add program registry"
          getEditFormName={programRegistry => `Program registry: ${programRegistry.name}`}
          CustomEditForm={undefined}
        />
      </div>
    </ApiContext.Provider>
  );
});
//#endregion InfoPaneList

//#region ProgramRegistryForm

storiesOf('Program Registry', module).add('ProgramRegistryFrom', () => (
  // <MockedApi endpoints={mockProgramRegistrytFormEndpoints}>
  //     </MockedApi>
  <ApiContext.Provider value={dummyApi}>
    <Modal width="md" title="Add program registry" open>
      <ProgramRegistryForm
        onSubmit={action('submit')}
        onCancel={action('cancel')}
        patient={patient}
      />
    </Modal>
  </ApiContext.Provider>
));

//#endregion ProgramRegistryForm

//#region DisplayPatientRegDetails
storiesOf('Program Registry', module).add('DisplayPatientRegDetails Low risk', () => (
  <div style={{ width: '797px' }}>
    <DisplayPatientRegDetails patientProgramRegistration={patientProgramRegistration} />
  </div>
));

storiesOf('Program Registry', module).add('DisplayPatientRegDetails Critical', () => (
  <div style={{ width: '797px' }}>
    <DisplayPatientRegDetails
      patientProgramRegistration={{
        ...patientProgramRegistration,
        registrationStatus: 'removed',
        clinicalStatus: {
          id: '1',
          code: 'critical',
          name: 'Critical',
          color: 'red',
        },
      }}
    />
  </div>
));

storiesOf('Program Registry', module).add('DisplayPatientRegDetails Needs review', () => (
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
));
//#endregion DisplayPatientRegDetails

//#region ConditionSection
storiesOf('Program Registry', module).add('Condition Section', () => (
  <ApiContext.Provider value={dummyApi}>
    <div style={{ width: '262px' }}>
      <ConditionSection patientProgramRegistration={patientProgramRegistration} />
    </div>
  </ApiContext.Provider>
));

//#endregion ConditionSection

//#region AddConditionFormModal
storiesOf('Program Registry', module).add('Add Condition', () => (
  <ApiContext.Provider value={dummyApi}>
    <AddConditionFormModal
      patientProgramRegistration={patientProgramRegistration}
      onSubmit={action('submit')}
      onCancel={action('cancel')}
      open
    />
  </ApiContext.Provider>
));

//#endregion AddConditionFormModal

//#region RemoveConditionFormModal
storiesOf('Program Registry', module).add('Remove Condition', () => (
  <ApiContext.Provider value={dummyApi}>
    <RemoveConditionFormModal
      condition={programRegistryConditions[0]}
      onSubmit={action('submit')}
      onCancel={action('cancel')}
      open
    />
  </ApiContext.Provider>
));

//#endregion RemoveConditionFormModal

//#region ProgramRegistryStatusHistory

storiesOf('Program Registry', module).add('ProgramRegistryStatusHistory removed never', () => (
  <ApiContext.Provider value={dummyApi}>
    <ProgramRegistryStatusHistory patientProgramRegistration={patientProgramRegistration} />
  </ApiContext.Provider>
));

storiesOf('Program Registry', module).add('ProgramRegistryStatusHistory removed once', () => (
  <ApiContext.Provider value={dummyApi}>
    <ProgramRegistryStatusHistory patientProgramRegistration={patientProgramRegistration} />
  </ApiContext.Provider>
));

//#endregion ProgramRegistryStatusHistory

//#region PatientProgramRegistryFormHistory

storiesOf('Program Registry', module).add('PatientProgramRegistryFormHistory', () => (
  <ApiContext.Provider value={dummyApi}>
    <PatientProgramRegistryFormHistory patientProgramRegistration={patientProgramRegistration} />
  </ApiContext.Provider>
));
//#endregion PatientProgramRegistryFormHistory

//#region ChangeStatusFormModal

storiesOf('Program Registry', module).add('ProgramRegistry Status Change', () => {
  return (
    <ApiContext.Provider value={dummyApi}>
      <ChangeStatusFormModal
        // onSubmit={action('submit')}
        // onCancel={action('cancel')}
        patientProgramRegistration={patientProgramRegistration}
        // open
      />
    </ApiContext.Provider>
  );
});

//#endregion ChangeStatusFormModal

//#region DeleteProgramRegistryFormModal
storiesOf('Program Registry', module).add('ProgramRegistry Delete Modal', () => {
  return (
    <DeleteProgramRegistryFormModal
      open
      programRegistry={{ name: 'Hepatitis B' }}
      onSubmit={action('submit')}
      onCancel={action('cancel')}
    />
  );
});
//#endregion DeleteProgramRegistryFormModal

//#region

storiesOf('Program Registry', module).add('ActivatePatientProgramRegistry', () => (
  <ApiContext.Provider value={dummyApi}>
    <ActivatePatientProgramRegistry
      onSubmit={action('submit')}
      onCancel={action('cancel')}
      patientProgramRegistration={patientProgramRegistration}
      open
    />
  </ApiContext.Provider>
));
//#endregion

//#region RemoveProgramRegistryFormModal
storiesOf('Program Registry', module).add('RemoveProgramRegistryFormModal', () => (
  <ApiContext.Provider value={dummyApi}>
    <RemoveProgramRegistryFormModal
      patientProgramRegistration={patientProgramRegistration}
      onSubmit={action('submit')}
      onCancel={action('cancel')}
      open
    />
  </ApiContext.Provider>
));
//#endregion RemoveProgramRegistryFormModal

//#region PatientProgramRegistrationSelectSurvey
storiesOf('Program Registry', module).add('PatientProgramRegistrationSelectSurvey', () => (
  <ApiContext.Provider value={dummyApi}>
    <PatientProgramRegistrationSelectSurvey
      patientProgramRegistration={patientProgramRegistration}
      // patient={patient}
    />
  </ApiContext.Provider>
));
//#endregion PatientProgramRegistrationSelectSurvey

//#region ProgramRegistrySurveyView
storiesOf('Program Registry', module).add('ProgramRegistrySurveyView', () => (
  <ApiContext.Provider value={dummyApi}>
    <ProgramRegistrySurveyView />
  </ApiContext.Provider>
));
//#endregion ProgramRegistrySurveyView

//#region PatientProgramRegistryView
storiesOf('Program Registry', module).add('PatientProgramRegistryView', () => (
  <ApiContext.Provider value={dummyApi}>
    <PatientProgramRegistryView />
  </ApiContext.Provider>
));
//#endregion PatientProgramRegistryView
