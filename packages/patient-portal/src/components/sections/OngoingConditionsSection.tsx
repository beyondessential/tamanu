import React from 'react';
import { AccordionSection } from '../AccordionSection';
import { List, ListItem, ListItemText, Typography } from '@mui/material';
import { Stethoscope } from 'lucide-react';

import { useOngoingConditionsQuery } from '../../api/queries/useOngoingConditionsQuery';

export const OngoingConditionsSection = () => {
  const { data: conditions, isLoading } = useOngoingConditionsQuery();

  return (
    <AccordionSection header="Ongoing Conditions" icon={<Stethoscope />}>
      {isLoading ? (
        <Typography>Loading conditions...</Typography>
      ) : conditions && conditions.length > 0 ? (
        <List>
          {conditions.map(condition => (
            <ListItem key={condition.id}>
              <ListItemText>
                <Typography fontWeight="bold">{condition.condition?.name}</Typography>
              </ListItemText>
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography color="text.secondary">No ongoing conditions recorded.</Typography>
      )}
    </AccordionSection>
  );
};
