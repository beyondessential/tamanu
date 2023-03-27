import { Box, CircularProgress, Tooltip } from '@material-ui/core';
import { JsonEditor } from 'jsoneditor-react/es';
import React, { useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import {
  REPORT_STATUSES_VALUES,
  REPORT_DEFAULT_DATE_RANGES_VALUES,
  REPORT_DATA_SOURCE_VALUES,
} from 'shared/constants';
import { BodyText, Button, Heading4, formatShort, formatTime } from '../../../components';
import { DropdownButton } from '../../../components/DropdownButton';

const EditorContainer = styled.div`
  max-width: 1000px;
  padding-bottom: 30px;
`;

const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  > button:first-child {
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

const StyledDropdownButton = styled(DropdownButton)`
  opacity: ${props => props.$disabled && 0.5};
  pointer-events: ${props => props.$disabled && 'none'};
`;

const versionSchema = yup.object().shape({
  query: yup.string().required(),
  notes: yup.string(),
  status: yup.string().oneOf(REPORT_STATUSES_VALUES),
  queryOptions: yup.object({
    parameters: yup
      .array()
      .required()
      .of(
        yup.object({
          parameterField: yup.string().required(),
          name: yup.string().required(),
        }),
      ),
    dataSources: yup.array().of(yup.string().oneOf(REPORT_DATA_SOURCE_VALUES)),
    dateRangeLabel: yup.string(),
    defaultDateRange: yup
      .string()
      .oneOf(REPORT_DEFAULT_DATE_RANGES_VALUES)
      .required(),
  }),
});

const SaveButtonLabel = ({ submitting }) => (
  <Box display="flex" alignItems="center">
    {submitting ? 'Saving' : 'Save'}
    {submitting && <InlineProgress size={12} />}
  </Box>
);

export const VersionEditor = ({ report, version, onBack }) => {
  const { id, updatedAt, createdAt, createdBy, versionNumber, ...editableData } = version;
  const [isValid, setIsValid] = useState(true);
  const [value, setValue] = useState(editableData);
  const [submitting, setSubmitting] = useState(false);

  const { name } = report;

  const validate = json => {
    try {
      versionSchema.validateSync(json, { strict: true, abortEarly: false });
      setIsValid(true);
      return [];
    } catch (err) {
      setIsValid(false);
      return err.inner.map(error => ({
        path: error.path.split('.'),
        message: error.message,
      }));
    }
  };

  const handleSave = async () => {
    setSubmitting(true);
  };

  const handleSaveAsNewVersion = async () => {
    setSubmitting(true);
  };

  return (
    <EditorContainer>
      <ButtonContainer>
        <Button variant="outlined" onClick={onBack}>
          Back
        </Button>
        <Tooltip
          disableHoverListener={isValid}
          title="Please fix any errors before saving."
          placement="top"
          arrow
        >
          <div>
            <StyledDropdownButton
              variant="outlined"
              $disabled={!isValid}
              actions={[
                {
                  label: <SaveButtonLabel submitting={submitting} />,
                  onClick: handleSave,
                },
                { label: 'Save as new version', onClick: handleSaveAsNewVersion },
              ]}
            />
          </div>
        </Tooltip>
      </ButtonContainer>
      <DetailList>
        <Heading4>{name}</Heading4>
        <BodyText>Version: {versionNumber}</BodyText>
        <BodyText>Created by: {createdBy.displayName}</BodyText>
        <BodyText>
          Created at: {formatShort(createdAt)} {formatTime(createdAt)}
          {createdAt !== updatedAt &&
            `, last updated: ${formatShort(updatedAt)} ${formatTime(updatedAt)}`}
        </BodyText>
        <BodyText>Id: {id}</BodyText>
        <JsonEditor value={value} onValidate={validate} onChange={setValue} />
      </DetailList>
    </EditorContainer>
  );
};
