import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { LabelValueList } from '../../components/LabelValueList';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';

const meta: Meta<typeof LabelValueList> = {
  title: 'Components/LabelValueList',
  component: LabelValueList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A compound component for displaying label-value pairs in a grid layout. Uses CSS Grid to automatically align labels and values across multiple items. Access ListItem via LabelValueList.ListItem.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      description: 'LabelValueList.ListItem components',
      control: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic story with string label and value
export const Default: Story = {
  render: () => (
    <LabelValueList>
      <LabelValueList.ListItem label="Patient Name" value="John Doe" />
    </LabelValueList>
  ),
};

// Story with React node label and string value
export const WithIconLabel: Story = {
  render: () => (
    <LabelValueList>
      <LabelValueList.ListItem
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PersonIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography>Patient ID</Typography>
          </Box>
        }
        value="PAT-123456"
      />
    </LabelValueList>
  ),
};

// Story with string label and React node value
export const WithChipValue: Story = {
  render: () => (
    <LabelValueList>
      <LabelValueList.ListItem
        label="Status"
        value={<Chip label="Active" color="success" size="small" />}
      />
    </LabelValueList>
  ),
};

// Story with React node label and React node value
export const WithComplexContent: Story = {
  render: () => (
    <LabelValueList>
      <LabelValueList.ListItem
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarTodayIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
            <Typography>Last Visit</Typography>
          </Box>
        }
        value={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography fontWeight="bold">December 15, 2023</Typography>
            <Typography variant="caption" color="text.secondary">
              General Checkup
            </Typography>
          </Box>
        }
      />
    </LabelValueList>
  ),
};

// Story showing multiple list items together - this is the main benefit
export const MultipleItems: Story = {
  render: () => (
    <LabelValueList>
      <LabelValueList.ListItem label="Patient Name" value="John Doe" />
      <LabelValueList.ListItem
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PersonIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography>Patient ID</Typography>
          </Box>
        }
        value="PAT-123456"
      />
      <LabelValueList.ListItem label="Date of Birth" value="January 15, 1985" />
      <LabelValueList.ListItem
        label="Status"
        value={<Chip label="Active" color="success" size="small" />}
      />
      <LabelValueList.ListItem
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MedicalServicesIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
            <Typography>Primary Care Provider</Typography>
          </Box>
        }
        value={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography fontWeight="bold">Dr. Sarah Wilson</Typography>
            <Typography variant="caption" color="text.secondary">
              Internal Medicine
            </Typography>
          </Box>
        }
      />
      <LabelValueList.ListItem
        label="Insurance"
        value={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label="Primary" color="info" size="small" />
            <Typography fontWeight="bold">Blue Cross Blue Shield</Typography>
          </Box>
        }
      />
    </LabelValueList>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Example showing multiple LabelValueList.ListItem components with perfect alignment. Notice how all labels align in the first column and all values align in the second column, regardless of label length.',
      },
    },
  },
};

// Story showing mixed content types
export const MixedContentTypes: Story = {
  render: () => (
    <LabelValueList>
      <LabelValueList.ListItem label="Short" value="Value" />
      <LabelValueList.ListItem label="Medium Length Label" value="Another Value" />
      <LabelValueList.ListItem label="Very Long Label That Takes Up Space" value="Aligned Value" />
      <LabelValueList.ListItem
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PersonIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography>Icon + Text Label</Typography>
          </Box>
        }
        value={<Chip label="Complex Value" color="secondary" size="small" />}
      />
    </LabelValueList>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates how the grid layout automatically handles different label lengths and content types while maintaining perfect alignment.',
      },
    },
  },
};
