import React from 'react';
import { MemoryRouter, Route } from 'react-router';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Button, ButtonRow, ConfirmCancelRow, Modal } from '@tamanu/ui-components';
import { FinalisePatientMoveModal } from '../app/views/patients/components/FinalisePatientMoveModal';

storiesOf('Modal', module)
  .add('ConfirmCancel', () => (
    <Modal
      title="Confirm/Cancel modal"
      open
      actions={<ConfirmCancelRow onConfirm={action('confirm')} onCancel={action('cancel')} />}
    >
      Some modal content
    </Modal>
  ))
  .add('With custom buttons', () => (
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
  ));

storiesOf('Modal', module)
  .addDecorator(Story => (
    <MemoryRouter initialEntries={['/path/108']}>
      <Route path="/path/:myId">
        <Story />
      </Route>
    </MemoryRouter>
  ))
  .add('FinaliseMove', () => (
    <FinalisePatientMoveModal
      encounter={{ id: '123', plannedLocation: 'Unit 1' }}
      open
      onClose={() => {
        console.log('close');
      }}
    />
  ));
