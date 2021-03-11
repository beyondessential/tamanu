/*
 *   propertyPathsToTree
 *
 *    Input: ['a.b', 'a.b.c', 'a.b.d']
 *    Output: {a: {b: {c: {}, d: {}}}}
 *
 *   Adapted from tamanu-mobile.
 */
export const propertyPathsToTree = stringPaths => {
  const propertyArrayPathsToTree = paths => {
    const grouped = paths.reduce((memo, [first, ...remaining]) => {
      const leaves = memo[first] || [];
      if (remaining.length > 0) {
        leaves.push(remaining);
      }
      return { ...memo, [first]: leaves };
    }, {});
    return Object.entries(grouped).reduce((memo, [path, remaining]) => {
      const subTree = remaining.length > 0 ? propertyArrayPathsToTree(remaining) : {};
      return {
        ...memo,
        [path]: subTree,
      };
    }, {});
  };
  return propertyArrayPathsToTree(stringPaths.map(path => path.split('.')));
};

/*
 *   ensurePathsAreExhaustive
 *
 *    Input: ['a.b']
 *    Output: ['a', 'a.b']
 *
 *   Converts string paths to a tree and back again to ensure intermediate nodes
 *   between root and leaf aren't missing.
 */
export const ensurePathsAreExhaustive = stringPaths => {
  const tree = propertyPathsToTree(stringPaths);
  return treeToPaths(tree);
};

const treeToPaths = (tree, prefix = '') => {
  let paths = [];
  for (const [name, subTree] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${name}` : name;
    paths = [...paths, path, ...treeToPaths(subTree, path)];
  }
  return paths;
};
