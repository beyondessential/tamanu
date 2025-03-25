module.exports = function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  let elementCounts = new Map();

  // Helper function to generate a test ID based on component name and element type
  function generateTestId(componentName, elementName, elementIndex) {
    const sanitizedComponentName = componentName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const sanitizedElementName = elementName.toLowerCase();

    // Get count for this element type within this component
    const key = `${componentName}-${elementName}`;
    const count = elementCounts.get(key) || 0;
    elementCounts.set(key, count + 1);

    // Add index if there are multiple of the same element type
    const indexSuffix = count > 0 ? `-${count}` : '';
    return `${sanitizedComponentName}-${sanitizedElementName}${indexSuffix}`;
  }

  // Find the component name from the closest function or variable declaration
  function findComponentName(path) {
    let componentName = 'unknown';

    // Try to find the component name from the closest function or variable declaration
    let scope = path.scope;
    while (scope) {
      if (scope.node.type === 'FunctionDeclaration' && scope.node.id) {
        componentName = scope.node.id.name;
        break;
      }
      if (scope.node.type === 'VariableDeclarator' && scope.node.id) {
        componentName = scope.node.id.name;
        break;
      }
      if (
        scope.node.type === 'ArrowFunctionExpression' &&
        scope.parent &&
        scope.parent.node.type === 'VariableDeclarator'
      ) {
        componentName = scope.parent.node.id.name;
        break;
      }
      scope = scope.parent;
    }

    return componentName;
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

    // Special handling for TranslatedText components
    if (elementName === 'TranslatedText') {
      const stringIdAttr = openingElement.attributes.find(
        (attr) => attr.type === 'JSXAttribute' && attr.name.name === 'stringId',
      );

      if (stringIdAttr && stringIdAttr.value.type === 'StringLiteral') {
        const testId = stringIdAttr.value.value;
        console.log(`Adding data-testid="${testId}" to TranslatedText (using stringId)`);
        openingElement.attributes.push(
          j.jsxAttribute(j.jsxIdentifier('data-testid'), j.stringLiteral(testId)),
        );
      }
      return;
    }

    // Handle other components and interactive elements
    const isComponent = elementName[0] === elementName[0].toUpperCase();
    const interactiveElements = ['button', 'input', 'select', 'textarea', 'a'];
    const shouldAddTestId = isComponent || interactiveElements.includes(elementName.toLowerCase());

    if (shouldAddTestId) {
      const componentName = findComponentName(path);
      const testId = generateTestId(componentName, elementName);

      console.log(`Adding data-testid="${testId}" to ${elementName} in ${componentName}`);

      openingElement.attributes.push(
        j.jsxAttribute(j.jsxIdentifier('data-testid'), j.stringLiteral(testId)),
      );
    }
  });

  return root.toSource({ quote: 'single' });
};
