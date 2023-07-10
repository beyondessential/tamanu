import React from 'react';
import { Chance } from 'chance';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { InfoCard, InfoCardHeader, InfoCardItem } from '../../app/components/InfoCard';
import { EncounterInfoPane } from '../../app/views/patients/panes/EncounterInfoPane';
import { LabRequestSampleDetailsCard } from '../../app/views/patients/components/LabRequestSampleDetailsCard';

const chance = new Chance();

export default {
  argTypes: {},
  title: 'Card/InfoCard',
  component: InfoCard,
};

const Template = args => {
  return (
    <InfoCard {...args}>
      <InfoCardItem label="Age" value={chance.integer({ min: 1, max: 100 })} />
      <InfoCardItem label="Name" value={chance.name()} />
      <InfoCardItem label="Address" value={chance.address()} />
      <InfoCardItem label="Phone" value={chance.phone()} />
      <InfoCardItem label="Email" value={chance.email()} />
    </InfoCard>
  );
};
const EncounterInfoPaneTemplate = args => <EncounterInfoPane {...args} />;
const LabRequestSampleDetailsTemplate = args => <LabRequestSampleDetailsCard {...args} />;

export const Default = Template.bind({});
Default.args = {};

export const InlineValues = Template.bind({});
InlineValues.args = {
  inlineValues: true,
};

export const HeaderContent = Template.bind({});
HeaderContent.args = {
  inlineValues: true,
  headerContent: <InfoCardHeader label="User summary" value="General info" />,
};

export const EncounterInfo = EncounterInfoPaneTemplate.bind({});
EncounterInfo.args = {
  patientBillingType: 'Private',
  getLocalisation: key => {
    const config = {
      'fields.referralSourceId.shortLabel': 'Referral',
    };
    return config[key];
  },
  encounter: {
    reasonForEncounter: 'Heart attack',
    encounterType: 'admission',
    department: { name: 'Cardiology' },
    location: { name: 'Clinical treatment room' },
    referralSource: { name: 'Alan Chan' },
    plannedLocation: { name: 'Ward 2', locationGroup: { name: 'Clinical center building 1' } },
  },
};

export const LabRequestSampleDetails = LabRequestSampleDetailsTemplate.bind({});
LabRequestSampleDetails.args = {
  labRequest: {
    sampleTime: getCurrentDateTimeString(),
    labSampleSite: { name: 'Arm' },
  },
};
