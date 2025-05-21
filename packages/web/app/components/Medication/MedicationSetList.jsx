import React from 'react';
import styled from 'styled-components';
import CheckIcon from '@material-ui/icons/Check';
import {
  BodyText,
  Heading4,
  TranslatedText,
} from '..';
import { Colors } from '../../constants';
import { getDose, getTranslatedFrequency } from '@tamanu/shared/utils/medication';
import { useTranslation } from '../../contexts/Translation';

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 0px;
  border-radius: 3px;
  background-color: ${Colors.white};
  width: 100%;
  height: calc(100vh - 444px);
  border: 1px solid ${Colors.outline};
`;

const ListItem = styled.div`
  cursor: pointer;
  width: 100%;
  height: 28px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  position: relative;
`;

const MedicationListItem = styled.div`
  padding: 16px 20px;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin: 0px 16px;
`;

const SelectOverlay = styled.div`
  position: absolute;
  left: 6px;
  top: 0;
  border: 1px solid ${Colors.primary};
  border-radius: 5px;
  width: calc(100% - 12px);
  height: 100%;
  svg {
    position: absolute;
    right: 18px;
    top: 4px;
    width: 18px;
    height: 18px;
  }
`;


export const MedicationSetList = ({ medicationSets, isLoading, onSelect, selectedMedicationSet }) => {
  if (isLoading)
    return (
      <ListContainer>
        <BodyText pl="16px">
          <TranslatedText stringId="general.table.loading" fallback="Loading..." />
        </BodyText>
      </ListContainer>
    );
  return (
    <ListContainer>
      {medicationSets?.map(medicationSet => (
        <ListItem
          key={medicationSet.id}
          onClick={() => onSelect(medicationSet)}
          selected={selectedMedicationSet?.id === medicationSet.id}
        >
          {selectedMedicationSet?.id === medicationSet.id && (
            <SelectOverlay>
              <CheckIcon color="primary" />
            </SelectOverlay>
          )}
          <BodyText>{medicationSet.name}</BodyText>
        </ListItem>
      ))}
    </ListContainer>
  );
};

export const MedicationSetMedicationsList = ({ medicationSet }) => {
  const { getTranslation, getEnumTranslation } = useTranslation();
  return (
    <ListContainer>
      <Heading4 textAlign="center" mt="6px" mb="12px">
        {medicationSet.name}
      </Heading4>
      {medicationSet.children.map(({ medicationTemplate }) => {
        const { medication, route, frequency, notes } = medicationTemplate;
        return (
          <MedicationListItem key={medication.id}>
            <BodyText fontWeight="500">{medication.name}</BodyText>
            <BodyText>
              {getDose(medicationTemplate, getTranslation, getEnumTranslation)},{' '}
              {getTranslatedFrequency(frequency, getTranslation)},{' '}
              {route}
            </BodyText>
            {notes && <BodyText color={Colors.midText}>{notes}</BodyText>}
          </MedicationListItem>
        );
      })}
    </ListContainer>
  );
};
