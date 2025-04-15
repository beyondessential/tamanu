// DetailCard.jsx - Generic component for displaying a set of details
import React from 'react';
import { Box, Paper, Typography, Divider, Grid2 } from '@mui/material';

export const DetailCard = ({ items, data, elevation = 1, spacing = 2, rootSx = {} }) => {
  return (
    <Paper elevation={elevation} sx={{ p: 2, ...rootSx }}>
      <Box>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <Divider sx={{ my: 1 }} />}
            <Grid2 container spacing={spacing} sx={{ py: 0.5 }}>
              <Grid2 item xs={4}>
                <Typography color="text.secondary" variant="body2">
                  {item.label}
                </Typography>
              </Grid2>
              <Grid2 item xs={8}>
                <Typography variant="body1" fontWeight="medium">
                  {data[item.field] || item.defaultValue || '—'}
                </Typography>
              </Grid2>
            </Grid2>
          </React.Fragment>
        ))}
      </Box>
    </Paper>
  );
};
