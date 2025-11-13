import React from 'react';
import { SelectEncounterTypeModal } from '../app/components/SelectEncounterTypeModal';

export default {
  title: 'Modals/SelectEncounterTypeModal',
  component: SelectEncounterTypeModal,
};

const Template = args => <SelectEncounterTypeModal open {...args} />;

export const Default = Template.bind({});
