import React from 'react';
import styled from 'styled-components';
import Avatar from '@material-ui/core/Avatar';
import { encounterOptions, Colors } from '../constants';
import { Modal } from './Modal';
import { Button } from './Button';

const SelectorGrid = styled.div`
  display: grid;
  grid-template-columns: auto auto auto;
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
  <EncounterOptionTypeButton variant="contained" color="default" onClick={onClick}>
    <TypeImage alt={label} src={image} />
    {label}
  </EncounterOptionTypeButton>
);

const StartPage = ({ onClick }) => {
  const items = encounterOptions
    .filter(option => !option.hideFromMenu)
    .map(({ label, value, image }) => (
      <EncounterOptionButton
        key={value}
        label={label}
        value={value}
        image={image}
        onClick={onClick}
      />
    ));

  return <SelectorGrid>{items}</SelectorGrid>;
};

export const SelectEncounterTypeModal = React.memo(({ open, onClose, onSelectEncounterType }) => {
  return (
    <Modal title="Check-in" open={open} onClose={onClose}>
      <StartPage onClick={onSelectEncounterType} />
    </Modal>
  );
});
