/**
 * The logging env vars (LOG_CONSOLE_LEVEL, LOG_TIMELESS, NO_COLOR, LOG_PATH) are read at module
 * load, so each case re-imports the logging modules with the env prepared first, resetting the
 * module registry so the import re-evaluates rather than returning the cached module.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ENV_KEYS = [
  'LOG_CONSOLE_LEVEL',
  'LOG_TIMELESS',
  'LOG_PATH',
  'NO_COLOR',
  // systemd detection also suppresses timestamps; hold these steady so the
  // LOG_TIMELESS cases aren't affected by the machine running the tests
  'JOURNAL_STREAM',
  'DEBUG_INVOCATION',
];

describe('logging env vars', () => {
  const savedEnv = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    }
  });

  const loadConsole = async () => {
    vi.resetModules();
    return import('../../../src/services/logging/console');
  };

  const loadLog = async () => {
    vi.resetModules();
    return import('../../../src/services/logging/log');
  };

  // Run a fake info object through the transport's combined format and return
  // the final rendered line, exactly as it would be written to the console.
  const renderLine = transport => {
    const info = transport.format.transform({
      level: 'info',
      message: 'hello',
      [Symbol.for('level')]: 'info',
    });
    return info[Symbol.for('message')];
  };

  describe('LOG_CONSOLE_LEVEL', () => {
    it('is silent by default under test', async () => {
      const { localTransport } = await loadConsole();
      expect(localTransport.silent).toBe(true);
    });

    it('sets the console transport level and unsilences it', async () => {
      process.env.LOG_CONSOLE_LEVEL = 'debug';
      const { localTransport } = await loadConsole();
      expect(localTransport.level).toBe('debug');
      expect(localTransport.silent).toBe(false);
    });
  });

  describe('LOG_TIMELESS', () => {
    it('omits the timestamp when true', async () => {
      process.env.LOG_TIMELESS = 'true';
      process.env.NO_COLOR = '1';
      const { localTransport } = await loadConsole();
      expect(renderLine(localTransport)).toBe('info: hello');
    });

    it('includes a timestamp by default', async () => {
      process.env.NO_COLOR = '1';
      const { localTransport } = await loadConsole();
      expect(renderLine(localTransport)).toMatch(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z info: hello$/);
    });
  });

  describe('NO_COLOR', () => {
    it('disables ANSI colour codes when set', async () => {
      process.env.NO_COLOR = '1';
      process.env.LOG_TIMELESS = 'true';
      const { localTransport } = await loadConsole();
      expect(renderLine(localTransport)).not.toContain('\u001b[');
    });

    it('colourises by default', async () => {
      process.env.LOG_TIMELESS = 'true';
      const { localTransport } = await loadConsole();
      expect(renderLine(localTransport)).toContain('\u001b[');
    });
  });

  describe('LOG_PATH', () => {
    it('adds error and combined file transports when set', async () => {
      process.env.LOG_PATH = '/tmp/tamanu-log-env-test';
      const { log } = await loadLog();
      const files = log.transports.filter(t => t.constructor.name === 'File');
      expect(files.map(f => f.filename).sort()).toEqual(['combined.log', 'error.log']);
      const errorFile = files.find(f => f.filename === 'error.log');
      expect(errorFile.level).toBe('error');
      expect(errorFile.dirname).toBe('/tmp/tamanu-log-env-test');
    });

    it('logs to the console only when unset', async () => {
      const { log } = await loadLog();
      expect(log.transports.filter(t => t.constructor.name === 'File')).toHaveLength(0);
      expect(log.transports).toHaveLength(1);
    });
  });
});
