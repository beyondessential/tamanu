const mockPanels = {
  baking: [
    { name: 'Chocolate', id: 'chocolate', labTestCategoryId: 'Sweet' },
    { name: 'Egg', id: 'egg', labTestCategoryId: 'Savoury' },
    { name: 'Vanilla', id: 'vanilla', labTestCategoryId: 'Sweet' },
    { name: 'Yeast', id: 'yeast', labTestCategoryId: 'Savoury' },
    { name: 'Baking Powder', id: 'bakingpowder', labTestCategoryId: 'Savoury' },
  ],
  meat: [
    { name: 'Beef', id: 'beef', labTestCategoryId: 'Savoury' },
    { name: 'Chicken Breast', id: 'chicken_breast', labTestCategoryId: 'Savoury' },
    { name: 'Pork', id: 'pork', labTestCategoryId: 'Savoury' },
    { name: 'Salmon', id: 'salmon', labTestCategoryId: 'Savoury' },
    { name: 'Tuna', id: 'tuna', labTestCategoryId: 'Savoury' },
  ],
  vegetables: [
    { name: 'Cabbage', id: 'cabbage', labTestCategoryId: 'Savoury' },
    { name: 'Chilli', id: 'chilli', labTestCategoryId: 'Savoury' },
    { name: 'Fennel', id: 'fennel', labTestCategoryId: 'Savoury' },
    { name: 'Leek', id: 'leek', labTestCategoryId: 'Savoury' },
    { name: 'Pepper', id: 'pepper', labTestCategoryId: 'Savoury' },
    { name: 'Sprout', id: 'sprout', labTestCategoryId: 'Savoury' },
    { name: 'Zucchini', id: 'zuc', labTestCategoryId: 'Savoury' },
  ],
  fruit: [
    { name: 'Apple', id: 'apple', labTestCategoryId: 'Sweet' },
    { name: 'Banana', id: 'banana', labTestCategoryId: 'Sweet' },
    { name: 'Boysenberry', id: 'boysenberry', labTestCategoryId: 'Sweet' },
    { name: 'Grape', id: 'grape', labTestCategoryId: 'Sweet' },
    { name: 'Lemon', id: 'lemon', labTestCategoryId: 'Sweet' },
    { name: 'Strawberry', id: 'strawb', labTestCategoryId: 'Sweet' },
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

export const mockLabTestTypes = Object.values(mockPanels).flat();
