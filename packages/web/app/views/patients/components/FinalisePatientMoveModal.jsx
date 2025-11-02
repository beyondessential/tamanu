import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { BedIcon } from '../../../assets/icons/BedIcon';
import { Modal, TAMANU_COLORS, TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { BodyText } from '../../../components';
import { ModalActionRow } from '../../../components/ModalActionRow';
import { usePatientMove } from '../../../api/mutations';
import { getFullLocationName } from '../../../utils/location';

const Text = styled(BodyText)`
  margin-top: 10px;
  margin-bottom: 40px;
`;

const Container = styled.div`
  display: flex;
  margin: 40px auto 60px;
  justify-content: center;
`;

const Dots = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-left: 12px;
`;

const Dot = styled.div`
  display: inline-block;
  height: 5px;
  width: 5px;
  margin: 10px 0;
  background: ${({ theme }) => theme.palette.primary.main};
  border-radius: 50%;
  opacity: ${props => props.opacity || 1};
`;

const Card = styled.div`
  padding: 20px 35px 20px 30px;
  border: 1px solid ${Colors.outline};
  font-size: 14px;
  line-height: 21px;
  background: white;
  width: 100%;
  margin-left: 20px;
  border-radius: 3px;
  color: ${({ theme }) => theme.palette.text.primary};

  span {
    font-weight: 500;
  }

  &.active {
    border: 1px solid ${({ theme }) => theme.palette.primary.main};
  }
`;

const Location = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

export const FinalisePatientMoveModal = React.memo(({ encounter, open, onClose }) => {
  const { mutate: submit } = usePatientMove(encounter.id, onClose);
  const { location, plannedLocation } = encounter;
  const onConfirmMove = () => {
    submit({ locationId: plannedLocation.id });
  };

  return (
    <Modal
      title={
        <TranslatedText
          stringId="patient.modal.finaliseMove.title"
          fallback="Finalise patient move"
          data-testid="translatedtext-patient-modal-move-finalise-title"
        />
      }
      open={open}
      onClose={onClose}
      data-testid="modal-v19s"
    >
      <Text data-testid="text-oexz">
        <TranslatedText
          stringId="patient.modal.finaliseMove.confirmation"
          fallback="Please confirm the location details below to finalise the patient move."
          data-testid="translatedtext-patient-modal-move-finalise-confirmation"
        />
      </Text>
      <Container data-testid="container-c12u">
        <Box
          display="flex"
          flexDirection="column"
          alignItems="stretch"
          justifyContent="space-between"
          ml={2}
          data-testid="box-476j"
        >
          <Location>
            <BedIcon size={34} color={TAMANU_COLORS.softText} data-testid="bedicon-5mw8" />
            <Card data-testid="card-enqf">
              <TranslatedText
                stringId="patient.modal.finaliseMove.currentLocation"
                fallback="Current location:"
                data-testid="translatedtext-patient-modal-move-finalise-current-location"
              />{' '}
              <span>{getFullLocationName(location)}</span>
            </Card>
          </Location>
          <Dots data-testid="box-dots">
            <Dot opacity={0.33} data-testid="dot-1" />
            <Dot opacity={0.67} data-testid="dot-2" />
            <Dot opacity={1} data-testid="dot-3" />
          </Dots>
          <Location>
            <BedIcon size={34} color={TAMANU_COLORS.primary} data-testid="bedicon-xy5f" />
            <Card className="active" data-testid="card-rmih">
              <TranslatedText
                stringId="patient.modal.finaliseMove.newLocation"
                fallback="New location:"
                data-testid="translatedtext-patient-modal-move-finalise-new-location"
              />{' '}
              <span>{getFullLocationName(plannedLocation)}</span>
            </Card>
          </Location>
        </Box>
      </Container>
      <ModalActionRow
        confirmText={
          <TranslatedText
            stringId="patient.modal.finaliseMove.confirm"
            fallback="Finalise location move"
            data-testid="translatedtext-confirm-action"
          />
        }
        onConfirm={onConfirmMove}
        onCancel={onClose}
        data-testid="modalactionrow-1fvh"
      />
    </Modal>
  );
});

FinalisePatientMoveModal.propTypes = {
  encounter: PropTypes.shape({
    location: PropTypes.object,
    plannedLocation: PropTypes.object,
  }).isRequired,
  open: PropTypes.bool,
  onClose: PropTypes.func,
};

FinalisePatientMoveModal.defaultProps = {
  open: false,
  onClose: null,
};
