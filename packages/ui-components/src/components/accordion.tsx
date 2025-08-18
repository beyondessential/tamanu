import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import SvgIcon from '@mui/material/SvgIcon';
import { styled } from '@mui/material/styles';

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  border: '1px solid',
  borderColor: theme.palette.divider,
  borderRadius: theme.shape.borderRadius,
  '&:before': {
    display: 'none',
  },
}));

interface AccordionSectionProps {
  header: string | React.ReactNode;
  icon: React.ReactNode;
  children: React.ReactNode;
  [key: string]: any;
}

export const AccordionSection: React.FC<AccordionSectionProps> = ({
  header,
  icon,
  children,
  ...props
}) => {
  return (
    <StyledAccordion elevation={0} {...props} disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SvgIcon color="primary" sx={{ width: 24, height: 24 }}>
            {icon}
          </SvgIcon>
          {typeof header === 'string' ? <Typography variant="h4">{header}</Typography> : header}
        </Box>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </StyledAccordion>
  );
};
