import React, { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { Popper } from '@material-ui/core';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { DIAGNOSIS_CERTAINTY } from '@tamanu/constants';
import { UnstyledHtmlButton } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { DiagnosisCertaintyTag } from '../../../components/DiagnosisCertaintyTag';
import { TranslatedReferenceData, TranslatedText } from '../../../components/Translation';
import { useAuth } from '../../../contexts/Auth';

// Listed in this order, then alphabetically by diagnosis within each certainty.
const DISPLAYED_CERTAINTIES = [
  DIAGNOSIS_CERTAINTY.CONFIRMED,
  DIAGNOSIS_CERTAINTY.EMERGENCY,
  DIAGNOSIS_CERTAINTY.SUSPECTED,
];

// The panel shows at most this many lines, and lists whatever does not fit in a dropdown.
const MAX_LINES = 3;

// A diagnosis's reference data can be missing, such as when it has been deleted or has yet to sync.
const getDiagnosisName = ({ diagnosis }) => diagnosis?.name ?? '';

const getDisplayedPrimaryDiagnoses = diagnoses =>
  diagnoses
    .filter(({ isPrimary, certainty }) => isPrimary && DISPLAYED_CERTAINTIES.includes(certainty))
    .sort(
      (a, b) =>
        DISPLAYED_CERTAINTIES.indexOf(a.certainty) - DISPLAYED_CERTAINTIES.indexOf(b.certainty) ||
        getDiagnosisName(a).localeCompare(getDiagnosisName(b)),
    );

// Which line of the list each element is on, counting from 0.
const getLineIndexes = elements =>
  elements.reduce((lineIndexes, element, index) => {
    if (index === 0) return [0];
    const previousElement = elements[index - 1];
    const startsNewLine =
      element.offsetTop >= previousElement.offsetTop + previousElement.offsetHeight / 2;
    return [...lineIndexes, lineIndexes[index - 1] + (startsNewLine ? 1 : 0)];
  }, []);

const Divider = styled.hr`
  margin: 16px 0 0;
  border: none;
  border-top: 1px solid ${Colors.softOutline};
`;

const Panel = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: fit-content;
  max-width: 1050px;
  margin-top: 16px;
  padding: 6px 12px;
  border: 1px solid ${Colors.primary};
  border-radius: 5px;
  background-color: ${Colors.white};
  font-size: 14px;
  line-height: 18px;
`;

// Padded to the height of a diagnosis's certainty pill, so it lines up with the first line.
const Label = styled.span`
  flex-shrink: 0;
  padding-block: 3.5px;
  color: ${Colors.darkText};
`;

// A name too long for the panel is cut off rather than spilling past its border.
const List = styled.ul.attrs({ role: 'list' })`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 24px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Item = styled.li`
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
`;

const DiagnosisName = styled.span`
  font-weight: 500;
  color: ${Colors.darkestText};
`;

const MoreToggle = styled(UnstyledHtmlButton)`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding-block: 3.5px;
  font-weight: 500;
  color: ${Colors.primary};
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }

  svg {
    transition: transform 150ms;
  }

  &[aria-expanded='true'] svg {
    transform: rotate(180deg);
  }
`;

const Menu = styled.div`
  margin: 4px 0;
  padding: 3px;
  max-height: 320px;
  overflow-y: auto;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  background-color: ${Colors.white};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  font-size: 14px;
  line-height: 18px;
`;

const MenuList = styled.ul.attrs({ role: 'list' })`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const MenuItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 6px 12px;
  white-space: nowrap;
`;

const DiagnosisWithCertainty = ({ encounterDiagnosis: { diagnosis, certainty } }) => (
  <>
    {diagnosis && (
      <DiagnosisName data-testid="diagnosisname-primary-diagnosis">
        <TranslatedReferenceData
          fallback={diagnosis.name}
          value={diagnosis.id}
          category="diagnosis"
          data-testid="translatedreferencedata-primary-diagnosis"
        />
      </DiagnosisName>
    )}
    <DiagnosisCertaintyTag
      certainty={certainty}
      data-testid="diagnosiscertaintytag-primary-diagnosis"
    />
  </>
);

/**
 * As many diagnoses as fit on the panel's lines, then a toggle to a dropdown listing the rest.
 *
 * How many fit depends on the room the panel has and on the diagnoses' names, so it is measured as
 * the list renders rather than fixed at a count.
 */
const PrimaryDiagnosisList = ({ diagnoses, roomWidth }) => {
  const menuId = useId();
  const listRef = useRef(null);
  const toggleRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [inlineCount, setInlineCount] = useState(diagnoses.length);

  // What fits is measured afresh, starting from every diagnosis inline, whenever the diagnoses or
  // the room for them change. The dropdown closes then, as what it lists may change.
  const [measuredFor, setMeasuredFor] = useState({ diagnoses, roomWidth });
  if (measuredFor.diagnoses !== diagnoses || measuredFor.roomWidth !== roomWidth) {
    setMeasuredFor({ diagnoses, roomWidth });
    setInlineCount(diagnoses.length);
    setIsMenuOpen(false);
  }

  // Measured before the browser paints, so the list never shows more lines than it keeps.
  useLayoutEffect(() => {
    const lineIndexes = getLineIndexes([...listRef.current.children]);
    if (lineIndexes[lineIndexes.length - 1] < MAX_LINES) return;

    const countOnKeptLines = lineIndexes
      .slice(0, inlineCount)
      .filter(lineIndex => lineIndex < MAX_LINES).length;
    // At least one fewer each time, until the toggle fits on the last kept line too.
    setInlineCount(Math.min(countOnKeptLines, inlineCount - 1));
  }, [inlineCount, measuredFor]);

  const inlineDiagnoses = diagnoses.slice(0, inlineCount);
  const menuDiagnoses = diagnoses.slice(inlineCount);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <List ref={listRef} data-testid="list-primary-diagnoses">
        {inlineDiagnoses.map(encounterDiagnosis => (
          <Item
            key={encounterDiagnosis.id}
            data-testid={`item-primary-diagnosis-${encounterDiagnosis.id}`}
          >
            <DiagnosisWithCertainty encounterDiagnosis={encounterDiagnosis} />
          </Item>
        ))}
        {menuDiagnoses.length > 0 && (
          <Item key="more" data-testid="item-primary-diagnoses-more">
            <MoreToggle
              ref={toggleRef}
              aria-expanded={isMenuOpen}
              aria-controls={menuId}
              onClick={() => setIsMenuOpen(isOpen => !isOpen)}
              onKeyDown={event => event.key === 'Escape' && closeMenu()}
              data-testid="moretoggle-primary-diagnoses"
            >
              <TranslatedText
                stringId="encounter.primaryDiagnosis.moreToggle"
                fallback="+:count more"
                replacements={{ count: menuDiagnoses.length }}
                data-testid="translatedtext-primary-diagnoses-more"
              />
              <ExpandMoreIcon fontSize="small" aria-hidden />
            </MoreToggle>
          </Item>
        )}
      </List>
      <Popper
        open={isMenuOpen && menuDiagnoses.length > 0}
        anchorEl={toggleRef.current}
        placement="bottom-start"
        style={{ zIndex: 10 }}
        data-testid="popper-primary-diagnoses"
      >
        <ClickAwayListener
          mouseEvent="onMouseDown"
          // The toggle opens and closes the menu itself.
          onClickAway={event => !toggleRef.current.contains(event.target) && closeMenu()}
        >
          <Menu id={menuId} data-testid="menu-primary-diagnoses">
            <MenuList>
              {menuDiagnoses.map(encounterDiagnosis => (
                <MenuItem
                  key={encounterDiagnosis.id}
                  data-testid={`menuitem-primary-diagnosis-${encounterDiagnosis.id}`}
                >
                  <DiagnosisWithCertainty encounterDiagnosis={encounterDiagnosis} />
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </ClickAwayListener>
      </Popper>
    </>
  );
};

const PrimaryDiagnosisPanel = ({ diagnoses }) => {
  const dividerRef = useRef(null);
  const [roomWidth, setRoomWidth] = useState(null);

  // The divider spans the room the panel has, and unlike the panel its height never changes with
  // what it lists, so observing it hears only of the room changing.
  useLayoutEffect(() => {
    const resizeObserver = new ResizeObserver(([entry]) => setRoomWidth(entry.contentRect.width));
    resizeObserver.observe(dividerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <>
      <Divider ref={dividerRef} />
      <Panel data-testid="panel-primary-diagnoses">
        <Label>
          <TranslatedText
            stringId="encounter.diagnosis.type.primary.full"
            fallback="Primary diagnosis"
            data-testid="translatedtext-primary-diagnoses-label"
          />
          :
        </Label>
        <PrimaryDiagnosisList diagnoses={diagnoses} roomWidth={roomWidth} />
      </Panel>
    </>
  );
};

/**
 * The encounter's primary diagnoses, shown in the encounter details above the encounter's tabs,
 * whichever is selected. Shows nothing for a user who cannot list diagnoses, or when there are none
 * to list.
 */
export const PrimaryDiagnoses = ({ diagnoses }) => {
  const { ability } = useAuth();
  const canListDiagnoses = ability.can('list', 'EncounterDiagnosis');
  const displayedDiagnoses = useMemo(() => getDisplayedPrimaryDiagnoses(diagnoses), [diagnoses]);
  if (!canListDiagnoses || displayedDiagnoses.length === 0) return null;
  return <PrimaryDiagnosisPanel diagnoses={displayedDiagnoses} />;
};
