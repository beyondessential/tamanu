import React from 'react';
import styled from 'styled-components';
import { PATIENT_STATUSES } from '@tamanu/constants';
import { Colors, PATIENT_STATUS, PATIENT_STATUS_COLORS } from '../../../constants';
import { SectionName, SectionPeriod } from './SectionTitle';

// The section's own colour, the one its encounter types carry in the encounter view. Keyed by the
// section's code rather than the web's title-case status, which also carries a Deceased entry
// that is not an encounter category.
const SECTION_COLORS = {
  [PATIENT_STATUSES.INPATIENT]: PATIENT_STATUS_COLORS[PATIENT_STATUS.INPATIENT],
  [PATIENT_STATUSES.OUTPATIENT]: PATIENT_STATUS_COLORS[PATIENT_STATUS.OUTPATIENT],
  [PATIENT_STATUSES.EMERGENCY]: PATIENT_STATUS_COLORS[PATIENT_STATUS.EMERGENCY],
};

// A configured section that is not one of the encounter categories, which a deployment can add.
const OTHER_SECTION_COLOUR = Colors.primary;

const HeaderRow = styled.tr`
  background-color: ${Colors.background2};
  border-block-end: 1px solid ${p => p.theme.palette.divider};
`;

const HeaderCell = styled.td`
  font-size: 14px;
  font-weight: 500;
`;

const Marker = styled.span`
  display: inline-block;
  inline-size: 3px;
  block-size: 14px;
  border-radius: 2px;
  margin-inline-end: 8px;
  vertical-align: -2px;
`;

const Period = styled.span`
  font-weight: 400;
  color: ${p => p.theme.palette.text.tertiary};
  margin-inline-start: 8px;
`;

export const InvoiceSectionHeader = ({ section, columnCount }) => (
  <HeaderRow>
    <HeaderCell colSpan={columnCount}>
      <Marker
        style={{ backgroundColor: SECTION_COLORS[section.code] ?? OTHER_SECTION_COLOUR }}
      />
      <SectionName section={section} />
      {section.startDate && (
        <Period>
          <SectionPeriod section={section} />
        </Period>
      )}
    </HeaderCell>
  </HeaderRow>
);
