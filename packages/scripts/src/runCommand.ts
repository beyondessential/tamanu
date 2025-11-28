import { execFile, ExecFileOptions, spawn } from 'child_process';

async function runCommandImpl(
  prog: string,
  args: string[],
  opts: ExecFileOptions,
): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log('$', prog, ...args);
    execFile(prog, args, { encoding: 'utf-8', ...opts }, (error, stdout, stderr) => {
      if (error) {
        console.log(stdout);
        console.error(stderr);
        reject(error);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

let repoRoot: string;
async function findRepoRoot(): Promise<string> {
  if (!repoRoot) {
    const root = await runCommandImpl('npm', ['root'], {});
    if (!repoRoot) {
      repoRoot = root;
    }
  }

  return repoRoot;
}

export async function runCommand(
  prog: string,
  args: string[],
  env?: Record<string, string>,
): Promise<string> {
  return runCommandImpl(prog, args, { cwd: await findRepoRoot(), env });
}

export async function spawnCommand(prog: string, args: string[]): Promise<void> {
  const repoRoot = await findRepoRoot();
  return new Promise((resolve, reject) => {
    console.log('$', prog, ...args);
    const child = spawn(prog, args, {
      cwd: repoRoot,
      stdio: 'inherit',
    });
    child.on('error', err => reject(err));
    child.on('exit', code => {
      if (code !== 0) reject(new Error(`exited with code ${code}`));
      else resolve();
    });
  });
}
