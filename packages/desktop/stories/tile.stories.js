import React from 'react';
import styled from 'styled-components';
import { Timelapse, Business, AssignmentLate, Category } from '@material-ui/icons';
import { TileContainer, Tile, TileTag, TileTooltip, DateDisplay } from '../app/components';

export default {
  title: 'Tile',
  component: Tile,
};

const Template = args => <Tile {...args} />;

export const Simple = Template.bind({});
Simple.args = {
  Icon: Timelapse,
  main: 'Priority',
  text: 'Standard',
  actions: {
    Etendre: () => {},
    Relever: () => {},
    Glisser: () => {},
  },
};

export const WithTag = Template.bind({});
WithTag.args = {
  Icon: Business,
  main: <TileTag $color="#CB6100">Reception pending</TileTag>,
  text: 'Status',
  actions: {
    Etendre: () => {},
    Relever: () => {},
    Glisser: () => {},
  },
};

const SubText = styled.div`
  font-weight: 400;
  font-size: 11px;
  line-height: 15px;
  > span {
    font-weight: 500;
  }
`;

const CustomText = () => {
  return (
    <div>
      <DateDisplay date={new Date()} showTime />
      <SubText style={{ marginTop: 2 }}>
        Site: <span>Left arm</span>
      </SubText>
    </div>
  );
};

export const WithSubText = Template.bind({});
WithSubText.args = {
  Icon: Category,
  main: <CustomText />,
  text: 'Standard',
  actions: {
    Etendre: () => {},
    Relever: () => {},
    Glisser: () => {},
  },
};

export const WithLineBreak = Template.bind({});
WithLineBreak.args = {
  main: (
    <div>
      <div>Hospital</div>
      <div>Admission</div>
    </div>
  ),
  text: 'Standard',
  actions: {
    Etendre: () => {},
    Relever: () => {},
    Glisser: () => {},
  },
};

export const WithTooltip = Template.bind({});
WithTooltip.args = {
  main: (
    <TileTooltip text="Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusamus modi quibusdam totam!" />
  ),
  text: 'Standard',
  actions: {
    Etendre: () => {},
    Relever: () => {},
    Glisser: () => {},
  },
};

const actions = [
  {
    label: 'Etendre',
    action: () => {},
  },
  {
    label: 'Relever',
    action: () => {},
  },
  {
    label: 'Glisser',
    action: () => {},
  },
];
const Template2 = () => (
  <TileContainer>
    <Tile Icon={Timelapse} text="Test Category" main="FBC" actions={actions} />
    <Tile
      Icon={Business}
      text="Status"
      main={<TileTag $color="#19934E">Reception pending</TileTag>}
      actions={actions}
    />
    <Tile
      Icon={AssignmentLate}
      text="Location"
      main={
        <div>
          <div style={{ marginBottom: 3 }}>ED Bed 1</div>
          <TileTag $color="#19934E">Planned: ED Bed 2</TileTag>
        </div>
      }
      actions={actions}
    />
    <Tile
      Icon={AssignmentLate}
      main={
        <div>
          <TileTooltip style={{ marginBottom: 5 }} text="Emergency department" />
          <TileTag $color="#19934E">Planned: ED Bed 2</TileTag>
        </div>
      }
      actions={actions}
    />
    <Tile Icon={Category} text="Sample collected" main={<CustomText />} actions={actions} />
    <Tile text="Laboratory" main="Fiji CDC" actions={actions} />
    <Tile Icon={Timelapse} text="Priority" main="Standard" actions={actions} />
  </TileContainer>
);

export const WithTileContainer = Template2.bind({});
