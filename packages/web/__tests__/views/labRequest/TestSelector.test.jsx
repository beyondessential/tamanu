import { describe, it, expect } from 'vitest';

import { groupByCategory } from '../../../app/views/labRequest/TestSelector';

const category = (id, name) => ({ id, name, type: 'labTestCategory' });

describe('groupByCategory', () => {
  it('collapses a panel and an individual test in the same category into a single group', () => {
    const chemistry = category('cat-chem', 'Chemistry');
    const groups = groupByCategory([
      { kind: 'panel', id: 'panel-1', name: 'Electrolytes', category: chemistry },
      { kind: 'test', id: 'test-1', name: 'Sodium', category: chemistry },
    ]);

    // One category -> one sample row downstream, covering both selections.
    expect(groups).toHaveLength(1);
    expect(groups[0].category.id).toBe('cat-chem');
    expect(groups[0].items.map(item => item.id)).toEqual(['panel-1', 'test-1']);
  });

  it('orders categories alphabetically and mixes panels and tests alphabetically within each', () => {
    const chemistry = category('cat-chem', 'Chemistry');
    const haematology = category('cat-haem', 'Haematology');
    const groups = groupByCategory([
      { kind: 'test', id: 'test-sodium', name: 'Sodium', category: chemistry },
      { kind: 'test', id: 'test-fbc', name: 'FBC', category: haematology },
      { kind: 'panel', id: 'panel-elec', name: 'Electrolytes', category: chemistry },
    ]);

    expect(groups.map(group => group.category.name)).toEqual(['Chemistry', 'Haematology']);
    expect(groups[0].items.map(item => item.name)).toEqual(['Electrolytes', 'Sodium']);
  });

  it('groups items with no category under a single uncategorised bucket', () => {
    const groups = groupByCategory([
      { kind: 'test', id: 'test-1', name: 'Orphan A', category: undefined },
      { kind: 'test', id: 'test-2', name: 'Orphan B', category: undefined },
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].category).toBeUndefined();
    expect(groups[0].items.map(item => item.id)).toEqual(['test-1', 'test-2']);
  });
});
