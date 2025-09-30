import React from 'react';
import styled from 'styled-components';
import Avatar from '@material-ui/core/Avatar';
import { ENCOUNTER_TYPE_LABELS } from '@tamanu/constants';
import {
  Button,
  Modal,
  TranslatedText,
  TranslatedEnum,
} from '@tamanu/ui-components';
import { Colors } from '../constants/styles';
import { ENCOUNTER_OPTIONS } from '../constants';

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

const EncounterOptionButton = ({ value, image, onClick }) => (
  <EncounterOptionTypeButton
    variant="contained"
    color="default"
    onClick={onClick}
    data-testid="encounteroptiontypebutton-haqi"
  >
    <TypeImage alt={value} src={image} data-testid="typeimage-c71v" />
    <TranslatedEnum
      value={value}
      enumValues={ENCOUNTER_TYPE_LABELS}
      data-testid="translatedenum-encounter-type"
    />
  </EncounterOptionTypeButton>
);

export const SelectEncounterTypeModal = React.memo(({ open, onClose, onSelectEncounterType }) => {
  const items = ENCOUNTER_OPTIONS.filter(option => !option.hideFromMenu).map(({ value, image }) => (
    <EncounterOptionButton
      key={value}
      value={value}
      image={image}
      onClick={() => onSelectEncounterType(value)}
      data-testid={`encounteroptionbutton-6ubf-${value}`}
    />
  ));

  return (
    <Modal
      title={
        <TranslatedText
          stringId="patient.modal.admit.title"
          fallback="Admit or check-in"
          data-testid="translatedtext-505w"
        />
      }
      open={open}
      onClose={onClose}
      data-testid="modal-8456"
    >
      <SelectorGrid data-testid="selectorgrid-000c">{items}</SelectorGrid>
    </Modal>
  );
});
