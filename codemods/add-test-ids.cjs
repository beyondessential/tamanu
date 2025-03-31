module.exports = function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const usedTestIds = new Set();

  function generateRandomSuffix() {
    return Math.random().toString(36).substring(2, 6);
  }

  // Helper function to generate a test ID based on component name and element type
  function generateTestId(elementName) {
    let testId;
    do {
      testId = `${elementName.toLowerCase()}-${generateRandomSuffix()}`;
    } while (usedTestIds.has(testId));
    usedTestIds.add(testId);
    return testId;
  }

  // Important components to add test IDs to
  const importantComponents = new Set([
    // Critical Form Elements
    'Field',
    'TextField',
    'DateField',
    'TimeField',
    'DateTimeField',
    'SelectField',
    'CheckField',
    'NumberField',
    'AutocompleteField',
    'DynamicSelectField',
    'SwitchField',
    'SuggesterSelectField',
    'TranslatedField',
    'TranslatedSelectField',
    'TranslatedText',
    'TranslatedReferenceData',
    'TranslatedEnum',

    // Navigation and Layout
    'TopBar',
    'TabContainer',
    'StyledTabDisplay',

    // Base button components
    'Button',
    'ButtonBase',
    'DeleteButton',
    'FormCancelButton',
    'FormSubmitButton',
    'FormSubmitCancelRow',
    'StyledMenuButton',
    'ToggleButton',
    'ButtonWithPermissionCheck',
    'CheckInButton',
    'MenuButton',
    'Menu',
    'MenuItem',
    'ButtonRow',
    'TextButton',
    'MuiButton',
    'InfoButton',
    'OutlinedButton',
    'StyledButton',
    'IconButton',
    'DefaultIconButton',
    'UnstyledHtmlButton',
    'ToggleButton',

    // Data Display
    'CardItem',
    'LabelledValue',
    'DateDisplay',
    'TableRow',
    'StyledTableDataCell',
    'DataFetchingTable',

    // Interactive Elements
    'DefaultIconButton',
    'RemoveIconButton',
    'ClearAllButton',
    'StyledCheckboxControl',
    'StyledFormControlLabel',

    // Search and Filter
    'SearchField',
    'LocalisedField',
    'SuggesterSelectField',

    // Base HTML elements that should always get test IDs
    'button',
    'input',
    'select',
    'textarea',
    'a',
    'form',
    'table',
    'tr',
    'td',
    'th',
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'label',
    'nav',
    'header',
    'footer',
    'main',
  ]);

  // Process each JSX element
  root.find(j.JSXElement).forEach((path) => {
    const openingElement = path.node.openingElement;

    // Get element name, handling member expressions (e.g., Styled.div)
    let elementName;
    if (openingElement.name.type === 'JSXIdentifier') {
      elementName = openingElement.name.name;
    } else if (openingElement.name.type === 'JSXMemberExpression') {
      elementName = openingElement.name.property.name;
    }

    if (!elementName) {
      console.log('Skipping element with unknown name:', openingElement);
      return;
    }

    // Skip if element already has a data-testid
    const hasTestId = openingElement.attributes.some(
      (attr) => attr.type === 'JSXAttribute' && attr.name.name === 'data-testid',
    );

    if (hasTestId) return;

    // Check if this is an important component or element
    const isImportantComponent = importantComponents.has(elementName);

    if (isImportantComponent) {
      const testId = generateTestId(elementName);

      console.log(`Adding data-testid="${testId}" to ${elementName}`);

      openingElement.attributes.push(
        j.jsxAttribute(j.jsxIdentifier('data-testid'), j.stringLiteral(testId)),
      );
    }
  });

  return root.toSource({ quote: 'single' });
};
