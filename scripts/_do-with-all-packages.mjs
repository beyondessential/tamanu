import { readFileSync } from 'fs';
import { execFileSync } from 'child_process';

function cleanupLeadingGarbage(jsonStr) {
  if (!jsonStr || typeof jsonStr !== 'string') {
    throw new Error('Invalid input: expected non-empty string');
  }

  // Remove any leading whitespace and control characters
  let cleaned = jsonStr.trim();
  
  if (cleaned.startsWith('{')) return cleaned;

  // Look for the first JSON object
  const firstOpenBrace = cleaned.indexOf('{');
  if (firstOpenBrace === -1) {
    throw new Error('No JSON object found in npm output');
  }
  
  cleaned = cleaned.slice(firstOpenBrace);
  
  // Also clean up any trailing garbage after the JSON
  // Find the matching closing brace
  let braceCount = 0;
  let endIndex = -1;
  
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === '{') braceCount++;
    if (cleaned[i] === '}') braceCount--;
    if (braceCount === 0) {
      endIndex = i + 1;
      break;
    }
  }
  
  if (endIndex > 0) {
    cleaned = cleaned.slice(0, endIndex);
  }
  
  return cleaned;
}

function extractDependencyTree(workspaceTree, workspaces) {
  const dependencyTree = {};

  Object.entries(workspaceTree.dependencies).forEach(([workspace, info]) => {
    let dependencies = [];
    if (info.dependencies) {
      dependencies = Object.keys(info.dependencies).filter((dependency) =>
        workspaces.has(dependency),
      );
    }
    dependencyTree[workspace] = dependencies;
  });

  return dependencyTree;
}

function extractLocation(resolvedPath) {
  const packageIndex = resolvedPath.indexOf('packages');
  return resolvedPath.slice(packageIndex);
}

export function doWithAllPackages(fn) {
  let npmOutput;
  try {
    npmOutput = execFileSync('npm', ['ls', '--workspaces', '--json'], { 
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe']  // Capture stderr separately
    });
  } catch (error) {
    // npm ls might exit with non-zero code but still produce valid JSON
    if (error.stdout) {
      npmOutput = error.stdout;
    } else {
      console.error('npm ls failed:', error.message);
      if (error.stderr) {
        console.error('npm stderr:', error.stderr);
      }
      throw error;
    }
  }

  console.error('Raw npm ls output:', npmOutput.substring(0, 200) + '...');
  
  const cleanedOutput = cleanupLeadingGarbage(npmOutput);
  console.error('Cleaned output:', cleanedOutput.substring(0, 200) + '...');
  
  let workspaceTree;
  try {
    workspaceTree = JSON.parse(cleanedOutput);
  } catch (parseError) {
    console.error('JSON parse error:', parseError.message);
    console.error('Failed to parse this output:');
    console.error(cleanedOutput);
    throw parseError;
  }

  const workspaces = new Set(Object.keys(workspaceTree.dependencies));
  const processed = new Set();

  const dependencyTree = extractDependencyTree(workspaceTree, workspaces);
  const packagesThatAreDependedOn = new Set(Object.values(dependencyTree).flat());

  // find and build dependencies for each workspace
  // max number of iterations is pow(workspaces.size, 2)
  for (let i = 0; i <= workspaces.size; i++) {
    if (processed.size === workspaces.size) break;
    for (const workspace of workspaces) {
      if (processed.has(workspace)) continue;

      const { resolved } = workspaceTree.dependencies[workspace];
      const location = extractLocation(resolved);
      const workspaceDependencies = dependencyTree[workspace];

      if (workspaceDependencies.every((dep) => processed.has(dep))) {
        processed.add(workspace);

        const pkgPath = `./${location}/package.json`;
        let pkg;
        try {
          pkg = JSON.parse(readFileSync(pkgPath));
        } catch (err) {
          console.log(`Skipping ${workspace} as we can't read its package.json...`);
          continue;
        }

        fn(workspace, pkg, pkgPath, packagesThatAreDependedOn.has(workspace));
      }
    }
  }
}
