import React, { useCallback } from 'react';
import { useEncounter } from '../contexts/Encounter';
import { useSuggester } from '../api';
import { usePatientNavigation } from '../utils/usePatientNavigation';

import { Form, Field, AutocompleteField } from './Field';
import { ConfirmCancelRow } from './ButtonRow';
import { FormGrid } from './FormGrid';
import { Modal } from './Modal';

export const MoveModal = ({ open, onClose, encounter }) => {
  const { navigateToEncounter } = usePatientNavigation();
  const locationSuggester = useSuggester('location', {
    baseQueryParameters: { filterByFacility: true },
  });
  const { writeAndViewEncounter } = useEncounter();
  const movePatient = useCallback(
    async data => {
      await writeAndViewEncounter(encounter.id, data);
      navigateToEncounter(encounter.id);
      onClose();
    },
    [encounter, writeAndViewEncounter, onClose, navigateToEncounter],
  );

  return (
    <Modal title="Move patient" open={open} onClose={onClose}>
      <MoveForm
        onClose={onClose}
        onSubmit={movePatient}
        encounter={encounter}
        locationSuggester={locationSuggester}
      />
    </Modal>
  );
};

const MoveForm = ({ onSubmit, onClose, encounter, locationSuggester }) => {
  const renderForm = useCallback(
    ({ submitForm }) => (
      <FormGrid columns={1}>
        <Field
          name="locationId"
          component={AutocompleteField}
          suggester={locationSuggester}
          label="New location"
          required
        />
        <ConfirmCancelRow onConfirm={submitForm} onCancel={onClose} />
      </FormGrid>
    ),
    [locationSuggester, onClose],
  );

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      initialValues={{ locationId: encounter.location.id }}
    />
  );
};

// -------------------------------------------------------------------------------
// TODO: Reimplement "planned move" functionality on backend.
// Keeping the display components for that here so that they can be used later.
// They should just need the endpoints updated to match the new API, and to
// be re-added to EncounterView.js (PR 786)

// const BeginMoveForm = ({ onSubmit, onClose, encounter, locationSuggester }) => {
//   const renderForm = React.useCallback(({ submitForm }) => (
//     <FormGrid columns={1}>
//       <Field
//         name="plannedLocation.id"
//         component={AutocompleteField}
//         suggester={locationSuggester}
//         label="New location"
//         required
//       />
//       <ConfirmCancelRow onConfirm={submitForm} onCancel={onClose} />
//     </FormGrid>
//   ));

//   return (
//     <Form
//       onSubmit={onSubmit}
//       render={renderForm}
//       initialValues={{ plannedLocation: encounter.plannedLocation }}
//     />
//   );
// };
// const FinaliseMoveForm = ({ onSubmit, encounter, onClose }) => (
//   <FormGrid columns={1}>
//     <div>{`Are you sure you want to move ${encounter.patient[0].firstName} to ${encounter.plannedLocation.name}?`}</div>
//     <ConfirmCancelRow
//       onConfirm={() => onSubmit({ location: encounter.plannedLocation })}
//       onCancel={onClose}
//     />
//   </FormGrid>
// );

// const CancelMoveForm = ({ onSubmit, encounter, onClose }) => (
//   <FormGrid columns={1}>
//     <div>{`Are you sure you want to cancel ${encounter.patient[0].firstName}'s scheduled move to ${encounter.plannedLocation.name}?`}</div>
//     <ConfirmCancelRow
//       onConfirm={() => onSubmit({ plannedLocation: null })}
//       confirmText="Yes, cancel"
//       cancelText="Keep it"
//       onCancel={onClose}
//     />
//   </FormGrid>
// );

// const BaseMoveModal = connectApi((api, dispatch, { encounter, endpoint }) => ({
//   locationSuggester: new Suggester(api, 'location'), // If this gets uncommented, check if the location should be filtered by current facility (SEE EPI-87)
//   onSubmit: async data => {
//     await api.put(`encounter/${encounter.id}/${endpoint}`, data);
//     dispatch(viewEncounter(encounter.id));
//   },
// }))(({ title, open, onClose, Component, ...rest }) => (
//   <Modal title={title} open={open} onClose={onClose}>
//     <Component onClose={onClose} {...rest} />
//   </Modal>
// ));

// const BeginMoveModal = props => (
//   <BaseMoveModal
//     {...props}
//     Component={BeginMoveForm}
//     title="Move patient"
//     endpoint="plannedLocation"
//   />
// );

// const FinaliseMoveModal = props => (
//   <BaseMoveModal
//     {...props}
//     Component={FinaliseMoveForm}
//     title="Finalise move"
//     endpoint="location"
//   />
// );

// const CancelMoveModal = props => (
//   <BaseMoveModal
//     {...props}
//     Component={CancelMoveForm}
//     title="Cancel move"
//     endpoint="plannedLocation"
//   />
// );
