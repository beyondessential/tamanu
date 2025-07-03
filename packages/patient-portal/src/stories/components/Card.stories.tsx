import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Card } from '../../components/Card';
import { LabelValueList } from '../../components/LabelValueList';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A generic card component with a subtle background designed for displaying structured information throughout the patient portal. Works well with LabelValueList and other content types.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      description: 'Content to display inside the card',
      control: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: <Typography>This is a basic card with simple text content.</Typography>,
  },
};

export const WithMedicationInfo: Story = {
  args: {
    children: (
      <LabelValueList>
        <LabelValueList.ListItem label="Medication" value="Lisinopril" />
        <LabelValueList.ListItem label="Dose" value="10 mg" />
        <LabelValueList.ListItem label="Frequency" value="Twice Daily" />
        <LabelValueList.ListItem label="Route" value="Oral" />
        <LabelValueList.ListItem label="Date" value="15/01/2024" />
        <LabelValueList.ListItem label="Prescriber" value="Dr. Sarah Wilson" />
      </LabelValueList>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Example showing a card with medication information using LabelValueList.',
      },
    },
  },
};

export const WithAppointmentInfo: Story = {
  args: {
    children: (
      <Box>
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
        >
          <Typography variant="h6" fontWeight="bold">
            Upcoming Appointment
          </Typography>
          <Chip label="Confirmed" color="success" size="small" />
        </Box>
        <LabelValueList>
          <LabelValueList.ListItem
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarTodayIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                <Typography>Date & Time</Typography>
              </Box>
            }
            value="March 15, 2024 at 2:30 PM"
          />
          <LabelValueList.ListItem label="Provider" value="Dr. Sarah Wilson" />
          <LabelValueList.ListItem label="Department" value="Cardiology" />
          <LabelValueList.ListItem label="Location" value="Building A, Room 205" />
          <LabelValueList.ListItem label="Type" value="Follow-up Consultation" />
        </LabelValueList>
      </Box>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Example showing a card with appointment information, demonstrating versatility beyond medications.',
      },
    },
  },
};

export const WithLabResults: Story = {
  args: {
    children: (
      <Box>
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
        >
          <Typography variant="h6" fontWeight="bold">
            Blood Chemistry Panel
          </Typography>
          <Chip label="Normal" color="success" size="small" />
        </Box>
        <LabelValueList>
          <LabelValueList.ListItem label="Test Date" value="January 15, 2024" />
          <LabelValueList.ListItem label="Glucose" value="95 mg/dL" />
          <LabelValueList.ListItem label="Cholesterol" value="180 mg/dL" />
          <LabelValueList.ListItem label="Hemoglobin" value="14.2 g/dL" />
          <LabelValueList.ListItem
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <MedicalServicesIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                <Typography>Ordered by</Typography>
              </Box>
            }
            value="Dr. James Chen"
          />
        </LabelValueList>
      </Box>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Example showing a card with lab results, demonstrating use in different medical contexts.',
      },
    },
  },
};

export const MultipleCards: Story = {
  render: () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <Card>
        <LabelValueList>
          <LabelValueList.ListItem label="Medication" value="Lisinopril" />
          <LabelValueList.ListItem label="Dose" value="10 mg" />
          <LabelValueList.ListItem label="Frequency" value="Once Daily" />
        </LabelValueList>
      </Card>

      <Card>
        <LabelValueList>
          <LabelValueList.ListItem label="Appointment" value="March 15, 2024" />
          <LabelValueList.ListItem label="Provider" value="Dr. Sarah Wilson" />
          <LabelValueList.ListItem label="Type" value="Follow-up" />
        </LabelValueList>
      </Card>

      <Card>
        <LabelValueList>
          <LabelValueList.ListItem label="Lab Test" value="Blood Chemistry" />
          <LabelValueList.ListItem label="Date" value="January 15, 2024" />
          <LabelValueList.ListItem label="Status" value="Normal" />
        </LabelValueList>
      </Card>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Example showing multiple cards stacked together, demonstrating consistent spacing and versatile use cases.',
      },
    },
  },
};
