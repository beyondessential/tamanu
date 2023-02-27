const mockPanels = {
  baking: [
    { name: 'Chocolate', id: 'chocolate', category: { name: 'Sweet' } },
    { name: 'Egg', id: 'egg', category: { name: 'Savoury' } },
    { name: 'Vanilla', id: 'vanilla', category: { name: 'Sweet' } },
    { name: 'Yeast', id: 'yeast', category: { name: 'Savoury' } },
    { name: 'Baking Powder', id: 'bakingpowder', category: { name: 'Savoury' } },
  ],
  meat: [
    { name: 'Beef', id: 'beef', category: { name: 'Savoury' } },
    { name: 'Chicken Breast', id: 'chicken_breast', category: { name: 'Savoury' } },
    { name: 'Pork', id: 'pork', category: { name: 'Savoury' } },
    { name: 'Salmon', id: 'salmon', category: { name: 'Savoury' } },
    { name: 'Tuna', id: 'tuna', category: { name: 'Savoury' } },
  ],
  vegetables: [
    { name: 'Cabbage', id: 'cabbage', category: { name: 'Savoury' } },
    { name: 'Chilli', id: 'chilli', category: { name: 'Savoury' } },
    { name: 'Fennel', id: 'fennel', category: { name: 'Savoury' } },
    { name: 'Leek', id: 'leek', category: { name: 'Savoury' } },
    { name: 'Pepper', id: 'pepper', category: { name: 'Savoury' } },
    { name: 'Sprout', id: 'sprout', category: { name: 'Savoury' } },
    { name: 'Zucchini', id: 'zuc', category: { name: 'Savoury' } },
  ],
  fruit: [
    { name: 'Apple', id: 'apple', category: { name: 'Sweet' } },
    { name: 'Banana', id: 'banana', category: { name: 'Sweet' } },
    { name: 'Boysenberry', id: 'boysenberry', category: { name: 'Sweet' } },
    { name: 'Grape', id: 'grape', category: { name: 'Sweet' } },
    { name: 'Lemon', id: 'lemon', category: { name: 'Sweet' } },
    { name: 'Strawberry', id: 'strawb', category: { name: 'Sweet' } },
  ],
};

export const mockTestSelectorEndpoints = {
  'suggestions/labTestPanel/all': () => [
    { id: 'fruit', name: 'Fruit' },
    { id: 'vegetables', name: 'Vegetables' },
    { id: 'meat', name: 'Meat' },
    { id: 'baking', name: 'Baking' },
  ],
  'suggestions/labTestCategory/:query': () => [
    { id: 'Savoury', name: 'Savoury' },
    { id: 'Sweet', name: 'Sweet' },
  ],
  'labTestPanel/:id/labTestTypes': (_, id) => {
    return mockPanels[id] || [];
  },
};

export const mockLabRequestFormEndpoints = {
  'suggestions/labSampleSite/all': () => [
    { id: '1', name: 'Arm' },
    { id: '2', name: 'Leg' },
    { id: '3', name: 'Shoulder' },
  ],
  'suggestions/labTestPriority/all': () => [
    { id: '1', name: 'Normal' },
    { id: '2', name: 'Urgent' },
  ],
  labTestType: () => mockLabTestTypes,
  ...mockTestSelectorEndpoints,
};

export const mockLabTestTypes = Object.values(mockPanels).flat();
