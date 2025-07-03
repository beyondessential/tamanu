import React from 'react';
import { AccordionSection } from '../AccordionSection';
import { Typography } from '@mui/material';

import { StethoscopeIcon } from '../../icons/StethoscopeIcon';
import { useOngoingConditionsQuery } from '../../api/queries/useOngoingConditionsQuery';

export const OngoingConditionsSection = () => {
  const { data: conditions, isLoading } = useOngoingConditionsQuery();

  return (
    <AccordionSection header="Ongoing Conditions" icon={<StethoscopeIcon color="primary" />}>
      {isLoading ? (
        <Typography>Loading conditions...</Typography>
      ) : conditions && conditions.length > 0 ? (
        <div>
          {conditions.map((condition: any) => (
            <div
              key={condition.id}
              style={{
                marginBottom: '16px',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
              }}
            >
              <Typography variant="h6" component="h3">
                {condition.condition.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Recorded: {new Date(condition.recordedDate).toLocaleDateString()}
              </Typography>
              {condition.note && <Typography variant="body2">{condition.note}</Typography>}
            </div>
          ))}
        </div>
      ) : (
        <Typography color="text.secondary">No ongoing conditions recorded.</Typography>
      )}
    </AccordionSection>
  );
};
