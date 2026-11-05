import React from 'react';
import styled from 'styled-components';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import { TranslatedText } from '@tamanu/ui-components';

import { Colors } from '../../../constants/styles';
import { useTranslation } from '../../../contexts/Translation';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 20px 72px;
  border: 1px solid ${Colors.outline};
  border-radius: 5px;
  background: ${Colors.white};
  text-align: center;
`;

const Badge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin-bottom: 16px;
  border-radius: 50%;
  background: rgba(50, 102, 153, 0.08);
  color: ${Colors.primary};

  .MuiSvgIcon-root {
    font-size: 28px;
  }
`;

const Title = styled.p`
  margin: 0 0 6px;
  color: ${Colors.primaryDark};
  font-size: 16px;
  font-weight: 500;
`;

const Hint = styled.p`
  margin: 0;
  color: ${Colors.darkText};
  font-size: 14px;
`;

const AdvancedSearchIcon = styled(KeyboardDoubleArrowDownIcon)`
  &.MuiSvgIcon-root {
    margin: 0 -1px;
    color: ${Colors.primary};
    font-size: 18px;
    vertical-align: -4px;
  }
`;

export const PatientSearchEmptyState = () => {
  const { getTranslation } = useTranslation();
  // One sentence for translators, so they can place the inline icon wherever their word order needs.
  const [beforeIcon, afterIcon] = getTranslation(
    'patientList.emptyState.hint',
    'Search by :displayId, name or date of birth. Otherwise select :advancedSearchIcon for more advanced search options.',
    {
      replacements: {
        displayId: getTranslation('general.localisedField.displayId.label.short', 'NHN'),
      },
    },
  ).split(':advancedSearchIcon');
  return (
    <Container data-testid="patientsearchemptystate">
      <Badge>
        <PersonSearchIcon aria-hidden />
      </Badge>
      <Title>
        <TranslatedText stringId="patientList.emptyState.title" fallback="Search for a patient" />
      </Title>
      <Hint>
        {beforeIcon}
        <AdvancedSearchIcon
          titleAccess={getTranslation('patientList.emptyState.advancedSearch', 'advanced search')}
        />
        {afterIcon}
      </Hint>
    </Container>
  );
};
