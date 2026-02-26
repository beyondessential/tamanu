import React from 'react';
import styled from 'styled-components';
import { BodyText, LargeBodyText, SmallBodyText } from '../app/components';

const Container = styled.div`
  width: 500px;
  padding: 1rem;
  background: white;
`;

const Section = styled.div`
  margin-bottom: 30px;
`;

export default {
  title: 'Typography',
};

export const Text = () => (
  <Container>
    <Section>
      <LargeBodyText color="textPrimary">Large Body Text</LargeBodyText>
      <LargeBodyText color="textPrimary">
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nihil, totam.
      </LargeBodyText>
    </Section>
    <Section>
      <LargeBodyText color="textSecondary">Large Body Text</LargeBodyText>
      <LargeBodyText color="textSecondary">
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nihil, totam.
      </LargeBodyText>
    </Section>
    <Section>
      <BodyText color="textPrimary">Body Text Primary</BodyText>
      <BodyText color="textPrimary">
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nihil, totam.
      </BodyText>
    </Section>
    <Section>
      <BodyText color="textSecondary">Body Text Secondary</BodyText>
      <BodyText color="textSecondary">
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nihil, totam.
      </BodyText>
    </Section>
    <Section>
      <SmallBodyText color="textPrimary">Small Body Text</SmallBodyText>
      <SmallBodyText color="textPrimary">
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nihil, totam.
      </SmallBodyText>
    </Section>
    <Section>
      <SmallBodyText color="textSecondary">Small Body Text</SmallBodyText>
      <SmallBodyText color="textSecondary">
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nihil, totam.
      </SmallBodyText>
    </Section>
  </Container>
);
