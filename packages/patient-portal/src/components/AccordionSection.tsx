import React from 'react';
import Accordion, { AccordionProps } from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';

type AccordionSectionTitle = string | React.ReactNode;

interface AccordionSectionProps extends AccordionProps {
  header: AccordionSectionTitle;
  icon?: React.ReactNode;
}

export const AccordionSection = ({ header, icon, children, ...props }: AccordionSectionProps) => {
  return (
    <Accordion {...props}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          {typeof header === 'string' ? <Typography>{header}</Typography> : header}
        </Box>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
};
