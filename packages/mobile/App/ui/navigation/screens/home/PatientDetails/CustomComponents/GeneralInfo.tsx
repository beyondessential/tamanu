import React, { ReactElement } from 'react';
import { chunk } from 'lodash';
import { Chance } from 'chance';

import { PatientGeneralInformationDataProps } from '/interfaces/PatientDetails';
import { StyledView, RowView } from '/styled/common';
import { SectionHeader } from '/components/SectionHeader';
import { InformationBox } from './InformationBox';
import { formatDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';

export const GeneralInfo = (
  data: PatientGeneralInformationDataProps,
): ReactElement => {
  const chance = new Chance(data.generalInfo.id); // seed random with user id for reproducible values

  const fields = [
    ['First name', data.generalInfo.firstName],
    ['Middle name', data.generalInfo.middleName || 'None'],

    ['Last name', data.generalInfo.lastName],
    ['Cultural/tradition name', data.generalInfo.culturalName || 'None'],

    ['Date of Birth', formatDate(new Date(data.generalInfo.dateOfBirth), DateFormats.DDMMYY)],
    ['Blood type', `${chance.pickone(['A', 'B', 'AB', 'O'])}${chance.pickone(['+', '-'])}`],

    ['Residential address', `${chance.address()}, ${chance.city()}, Fiji`],
    ['Contact number', `${chance.phone({ formatted: false }).slice(0, 3)} ${chance.phone({ formatted: false }).slice(0, 4)}`],

    ['Social media platform', chance.pickone(['Facebook', 'Instagram', 'LinkedIn', 'Twitter', 'Viber', 'Whatsapp'])],
    ['Social media name', `@${chance.animal().replace(/[^a-zA-Z]/g, '')}${chance.natural({ min: 0, max: 99, exclude: [69] })}`],

    ['Email', chance.email()],
    ['Village', data.generalInfo.villageId || 'Not Listed'],
  ];

  const rows = chunk(fields, 2);
  return (
    <StyledView width="100%">
      <SectionHeader h1 fontWeight={500}>
        General Information
      </SectionHeader>
      {rows.map((row, i) => (
        <RowView key={i} marginTop={20}>
          {row.map(([title, info]) => (
            <InformationBox
              key={title}
              flex={1}
              title={title}
              info={info}
            />
          ))}
        </RowView>
      ))}
    </StyledView >
  );
};
