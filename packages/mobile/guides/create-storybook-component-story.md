# Creating Component Story

I've been able to configure Storybook only using it's storiesOf APi.

Basically what you will need is to create a .stories.tsx file for your component story:

```tsx
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { CenterView } from '/styled/common';
import { AccordionList } from './index';
import { data, data2 } from './fixtures';

storiesOf('Place here the name of the component - Name of the component must be unique to avoid errors', module)
  .addDecorator((getStory: any) => (
    <CenterView flex={1}>{getStory()}</CenterView>
  ))
  .add('List 1', () => <AccordionList dataArray={data} />),
  .add('List 2', () => <AccordionList dataArray={data2} />);
```

- The storiesOf first argument should be unique considering all other stories to avoid errors. 
- addDecorator is beign used here to centralize all stories of this file
-  add should render the component to be tested in the story. There can be as many "add"  
