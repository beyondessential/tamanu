import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Button, ButtonRow, ConfirmCancelRow } from '@tamanu/ui-components';

storiesOf('Buttons/ButtonRow', module)
  .add('ConfirmCancel', () => (
    <ConfirmCancelRow onConfirm={action('confirm')} onCancel={action('confirm')} />
  ))
  .add('With custom text', () => (
    <ConfirmCancelRow
      onConfirm={action('confirm')}
      onCancel={action('confirm')}
      confirmText="OK"
      cancelText="Back"
    />
  ))
  .add('With long custom text', () => (
    <ConfirmCancelRow
      onConfirm={action('confirm')}
      onCancel={action('confirm')}
      confirmText="Assign patient diagnosis"
      cancelText="Return to previous state"
    />
  ))
  .add('With custom buttons', () => (
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
  ));
