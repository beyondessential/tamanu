const categories = {
  sweet: { id: 'sweet', name: 'Sweet' },
  savoury: { id: 'savoury', name: 'Savoury' },
};

const mockPanels = {
  baking: [
    { name: 'Chocolate', id: 'chocolate', category: categories.sweet },
    { name: 'Egg', id: 'egg', category: categories.savoury },
    { name: 'Vanilla', id: 'vanilla', category: categories.sweet },
    { name: 'Yeast', id: 'yeast', category: categories.savoury },
    { name: 'Baking Powder', id: 'bakingpowder', category: categories.savoury },
  ],
  meat: [
    { name: 'Beef', id: 'beef', category: categories.savoury },
    { name: 'Chicken Breast', id: 'chicken_breast', category: categories.savoury },
    { name: 'Pork', id: 'pork', category: categories.savoury },
    { name: 'Salmon', id: 'salmon', category: categories.savoury },
    { name: 'Tuna', id: 'tuna', category: categories.savoury },
  ],
  vegetables: [
    { name: 'Cabbage', id: 'cabbage', category: categories.savoury },
    { name: 'Chilli', id: 'chilli', category: categories.savoury },
    { name: 'Fennel', id: 'fennel', category: categories.savoury },
    { name: 'Leek', id: 'leek', category: categories.savoury },
    { name: 'Pepper', id: 'pepper', category: categories.savoury },
    { name: 'Sprout', id: 'sprout', category: categories.savoury },
    { name: 'Zucchini', id: 'zuc', category: categories.savoury },
  ],
  fruit: [
    { name: 'Apple', id: 'apple', category: categories.sweet },
    { name: 'Banana', id: 'banana', category: categories.sweet },
    { name: 'Boysenberry', id: 'boysenberry', category: categories.sweet },
    { name: 'Grape', id: 'grape', category: categories.sweet },
    { name: 'Lemon', id: 'lemon', category: categories.sweet },
    { name: 'Strawberry', id: 'strawb', category: categories.sweet },
  ],
};

export const mockTestSelectorEndpoints = {
  'suggestions/labTestPanel/all': () => [
    { id: 'fruit', name: 'Fruit' },
    { id: 'vegetables', name: 'Vegetables' },
    { id: 'meat', name: 'Meat' },
    { id: 'baking', name: 'Baking' },
  ],
  'suggestions/labTestCategory/:query': () => Object.values(categories),
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
