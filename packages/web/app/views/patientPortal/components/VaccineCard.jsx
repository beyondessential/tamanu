// VaccineCard.jsx - Card component for individual vaccine items
import React from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';

// Status configuration with colors
const statusConfig = {
  scheduled: { label: 'Scheduled', color: '#e8e6ff', textColor: '#5045e5' },
  upcoming: { label: 'Upcoming', color: '#e4f1ff', textColor: '#1976d2' },
  due: { label: 'Due', color: '#e0f2e9', textColor: '#2e7d32' },
  overdue: { label: 'Overdue', color: '#fff1e6', textColor: '#ed6c02' },
};

export const VaccineCard = ({ vaccine, elevation = 0, rootSx = {} }) => {
  // Get status config based on status (default to scheduled if not found)
  const status = vaccine.status?.toLowerCase() || 'scheduled';
  const statusStyle = statusConfig[status] || statusConfig.scheduled;

  // Define fields to display
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

      {/* Fields displayed in table layout for alignment */}
      <Box sx={{ display: 'table', width: '70%' }}>
        {fields.map((field, index) => (
          <Box key={index} sx={{ display: 'table-row', py: 0.5 }}>
            <Box
              sx={{
                display: 'table-cell',
                width: '40%',
                pr: 2,
                py: 1,
                verticalAlign: 'top',
              }}
            >
              <Typography color="text.secondary" variant="body2">
                {field.label}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'table-cell',
                py: 1,
                verticalAlign: 'top',
              }}
            >
              <Typography variant="body1" fontWeight="medium">
                {vaccine[field.field] || '—'}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};
