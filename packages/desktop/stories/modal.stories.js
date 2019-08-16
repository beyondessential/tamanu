import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { Modal, ModalActions, ModalContent } from '../app/components/Modal';
import { Button } from '../app/components/Button';
import { ButtonRow, ConfirmCancelRow } from '../app/components/ButtonRow';

storiesOf('Modal', module)
  .add('ConfirmCancel', () => (
    <Modal title="Confirm/Cancel modal" open>
      <ModalContent>Some modal content</ModalContent>
      <ModalActions>
        <ConfirmCancelRow onConfirm={action('confirm')} onCancel={action('cancel')} />
      </ModalActions>
    </Modal>
  ))
  .add('With custom buttons', () => (
    <Modal title="Custom buttons modal" open>
      <ModalContent>Some modal content</ModalContent>
      <ModalActions>
        <ButtonRow>
          <Button onClick={action('plier')} variant="contained" color="primary">
            Plier
          </Button>
          <Button onClick={action('etendre')} variant="contained" color="secondary">
            Etendre
          </Button>
          <Button onClick={action('relever')} variant="contained" color="tertiary">
            Relever
          </Button>
          <Button onClick={action('glisser')} variant="contained">
            Glisser
          </Button>
        </ButtonRow>
      </ModalActions>
    </Modal>
  ));
