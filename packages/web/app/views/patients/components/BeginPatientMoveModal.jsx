import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { usePatientMove } from '../../../api/mutations';
import {
  BodyText,
  Field,
  Form,
  FormModal,
  LocalisedLocationField,
  LocationAvailabilityWarningMessage,
  RadioField,
} from '../../../components';
import { ModalActionRow } from '../../../components/ModalActionRow';
import { FORM_TYPES } from '../../../constants';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { useSettings } from '../../../contexts/Settings';

const patientMoveActionOptions = [
  { label: 'Plan', value: 'plan' },
  { label: 'Finalise', value: 'finalise' },
];

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-row-gap: 35px;
  margin: 20px auto 20px;
  grid-column-gap: 30px;
`;

const Text = styled(BodyText)`
  color: ${props => props.theme.palette.text.secondary};
  padding-bottom: 20px;
`;

export const BeginPatientMoveModal = React.memo(({ onClose, open, encounter }) => {
  const { mutateAsync: submit } = usePatientMove(encounter.id, onClose);

  const { getSetting } = useSettings()
  const plannedMoveTimeoutHours = getSetting('templates.plannedMoveTimeoutHours');
  const onSubmit = data => {
    if (data.action === 'plan') {
      return submit(data);
    }
    // If we're finalising the move, we just directly update the locationId
    const { plannedLocationId: locationId, ...rest } = data;
    return submit({ locationId, ...rest });
  };
  return (
    <FormModal
      title="Move patient"
      open={open}
      onClose={onClose}
      data-testid='formmodal-z0n0'>
      <Form
        initialValues={{ plannedLocationId: encounter.plannedLocationId, action: 'plan' }}
        onSubmit={onSubmit}
        validationSchema={yup.object().shape({
          plannedLocationId: yup
            .string()
            .required()
            .translatedLabel(
              <TranslatedText
                stringId="encounter.modal.patientMove.validation.plannedLocation.path"
                fallback="Planned location"
                data-testid='translatedtext-6bop' />,
            ),
        })}
        formType={FORM_TYPES.EDIT_FORM}
        render={({ submitForm, values }) => {
          return (
            <>
              <Container data-testid='container-otqu'>
                <Field
                  name="plannedLocationId"
                  component={LocalisedLocationField}
                  required
                  data-testid='field-n625' />
                <LocationAvailabilityWarningMessage
                  locationId={values?.plannedLocationId}
                  style={{ gridColumn: '2', marginTop: '-35px', fontSize: '12px' }}
                  data-testid='locationavailabilitywarningmessage-6ivs' />
                <Field
                  name="action"
                  label={
                    <TranslatedText
                      stringId="encounter.modal.patientMove.action.label"
                      fallback="Would you like to plan or finalise the patient move?"
                      data-testid='translatedtext-l7v1' />
                  }
                  component={RadioField}
                  options={patientMoveActionOptions}
                  style={{ gridColumn: '1/-1' }}
                  data-testid='field-ryle' />
              </Container>
              <Text data-testid='text-5y59'>
                By selecting ‘Plan’ the new location will not be reflected in the patient encounter
                until you finalise the move. If the move is not finalised within{' '}
                {plannedMoveTimeoutHours} hours, the location will be deemed ‘Available’ again.
              </Text>
              <ModalActionRow
                confirmText="Confirm"
                onConfirm={submitForm}
                onCancel={onClose}
                data-testid='modalactionrow-t42b' />
            </>
          );
        }}
        data-testid='form-0n4f' />
    </FormModal>
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
