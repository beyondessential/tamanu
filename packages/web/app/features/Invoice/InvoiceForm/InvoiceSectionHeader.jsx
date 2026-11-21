import React from 'react';
import styled from 'styled-components';
import { OutlinedButton, TranslatedText } from '@tamanu/ui-components';
import { PATIENT_STATUSES } from '@tamanu/constants';
import { Colors, PATIENT_STATUS, PATIENT_STATUS_COLORS } from '../../../constants';
import { NoteModalActionBlocker } from '../../../components';
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
  border-block-end: 1px solid ${Colors.outline};
`;

// The colour runs the full height of the row's leading edge as an inset shadow, so it needs no
// element of its own and cannot fall short of a header that wraps. Doubled to outrank the table's
// own padding and alignment, which are set on every th and td it holds.
const HeaderCell = styled.th`
  && {
    padding-block: 6px;
    text-align: start;
    vertical-align: middle;
    font-size: 12px;
    font-weight: 400;
    color: ${Colors.midText};
    box-shadow: inset 3px 0 0 var(--encounter-type-colour);
  }
`;

const Name = styled.span`
  color: ${Colors.darkestText};
  font-weight: 500;
  margin-inline-end: 12px;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const InvoiceSectionHeader = ({ section, columnCount, onInsurance }) => (
  <HeaderRow>
    <HeaderCell
      scope="rowgroup"
      colSpan={columnCount}
      style={{
        '--encounter-type-colour': SECTION_COLORS[section.code] ?? OTHER_SECTION_COLOUR,
      }}
    >
      <HeaderContent>
        <span>
          <Name>
            <SectionName section={section} />
          </Name>
          <SectionPeriod section={section} />
        </span>
        {onInsurance && (
          <NoteModalActionBlocker>
            <OutlinedButton size="small" onClick={onInsurance}>
              <TranslatedText stringId="invoice.action.insurance" fallback="Insurance plan" />
            </OutlinedButton>
          </NoteModalActionBlocker>
        )}
      </HeaderContent>
    </HeaderCell>
  </HeaderRow>
);
