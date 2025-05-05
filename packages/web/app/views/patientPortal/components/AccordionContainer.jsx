// AccordionContainer.jsx - Reusable accordion wrapper
import React, { useState } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export const AccordionContainer = ({
  title,
  count,
  children,
  defaultExpanded = false,
  titleVariant = 'h6',
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleChange = (event, isExpanded) => {
    setExpanded(isExpanded);
  };

  return (
    <Accordion expanded={expanded} onChange={handleChange} disableGutters elevation={1}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant={titleVariant} color="text.secondary">
          {title}
          {count !== undefined && count > 0 && (
            <Typography component="span" variant="body1" color="text.secondary" sx={{ ml: 1 }}>
              ({count})
            </Typography>
          )}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ pt: 1 }}>{children}</Box>
      </AccordionDetails>
    </Accordion>
  );
};
