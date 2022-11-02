import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import SingleBedIcon from '@material-ui/icons/SingleBed';
import { BodyText, Modal } from '../../../components';
import { ModalActionRow } from '../../../components/ModalActionRow';
import { usePatientMove } from '../../../api/mutations';
import { Colors } from '../../../constants';

const Text = styled(BodyText)`
  color: ${props => props.theme.palette.text.secondary};
  margin-top: 10px;
  margin-bottom: 40px;
`;

const Container = styled.div`
  margin: 30px auto 50px 15%;
  display: flex;
`;

const BedIcon = styled(SingleBedIcon)`
  color: ${Colors.softText};
  font-size: 50px;

  &.MuiSvgIcon-colorPrimary {
    color: ${props => props.theme.palette.primary.main};
  }
`;

const Dot = styled.div`
  display: inline-block;
  height: 5px;
  width: 5px;
  margin: 10px 0;
  background: ${Colors.darkText};
  border-radius: 50%;
`;

const Card = styled.div`
  padding: 20px 35px 20px 30px;
  border-radius: 5px;
  border: 1px solid ${Colors.outline};

  &.active {
    border: 1px solid white;
    background: white;
    box-shadow: 2px 2px 25px rgba(0, 0, 0, 0.1);
  }
`;

export const FinalisePatientMoveModal = React.memo(({ encounter, open, onClose }) => {
  const { mutate: submit } = usePatientMove(encounter.id, onClose);
  return (
    <Modal title="Finalise patient move" open={open} onClose={onClose}>
      <Text>Please confirm the location details below to finalise the patient move.</Text>
      <Container>
        <Box display="flex" flexDirection="column" alignItems="center" py={1}>
          <BedIcon />
          <Dot />
          <Dot />
          <Dot />
          <BedIcon color="primary" />
        </Box>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="space-between"
          ml={2}
        >
          <Card>Current location: ED Bed 1</Card>
          <Card className="active">Current location: ED Bed 2</Card>
        </Box>
      </Container>
      <ModalActionRow confirmText="Confirm" onConfirm={submit} onCancel={onClose} />
    </Modal>
  );
});
