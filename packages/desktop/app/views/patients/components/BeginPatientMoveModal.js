import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { usePatientMove } from '../../../api/mutations';
import {
  BodyText,
  Field,
  Form,
  Modal,
  LocalisedLocationField,
  LocationAvailabilityWarningMessage,
  RadioField,
} from '../../../components';
import { ModalActionRow } from '../../../components/ModalActionRow';
import { useLocalisation } from '../../../contexts/Localisation';

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-row-gap: 20px;
  margin: 30px auto 20px;
  grid-column-gap: 30px;
`;

const Text = styled(BodyText)`
  color: ${props => props.theme.palette.text.secondary};
`;

export const BeginPatientMoveModal = React.memo(({ onClose, open, encounter }) => {
  const { mutateAsync: submit } = usePatientMove(encounter.id, onClose);

  const { getLocalisation } = useLocalisation();
  const plannedMoveTimeoutHours = getLocalisation('templates.plannedMoveTimeoutHours');
  return (
    <Modal title="Move patient" open={open} onClose={onClose}>
      <Form
        initialValues={{ plannedLocationId: encounter.plannedLocationId }}
        onSubmit={submit}
        validationSchema={yup.object().shape({
          plannedLocationId: yup.string().required('Please select a planned location'),
        })}
        render={({ submitForm, values }) => {
          return (
            <>
              <Container>
                <Field name="plannedLocationId" component={LocalisedLocationField} required />
                <LocationAvailabilityWarningMessage locationId={values?.plannedLocationId} />
                <Field
                  name="action"
                  label="Would you like to finalise or plan the patient move?"
                  component={RadioField}
                  options={[
                    { label: 'Finalise', value: 0 },
                    { label: 'Plan', value: 1 },
                  ]}
                  style={{ gridColumn: '1/-1' }}
                />
                <Text fullWidth>
                  By selecting ‘Plan’ the new location will not be reflected in the patient
                  encounter until you finalise the move. If the move is not finalised within{' '}
                  {plannedMoveTimeoutHours} hours, the location will be deemed ‘Available’ again.
                </Text>
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
