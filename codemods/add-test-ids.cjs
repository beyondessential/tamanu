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

    // Handle other components and interactive elements
    const isComponent = elementName[0] === elementName[0].toUpperCase();
    const interactiveElements = ['button', 'input', 'select', 'textarea', 'a'];
    const shouldAddTestId = isComponent || interactiveElements.includes(elementName.toLowerCase());

    if (shouldAddTestId) {
      const testId = generateTestId(elementName);

      console.log(`Adding data-testid="${testId}" to ${elementName}`);

      openingElement.attributes.push(
        j.jsxAttribute(j.jsxIdentifier('data-testid'), j.stringLiteral(testId)),
      );
    }
  });

  return root.toSource({ quote: 'single' });
};
