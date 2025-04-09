import React from 'react';
import styled from 'styled-components';
import Avatar from '@material-ui/core/Avatar';
import { Colors, ENCOUNTER_OPTIONS } from '../constants';
import { Button } from './Button';
import { Modal } from './Modal';
import { TranslatedText } from './Translation/TranslatedText';

const SelectorGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: 0.7rem;
`;

const TypeImage = styled(Avatar)`
  margin-bottom: 10px;
`;

const EncounterOptionTypeButton = styled(Button)`
  background: ${Colors.white};
  display: grid;
  justify-content: center;
  text-align: -webkit-center;
  height: 9rem;

  span {
    justify-items: center;
  }
`;

const EncounterOptionButton = ({ label, image, onClick }) => (
  <EncounterOptionTypeButton
    variant="contained"
    color="default"
    onClick={onClick}
    data-testid='encounteroptiontypebutton-haqi'>
    <TypeImage alt={label} src={image} data-testid='typeimage-c71v' />
    {label}
  </EncounterOptionTypeButton>
);

export const SelectEncounterTypeModal = React.memo(({ open, onClose, onSelectEncounterType }) => {
  const items = ENCOUNTER_OPTIONS
    .filter(option => !option.hideFromMenu)
    .map(({ label, value, image }) => (
      <EncounterOptionButton
        key={value}
        label={label}
        value={value}
        image={image}
        onClick={() => onSelectEncounterType(value)}
        data-testid={`encounteroptionbutton-6ubf-${value}`} />
    ));

  return (
    <Modal
      title={<TranslatedText
        stringId="patient.modal.admit.title"
        fallback="Admit or check-in"
        data-testid='translatedtext-505w' />}
      open={open}
      onClose={onClose}
      data-testid='modal-8456'>
      <SelectorGrid data-testid='selectorgrid-000c'>{items}</SelectorGrid>
    </Modal>
  );
});
