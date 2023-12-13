import React from 'react';
import { DateDisplay } from '../../../components';
import { InfoCard, InfoCardItem } from '../../../components/InfoCard';

export const LabRequestSampleDetailsCard = ({ labRequest }) => (
  <InfoCard>
    <InfoCardItem
      label="Date & time"
      value={<DateDisplay date={labRequest.sampleTime} showTime />}
    />
    <InfoCardItem label="Collected by" value={labRequest.collectedBy?.displayName || '-'} />
    <InfoCardItem label="Specimen type" value={labRequest.specimenType?.name || '-'} />
    <InfoCardItem label="Site" value={labRequest.site?.name || '-'} />
  </InfoCard>
);
