import React, { useCallback, useId } from 'react';
import styled from 'styled-components';
import Box from '@material-ui/core/Box';
import { IconButton } from '@material-ui/core';
import { FORM_TYPES } from '@tamanu/constants/forms';
import { Form, Button, TextButton } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import { TranslatedText } from '../Translation/TranslatedText';
import { ThemedTooltip } from '../Tooltip';
import { withPermissionCheck } from '../withPermissionCheck';
import { withPermissionTooltip } from '../withPermissionTooltip';

const Container = styled.div`
  border: 1px solid ${Colors.outline};
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  background: ${Colors.white};
  padding: 16px 25px 10px;
  font-size: 11px;

  .MuiInputBase-input,
  .MuiFormControlLabel-label {
    font-size: 11px;
  }

  .MuiButtonBase-root {
    font-size: 14px;
  }

  .label-field {
    font-size: 11px;
  }

  .display-field {
    .MuiSvgIcon-root {
      font-size: 16px;
    }
  }
`;

const CustomisableSearchBarGrid = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(5, 2fr);
  gap: 10px;
  margin-bottom: 16px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(4, 2fr);
  }
`;

const ActionsContainer = styled(Box)`
  display: flex;
  align-items: center;
  margin-top: 20px;
  margin-left: 8px;
`;

const ExpandIcon = styled(KeyboardDoubleArrowDownIcon)`
  &.MuiSvgIcon-root {
    font-size: 24px;
    transition: ${props => props.theme.transitions.create('rotate')};
  }
  [aria-expanded='true'] & {
    rotate: x 0.5turn;
  }
`;

const SearchButton = styled(withPermissionTooltip(Button))`
  margin-right: 20px;
  margin-left: 6px;
`;

const ClearButton = styled(TextButton)`
  text-decoration: underline;
`;

export const CustomisableSearchBar = ({
  onSearch,
  children,
  showExpandButton = false,
  isExpanded,
  setIsExpanded,
  initialValues = {},
  hiddenFields,
  hasPermission = true,
  className,
}) => {
  const switchExpandValue = useCallback(() => {
    setIsExpanded(previous => !previous);
  }, [setIsExpanded]);

  const handleSubmit = values => {
    onSearch({ ...values });
  };

  const hiddenFieldsId = useId();

  return (
    <Form
      onSubmit={handleSubmit}
      render={({ clearForm, values }) => (
        <Container data-testid="container-ntc5" className={className}>
          <CustomisableSearchBarGrid data-testid="customisablesearchbargrid-c6rk">
            {children}
            <ActionsContainer data-testid="actionscontainer-3pm7" className="actions-container">
              {showExpandButton && (
                <ThemedTooltip
                  title={isExpanded ? 'Hide advanced search' : 'Advanced search'}
                  data-testid="themedtooltip-arue"
                >
                  <IconButton
                    aria-controls={hiddenFieldsId}
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? 'hide' : 'show'} advanced search`}
                    onClick={() => {
                      switchExpandValue();
                    }}
                    color="primary"
                    data-testid="iconbutton-zrkv"
                    style={{ padding: 6 }}
                  >
                    <ExpandIcon aria-hidden />
                  </IconButton>
                </ThemedTooltip>
              )}
              <SearchButton
                type="submit"
                hasPermission={hasPermission}
                data-testid="searchbutton-nt24"
              >
                <TranslatedText
                  stringId="general.action.search"
                  fallback="Search"
                  data-testid="translatedtext-am6o"
                />
              </SearchButton>
              <ClearButton
                onClick={() => {
                  // Cant check for dirty as form is reinitialized with persisted values
                  if (Object.keys(values).length === 0) return;
                  onSearch({});
                  // ClearForm needed to be deferred in order ensure that it re-initializes to an empty
                  // state rather than the previous state
                  setTimeout(() => clearForm(), 0);
                }}
                data-testid="clearbutton-z9x3"
              >
                <TranslatedText
                  stringId="general.action.clear"
                  fallback="Clear"
                  data-testid="translatedtext-vpib"
                />
              </ClearButton>
            </ActionsContainer>
          </CustomisableSearchBarGrid>
          {isExpanded && (
            <CustomisableSearchBarGrid
              data-testid="customisablesearchbargrid-q5qy"
              id={hiddenFieldsId}
            >
              {hiddenFields}
            </CustomisableSearchBarGrid>
          )}
        </Container>
      )}
      initialValues={initialValues}
      enableReinitialize
      formType={FORM_TYPES.SEARCH_FORM}
      data-testid="form-ufk0"
    />
  );
};

export const CustomisableSearchBarWithPermissionCheck = withPermissionCheck(CustomisableSearchBar);
