import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { CircleCheck, Clock } from 'lucide-react';

import { StyledCircularProgress } from '../../StyledCircularProgress';
import { FormCard } from './FormCard';
import { useOutstandingFormsQuery } from '../../../api/queries/useOutstandingFormsQuery';
import { Card } from '../../Card';
import { Colors } from '@tamanu/shared/ui/theme/colors';

export const OutstandingFormsSection = () => {
  const { data: forms, isLoading } = useOutstandingFormsQuery();

  const formCount = forms?.length || 0;
  const hasOutstandingForms = formCount > 0;

  // Dynamic header text
  const headerText = hasOutstandingForms
    ? `You have ${formCount} outstanding ${formCount === 1 ? 'form' : 'forms'} to complete below`
    : 'You have no outstanding forms';

  return (
    <Card variant="outlined">
      <Stack spacing={2}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {hasOutstandingForms ? (
            <Clock size={24} color="#f44336" />
          ) : (
            <CircleCheck size={24} color={Colors.green} />
          )}
          <Typography variant="h4" fontWeight="normal">
            {headerText}
          </Typography>
        </Box>

        {/* Content */}
        {isLoading ? (
          <StyledCircularProgress size={24} />
        ) : forms && forms.length > 0 ? (
          <Stack spacing={2}>
            {forms.map(form => (
              <FormCard
                key={form.id}
                form={form}
                onClick={() => {
                  // TODO: Open form modal when implemented
                  console.log('Opening form:', form.title);
                }}
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Card>
  );
};
