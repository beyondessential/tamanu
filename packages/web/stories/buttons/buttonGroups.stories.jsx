import React from 'react';
import { action } from 'storybook/actions';
import { Button, ButtonRow, ConfirmCancelRow } from '@tamanu/ui-components';

export default {
  title: 'Buttons/ButtonRow',
};

export const ConfirmCancel = () => (
  <ConfirmCancelRow onConfirm={action('confirm')} onCancel={action('confirm')} />
);

ConfirmCancel.story = {
  name: 'ConfirmCancel',
};

export const WithCustomText = () => (
  <ConfirmCancelRow
    onConfirm={action('confirm')}
    onCancel={action('confirm')}
    confirmText="OK"
    cancelText="Back"
  />
);

WithCustomText.story = {
  name: 'With custom text',
};

export const WithLongCustomText = () => (
  <ConfirmCancelRow
    onConfirm={action('confirm')}
    onCancel={action('confirm')}
    confirmText="Assign patient diagnosis"
    cancelText="Return to previous state"
  />
);

WithLongCustomText.story = {
  name: 'With long custom text',
};

export const WithCustomButtons = () => (
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
);

WithCustomButtons.story = {
  name: 'With custom buttons',
};
