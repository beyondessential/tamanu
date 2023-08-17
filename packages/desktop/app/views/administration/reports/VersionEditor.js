import { Box, CircularProgress, Tooltip } from '@material-ui/core';
import React, { useState } from 'react';
import styled from 'styled-components';
import Ajv from 'ajv';
import { toast } from 'react-toastify';
import SaveAsIcon from '@material-ui/icons/SaveAltSharp';
import { OutlinedButton, CardItem, formatShort, formatTime } from '../../../components';
import { schema } from './schema';
import { Colors } from '../../../constants';

const ajv = new Ajv({ allErrors: true });

const EditorContainer = styled.div`
  width: 1000px;
  padding-bottom: 30px;
`;

const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  > :first-child {
    margin-right: 10px;
  }
`;

const InlineProgress = styled(CircularProgress)`
  margin-left: 10px;
`;

const DetailList = styled.div`
  & > * {
    margin-bottom: 10px;
  }
`;

const ErrorMessage = styled.div`
  word-break: break-word;
`;

const VersionInfoCard = styled.div`
  background: white;
  box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 1px -1px, rgba(0, 0, 0, 0.14) 0px 1px 1px 0px,
    rgba(0, 0, 0, 0.12) 0px 1px 3px 0px;
  border-radius: 5px;
  padding: 32px 30px;
`;

const CardHeader = styled.div`
  border-bottom: 1px solid ${Colors.softOutline};
  padding-bottom: 12px;
  margin-bottom: 15px;
`;

const CardDivider = styled.div`
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-3px);
  height: ${props => props.$height || '70px'};
  border-left: 1px solid ${Colors.softOutline};
`;

const ErrorCard = styled.div`
  background: #ffebee;
  box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 1px -1px, rgba(0, 0, 0, 0.14) 0px 1px 1px 0px,
    rgba(0, 0, 0, 0.12) 0px 1px 3px 0px;
  border-radius: 5px;
  padding: 32px 30px;
  margin-bottom: 20px;
`;

const StyledButton = styled(OutlinedButton)`
  background: ${Colors.white};

  &.Mui-disabled {
    border-color: ${Colors.outline};
  }
`;

const SaveIcon = styled(SaveAsIcon)`
  margin-right: 10px;
`;

const VersionInfo = ({ name, reportDefinitionId, version }) => (
  <VersionInfoCard>
    <CardHeader>
      <CardItem label="Name" value={name} />
      <CardItem label="Version" value={version.versionNumber} />
      <CardItem label="Report id" value={reportDefinitionId} />
    </CardHeader>
    <CardDivider />
    <CardItem
      label="Created"
      value={`${formatShort(version.createdAt)} ${formatTime(version.createdAt)}`}
    />
    <CardItem label="Created by" value={version.createdBy?.displayName} />
  </VersionInfoCard>
);

const VersionError = ({ errorMessage }) => (
  <div>
    <b>Create version failed</b>
    <ErrorMessage>{errorMessage}</ErrorMessage>
  </div>
);

const LoadError = ({ error }) => (
  <ErrorCard>
    Editor failed to load report with error: <b>{error.message}</b>
  </ErrorCard>
);

const SaveButton = ({ isValid, dirty, onClick, children, submitting }) => {
  let errorTooltipText;
  if (!dirty) {
    errorTooltipText = 'No changes to json';
  } else if (!isValid) {
    errorTooltipText = 'Please fix any errors before saving.';
  }
  return (
    <Tooltip
      disableHoverListener={!errorTooltipText}
      title={errorTooltipText}
      placement="top"
      arrow
    >
      <div>
        <StyledButton onClick={onClick} disabled={!!errorTooltipText || submitting}>
          <Box display="flex" alignItems="center">
            {children}
            {submitting && <InlineProgress size={12} />}
          </Box>
        </StyledButton>
      </div>
    </Tooltip>
  );
};

export const VersionEditor = ({ report, version, onBack, onSave }) => {
  const {
    id,
    updatedAt,
    createdAt,
    deletedAt,
    createdBy,
    versionNumber,
    ...editableData
  } = version;
  const { name, id: reportDefinitionId } = report;
  const [showSqlEditor, setShowSqlEditor] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [value, setValue] = useState(editableData);
  const [submitting, setSubmitting] = useState(false);

  // Handle change is debounced by jsoneditor-react
  const handleChange = json => {
    setValue(json);
    setDirty(JSON.stringify(json) !== JSON.stringify(editableData));
    setIsValid(ajv.validate(schema, json));
  };

  // Force jsoneditor to re-render
  const triggerRefresh = json => {
    setValue(null);
    setTimeout(() => setValue(json), 0);
  };

  const handleReset = () => {
    triggerRefresh(editableData);
  };

  const handleUpdate = query => {
    if (query === editableData.query) return;
    setDirty(true);
    const updatedData = { ...value, query };
    triggerRefresh(updatedData);
  };

  const handleShowSqlEditor = () => setShowSqlEditor(true);
  const handleCloseSqlEditor = () => setShowSqlEditor(false);

  const handleSave = async () => {
    try {
      setSubmitting(true);
      const res = await onSave(value);
      toast.success(`Successfully created new version ${res.versionNumber}`);
      setDirty(false);
    } catch (err) {
      toast.error(<VersionError errorMessage={err.message} />);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <EditorContainer>
        <ButtonContainer>
          <StyledButton onClick={onBack}>Back</StyledButton>
          <StyledButton onClick={handleReset} disabled={!dirty}>
            Reset
          </StyledButton>
        </ButtonContainer>
        <ButtonContainer>
          <SaveButton submitting={submitting} onClick={handleSave} dirty={dirty} isValid={isValid}>
            <SaveIcon />
            Save new version
          </SaveButton>
        </ButtonContainer>
        <DetailList>
          <VersionInfo reportDefinitionId={reportDefinitionId} name={name} version={version} />
        </DetailList>
      </EditorContainer>
    </>
  );
};
