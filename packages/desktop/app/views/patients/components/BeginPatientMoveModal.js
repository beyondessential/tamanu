import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { Colors } from '../../../constants';
import { usePatientMove } from '../../../api/mutations';
import { useSuggester } from '../../../api';
import { BodyText, AutocompleteField, Field, Form, FormGrid, Modal } from '../../../components';
import { ModalActionRow } from '../../../components/ModalActionRow';

const Text = styled(BodyText)`
  color: ${props => props.theme.palette.text.secondary};
  margin-bottom: 30px;
`;

export const BeginPatientMoveModal = React.memo(({ onClose, open, encounter }) => {
  const { mutate: submit } = usePatientMove(encounter.id, onClose);

  const locationSuggester = useSuggester('location', {
    baseQueryParameters: { filterByFacility: true },
  });

  return (
    <Modal title="Plan patient move" open={open} onClose={onClose}>
      <Text>
        Select a location to plan the patient move and reserve a bed. The new location will not be
        reflected in the patient encounter until you finalise the move.
        <br />
        <br />
        If the move is not finalised within 24 hours, the location will be deemed ‘Available’ again.
      </Text>
      <Form
        initialValues={{ plannedLocation: encounter.plannedLocationId }}
        onSubmit={submit}
        validationSchema={yup.object().shape({
          plannedLocationId: yup.string().required('Please select a planned location'),
        })}
        render={({ submitForm }) => (
          <FormGrid columns={1}>
            <Field
              name="plannedLocationId"
              component={AutocompleteField}
              suggester={locationSuggester}
              label="New location"
              required
            />
            <Text>
              <span style={{ color: Colors.alert }}>*</span> This location has already been reserved
              for another patient. Please ensure the bed is available before confirming.
            </Text>
            <ModalActionRow confirmText="Confirm" onConfirm={submitForm} onCancel={onClose} />
          </FormGrid>
        )}
      />
    </Modal>
  );
});

BeginPatientMoveModal.propTypes = {
  encounter: PropTypes.shape({
    id: PropTypes.string,
  }).isRequired,
  open: PropTypes.bool,
  onClose: PropTypes.func,
};

BeginPatientMoveModal.defaultProps = {
  open: false,
  onClose: null,
};
