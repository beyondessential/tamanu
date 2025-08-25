import React from 'react';
import { ListItemText, Typography } from '@mui/material';
import { Ban } from 'lucide-react';

import { AccordionSection } from '../../components/AccordionSection';
import { useAllergiesQuery } from '@api/queries/useAllergiesQuery';
import { StyledList, StyledListItem } from '../../components/StyledList';
import { StyledCircularProgress } from '../../components/StyledCircularProgress';

export const AllergiesSection = () => {
  const { data: allergies, isLoading } = useAllergiesQuery();

  return (
    <AccordionSection header="Allergies" icon={<Ban />}>
      {isLoading ? (
        <StyledCircularProgress size={24} />
      ) : allergies && allergies.length > 0 ? (
        <StyledList>
          {allergies.map(allergy => (
            <StyledListItem key={allergy.id}>
              <ListItemText>
                <Typography fontWeight="bold">
                  {allergy.allergy?.name}
                  {allergy.reaction?.name && ` (${allergy.reaction.name})`}
                </Typography>
              </ListItemText>
            </StyledListItem>
          ))}
        </StyledList>
      ) : (
        <Typography color="text.secondary">No allergies recorded.</Typography>
      )}
    </AccordionSection>
  );
};
