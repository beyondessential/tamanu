import React from 'react';
import { MemoryRouter, Route } from 'react-router';
import { action } from 'storybook/actions';
import { Button, ButtonRow, ConfirmCancelRow, Modal } from '@tamanu/ui-components';
import { FinalisePatientMoveModal } from '../app/views/patients/components/FinalisePatientMoveModal';

export default {
  title: 'Modal',
};

export const ConfirmCancel = () => (
  <Modal
    title="Confirm/Cancel modal"
    open
    actions={<ConfirmCancelRow onConfirm={action('confirm')} onCancel={action('cancel')} />}
  >
    Some modal content
  </Modal>
);

ConfirmCancel.story = {
  name: 'ConfirmCancel',
};

export const WithCustomButtons = () => (
  <Modal
    title="Custom buttons modal"
    open
    actions={
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
    }
  >
    Some modal content
  </Modal>
);

WithCustomButtons.story = {
  name: 'With custom buttons',
};

export const FinaliseMove = () => (
  <FinalisePatientMoveModal
    encounter={{ id: '123', plannedLocation: 'Unit 1' }}
    open
    onClose={() => {
      console.log('close');
    }}
  />
);

FinaliseMove.story = {
  name: 'FinaliseMove',
  decorators: [
    Story => (
      <MemoryRouter initialEntries={['/path/108']}>
        <Route path="/path/:myId">
          <Story />
        </Route>
      </MemoryRouter>
    ),
  ],
};
