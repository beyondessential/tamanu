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

    // Common field components
    'TextField',
    'Input',
    'InputField',
    'TextInput',
    'NumberInput',
    'DateInput',
    'TimeInput',
    'DateTimeInput',
    'EmailInput',
    'PasswordInput',
    'SearchInput',
    'Select',
    'SelectField',
    'Dropdown',
    'DropdownField',
    'MultiSelect',
    'MultiSelectField',
    'Checkbox',
    'CheckboxField',
    'Radio',
    'RadioField',
    'RadioGroup',
    'Switch',
    'SwitchField',
    'Toggle',
    'ToggleField',
    'Slider',
    'SliderField',
    'Range',
    'RangeField',
    'ColorPicker',
    'ColorPickerField',
    'FileInput',
    'FileUpload',
    'FileUploadField',
    'ImageUpload',
    'ImageUploadField',
    'RichTextEditor',
    'RichTextField',
    'CodeEditor',
    'CodeField',
    'Autocomplete',
    'AutocompleteField',
    'Combobox',
    'ComboboxField',
    'TagInput',
    'TagInputField',
    'PhoneInput',
    'PhoneInputField',
    'CurrencyInput',
    'CurrencyInputField',
    'PercentageInput',
    'PercentageInputField',
    'Rating',
    'RatingField',
    'StarRating',
    'StarRatingField',
    'Progress',
    'ProgressField',
    'Spinner',
    'SpinnerField',
    'Loading',
    'LoadingField',
    'Skeleton',
    'SkeletonField',

    // Common button components
    'Button',
    'ButtonField',
    'IconButton',
    'IconButtonField',
    'SubmitButton',
    'SubmitButtonField',
    'ResetButton',
    'ResetButtonField',
    'CancelButton',
    'CancelButtonField',
    'DeleteButton',
    'DeleteButtonField',
    'EditButton',
    'EditButtonField',
    'SaveButton',
    'SaveButtonField',
    'UpdateButton',
    'UpdateButtonField',
    'AddButton',
    'AddButtonField',
    'RemoveButton',
    'RemoveButtonField',
    'ClearButton',
    'ClearButtonField',
    'SearchButton',
    'SearchButtonField',
    'FilterButton',
    'FilterButtonField',
    'SortButton',
    'SortButtonField',
    'RefreshButton',
    'RefreshButtonField',
    'DownloadButton',
    'DownloadButtonField',
    'UploadButton',
    'UploadButtonField',
    'PrintButton',
    'PrintButtonField',
    'ExportButton',
    'ExportButtonField',
    'ImportButton',
    'ImportButtonField',
    'ShareButton',
    'ShareButtonField',
    'MenuButton',
    'MenuButtonField',
    'DropdownButton',
    'DropdownButtonField',
    'SplitButton',
    'SplitButtonField',
    'ToggleButton',
    'ToggleButtonField',
    'ActionButton',
    'ActionButtonField',
    'LinkButton',
    'LinkButtonField',
    'BackButton',
    'BackButtonField',
    'NextButton',
    'NextButtonField',
    'PreviousButton',
    'PreviousButtonField',
    'CloseButton',
    'CloseButtonField',
    'ConfirmButton',
    'ConfirmButtonField',
    'ApproveButton',
    'ApproveButtonField',
    'RejectButton',
    'RejectButtonField',

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
    'DatePicker',
    'TimePicker',
    'DateTimePicker',
    'FileUpload',
    'ImageUpload',
    'RichTextEditor',
    'CodeEditor',
    'ColorPicker',
    'Slider',
    'Range',
    'Rating',
    'Progress',
    'Spinner',
    'Loading',
    'Skeleton',
    'Tooltip',
    'Popover',
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
      /Slider$/i,
      /Range$/i,
      /Upload$/i,
      /Editor$/i,
      /Picker$/i,
      /Menu$/i,
      /Dialog$/i,
      /Modal$/i,
      /Form$/i,
      /Card$/i,
      /Alert$/i,
      /Toast$/i,
      /Notification$/i,
      /Banner$/i,
      /Drawer$/i,
      /Sidebar$/i,
      /Navigation$/i,
      /Search$/i,
      /Filter$/i,
      /Sort$/i,
      /Pagination$/i,
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
