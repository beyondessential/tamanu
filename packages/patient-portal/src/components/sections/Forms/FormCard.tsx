import React from 'react';
import { Box, Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material';
import { ChevronRight } from 'lucide-react';
import type { OutstandingForm } from '@tamanu/shared/dtos/responses/OutstandingFormSchema';

interface FormCardProps {
  form: OutstandingForm;
  onClick?: () => void;
}

export const FormCard: React.FC<FormCardProps> = ({ form, onClick }) => {
  return (
    <Card variant="outlined">
      <CardActionArea onClick={onClick} disabled={!onClick}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack spacing={1} sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="bold">
                {form.title}
              </Typography>
              <Box>
                <Chip
                  label="To be completed"
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ width: 'fit-content' }}
                />
              </Box>
            </Stack>
            <ChevronRight size={24} color="#666" />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
