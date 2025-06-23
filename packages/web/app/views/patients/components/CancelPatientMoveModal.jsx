import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { usePatientMove } from '../../../api/mutations';
import { LargeBodyText, Modal } from '../../../components';
import { ModalActionRow } from '../../../components/ModalActionRow';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

const Container = styled.div`
  margin: 70px 0 80px;
`;

export const CancelPatientMoveModal = React.memo(({ encounter, open, onClose }) => {
  const { mutate: submit } = usePatientMove(encounter.id, onClose);
  const onCancelMove = () => {
    submit({ plannedLocationId: null });
  };
  return (
    <Modal
      title={
        <TranslatedText
          stringId="patient.modal.cancelMove.title"
          fallback="Cancel move"
          data-testid="translatedtext-cancel-move-title"
        />
      }
      endpoint="plannedLocation"
      open={open}
      onClose={onClose}
      data-testid="modal-0l0v"
    >
      <Container data-testid="container-vady">
        <LargeBodyText data-testid="largebodytext-jtqa">
          <TranslatedText
            stringId="patient.modal.cancelMove.confirmation"
            fallback="Are you sure you want to cancel the planned patient move?"
            data-testid="translatedtext-cancel-move-confirmation"
          />
        </LargeBodyText>
      </Container>
      <ModalActionRow
        confirmText={
          <TranslatedText
            stringId="general.action.confirm"
            fallback="Confirm"
            data-testid="translatedtext-confirm-action"
          />
        }
        onConfirm={onCancelMove}
        onCancel={onClose}
        data-testid="modalactionrow-aga7"
      />
    </Modal>
  );
});

CancelPatientMoveModal.propTypes = {
  encounter: PropTypes.shape({
    id: PropTypes.string,
  }).isRequired,
  open: PropTypes.bool,
  onClose: PropTypes.func,
};

CancelPatientMoveModal.defaultProps = {
  open: false,
  onClose: null,
};
