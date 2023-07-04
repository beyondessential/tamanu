import React from 'react';
import { storiesOf } from '@storybook/react';
import styled from 'styled-components';
import { DropdownButton } from '../../app/components/DropdownButton';
import { Button, ButtonRow } from '../../app/components';

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
