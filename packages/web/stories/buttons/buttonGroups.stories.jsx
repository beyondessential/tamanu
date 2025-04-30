import React from 'react';
import { action } from '@storybook/addon-actions';
import { Button, ButtonRow, ConfirmCancelRow } from '../../app/components';

export default {
  title: 'Buttons/ButtonRow',
  component: ButtonRow,
};

export const ConfirmCancel = {
  render: () => (
    <ConfirmCancelRow onConfirm={action('confirm')} onCancel={action('confirm')} />
  ),
};

export const WithCustomText = {
  render: () => (
    <ConfirmCancelRow
      onConfirm={action('confirm')}
      onCancel={action('confirm')}
      confirmText="OK"
      cancelText="Back"
    />
  ),
};

export const WithLongCustomText = {
  render: () => (
    <ConfirmCancelRow
      onConfirm={action('confirm')}
      onCancel={action('confirm')}
      confirmText="Assign patient diagnosis"
      cancelText="Return to previous state"
    />
  ),
};

export const WithCustomButtons = {
  render: () => (
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
