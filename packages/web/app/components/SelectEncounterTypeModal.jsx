import React from 'react';
import styled from 'styled-components';
import { TAMANU_COLORS } from '@tamanu/ui-components';
import { ENCOUNTER_TYPE_LABELS, ENCOUNTER_TYPES } from '@tamanu/constants';
import { ENCOUNTER_OPTIONS } from '../constants';
import { Modal } from './Modal';
import { TranslatedText } from './Translation/TranslatedText';
import { TranslatedEnum } from './Translation/TranslatedEnum';
import { BodyText, LargeBodyText } from './Typography';

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
  border-radius: 3px;
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

const EncounterOptionTypeButton = styled.button`
  all: unset;
  border: 1px solid ${({ $backgroundColor }) => $backgroundColor};
  background: ${({ $backgroundColor }) => $backgroundColor};

  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;

  border-radius: 10px;
  padding: 20px;
  padding-top: 80px;

  &:hover {
    border: 1px solid ${({ $color }) => $color};
    cursor: pointer;
  }
`;

const getDescriptionForEncounterType = encounterType => {
  switch (encounterType) {
    case ENCOUNTER_TYPES.ADMISSION:
      return (
        <TranslatedText
          stringId="encounter.option.admission.description"
          fallback="Inpatient care with overnight stay"
        />
      );
    case ENCOUNTER_TYPES.CLINIC:
      return (
        <TranslatedText
          stringId="encounter.option.clinic.description"
          fallback="Outpatient consultation and treatment"
        />
      );
    case ENCOUNTER_TYPES.TRIAGE:
      return (
        <TranslatedText
          stringId="encounter.option.triage.description"
          fallback="Emergency assessment and care"
        />
      );
    default:
      return '';
  }
};

const EncounterOptionButton = ({ value, Icon, color, backgroundColor, onClick }) => (
  <EncounterOptionTypeButton
    $color={color}
    $backgroundColor={backgroundColor}
    onClick={onClick}
    data-testid="encounteroptiontypebutton-haqi"
  >
    <TypeIcon>
      <Icon color={color} size={24} />
    </TypeIcon>
    <TypeName>
      <TranslatedEnum
        value={value}
        enumValues={ENCOUNTER_TYPE_LABELS}
        data-testid="translatedenum-encounter-type"
      />
    </TypeName>
    <TypeDescription>{getDescriptionForEncounterType(value)}</TypeDescription>
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
    >
      <SelectorGrid data-testid="selectorgrid-000c">{items}</SelectorGrid>
    </StyledModal>
  );
});
