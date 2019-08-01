import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { Button } from '../app/components/Button';
import SearchBar from '../app/components/SearchBar';

import TopBar from '../app/components/TopBar';

storiesOf('TopBar', module)
  .add('Plain', () => <TopBar title="Title" />)
  .add('With button', () => (
    <TopBar title="With button">
      <Button color="primary" variant="contained" onClick={action('save')}>
        Save
      </Button>
    </TopBar>
  ))
  .add('With two buttons', () => (
    <TopBar title="With two buttons">
      <Button variant="outlined" onClick={action('cancel')}>
        Cancel
      </Button>
      <Button color="primary" variant="contained" onClick={action('save')}>
        Save
      </Button>
    </TopBar>
  ))
  .add('With search input', () => (
    <TopBar title="With search input">
      <SearchBar onChange={action('searchChange')} />
    </TopBar>
  ));
