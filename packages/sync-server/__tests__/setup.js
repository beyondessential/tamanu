// IMPORTANT NOTE!
// This script is run _before_ the test environment is fully set up,
// crucially the aliases defined in moduleNameMapper will not be available.
// As these aliases are used throughout the codebase, importing any file that
// uses such an alias (or any file that imports such a file, etc) will break
// this setup step.

export default function() {}
