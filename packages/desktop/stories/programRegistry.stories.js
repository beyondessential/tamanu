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
import { ProgramRegistryView } from '../app/views/programRegistry/ProgramRegistryView';
import { RemoveProgramRegistryFormModal } from '../app/views/programRegistry/RemoveProgramRegistryFormModal';
import { PatientProgramRegistrationSelectSurvey } from '../app/views/programRegistry/PatientProgramRegistrationSelectSurvey';
import { ProgramRegistrySurveyView } from '../app/views/programRegistry/ProgramRegistrySurveyView';
import { dummyApi, patient, patientProgramRegistration } from './utils/mockProgramRegistryData';

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
          getEndpoint={`patient/${patient.id}/program-registry`}
          Form={ProgramRegistryForm}
          ListItemComponent={ProgramRegistryListItem}
          getName={programRegistry => programRegistry.name}
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
        programRegistryClinicalStatus: {
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
        programRegistryClinicalStatus: {
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

//#region PatientProgramRegistrationSelectSurvey
storiesOf('Program Registry', module).add('ProgramRegistrySurveyView', () => (
  <ApiContext.Provider value={dummyApi}>
    <ProgramRegistrySurveyView />
  </ApiContext.Provider>
));
//#endregion PatientProgramRegistrationSelectSurvey

//#region ProgramRegistryView
storiesOf('Program Registry', module).add('ProgramRegistryView', () => (
  <ApiContext.Provider value={dummyApi}>
    <ProgramRegistryView />
  </ApiContext.Provider>
));
//#endregion ProgramRegistryView
