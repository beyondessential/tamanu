import { it, expect } from '@jest/globals';
import { hello } from '../src/index';

it('should work', () => {
  expect(hello()).toBe('world');
});