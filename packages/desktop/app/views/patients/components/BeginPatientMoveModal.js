import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { LOCATION_AVAILABILITY_STATUS } from 'shared/constants';
import { Colors } from '../../../constants';
import { usePatientMove } from '../../../api/mutations';
import { useLocationAvailabilitySuggester } from '../../../api';
import { BodyText, AutocompleteField, Field, Form, Modal } from '../../../components';
import { ModalActionRow } from '../../../components/ModalActionRow';
import { useLocalisation } from '../../../contexts/Localisation';

const Container = styled.div`
  padding-bottom: 50px;

  .react-autosuggest__container {
    max-width: 320px;
    margin: 30px auto 40px;
  }
`;

const Text = styled(BodyText)`
  color: ${props => props.theme.palette.text.secondary};
`;

export const BeginPatientMoveModal = React.memo(({ onClose, open, encounter }) => {
  const { mutateAsync: submit } = usePatientMove(encounter.id, onClose);
  const locationSuggester = useLocationAvailabilitySuggester();

  const { getLocalisation } = useLocalisation();
  const plannedMoveTimeoutHours = getLocalisation('templates.plannedMoveTimeoutHours');
  return (
    <Modal title="Plan patient move" open={open} onClose={onClose}>
      <Text>
        Select a location to plan the patient move and reserve a bed. The new location will not be
        reflected in the patient encounter until you finalise the move.
        <br />
        <br />
        If the move is not finalised within {plannedMoveTimeoutHours} hours, the location will be
        deemed ‘Available’ again.
      </Text>
      <Form
        initialValues={{ plannedLocationId: encounter.plannedLocationId }}
        onSubmit={submit}
        validationSchema={yup.object().shape({
          plannedLocationId: yup.string().required('Please select a planned location'),
        })}
        render={({ submitForm }) => {
          return (
            <>
              <Container>
                <Field
                  name="plannedLocationId"
                  component={AutocompleteField}
                  suggester={locationSuggester}
                  label="New location"
                  renderMessage={({ tag }) => {
                    // Todo: Move this message handling to the location component @see WAITM-536
                    const status = tag?.label?.toUpperCase();

                    if (status === LOCATION_AVAILABILITY_STATUS.RESERVED) {
                      return (
                        <Text>
                          <span style={{ color: Colors.alert }}>*</span> This location has already
                          been reserved for another patient. Please ensure the bed is available
                          before confirming.
                        </Text>
                      );
                    }

                    if (status === LOCATION_AVAILABILITY_STATUS.OCCUPIED) {
                      return (
                        <Text>
                          <span style={{ color: Colors.alert }}>*</span> This location is already
                          occupied by another patient. Please ensure the bed is available before
                          confirming.
                        </Text>
                      );
                    }

                    return null;
                  }}
                  required
                />
              </Container>
              <ModalActionRow confirmText="Confirm" onConfirm={submitForm} onCancel={onClose} />
            </>
          );
        }}
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
