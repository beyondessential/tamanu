import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { usePatientMove } from '../../../api/mutations';
import { LargeBodyText, Modal } from '../../../components';
import { ModalActionRow } from '../../../components/ModalActionRow';

const Container = styled.div`
  margin: 70px 0 80px;
`;

export const CancelPatientMoveModal = React.memo(({ encounter, open, onClose }) => {
  const { mutate: submit } = usePatientMove(encounter.id, onClose);
  const onCancelMove = () => {
    submit({ plannedLocationId: null });
  };
  return (
    <Modal title="Cancel move" endpoint="plannedLocation" open={open} onClose={onClose}>
      <Container>
        <LargeBodyText>Are you sure you want to cancel the planned patient move?</LargeBodyText>
      </Container>
      <ModalActionRow confirmText="Confirm" onConfirm={onCancelMove} onCancel={onClose} />
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
