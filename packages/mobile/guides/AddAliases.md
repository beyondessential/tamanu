# Adding aliases

Some times paths can become bigger and hard to read. To solve this problem we can create aliases as a pointer to a specific file path.


## Create an entry on tsconfig.json

Add a new entry mapping all files after the folder, i.e, "globalHelpers/*"

```json
"paths": {      
  "/root/*": ["./*"],
  "/components/*": ["App/ui/components/*"],
  "/styled/*": ["App/ui/styled/*"],
  "/interfaces/*": ["App/ui/interfaces/*"],
  "/helpers/*": ["App/ui/helpers/*"],
  "/navigation/*": ["App/ui/navigation/*"],      
  "/containers/*":["App/ui/containers/*"],
  "/contexts/*":["App/ui/contexts/*"],
  "/store/*": ["App/ui/store/*"],
  "/models/*": ["App/ui/models/*"],
  "/services/*": ["App/ui/services/*"],
  "/domain/*": ["App/domain/*"],
  "/data/*": ["App/data/*"],
  "/infra/*": ["App/infra/*"],
  "/presentation/*": ["App/presentation/*"],
  "globalHelpers/*": ["App/globalHelpers/*"],
},
```

### Create entry in jest

After adding an entry to tsconfig.json add a similar entry to jest.config.js in module mapper.
Then both string will be regular expressions. The first part will be related to the alias and it's reference value will be the resolving pattern.

```js
'^globalHelpers(.*)$': '<rootDir>/App/globalHelpers$1'
```

```js
moduleNameMapper: {
  '^/root(.*)$': '<rootDir>$1',
  '^/helpers(.*)$': '<rootDir>/App/ui/helpers$1',
  '^/styled(.*)$': '<rootDir>/App/ui/styled$1',
  '^/components(.*)$': '<rootDir>/App/ui/components$1',
  '^/interfaces(.*)$': '<rootDir>/App/ui/interfaces$1',
  '^/navigation(.*)$': '<rootDir>/App/ui/navigation$1',
  '^/contexts(.*)$': '<rootDir>/App/ui/contexts$1',
  '^/services(.*)$': '<rootDir>/App/ui/services$1',
  '^/domain(.*)$': '<rootDir>/App/domain$1',
  '^/data(.*)$': '<rootDir>/App/data$1',
  '/infra(.*)$': '<rootDir>/App/infra$1',
  '/presentation(.*)$': '<rootDir>/App/presentation$1',    
  '/globalHelpers(.*)$': '<rootDir>/App/globalHelpers$1',
},
```


## Add entry to babel

Add a new entry to the alias object where the key is the alias and the value is the path to be resolved.
```js
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        extensions: ['ts', '.tsx', '.json'],
        alias: {
          '/globalHelpers': './App/globalHelpers',          
          '/styled': './App/ui/styled',
          '/components': './App/ui/components',
          '/interfaces': './App/ui/interfaces',
          '/helpers': './App/ui/helpers',
          '/navigation': './App/ui/navigation',
          '/containers': './App/ui/containers',
          '/contexts': './App/ui/contexts',
          '/store': './App/ui/store',
          '/models': './App/ui/models',
          '/services': './App/ui/services',
          '/domain': './App/domain',
          '/data': './App/data',
          '/infra': './App/infra',
          '/presentation': './App/presentation',          
          '/root': './',
        },
      },
    ],
  ],
};
```

## Add entry to eslint.json

Finally add the path entry inside the map array so eslint can properly lint it.

```json
 "settings": {   
    "import/resolver": { 
      "alias": {        
        "map": [                        
          ["/globalHelpers", "./App/globalHelpers"],      
          ["/styled", "./App/ui/styled"],      
          ["/helpers", "./App/ui/helpers"]  ,
          ["/interfaces", "./App/ui/interfaces"],
          ["/components", "./App/ui/components"],   
          ["/navigation", "./App/ui/navigation"],         
          ["/containers", "./App/ui/containers"],
          ["/store", "./App/ui/store"],
          ["/models", "./App/ui/models"],
          ["/services", "./App/ui/services"],
          ["/contexts", "./App/ui/contexts"],
          ["/domain", "./App/domain"],
          ["/data", "./App/data"],
          ["/infra", "./App/infra"],
          ["/presentation", "./App/presentation"],
          ["/root", "./"]                
        ],
        "extensions": [".ts", ".js", ".jsx", ".tsx", ".json"]
      },
      "node": {
        "extensions": [".js",".json", ".ts", ".tsx", ".stories"]
      }
    }
  },
  ```

  This should be all to allow aliases and avoid editor, eslint, babel and jest errors.
