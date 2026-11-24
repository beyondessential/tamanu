# UI folder

All files related from UI rendering to ui state logic. The files and folder names should be
“screaming architecture” based. This way, by navigating through the folders should follow the same
mental steps to understand the logic in the files.

|            |                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| assets     | Images and other assets required in the app                                                             |
| components | React components built according to the figma design                                                    |
| contexts   | Context providers that hold app state and the actions on it, each with a hook to read it.               |
| hooks      | Shared hooks, including the query and mutation hooks                                                    |
| helpers    | helper methods and constants                                                                            |
| interfaces | Types and interfaces for components, navigators and screens.                                            |
| models     | Interfaces for Data Transfer Objects from the remote API (might be moved to models iside domain folder) |
| navigation | navigators, screens and stack components                                                                |
| reactotron | Folder with file setup for reactotron desktop app.                                                      |
| services   | (Deprecated) used to create Services to hit remote API endpoints                                        |
| styled     | styled-components base blocks to build the UI and theme object exported in theme.js                     |

### interfaces

The idea behind this folder is to make screens, stateful or stateless components as clean as
possible and move all interfaces and types to this folder.

The structure is basically the same structure as the UI folder where screens should have screen
interfaces and so on.

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

The idea is to avoid the common problem that happens in styled-components where due to declaration
of blocks are separated from instantiation, component files becomes bigger than it should even if we
use composition. Using a common base block to create the UI in a "inline style" makes it more
readable and avoid jumping between files to understand.

Blocks:

|                          |                                                          |
| ------------------------ | -------------------------------------------------------- |
| `StyledView`             | Base building block                                      |
| `StyledImage`            | Image                                                    |
| `FullView`               | Component with flex: 1, i.e, fill all available space.   |
| `CenterView`             | Component that centers children elements                 |
| `RotateView`             | Component that rotates 90 degrees the children elements  |
| `HalfSizeView`           | Component that gets 50% of width of the parent component |
| `RowView`                | Component with flex-direction row                        |
| `ColumnView`             | Component with flex-direction column                     |
| `StyledScrollView`       | Component with scroll                                    |
| `StyledTouchableOpacity` | TouchableOpacity component with StyledView properties.   |

### navigation

This project uses the version 5 of
[react-navigation](https://reactnavigation.org/docs/getting-started) lib. Useful links:

- [navigation hooks](https://reactnavigation.org/docs/use-navigation)
- [Stack Navigator](https://reactnavigation.org/docs/stack-navigator/)
- [Tab navigation](https://reactnavigation.org/docs/tab-based-navigation)
- [Drawer Navigator (side menu)](https://reactnavigation.org/docs/drawer-based-navigation/)

|      |                                                                                   |
| ---- | --------------------------------------------------------------------------------- |
| Root | File used to centralize the context providers and the react-navigation container. |
| Core | Higher navigator component.                                                       |

|         |                                                                             |
| ------- | --------------------------------------------------------------------------- |
| screens | UI components for each screens based on the stack they are in.              |
| stacks  | Declaration of the navigators components and the screen hierarchy/sequence. |

#### On Creating Screens

A single file can handle if the screen has low complexity. The current approach when screens are too
big is to split the code between Container, Screen, CustomComponents and helpers.

|                  |                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Container        | UI components for each screens based on the stack they are in.                                                                 |
| Screen           | instantiation of the UI components                                                                                             |
| CustomComponents | folder with the UI components. Should be used only if screen file becomes too big or if there is an opportunity to code reuse. |
| helpers          | Declaration of the navigators components and the screen hierarchy/sequence.                                                    |

### context

App state that more than one screen needs lives in a Context.Provider component, which also holds
the methods that change it. Screens read it through the context's hook, such as `useAuth()` or
`useSelectedPatient()`, which keeps the implementation out of the screens.

State that has to survive the app closing goes through the `useStoredState` hook, which reads it
from storage when the provider mounts and writes it back on every change. `AuthContext` keeps the
signed-in session this way and `SelectedPatientContext` the selected patient.
