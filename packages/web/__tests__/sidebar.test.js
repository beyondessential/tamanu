import { describe, afterEach, it, vi } from 'vitest';
import { useFacilitySidebar } from '../app/components/Sidebar';

describe.only('useFacilitySidebar', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.only('should display the correct items', () => {
    vi.mock('../app/contexts/Localisation', () => {
      return {
        useLocalisation: () => {
          return { getLocalisation: () => ({ foo: 'bar' }) };
        },
      };
    });

    const items = useFacilitySidebar();
  });
  it('should hide top level items', () => {});
  it('should hide secondary level items', () => {});
  it('should sort top level items', () => {});
  it('should sort secondary level items', () => {});
});
