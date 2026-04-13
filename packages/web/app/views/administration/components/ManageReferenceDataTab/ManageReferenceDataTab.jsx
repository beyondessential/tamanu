import React, { useCallback, useMemo, useState } from 'react';

import styled from 'styled-components';
import { SelectInput, Button } from '@tamanu/ui-components';
import { SYSTEM_DATA_TYPES } from '@tamanu/constants';
import { DataFetchingTable } from '../../../../components/Table/DataFetchingTable';
import { Colors } from '../../../../constants/styles';
import { TranslatedText } from '../../../../components/Translation/TranslatedText';
import { ThemedTooltip } from '../../../../components/Tooltip';
import { PlusIcon } from '../../../../assets/icons/PlusIcon';
import { ConfirmModal } from '../../../../components/ConfirmModal';
import { ThreeDotMenu } from '../../../../components/ThreeDotMenu';
import { SearchBar } from './SearchBar';
import { AddReferenceDataModal } from './AddReferenceDataModal';
import { EditReferenceDataModal } from './EditReferenceDataModal';
import { useReferenceDataColumns } from './useReferenceDataColumns';
import { useReferenceDataDeleteMutation } from './useReferenceDataDeleteMutation';
import { DATA_TYPE_OPTIONS, ENDPOINT } from './constants';

const Container = styled.div`
  margin: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: calc(100vh - 200px);
  overflow: auto;
  border: 1px solid ${Colors.outline};
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${Colors.outline};
`;

const SelectContainer = styled.div`
  align-items: center;
  gap: 12px;
  width: 18.75rem;
`;

const StyledAddButton = styled(Button)`
  min-height: 44px;
`;

const TableWrapper = styled.div`
  flex: 1;
  min-height: 0;

  .MuiTableBody-root .MuiTableRow-root {
    cursor: pointer;
    &:hover {
      background-color: ${Colors.veryLightBlue};
    }
  }
`;

const PlaceholderBox = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${Colors.background};
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  color: ${Colors.primary};
  font-weight: 500;
  font-size: 14px;
  overflow: auto;
`;

export const ManageReferenceDataTab = () => {
  const [selectedType, setSelectedType] = useState('');
  const { data: columns = [] } = useReferenceDataColumns(selectedType);
  const [searchParams, setSearchParams] = useState({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);

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

  const [deletingRecordId, setDeletingRecordId] = useState(null);

  const { mutateAsync: deleteRecord } = useReferenceDataDeleteMutation({
    onSuccess: () => {
      setDeletingRecordId(null);
      handleSuccess();
    },
  });

  const handleRowClick = useCallback(row => {
    if (selectedType === SYSTEM_DATA_TYPES.REFERENCE_DATA_RELATION) return;
    setEditingRecord(row);
  }, [selectedType]);

  const tableColumns = useMemo(() => {
    const cols = columns.map(col => {
      const column = {
        key: col.key,
        title: col.key,
        sortable: true,
      };
      if (col.type === 'BOOLEAN') {
        column.accessor = row => (row[col.key] ? 'Yes' : 'No');
      }
      return column;
    });

    if (selectedType === SYSTEM_DATA_TYPES.REFERENCE_DATA_RELATION) {
      cols.push({
        key: 'actions',
        title: '',
        sortable: false,
        dontCallRowInput: true,
        CellComponent: ({ data }) => (
          <ThreeDotMenu
            items={[
              {
                label: (
                  <TranslatedText stringId="general.action.delete" fallback="Delete" />
                ),
                onClick: () => setDeletingRecordId(data.id),
              },
            ]}
          />
        ),
      });
    }

    return cols;
  }, [columns, selectedType]);

  const fetchOptions = useMemo(
    () => ({
      ...searchParams,
      referenceDataType: selectedType,
    }),
    [selectedType, searchParams],
  );

  return (
    <Container data-testid="manage-refdata-container">
      <TopRow data-testid="toprow-refdata">
        <SelectContainer data-testid="selectcontainer-refdata">
          <SelectInput
            id="reference-data-type-select"
            value={selectedType}
            onChange={handleTypeChange}
            options={DATA_TYPE_OPTIONS}
            placeholder={
              <TranslatedText
                stringId="admin.referenceData.selectTypePlaceholder"
                fallback="Select reference data..."
                data-testid="translatedtext-select-refdata-type"
              />
            }
            data-testid="selectinput-refdata-type"
          />
        </SelectContainer>
        <ThemedTooltip
          title={
            !selectedType ? (
              <TranslatedText
                stringId="admin.referenceData.selectTypeToAdd"
                fallback="Select desired reference data to add new"
                data-testid="translatedtext-tooltip-add-refdata"
              />
            ) : (
              ''
            )
          }
        >
          <span>
            <StyledAddButton
              color="primary"
              variant="contained"
              disabled={!selectedType}
              onClick={() => setIsAddModalOpen(true)}
              data-testid="add-refdata-button"
            >
              <PlusIcon width={18} height={18} style={{ marginInlineEnd: '0.5em' }} />
              <TranslatedText
                stringId="admin.referenceData.addNew"
                fallback="Add reference data"
                data-testid="translatedtext-add-refdata"
              />
            </StyledAddButton>
          </span>
        </ThemedTooltip>
      </TopRow>
      {selectedType && columns.length > 0 && (
        <>
          <SearchBar columns={columns} onSearch={handleSearch} data-testid="searchbar-refdata" />
          <TableWrapper>
            <DataFetchingTable
              endpoint={ENDPOINT}
              columns={tableColumns}
              fetchOptions={fetchOptions}
              defaultRowsPerPage={10}
              initialSort={{ orderBy: 'createdAt', order: 'asc' }}
              fixedHeader
              refreshCount={refreshCount}
              onRowClick={handleRowClick}
              containerStyle="table { width: 100%; }"
              noDataMessage={
                <TranslatedText
                  stringId="admin.referenceData.noData"
                  fallback="No reference data found"
                  data-testid="translatedtext-nodata-refdata"
                />
              }
              data-testid="table-refdata-manage"
            />
          </TableWrapper>
        </>
      )}
      {!selectedType && (
        <PlaceholderBox data-testid="placeholder-refdata">
          <TranslatedText
            stringId="admin.referenceData.selectTypePrompt"
            fallback="Select the desired reference data from the field above to view."
            data-testid="translatedtext-prompt-refdata"
          />
        </PlaceholderBox>
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
      {Boolean(deletingRecordId) && (
        <ConfirmModal
          open={Boolean(deletingRecordId)}
          title={
            <TranslatedText
              stringId="admin.referenceData.deleteTitle"
              fallback="Delete item"
              data-testid="translatedtext-delete-refdata-title"
            />
          }
          subText={
            <>
              <TranslatedText
                stringId="admin.referenceData.deleteConfirmPrefix"
                fallback="Are you sure you would like to delete "
                data-testid="translatedtext-delete-refdata-prefix"
              />
              <b>{deletingRecordId}</b>?
            </>
          }
          confirmButtonText={
            <TranslatedText
              stringId="admin.referenceData.deleteConfirmButton"
              fallback="Delete item"
              data-testid="translatedtext-delete-refdata-button"
            />
          }
          onConfirm={() => deleteRecord(deletingRecordId)}
          onCancel={() => setDeletingRecordId(null)}
          data-testid="confirm-delete-refdata"
        />
      )}
    </Container>
  );
};
