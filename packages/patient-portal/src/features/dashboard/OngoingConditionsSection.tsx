import React from 'react';
import { ListItemText, Typography } from '@mui/material';
import { Stethoscope } from 'lucide-react';

import { AccordionSection } from '../../components/AccordionSection';
import { useOngoingConditionsQuery } from '@api/queries/useOngoingConditionsQuery';
import { StyledList, StyledListItem } from '../../components/StyledList';
import { StyledCircularProgress } from '../../components/StyledCircularProgress';

export const OngoingConditionsSection = () => {
  const { data: conditions, isLoading } = useOngoingConditionsQuery();

  return (
    <AccordionSection header="Ongoing conditions" icon={<Stethoscope />}>
      {isLoading ? (
        <StyledCircularProgress size={24} />
      ) : conditions && conditions.length > 0 ? (
        <StyledList>
          {conditions.map(condition => (
            <StyledListItem key={condition.id}>
              <ListItemText>
                <Typography fontWeight="bold">{condition.condition?.name}</Typography>
              </ListItemText>
            </StyledListItem>
          ))}
        </StyledList>
      ) : (
        <Typography color="text.secondary">No ongoing conditions recorded.</Typography>
      )}
    </AccordionSection>
  );
};
