import React from 'react';
import styled from 'styled-components';
import { CustomisableSearchBarWithPermissionCheck } from './CustomisableSearchBar';
import { AutocompleteField, CheckField, Field, SearchField } from '../Field';
import { useAdvancedFields } from './useAdvancedFields';
import { TranslatedText } from '../Translation/TranslatedText';
import { useSuggester } from '../../api';

const ADVANCED_FIELDS = ['designation', 'includeDeactivated'];

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 20px;
`;

export const UserSearchBar = React.memo(({ onSearch, searchParameters }) => {
  const { showAdvancedFields, setShowAdvancedFields } = useAdvancedFields(
    ADVANCED_FIELDS,
    searchParameters,
  );

  const roleSuggester = useSuggester('role');
  const designationSuggester = useSuggester('designation');

  return (
    <CustomisableSearchBarWithPermissionCheck
      verb="list"
      noun="User"
      showExpandButton
      isExpanded={showAdvancedFields}
      setIsExpanded={setShowAdvancedFields}
      onSearch={onSearch}
      initialValues={{ includeDeactivated: true, ...searchParameters }}
      hiddenFields={
        <>
          <Field
            component={AutocompleteField}
            name="designationId"
            label={
              <TranslatedText
                stringId="admin.users.designation.search.label"
                fallback="Designation"
                data-testid="translatedtext-designation-search"
              />
            }
            data-testid="field-designation-search"
            suggester={designationSuggester}
          />
          <CheckboxContainer data-testid="checkbox-container-include-deactivated">
            <Field
              name="includeDeactivated"
              label={
                <TranslatedText
                  stringId="admin.users.includeDeactivated.label"
                  fallback="Include deactivated users"
                  data-testid="translatedtext-include-deactivated"
                />
              }
              component={CheckField}
              data-testid="field-include-deactivated"
            />
          </CheckboxContainer>
        </>
      }
      data-testid="customisablesearchbarwithpermissioncheck-users"
    >
      <Field
        component={SearchField}
        name="displayName"
        label={
          <TranslatedText
            stringId="admin.users.displayName.search.label"
            fallback="Display name"
            data-testid="translatedtext-displayname-search"
          />
        }
        data-testid="field-displayname-search"
      />
      <Field
        component={SearchField}
        name="displayId"
        label={
          <TranslatedText
            stringId="admin.users.displayId.search.label"
            fallback="ID"
            data-testid="translatedtext-displayid-search"
          />
        }
        data-testid="field-displayid-search"
      />
      <Field
        component={AutocompleteField}
        name="roleId"
        label={
          <TranslatedText
            stringId="admin.users.role.search.label"
            fallback="Role"
            data-testid="translatedtext-role-search"
          />
        }
        data-testid="field-role-search"
        suggester={roleSuggester}
      />
      <Field
        component={SearchField}
        name="email"
        label={
          <TranslatedText
            stringId="admin.users.email.search.label"
            fallback="Email"
            data-testid="translatedtext-email-search"
          />
        }
        data-testid="field-email-search"
      />
    </CustomisableSearchBarWithPermissionCheck>
  );
}); 