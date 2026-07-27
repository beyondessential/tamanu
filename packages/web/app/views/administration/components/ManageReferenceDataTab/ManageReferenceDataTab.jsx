import AddIcon from '@mui/icons-material/Add';
import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

import { SYSTEM_DATA_TYPES } from '@tamanu/constants';
import {
  Button,
  SelectInput,
  ThemedTooltip,
  TranslatedText,
  VisuallyHidden,
} from '@tamanu/ui-components';
import { ConfirmModal } from '../../../../components/ConfirmModal';
import { DataFetchingTable } from '../../../../components/Table/DataFetchingTable';
import { ThreeDotMenu } from '../../../../components/ThreeDotMenu';
import { AddReferenceDataModal } from './AddReferenceDataModal';
import { DATA_TYPE_OPTIONS, ENDPOINT } from './constants';
import { EditReferenceDataModal } from './EditReferenceDataModal';
import { SearchBar } from './SearchBar';
import { useReferenceDataColumns } from './useReferenceDataColumns';
import { useReferenceDataDeleteMutation } from './useReferenceDataDeleteMutation';

const Container = styled.div`
  margin: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-block-size: calc(100vh - 200px);
  overflow: auto;
  border: 1px solid ${p => p.theme.palette.divider};
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  padding-block-end: 16px;
  border-block-end: 1px solid ${p => p.theme.palette.divider};
`;

const SelectContainer = styled.div`
  align-items: center;
  gap: 12px;
  inline-size: 18.75rem;
`;

const StyledAddButton = styled(Button)`
  min-block-size: 44px;
`;

const TableWrapper = styled.div`
  flex: 1;
  min-height: 0;

  .MuiTableBody-root .MuiTableRow-root {
    cursor: pointer;
    &:hover {
      background-color: ${p => p.theme.palette.action.hover};
    }
  }
`;

const PlaceholderBox = styled.div`
  flex: 1 1 auto;
  min-block-size: 0;
  block-size: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${p => p.theme.palette.background.default};
  border: 1px solid ${p => p.theme.palette.divider};
  border-radius: ${p => p.theme.shape.borderRadius}px;
  color: ${p => p.theme.palette.primary.main};
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

  const handleRowClick = useCallback(
    row => {
      if (selectedType === SYSTEM_DATA_TYPES.REFERENCE_DATA_RELATION) return;
      setEditingRecord(row);
    },
    [selectedType],
  );

  const tableColumns = useMemo(() => {
    const cols = columns.map(col => {
      const column = {
        key: col.key,
        title: col.key,
        // FK name columns are computed from an association, not a sortable DB column on this model
        sortable: !col.isFkName,
      };
      if (col.type === 'BOOLEAN') {
        column.accessor = row => (row[col.key] ? 'Yes' : 'No');
      }
      return column;
    });

    if (selectedType === SYSTEM_DATA_TYPES.REFERENCE_DATA_RELATION) {
      cols.push({
        key: 'actions',
        title: (
          <VisuallyHidden>
            <TranslatedText stringId="general.actions.label" fallback="Actions" />
          </VisuallyHidden>
        ),
        sortable: false,
        dontCallRowInput: true,
        CellComponent: ({ data }) => (
          <ThreeDotMenu
            items={[
              {
                label: <TranslatedText stringId="general.action.delete" fallback="Delete" />,
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
                fallback="Select reference data…"
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
              startIcon={<AddIcon />}
            >
              <TranslatedText stringId="admin.referenceData.addNew" fallback="Add reference data" />
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
            <TranslatedText stringId="admin.referenceData.deleteTitle" fallback="Delete item" />
          }
          subText={
            <TranslatedText
              stringId="admin.referenceData.deleteConfirmPrefix"
              fallback="Are you sure you would like to delete the selected item?"
            />
          }
          confirmButtonText={
            <TranslatedText
              stringId="admin.referenceData.deleteConfirmButton"
              fallback="Delete item"
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
