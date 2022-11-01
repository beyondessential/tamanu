import React from 'react';
import { useApi, useSuggester } from '../../../api';
import { usePatientNavigation } from '../../../utils/usePatientNavigation';
import {
  AutocompleteField,
  ConfirmCancelRow,
  Field,
  Form,
  FormGrid,
  Modal,
} from '../../../components';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { ModalActionRow } from '../../../components/ModalActionRow';

const Text = styled(Typography)`
  font-size: 14px;
  line-height: 18px;
  color: ${props => props.theme.palette.text.secondary};
  margin-bottom: 30px;
`;
export const BeginPatientMoveModal = ({ onClose, open, encounter }) => {
  const api = useApi();
  const { navigateToEncounter } = usePatientNavigation();

  const locationSuggester = useSuggester('location', {
    baseQueryParameters: { filterByFacility: true },
  });

  const onSubmit = async data => {
    await api.put(`encounter/${encounter.id}/plannedLocation`, data);
    navigateToEncounter(encounter.id);
    onClose();
  };

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
        initialValues={{ plannedLocation: encounter.plannedLocation }}
        onSubmit={onSubmit}
        render={({ submitForm }) => (
          <FormGrid columns={1}>
            <Field
              name="plannedLocation.id"
              component={AutocompleteField}
              suggester={locationSuggester}
              label="New location"
              required
            />
            <Text>
              *This location has already been reserved for another patient. Please ensure the bed is
              available before confirming.
            </Text>
            <ModalActionRow confirmText="Confirm" onConfirm={submitForm} onCancel={onClose} />
          </FormGrid>
        )}
      />
    </Modal>
  );
};
