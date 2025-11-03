import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { usePatientMove } from '../../../api/mutations';
import { LargeBodyText } from '../../../components';
import { ModalActionRow } from '../../../components/ModalActionRow';
import { Modal, TranslatedText } from '@tamanu/ui-components';

const Container = styled.div`
  margin: 70px 30px 80px;
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
          stringId="encounter.action.cancelPatientMove"
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
            stringId="patient.modal.cancelMove.confirm"
            fallback="Cancel location move"
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
