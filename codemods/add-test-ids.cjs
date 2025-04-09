module.exports = function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const usedTestIds = new Set();

  // List of interactive elements that should always get test IDs
  const interactiveElements = new Set([
    // Form elements
    'input',
    'select',
    'textarea',
    'button',
    'form',
    'fieldset',
    'label',
    'legend',
    'option',
    'optgroup',
    'datalist',
    'output',
    'progress',
    'meter',

    // Interactive elements
    'a',
    'details',
    'summary',
    'dialog',
    'menu',
    'menuitem',
    'nav',
    'tab',
    'tabpanel',
    'tablist',

    // Actual Button Components from codebase
    'Button',
    'ButtonWithPermissionCheck',
    'PatientMenuButton',
    'MenuOptionButton',
    'SubmitButton',
    'ImageActionButton',
    'RadioButton',
    'RadioButtonGroup',
    'MultiSelectButton',
    'ConfirmButton',
    'CancelButton',
    'BackButton',
    'CloseButton',
    'TextButton',
    'DeleteButton',
    'EditButton',
    'SaveButton',
    'SearchButton',
    'FilterButton',
    'SortButton',
    'RefreshButton',
    'DownloadButton',
    'UploadButton',
    'PrintButton',
    'ExportButton',
    'ImportButton',
    'ShareButton',
    'MenuButton',
    'DropdownButton',
    'ActionButton',
    'LinkButton',
    'NextButton',
    'PreviousButton',

    // Actual Field Components from codebase
    'TextField',
    'MaskedTextField',
    'LimitedTextField',
    'NumberField',
    'DateField',
    'LocationField',
    'CurrentUserField',
    'ModalField',
    'RowField',
    'HierarchyFieldItem',
    'HierarchyFields',
    'ReferenceDataField',
    'MultiSelectModalField',
    'ReadOnlyField',
    'LocalisedField',
    'FormField',
    'FieldRowDisplay',
    'SurveyAnswerField',
    'SurveyGeolocationField',
    'DateGivenField',
    'BatchField',
    'InjectionSiteField',
    'NotGivenField',
    'VaccineLocationField',
    'DepartmentField',
    'GivenByField',
    'RecordedByField',
    'ConsentField',
    'ConsentGivenByField',
    'RadioField',
    'PatientFieldDefinition',

    // Common interactive components
    'Modal',
    'Dialog',
    'Form',
    'Menu',
    'MenuItem',
    'Tab',
    'TabPanel',
    'Accordion',
    'AccordionItem',
    'Card',
    'CardHeader',
    'CardBody',
    'CardFooter',
    'Alert',
    'Toast',
    'Notification',
    'Banner',
    'Drawer',
    'Sidebar',
    'Navigation',
    'Search',
    'Filter',
    'Sort',
    'Pagination',
  ]);

  function generateRandomSuffix() {
    return Math.random().toString(36).substring(2, 6);
  }

  function generateTestId(elementName) {
    let testId;
    do {
      testId = `${elementName.toLowerCase()}-${generateRandomSuffix()}`;
    } while (usedTestIds.has(testId));
    usedTestIds.add(testId);
    return testId;
  }

  function shouldAddTestId(elementName) {
    // Check if it's a known interactive element
    if (interactiveElements.has(elementName)) {
      return true;
    }

    // Check if it's a custom component (starts with uppercase)
    if (elementName[0] === elementName[0].toUpperCase()) {
      // Check if it has interactive props
      return true;
    }

    // Check for common patterns in component names
    const interactivePatterns = [
      /Button$/i,
      /Field$/i,
      /Input$/i,
      /Select$/i,
      /Checkbox$/i,
      /Radio$/i,
      /Switch$/i,
      /Toggle$/i,
      /Modal$/i,
      /Form$/i,
      /Menu$/i,
    ];

    return interactivePatterns.some(pattern => pattern.test(elementName));
  }

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
      return;
    }

    // Skip if element already has a data-testid
    const hasTestId = openingElement.attributes.some(
      (attr) => attr.type === 'JSXAttribute' && attr.name.name === 'data-testid',
    );

    if (hasTestId) return;

    // Check if we should add a test ID
    if (shouldAddTestId(elementName)) {
      const testId = generateTestId(elementName);
      openingElement.attributes.push(
        j.jsxAttribute(j.jsxIdentifier('data-testid'), j.stringLiteral(testId)),
      );
    }
  });

  return root.toSource({ quote: 'single' });
};
