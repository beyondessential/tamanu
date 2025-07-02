import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { AccordionSection } from '../../components/AccordionSection';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import PersonIcon from '@mui/icons-material/Person';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';

const meta: Meta<typeof AccordionSection> = {
  title: 'Components/AccordionSection',
  component: AccordionSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A reusable accordion section component built with Material-UI that supports both string and React node titles, plus optional icons.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      description: 'The title of the accordion section, can be a string or React node',
      control: 'text',
    },
    icon: {
      description: 'Optional icon to display before the title',
      control: false,
    },
    children: {
      description: 'The content to display inside the accordion section',
      control: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic story with string title
export const Default: Story = {
  args: {
    title: 'Basic Accordion Section',
    children: (
      <Typography>
        This is the default accordion section with a simple string title and basic content.
      </Typography>
    ),
  },
};

// Story with icon
export const WithIcon: Story = {
  args: {
    title: 'Patient Information',
    icon: <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />,
    children: (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body1">
          <strong>Name:</strong> John Doe
        </Typography>
        <Typography variant="body1">
          <strong>Date of Birth:</strong> January 15, 1985
        </Typography>
        <Typography variant="body1">
          <strong>Medical Record Number:</strong> MRN-123456
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Chip label="Active" color="success" size="small" />
          <Chip label="Insured" color="info" size="small" />
        </Box>
      </Box>
    ),
  },
};

// Story with React node title and icon
export const WithComplexTitle: Story = {
  args: {
    title: (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6">Current Medications</Typography>
        <Chip label="3 items" color="secondary" size="small" />
      </Box>
    ),
    icon: <MedicalServicesIcon sx={{ mr: 1, color: 'secondary.main' }} />,
    children: (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography>• Aspirin 81mg - Daily</Typography>
        <Typography>• Lisinopril 10mg - Daily</Typography>
        <Typography>• Metformin 500mg - Twice daily</Typography>
      </Box>
    ),
  },
};

// Story showing multiple accordion sections
export const MultipleAccordions: Story = {
  render: () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <AccordionSection
        title="Personal Information"
        icon={<PersonIcon sx={{ mr: 1, color: 'primary.main' }} />}
      >
        <Typography>Basic personal details and contact information.</Typography>
      </AccordionSection>

      <AccordionSection
        title="Medical History"
        icon={<MedicalServicesIcon sx={{ mr: 1, color: 'secondary.main' }} />}
      >
        <Typography>Previous medical conditions, surgeries, and treatments.</Typography>
      </AccordionSection>

      <AccordionSection
        title="Emergency Contacts"
        icon={<ContactPhoneIcon sx={{ mr: 1, color: 'error.main' }} />}
      >
        <Typography>Emergency contact information and next of kin details.</Typography>
      </AccordionSection>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example showing multiple accordion sections with different icons working together.',
      },
    },
  },
};
