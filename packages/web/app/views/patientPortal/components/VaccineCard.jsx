// VaccineCard.jsx
import React from 'react';
import { Box, Paper, Typography, Chip, Grid2 } from '@mui/material';

const statusConfig = {
  scheduled: { label: 'Scheduled', color: '#e8e6ff', textColor: '#5045e5' },
  upcoming: { label: 'Upcoming', color: '#e4f1ff', textColor: '#1976d2' },
  due: { label: 'Due', color: '#e0f2e9', textColor: '#2e7d32' },
  overdue: { label: 'Overdue', color: '#fff1e6', textColor: '#ed6c02' },
};

export const VaccineCard = ({ vaccine, elevation = 0, rootSx = {} }) => {
  const status = vaccine.status?.toLowerCase() || 'scheduled';
  const statusStyle = statusConfig[status] || statusConfig.scheduled;

  const fields = [
    { label: 'Vaccine', field: 'name' },
    { label: 'Schedule', field: 'dose' },
    { label: 'Due date', field: 'dueDate' },
  ];

  return (
    <Paper
      elevation={elevation}
      sx={{
        p: 2,
        position: 'relative',
        ...rootSx,
      }}
    >
      {/* Status chip */}
      <Box sx={{ position: 'absolute', right: 16, top: 16 }}>
        <Chip
          label={statusStyle.label}
          sx={{
            bgcolor: statusStyle.color,
            color: statusStyle.textColor,
            fontWeight: 500,
            px: 1,
          }}
        />
      </Box>

      {/* Use same Grid2 layout as DetailCard for consistency */}
      <Box>
        {fields.map((field, index) => (
          <Grid2 container spacing={2} sx={{ py: 0.5 }} key={index}>
            <Grid2
              item
              xs={4}
              sx={{
                width: '150px',
                flexShrink: 0,
              }}
            >
              <Typography color="text.secondary" variant="body2" sx={{ pr: 2 }}>
                {field.label}
              </Typography>
            </Grid2>
            <Grid2 item xs={8}>
              <Typography variant="body1" fontWeight="medium">
                {vaccine[field.field] || '—'}
              </Typography>
            </Grid2>
          </Grid2>
        ))}
      </Box>
    </Paper>
  );
};
