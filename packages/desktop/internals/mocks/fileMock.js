// Comment on package.json->jest.moduleNameMapper,
// 1. redux-persist failed to create sync storage in Jest. Mapping it to here is a hacky way to avoid it initialises. And unit test doesn't need Redux tbh.
// 2. Not to import images in unit test. It's not necessary and it will fail the test.
export default '';
