import React from 'react';
import { action } from '@storybook/addon-actions';
import { SelectEncounterTypeModal } from '../app/components/SelectEncounterTypeModal';

export default {
  title: 'Modals/SelectEncounterTypeModal',
  component: SelectEncounterTypeModal,
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    onClose: {
      action: 'onClose',
      description: 'Callback when modal is closed',
    },
    onSelectEncounterType: {
      action: 'onSelectEncounterType',
      description: 'Callback when an encounter type is selected',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A modal component that displays available encounter types for patient admission or check-in. Shows encounter options in a grid layout with icons and colors.',
      },
    },
  },
};

const Template = args => <SelectEncounterTypeModal {...args} />;

export const Default = Template.bind({});
Default.args = {
  open: true,
  onClose: action('onClose'),
  onSelectEncounterType: action('onSelectEncounterType'),
};
