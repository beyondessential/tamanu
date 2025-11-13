import React from 'react';
import { Stack, Typography, Card, CardContent, CardHeader } from '@mui/material';
import { CircleCheck, Clock } from 'lucide-react';
import { TAMANU_COLORS } from '@tamanu/ui-components';

import { StyledCircularProgress } from '../../../components/StyledCircularProgress';
import { OutstandingFormCard } from './OutstandingFormCard';
import { useOutstandingSurveysQuery } from '@api/queries/useOutstandingSurveysQuery';

export const OutstandingFormsSection = () => {
  const { data: forms, isLoading } = useOutstandingSurveysQuery();

  const formCount = forms?.length || 0;
  const hasOutstandingForms = formCount > 0;

  const headerText = hasOutstandingForms
    ? `You have ${formCount} outstanding ${formCount === 1 ? 'form' : 'forms'} to complete below`
    : 'You have no outstanding forms';

  return (
    <Card variant="outlined">
      <CardHeader
        avatar={
          hasOutstandingForms ? (
            <Clock size={24} color="#f44336" />
          ) : (
            <CircleCheck size={24} color={TAMANU_COLORS.green} />
          )
        }
        title={
          <Typography variant="h4" fontWeight="normal">
            {headerText}
          </Typography>
        }
      />
      {isLoading ? (
        <CardContent>
          <StyledCircularProgress size={24} />
        </CardContent>
      ) : forms && forms.length > 0 ? (
        <CardContent>
          <Stack spacing={2}>
            {forms.map(form => (
              <OutstandingFormCard key={form.id} form={form} />
            ))}
          </Stack>
        </CardContent>
      ) : null}
    </Card>
  );
};
