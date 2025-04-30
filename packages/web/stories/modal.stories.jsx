import React from 'react';
import { MemoryRouter, Route } from 'react-router-dom';
import { action } from '@storybook/addon-actions';
import { Modal } from '../app/components/Modal';
import { Button } from '../app/components/Button';
import { ButtonRow, ConfirmCancelRow } from '../app/components/ButtonRow';
import { BeginPatientMoveModal } from '../app/views/patients/components/BeginPatientMoveModal';
import { FinalisePatientMoveModal } from '../app/views/patients/components/FinalisePatientMoveModal';

export default {
  title: 'Modal',
  component: Modal,
};

const Template = args => <Modal {...args} />;

export const ConfirmCancel = Template.bind({});
ConfirmCancel.args = {
  title: 'Confirm/Cancel modal',
  open: true,
  children: 'Some modal content',
  actions: <ConfirmCancelRow onConfirm={action('confirm')} onCancel={action('cancel')} />,
};

export const WithCustomButtons = Template.bind({});
WithCustomButtons.args = {
  title: 'Custom buttons modal',
  open: true,
  children: 'Some modal content',
  actions: (
    <ButtonRow>
      <Button onClick={action('plier')} variant="contained" color="primary">
        Plier
      </Button>
      <Button onClick={action('etendre')} variant="contained" color="secondary">
        Etendre
      </Button>
      <Button onClick={action('relever')} variant="contained">
        Relever
      </Button>
      <Button onClick={action('glisser')} variant="contained">
        Glisser
      </Button>
    </ButtonRow>
  ),
};

// Router decorator for the move modals
const RouterDecorator = Story => (
  <MemoryRouter initialEntries={['/path/108']}>
    <Route path="/path/:myId">
      <Story />
    </Route>
  </MemoryRouter>
);

export const BeginMove = {
  decorators: [RouterDecorator],
  render: () => (
    <BeginPatientMoveModal
      encounter={{ id: '123', plannedLocation: 'Unit 1' }}
      open
      onClose={() => {
        console.log('close');
      }}
    />
  ),
};

export const FinaliseMove = {
  decorators: [RouterDecorator],
  render: () => (
    <FinalisePatientMoveModal
      encounter={{ id: '123', plannedLocation: 'Unit 1' }}
      open
      onClose={() => {
        console.log('close');
      }}
    />
  ),
};
