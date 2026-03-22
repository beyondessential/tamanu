import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { SelectInput, Button } from '@tamanu/ui-components';
import { DataFetchingTable } from '../../../../components/Table/DataFetchingTable';
import { Colors } from '../../../../constants/styles';
import { TranslatedText } from '../../../../components/Translation/TranslatedText';
import { useApi } from '../../../../api';
import { SearchBar } from './SearchBar';
import { AddReferenceDataModal } from './AddReferenceDataModal';
import { EditReferenceDataModal } from './EditReferenceDataModal';
import { DATA_TYPE_OPTIONS, ENDPOINT, COLUMNS_ENDPOINT } from './constants';

const Container = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow: hidden;
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
`;

const SelectContainer = styled.div`
  align-items: center;
  gap: 12px;
  width: 18.75rem;
`;

const SelectLabel = styled.label`
  font-weight: 500;
  font-size: 14px;
  white-space: nowrap;
  color: ${Colors.darkText};
`;

const StyledDataFetchingTable = styled(DataFetchingTable)`
  flex: 1;
  min-height: 0;
  box-shadow: none;

  .MuiTableBody-root .MuiTableRow-root {
    cursor: pointer;
    &:hover {
      background-color: ${Colors.veryLightBlue};
    }
  }
`;

export const ManageReferenceDataTab = memo(() => {
  const api = useApi();
  const [selectedType, setSelectedType] = useState('');
  const [columns, setColumns] = useState([]);
  const [searchParams, setSearchParams] = useState({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    if (!selectedType) {
      setColumns([]);
      return;
    }
    (async () => {
      const result = await api.get(COLUMNS_ENDPOINT, { type: selectedType });
      setColumns(result);
    })();
  }, [api, selectedType]);

  const handleTypeChange = useCallback(event => {
    const newType = event.target.value;
    setSelectedType(newType);
    setSearchParams({});
  }, []);

  const handleSearch = useCallback(params => {
    setSearchParams(params);
  }, []);

  const handleSuccess = useCallback(() => {
    setRefreshCount(prev => prev + 1);
  }, []);

  const handleRowClick = useCallback(row => {
    setEditingRecord(row);
  }, []);

  const tableColumns = useMemo(
    () =>
      columns.map(col => ({
        key: col.key,
        title: col.key,
        sortable: true,
      })),
    [columns],
  );

  const fetchOptions = useMemo(
    () => ({
      type: selectedType,
      ...searchParams,
    }),
    [selectedType, searchParams],
  );

  return (
    <Container data-testid="manage-refdata-container">
      <TopRow data-testid="toprow-refdata">
        <SelectContainer data-testid="selectcontainer-refdata">
          <SelectLabel htmlFor="reference-data-type-select">
            <TranslatedText
              stringId="admin.referenceData.selectType"
              fallback="Select reference data"
              data-testid="translatedtext-select-refdata"
            />
          </SelectLabel>
          <SelectInput
            id="reference-data-type-select"
            value={selectedType}
            onChange={handleTypeChange}
            options={DATA_TYPE_OPTIONS}
            placeholder="Select a type..."
            data-testid="selectinput-refdata-type"
          />
        </SelectContainer>
        <Button
          color="primary"
          variant="contained"
          disabled={!selectedType}
          onClick={() => setIsAddModalOpen(true)}
          data-testid="add-refdata-button"
        >
          <TranslatedText
            stringId="admin.referenceData.addNew"
            fallback="+ Add reference data"
            data-testid="translatedtext-add-refdata"
          />
        </Button>
      </TopRow>
      {selectedType && columns.length > 0 && (
        <>
          <SearchBar columns={columns} onSearch={handleSearch} data-testid="searchbar-refdata" />
          <StyledDataFetchingTable
            endpoint={ENDPOINT}
            columns={tableColumns}
            fetchOptions={fetchOptions}
            defaultRowsPerPage={10}
            initialSort={{ orderBy: 'createdAt', order: 'asc' }}
            fixedHeader
            refreshCount={refreshCount}
            onRowClick={handleRowClick}
            noDataMessage={
              <TranslatedText
                stringId="admin.referenceData.noData"
                fallback="No reference data found"
                data-testid="translatedtext-nodata-refdata"
              />
            }
            data-testid="table-refdata-manage"
          />
        </>
      )}
      {!selectedType && (
        <div
          style={{ textAlign: 'center', padding: '60px 0', color: Colors.softText }}
          data-testid="placeholder-refdata"
        >
          <TranslatedText
            stringId="admin.referenceData.selectTypePrompt"
            fallback="Select a reference data type to view and manage records"
            data-testid="translatedtext-prompt-refdata"
          />
        </div>
      )}
      {isAddModalOpen && (
        <AddReferenceDataModal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          columns={columns}
          selectedType={selectedType}
          onSuccess={handleSuccess}
          data-testid="add-refdata-modal"
        />
      )}
      {Boolean(editingRecord) && (
        <EditReferenceDataModal
          open={Boolean(editingRecord)}
          onClose={() => setEditingRecord(null)}
          columns={columns}
          selectedType={selectedType}
          record={editingRecord}
          onSuccess={handleSuccess}
          data-testid="edit-refdata-modal"
        />
      )}
    </Container>
  );
});
