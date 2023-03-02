import React from 'react';
import styled from 'styled-components';
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

const actions = [
  { label: 'button', onClick: () => {} },
  { label: 'Etendre', onClick: () => {} },
  { label: 'Relever', onClick: () => {} },
  { label: 'Glisser', onClick: () => {} },
];

const Container = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  padding: 1rem;

  > div {
    margin-right: 18px;
    margin-bottom: 3px;
  }
`;

storiesOf('Buttons/DropdownButton', module)
  .add('Default', () => (
    <div>
      <Container>
        <DropdownButton actions={actions} size="large" />
        <DropdownButton actions={actions} />
        <DropdownButton actions={actions} size="small" />
      </Container>
      <Container>
        <DropdownButton actions={actions} variant="outlined" size="large" />
        <DropdownButton actions={actions} variant="outlined" />
        <DropdownButton actions={actions} variant="outlined" size="small" />
      </Container>
    </div>
  ))
  .add('Only one action', () => (
    <DropdownButton actions={[{ label: 'Plier', onClick: () => {} }]} />
  ))
  .add('No actions', () => <DropdownButton actions={[]} />)
  .add('In button row', () => (
    <ButtonRow>
      <Button onClick={() => {}}>Other</Button>
      <DropdownButton actions={actions} />
    </ButtonRow>
  ));
