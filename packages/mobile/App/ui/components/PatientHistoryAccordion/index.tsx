import React, { type ReactElement, useState } from 'react';
import Accordion from 'react-native-collapsible/Accordion';
import type { Encounter } from '~/models/Encounter';
import type { HistoryTableRows } from '~/ui/interfaces/HistoryTable';
import { HistoryTable } from '../HistoryTable';
import Header from './Header';
import { StyledScrollView } from '/styled/common';

interface AccordionListProps {
  dataArray: Encounter[];
  rows: HistoryTableRows;
}

const keyExtractor = item => item.id;

export const PatientHistoryAccordion = ({ dataArray, rows }: AccordionListProps): ReactElement => {
  const [activeSections, setActiveSections] = useState<number[]>([]);

  return (
    <StyledScrollView flex={1} width="100%">
      <Accordion
        sections={dataArray}
        underlayColor="transparent"
        activeSections={activeSections}
        renderHeader={Header}
        renderContent={section => <HistoryTable data={section} rows={rows} />}
        onChange={setActiveSections}
        keyExtractor={keyExtractor}
      />
    </StyledScrollView>
  );
};
