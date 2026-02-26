import React from 'react';
import styled from 'styled-components';
import { DropdownButton } from '../../app/components/DropdownButton';
import { Button, ButtonRow } from '@tamanu/ui-components';

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

export default {
  title: 'Buttons/DropdownButton',
};

export const Default = () => (
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
);

export const OnlyOneAction = () => (
  <DropdownButton actions={[{ label: 'Plier', onClick: () => {} }]} />
);

OnlyOneAction.story = {
  name: 'Only one action',
};

export const NoActions = () => <DropdownButton actions={[]} />;

NoActions.story = {
  name: 'No actions',
};

export const InButtonRow = () => (
  <ButtonRow>
    <Button onClick={() => {}}>Other</Button>
    <DropdownButton actions={actions} />
  </ButtonRow>
);

InButtonRow.story = {
  name: 'In button row',
};
