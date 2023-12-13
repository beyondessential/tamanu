# UI folder

All files related from UI rendering to ui state logic. The files and folder names should be "screaming architecture" based. This way, by navigating through the folders should follow the same mental steps to understand the logic in the files.

|            |                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| assets     | Images and other assets required in the app                                                             |
| components | React components built according to the figma design                                                    |
| containers | Container logic to centralize redux imports                                                             |
| contexts   | Context component that centralize all implementations of actions of a specific resource.                |
| helpers    | helper methods and constants                                                                            |
| interfaces | Types and interfaces for components, navigators and screens.                                            |
| models     | Interfaces for Data Transfer Objects from the remote API (might be moved to models iside domain folder) |
| navigation | navigators, screens and stack components                                                                |
| reactotron | Folder with file setup for reactotron desktop app.                                                      |
| services   | (Deprecated) used to create Services to hit remote API endpoints                                        |
| styled     | styled-components base blocks to build the UI and theme object exported in theme.js                     |

### interfaces

The idea behind this folder is to make screens, stateful or stateless components as clean as possible and move all interfaces and types to this folder.

The structure is basically the same structure as the UI folder where screens should have screen interfaces and so on.

### styled

Styled folder has 2 files:

|        |                                                                                                                                                                                  |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| common | Exports multiple base blocks to build UIs with a inline styling approach to skip declaration and make styling more readable while looking to the UI tree.                        |
| theme  | File that exports an object with the keys named as the colors as described in the [Figma](https://www.figma.com/file/RYItiDc0mUB2BbrskfZOhh/Tamanu-Mobile-App?node-id=1177%3A40) |

#### common

The approached used widely in this project is based in 2 libraries:

- [styled-components](https://styled-components.com/)
- [styled-system](https://styled-system.com/)

The idea is to avoid the common problem that happens in styled-components where due to declaration of blocks are separated from instantiation, component files becomes bigger than it should even if we use composition.
Using a common base block to create the UI in a "inline style" makes it more readable and avoid jumping between files
to understand.

Blocks:

|                        |                                                          |
| ---------------------- | -------------------------------------------------------- |
| StyledView             | Base building block                                      |
| StyledImage            | Image                                                    |
| FullView               | Component with flex: 1, i.e, fill all available space.   |
| CenterView             | Component that centers children elements                 |
| RotateView             | Component that rotates 90 degrees the children elements  |
| HalfSizeView           | Component that gets 50% of width of the parent component |
| RowView                | Component with flex-direction row                        |
| ColumnView             | Component with flex-direction column                     |
| StyledScrollView       | Component with scroll                                    |
| StyledTouchableOpacity | TouchableOpacity component with StyledView properties.   |

### store

Folder responsible for redux configuration and it's dependencies.
Redux usually requires a lot of boilerplate and repetitive code. Thinking about this problem redux community created [redux-toolkit](https://redux-toolkit.js.org/usage/usage-with-typescript) with helper methods and interfaces to make the actions and reducers cleaner than the traditional code split.
This library gives a more opinionated strategy with redux, which can help to give consistency in the long run.

Methods used in this project so far:

|                |                                       |
| -------------- | ------------------------------------- |
| CreateSlice    | Creates both actions and reducers.    |
| configureStore | Helper method to create store object. |

|       |                                                                 |
| ----- | --------------------------------------------------------------- |
| index | gathers all reducers and exports the store object               |
| ducks | Pattern used where actions and reducer are all in the same file |

### navigation

This project uses the version 5 of [react-navigation](https://reactnavigation.org/docs/getting-started) lib.
Useful links:

- [navigation hooks](https://reactnavigation.org/docs/use-navigation)
- [Stack Navigator](https://reactnavigation.org/docs/stack-navigator/)
- [Tab navigation](https://reactnavigation.org/docs/tab-based-navigation)
- [Drawer Navigator (side menu)](https://reactnavigation.org/docs/drawer-based-navigation/)

|      |                                                                                                |
| ---- | ---------------------------------------------------------------------------------------------- |
| Root | File used to centralize imports of Contexts Providers: redux, redux-persist, react-navigation. |
| Core | Higher navigator component.                                                                    |

|         |                                                                             |
| ------- | --------------------------------------------------------------------------- |
| screens | UI components for each screens based on the stack they are in.              |
| stacks  | Declaration of the navigators components and the screen hierarchy/sequence. |

#### On Creating Screens

A single file can handle if the screen has low complexity.
The current approach when screens are too big is to split the code between Container, Screen, CustomComponents and helpers.

|                               |                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| Container                     | UI components for each screens based on the stack they are in.                                   |
| Screen                        | instantiation of the UI components                                                               |
| CustomComponents              | folder with the UI components. Should be used only if screen file becomes too big or if there is |
| an opportunity to code reuse. |                                                                                                  |
| helpers                       | Declaration of the navigators components and the screen hierarchy/sequence.                      |

### context

Since Context API has improved it makes sense to use it as a pattern to make Context.Provider components to centralize access of redux actions and implementation of methods that requires access from redux actions.
This way using useContext we can isolate the implementation from screen containers.
Check authContext for an example.
