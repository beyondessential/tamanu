# Mockserver

The remote server should have at least 2 api endpoints.

- Sync (pull all changes)
- Sync (push all changes)

A good example for [remote sync API] (https://nozbe.github.io/WatermelonDB/Advanced/Sync.html):

it could return an object with all models and it's respective changes:

```ts
{
  projects: {
    created: [
      { id: 'aaaa', name: 'Foo', is_favorite: true },
      { id: 'bbbb', name: 'Bar', is_favorite: false },
    ],
    updated: [
      { id: 'ccc', name: 'Baz', is_favorite: true },
    ],
    deleted: ['ddd'],
  },
  tasks: {
    created: [],
    updated: [
      { id: 'tttt', name: 'Buy eggs' },
    ],
    deleted: [],
  },  
}
```

This way a background job can be created with [react-native-background-task](https://www.npmjs.com/package/react-native-background-task) and implement a sync task in the app.
