# Detox configuration

[Detox](https://github.com/wix/detox) is a End to end testing framework that invokes an emulator and attempts to simulate user interactions workflow.

The idea here is to validate feature like it would be in production following possible steps and routines an user would have to do.

Repetitive workflows should be separated in a method to reduce the amount of code in test blocks. 


Example of workflows to be tested end-to-end:

- User authentication
- Add Patient workflow
- Add diagnosis & treatment entry
- Add check up
- Add program entry
- Add referral