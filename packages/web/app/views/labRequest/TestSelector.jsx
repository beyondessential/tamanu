import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { useFormikContext } from 'formik';
import { components as reactSelectComponents } from 'react-select';

import { subStrSearch } from '../../utils/subStringSearch';
import { Colors } from '../../constants';
import { useApi } from '../../api';
import { useAuth } from '../../contexts/Auth';
import { useSettings } from '../../contexts/Settings';
import { useTranslation } from '../../contexts/Translation';
import { SearchInput } from '../../components/Field';
import { Select, SelectDropdownIndicator } from '../../components/Select';
import { FilterIcon } from '../../components/Icons/FilterIcon';
import { useSuggesterOptions } from '../../hooks';
import { TextButton } from '../../components/Button';
import { BodyText } from '../../components/Typography';
import { TranslatedReferenceData, TranslatedText } from '../../components/Translation';
import {
  CategoryHeader,
  MemberTestRow,
  PanelRow,
  SelectableTestRow,
  SelectedCategoryHeader,
  SelectedGroupCard,
  SelectedItemRow,
} from './TestItem';

const Wrapper = styled.div`
  display: flex;
  width: 100%;
  height: 359px;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  background: ${Colors.white};
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 0.5rem 0.5rem 1rem;
`;

const ListColumn = styled(Column)`
  flex: 62;
`;

const SelectedColumn = styled(Column)`
  flex: 38;
`;

const VerticalLine = styled.div`
  border-left: 1px solid ${Colors.outline};
  height: 100%;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StyledSearchInput = styled(SearchInput)`
  flex: 1;
  margin-top: -2px;
  margin-left: 5px;
  .MuiInputBase-root {
    padding-left: 0;
  }
  .MuiInputBase-input {
    font-size: 14px;
  }
  .MuiOutlinedInput-root {
    .MuiOutlinedInput-notchedOutline,
    &.Mui-focused .MuiOutlinedInput-notchedOutline {
      border: none;
    }
  }
`;

const CategoryFilter = styled(Select)`
  width: 156px;
  flex-shrink: 0;
  margin-bottom: 0.5rem;
`;

const categoryFilterStyles = {
  control: base => ({
    ...base,
    minHeight: '36px',
    height: '36px',
    borderColor: Colors.outline,
    borderRadius: '3px',
    boxShadow: 'none',
    cursor: 'pointer',
    '&:hover': { borderColor: Colors.outline },
  }),
  valueContainer: base => ({ ...base, padding: '0 12px 0 7px' }),
  placeholder: base => ({
    ...base,
    margin: 0,
    color: Colors.darkText,
    fontSize: '14px',
    fontWeight: 500,
  }),
  singleValue: base => ({ ...base, color: Colors.darkText, fontSize: '14px', fontWeight: 500 }),
  dropdownIndicator: base => ({ ...base, padding: '0 12px 0 4px' }),
  option: (base, state) => ({
    ...base,
    fontSize: '14px',
    cursor: 'pointer',
    color: Colors.darkestText,
    backgroundColor: state.isFocused || state.isSelected ? Colors.hoverGrey : Colors.white,
  }),
  menu: base => ({
    ...base,
    marginTop: '2px',
    boxShadow: 'none',
    border: `1px solid ${Colors.outline}`,
  }),
  menuPortal: base => ({ ...base, zIndex: 9999 }),
};

const CategoryFilterControl = ({ children, ...props }) => (
  <reactSelectComponents.Control {...props}>
    <FilterIcon
      htmlColor={Colors.darkText}
      width={18}
      height={12}
      style={{ marginLeft: '14px', flexShrink: 0 }}
    />
    {children}
  </reactSelectComponents.Control>
);

const ScrollList = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex: 1;
`;

const SelectedHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const SectionTitle = styled.span`
  font-size: 15px;
  line-height: 18px;
  color: ${Colors.darkestText};
`;

const ClearAllButton = styled(TextButton)`
  font-size: 14px;
  line-height: 18px;
  font-weight: 400;
  text-transform: none;
  text-decoration: underline;
  color: ${({ theme }) => theme.palette.primary.main};
  &:hover {
    text-decoration: underline;
  }
`;

const EmptyText = styled(BodyText)`
  color: ${Colors.softText};
  padding: 8px 0;
`;

const collator = new Intl.Collator();
// A single alphabetical order mixing tests and panels within a category.
const byName = (a, b) => collator.compare(a.name, b.name);
const byCategoryName = (a, b) => collator.compare(a.category?.name ?? '', b.category?.name ?? '');

const buildPanelItem = panel => {
  const members = [...(panel.labTestTypes ?? [])].sort(
    (a, b) => (a.LabTestPanelLabTestTypes?.order ?? 0) - (b.LabTestPanelLabTestTypes?.order ?? 0),
  );
  return {
    kind: 'panel',
    id: panel.id,
    code: panel.code,
    name: panel.name,
    category: panel.category,
    members,
    memberTestIds: members.map(member => member.id),
  };
};

const buildTestItem = test => ({
  kind: 'test',
  id: test.id,
  code: test.code,
  name: test.name,
  category: test.category,
});

// Group items by category, categories alphabetical, items alphabetical within each.
export const groupByCategory = items => {
  const groups = new Map();
  items.forEach(item => {
    const key = item.category?.id ?? 'uncategorised';
    if (!groups.has(key)) groups.set(key, { category: item.category, items: [] });
    groups.get(key).items.push(item);
  });
  return [...groups.values()]
    .sort(byCategoryName)
    .map(group => ({ ...group, items: [...group.items].sort(byName) }));
};

const referenceName = (item, category) => (
  <TranslatedReferenceData
    category={category}
    value={item.id}
    fallback={item.name}
    data-testid={`refdata-${item.code}`}
  />
);

const CategoryGroupHeader = ({ category, component: HeaderComponent = CategoryHeader }) => (
  <HeaderComponent>
    {category ? (
      referenceName(category, category.type)
    ) : (
      <TranslatedText stringId="lab.testSelect.uncategorised" fallback="Uncategorised" />
    )}
  </HeaderComponent>
);

export const CombinedTestSelector = ({ onSelectionChange }) => {
  const api = useApi();
  const { facilityId } = useAuth();
  const { getTranslation } = useTranslation();
  const { getSetting } = useSettings();
  const onlyAllowLabPanels = getSetting('features.onlyAllowLabPanels');
  const { values, setFieldValue, setValues } = useFormikContext();

  const labTestTypeIds = useMemo(() => values.labTestTypeIds ?? [], [values.labTestTypeIds]);
  const panelIds = useMemo(() => values.panelIds ?? [], [values.panelIds]);
  const labTestTypeIdSet = useMemo(() => new Set(labTestTypeIds), [labTestTypeIds]);
  const panelIdSet = useMemo(() => new Set(panelIds), [panelIds]);

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [expandedPanelIds, setExpandedPanelIds] = useState([]);

  const categoryOptions = useSuggesterOptions({
    field: { value: categoryId },
    endpoint: 'labTestCategory',
    baseOptions: [],
  });

  const testsQuery = useQuery(
    ['labTestType', facilityId],
    () => api.get('labTestType', { facilityId }),
    { placeholderData: [] },
  );
  const panelsQuery = useQuery(
    ['labTestPanel', facilityId],
    () => api.get('labTestPanel', { facilityId }),
    { placeholderData: [] },
  );
  const isLoading = testsQuery.isFetching || panelsQuery.isFetching;

  const testItems = useMemo(() => (testsQuery.data ?? []).map(buildTestItem), [testsQuery.data]);
  const panelItems = useMemo(
    () => (panelsQuery.data ?? []).map(buildPanelItem),
    [panelsQuery.data],
  );
  const testsById = useMemo(
    () => Object.fromEntries(testItems.map(test => [test.id, test])),
    [testItems],
  );
  const panelsById = useMemo(
    () => Object.fromEntries(panelItems.map(panel => [panel.id, panel])),
    [panelItems],
  );

  // Tests already covered by a selected panel cannot be ordered individually.
  const coveredTestIds = useMemo(() => {
    const covered = new Set();
    panelIds.forEach(id => panelsById[id]?.memberTestIds.forEach(testId => covered.add(testId)));
    return covered;
  }, [panelIds, panelsById]);

  const allItems = useMemo(
    () => (onlyAllowLabPanels ? panelItems : [...testItems, ...panelItems]),
    [onlyAllowLabPanels, panelItems, testItems],
  );

  const visibleItems = useMemo(() => {
    const matchesCategory = item => !categoryId || item.category?.id === categoryId;
    const matchesSearch = item => !search || subStrSearch(search, item.name);
    return allItems.filter(item => matchesCategory(item) && matchesSearch(item));
  }, [allItems, categoryId, search]);

  // While searching, the list flattens to matching rows with no category grouping.
  const flatItems = useMemo(
    () => (search ? [...visibleItems].sort(byName) : null),
    [search, visibleItems],
  );
  const groupedItems = useMemo(
    () => (search ? null : groupByCategory(visibleItems)),
    [search, visibleItems],
  );

  const selectedPanels = useMemo(
    () => panelIds.map(id => panelsById[id]).filter(Boolean),
    [panelIds, panelsById],
  );
  const selectedTests = useMemo(
    () => labTestTypeIds.map(id => testsById[id]).filter(Boolean),
    [labTestTypeIds, testsById],
  );
  const selectedGroups = useMemo(
    () => groupByCategory([...selectedPanels, ...selectedTests]),
    [selectedPanels, selectedTests],
  );

  // Feed sample-details: one entry per category (keyed by categoryId downstream), covering every
  // selected panel and individual test in that category. Categories alphabetical, and testNames is
  // the alphabetical list of the category's selected panel + test names shown in the Test column.
  // One entry per category (keyed by the real categoryId the backend resolves — no client-only
  // sentinel), carrying the raw category so the row decides how to render/translate it.
  const samples = useMemo(
    () =>
      selectedGroups.map(group => ({
        categoryId: group.category?.id,
        category: group.category,
        testNames: group.items.map(item => item.name),
      })),
    [selectedGroups],
  );

  useEffect(() => {
    onSelectionChange?.(samples);
  }, [samples, onSelectionChange]);

  const toggleTest = (id, checked) =>
    setFieldValue(
      'labTestTypeIds',
      checked ? [...labTestTypeIds, id] : labTestTypeIds.filter(testId => testId !== id),
    );

  const togglePanel = (id, checked) => {
    if (checked) {
      const covered = new Set(panelsById[id]?.memberTestIds ?? []);
      // One update so the step schema validates once and the samples effect fires once.
      setValues(current => ({
        ...current,
        panelIds: [...(current.panelIds ?? []), id],
        labTestTypeIds: (current.labTestTypeIds ?? []).filter(testId => !covered.has(testId)),
      }));
    } else {
      setFieldValue(
        'panelIds',
        panelIds.filter(panelId => panelId !== id),
      );
    }
  };

  const toggleExpanded = id =>
    setExpandedPanelIds(current =>
      current.includes(id) ? current.filter(panelId => panelId !== id) : [...current, id],
    );

  const removeItem = id => {
    if (panelsById[id]) togglePanel(id, false);
    else toggleTest(id, false);
  };

  const clearAll = () => setValues(current => ({ ...current, labTestTypeIds: [], panelIds: [] }));

  const coveredTooltip = getTranslation(
    'lab.testSelect.coveredByPanel',
    'A panel containing this test has already been selected',
  );

  const renderItem = item => {
    if (item.kind === 'panel') {
      const isExpanded = expandedPanelIds.includes(item.id);
      return (
        <PanelRow
          key={item.id}
          id={item.id}
          label={referenceName(item, 'labTestPanel')}
          testCount={
            <TranslatedText
              stringId="lab.testSelect.panelTestCount"
              fallback="(:count tests)"
              replacements={{ count: item.members.length }}
              data-testid={`panelcount-${item.code}`}
            />
          }
          checked={panelIdSet.has(item.id)}
          expanded={isExpanded}
          onToggleExpand={toggleExpanded}
          onChange={togglePanel}
        >
          {isExpanded &&
            item.members.map(member => (
              <MemberTestRow key={member.id} data-testid={`member-${member.code}`}>
                {referenceName(member, 'labTestType')}
              </MemberTestRow>
            ))}
        </PanelRow>
      );
    }
    return (
      <SelectableTestRow
        key={item.id}
        id={item.id}
        label={referenceName(item, 'labTestType')}
        checked={labTestTypeIdSet.has(item.id)}
        disabled={coveredTestIds.has(item.id)}
        disabledTooltip={coveredTooltip}
        onChange={toggleTest}
      />
    );
  };

  const selectedCount = labTestTypeIds.length + panelIds.length;

  return (
    <Wrapper data-testid="test-selector">
      <ListColumn data-testid="test-selector-list">
        <Controls>
          <StyledSearchInput
            name="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            onClear={() => setSearch('')}
            placeholder={getTranslation('lab.testSelect.searchPlaceholder', 'Search test or panel')}
            data-testid="test-selector-search"
          />
          <CategoryFilter
            classNamePrefix="react-select"
            styles={categoryFilterStyles}
            options={[
              { value: '', label: getTranslation('general.select.all', 'All') },
              ...categoryOptions,
            ]}
            value={
              categoryId
                ? (categoryOptions.find(option => option.value === categoryId) ?? null)
                : null
            }
            onChange={option => setCategoryId(option?.value ?? '')}
            placeholder={getTranslation('lab.testSelect.categoryFilter.label', 'Category')}
            isSearchable={false}
            isClearable={false}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            components={{
              Control: CategoryFilterControl,
              DropdownIndicator: SelectDropdownIndicator,
            }}
            data-testid="test-selector-category-filter"
          />
        </Controls>
        <ScrollList>
          {isLoading && (
            <EmptyText data-testid="test-selector-loading">
              <TranslatedText stringId="general.table.loading" fallback="Loading…" />
            </EmptyText>
          )}
          {!isLoading && visibleItems.length === 0 && (
            <EmptyText data-testid="test-selector-empty">
              <TranslatedText
                stringId="lab.testSelect.noResults"
                fallback="No tests or panels found"
              />
            </EmptyText>
          )}
          {!isLoading && search && flatItems.map(renderItem)}
          {!isLoading &&
            !search &&
            groupedItems?.map(group => (
              <React.Fragment key={group.category?.id ?? 'uncategorised'}>
                <CategoryGroupHeader category={group.category} />
                {group.items.map(renderItem)}
              </React.Fragment>
            ))}
        </ScrollList>
      </ListColumn>
      <VerticalLine />
      <SelectedColumn data-testid="test-selector-selected">
        <SelectedHeader>
          <SectionTitle>
            <TranslatedText
              stringId="lab.testSelect.selected"
              fallback="Selected (:count)"
              replacements={{ count: selectedCount }}
            />
          </SectionTitle>
          {selectedCount > 0 && (
            <ClearAllButton onClick={clearAll} data-testid="test-selector-clear-all">
              <TranslatedText stringId="general.action.clearAll" fallback="Clear all" />
            </ClearAllButton>
          )}
        </SelectedHeader>
        <ScrollList>
          {selectedGroups.map(group => (
            <SelectedGroupCard key={group.category?.id ?? 'uncategorised'}>
              <CategoryGroupHeader category={group.category} component={SelectedCategoryHeader} />
              {group.items.map(item => (
                <SelectedItemRow
                  key={item.id}
                  id={item.id}
                  label={referenceName(
                    item,
                    item.kind === 'panel' ? 'labTestPanel' : 'labTestType',
                  )}
                  onRemove={removeItem}
                />
              ))}
            </SelectedGroupCard>
          ))}
        </ScrollList>
      </SelectedColumn>
    </Wrapper>
  );
};
