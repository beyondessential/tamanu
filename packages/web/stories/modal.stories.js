import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { Modal } from '../app/components/Modal';
import { Button } from '../app/components/Button';
import { ButtonRow, ConfirmCancelRow } from '../app/components/ButtonRow';

storiesOf('Modal', module)
  .add('ConfirmCancel', () => (
    <Modal
      title="Confirm/Cancel modal"
      open
      actions={() => <ConfirmCancelRow onConfirm={action('confirm')} onCancel={action('cancel')} />}
    >
      Some modal content
    </Modal>
  ))
  .add('With custom buttons', () => (
    <Modal
      title="Custom buttons modal"
      open
      actions={() => (
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
      )}
    >
      Some modal content
    </Modal>
  ));
