# App Folder

The idea is to separate concerns the best as possible although Domain Driven Design might be more suitable for backend development due to business logic.

|               |                                                                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| data          | Data Layer is responsible for implementing a Domain Use case and all data mutation and proper validation.                                                                |
| domain        | Create use case interfaces to be implemented for Data Layer. Model interfaces for Data Tranfer Objects.                                                                  |
| factories     | Factories for each use cases.                                                                                                                                            |
| infra         | Infra Layer is responsible for creating abstractions over modules that the app will use so it becomes easier to replace one lib for another one.                         |
| presentations | Presentation Layer is responsible for creating controllers which will call data layer implementations and returns to the UI the resource, an error or an success result. |
