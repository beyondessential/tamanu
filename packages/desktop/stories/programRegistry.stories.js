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
import { ProgramRegistryFormHistory } from '../app/views/programRegistry/ProgramRegistryFormHistory';
import { DisplayPatientRegDetails } from '../app/views/programRegistry/DisplayPatientRegDetails';
import { ProgramRegistryStatusHistory } from '../app/views/programRegistry/ProgramRegistryStatusHistory';
import { DeleteProgramRegistryFormModal } from '../app/views/programRegistry/DeleteProgramRegistryFormModal';
import { ActivateProgramRegistryFormModal } from '../app/views/programRegistry/ActivateProgramRegistryFormModal';
import { ProgramRegistryView } from '../app/views/programRegistry/ProgramRegistryView';
import { RemoveProgramRegistryFormModal } from '../app/views/programRegistry/RemoveProgramRegistryFormModal';
import {
  dummyApi,
  patient,
  patientProgramRegistration,
  programRegistry1,
} from './utils/mockProgramRegistryData';
import { ConditionSection } from '../app/views/programRegistry/ConditionSection';
import { AddConditionFormModal } from '../app/views/programRegistry/AddConditionFormModal';

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
      }}
    />
  </div>
));
//#endregion DisplayPatientRegDetails

//#region ConditionSection
storiesOf('Program Registry', module).add('Condition Section', () => (
  <ApiContext.Provider value={dummyApi}>
    <div style={{ width: '262px' }}>
      <ConditionSection patientProgramRegistryId={patientProgramRegistration.id} />
    </div>
  </ApiContext.Provider>
));

//#endregion ConditionSection

//#region AddConditionFormModal
storiesOf('Program Registry', module).add('Add Condition', () => (
  <ApiContext.Provider value={dummyApi}>
    <AddConditionFormModal
      programRegistry={patientProgramRegistration}
      onSubmit={action('submit')}
      onCancel={action('cancel')}
      open
    />
  </ApiContext.Provider>
));

//#endregion AddConditionFormModal

//#region ProgramRegistryStatusHistory

storiesOf('Program Registry', module).add('ProgramRegistryStatusHistory removed never', () => (
  <ApiContext.Provider value={dummyApi}>
    <ProgramRegistryStatusHistory
      programRegistry={{
        id: 'program_registry_id',
      }}
    />
  </ApiContext.Provider>
));

storiesOf('Program Registry', module).add('ProgramRegistryStatusHistory removed once', () => (
  <ApiContext.Provider value={dummyApi}>
    <ProgramRegistryStatusHistory
      programRegistry={{
        id: 'program_registry_id',
      }}
    />
  </ApiContext.Provider>
));

//#endregion ProgramRegistryStatusHistory

//#region ProgramRegistryFormHistory

storiesOf('Program Registry', module).add('ProgramRegistryFormHistory', () => (
  <ApiContext.Provider value={dummyApi}>
    <ProgramRegistryFormHistory programRegistry={programRegistry1.data} />
  </ApiContext.Provider>
));
//#endregion ProgramRegistryFormHistory

//#region ChangeStatusFormModal

storiesOf('Program Registry', module).add('ProgramRegistry Status Change', () => {
  return (
    <ApiContext.Provider value={dummyApi}>
      <ChangeStatusFormModal
        onSubmit={action('submit')}
        onCancel={action('cancel')}
        programRegistry={patientProgramRegistration}
        open
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

storiesOf('Program Registry', module).add('ActivateProgramRegistryFormModal', () => (
  <ApiContext.Provider value={dummyApi}>
    <ActivateProgramRegistryFormModal
      onSubmit={action('submit')}
      onCancel={action('cancel')}
      patient={patient}
      programRegistry={patientProgramRegistration}
      open
    />
  </ApiContext.Provider>
));
//#endregion

//#region RemoveProgramRegistryFormModal
storiesOf('Program Registry', module).add('RemoveProgramRegistryFormModal', () => (
  <ApiContext.Provider value={dummyApi}>
    <RemoveProgramRegistryFormModal
      programRegistry={patientProgramRegistration}
      onSubmit={action('submit')}
      onCancel={action('cancel')}
      open
    />
  </ApiContext.Provider>
));
//#endregion RemoveProgramRegistryFormModal

//#region ProgramRegistryView
storiesOf('Program Registry', module).add('ProgramRegistryView', () => (
  <ApiContext.Provider value={dummyApi}>
    <ProgramRegistryView />
  </ApiContext.Provider>
));
//#endregion ProgramRegistryView
