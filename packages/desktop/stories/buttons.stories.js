import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { Button } from '../app/components/Button';
import { ButtonRow, ConfirmCancelRow } from '../app/components/ButtonRow';
import { DropdownButton } from '../app/components/DropdownButton';

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

storiesOf('Buttons/DropdownButton', module)
  .add('Default', () => (
    <DropdownButton
      color="primary"
      actions={[
        { label: 'Plier', onClick: action('plier') },
        { label: 'Etendre', onClick: action('etendre') },
        { label: 'Relever', onClick: action('relever') },
        { label: 'Glisser', onClick: action('glisser') },
      ]}
    />
  ))
  .add('Only one action', () => (
    <DropdownButton color="primary" actions={[{ label: 'Plier', onClick: action('plier') }]} />
  ))
  .add('No actions', () => <DropdownButton color="primary" actions={[]} />)
  .add('With split color', () => (
    <DropdownButton
      color="primary"
      dropdownColor="secondary"
      actions={[
        { label: 'Plier', onClick: action('plier') },
        { label: 'Etendre', onClick: action('etendre') },
        { label: 'Relever', onClick: action('relever') },
        { label: 'Glisser', onClick: action('glisser') },
      ]}
    />
  ))
  .add('In button row', () => (
    <ButtonRow>
      <Button onClick={action('other')} variant="contained">
        Other
      </Button>
      <DropdownButton
        color="primary"
        actions={[
          { label: 'Plier', onClick: action('plier') },
          { label: 'Etendre', onClick: action('etendre') },
          { label: 'Relever', onClick: action('relever') },
          { label: 'Glisser', onClick: action('glisser') },
        ]}
      />
    </ButtonRow>
  ));
