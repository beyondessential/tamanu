import React from 'react';
import { InfoCard, InfoCardItem } from '../../../components/InfoCard';
import { DateDisplay } from '../../../components';

export const LabRequestSampleDetailsCard = ({ labRequest }) => (
  <InfoCard>
    <InfoCardItem
      label="Sample date & time"
      value={<DateDisplay date={labRequest.sampleTime} showTime />}
    />
    <InfoCardItem label="Site" value={labRequest.labSampleSite?.name || '-'} />
  </InfoCard>
);
