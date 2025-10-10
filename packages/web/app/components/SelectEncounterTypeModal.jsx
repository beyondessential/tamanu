import React from 'react';
import styled from 'styled-components';
import { ENCOUNTER_OPTIONS } from '../constants';
import { ENCOUNTER_TYPE_LABELS } from '@tamanu/constants';
import { Modal } from './Modal';
import { TranslatedText } from './Translation/TranslatedText';
import { TranslatedEnum } from './Translation/TranslatedEnum';
import { BodyText, LargeBodyText } from './Typography';
import { TAMANU_COLORS } from '@tamanu/ui-components';

// TODO: the styling is all a bit manual

const StyledModal = styled(Modal)`
  .MuiPaper-root {
    max-width: 750px;
  }
`;

const SelectorGrid = styled.div`
  display: flex;
  flex-wrap: nowrap;
  gap: 1rem;
  justify-content: center;
  background-color: ${TAMANU_COLORS.white};
  padding: 20px;
  border-radius: 5px;
  border: 1px solid ${TAMANU_COLORS.outline};
`;

const TypeIcon = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
`;

const TypeName = styled(LargeBodyText)`
  font-weight: bold;
  color: ${TAMANU_COLORS.darkestText};
  margin-bottom: 5px;
`;

const TypeDescription = styled(BodyText)`
  color: ${TAMANU_COLORS.darkText};
`;

const EncounterOptionTypeButton = styled.div`
  border: 1px solid ${props => props.$backgroundColor};
  background: ${props => props.$backgroundColor};
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  padding: 20px;
  padding-top: 80px;

  width: 200px;

  span {
    justify-items: center;
  }

  &:hover {
    border: 1px solid ${props => props.$color};
    cursor: pointer;
  }
`;

const EncounterOptionButton = ({ value, description, Icon, color, backgroundColor, onClick }) => (
  <EncounterOptionTypeButton
    variant="contained"
    $color={color}
    $backgroundColor={backgroundColor}
    onClick={onClick}
    data-testid="encounteroptiontypebutton-haqi"
  >
    <TypeIcon>
      <Icon color={color} />
    </TypeIcon>
    <TypeName>
      <TranslatedEnum
        value={value}
        enumValues={ENCOUNTER_TYPE_LABELS}
        data-testid="translatedenum-encounter-type"
      />
    </TypeName>
    <TypeDescription>{description}</TypeDescription>
  </EncounterOptionTypeButton>
);

export const SelectEncounterTypeModal = React.memo(({ open, onClose, onSelectEncounterType }) => {
  const items = ENCOUNTER_OPTIONS.filter(
    option => !option.hideFromMenu,
  ).map(({ value, icon, description, color, backgroundColor }) => (
    <EncounterOptionButton
      key={value}
      value={value}
      Icon={icon}
      description={description}
      color={color}
      backgroundColor={backgroundColor}
      onClick={() => onSelectEncounterType(value)}
      data-testid={`encounteroptionbutton-6ubf-${value}`}
    />
  ));

  return (
    <StyledModal
      title={
        <TranslatedText
          stringId="patient.modal.admit.title"
          fallback="Create encounter"
          data-testid="translatedtext-505w"
        />
      }
      open={open}
      onClose={onClose}
      data-testid="modal-8456"
      $numberOfItems={items.length}
    >
      <SelectorGrid $numberOfItems={items.length} data-testid="selectorgrid-000c">
        {items}
      </SelectorGrid>
    </StyledModal>
  );
});
