---
id: SDPUB
---

# Publishing Seedling definitions

Applies to how Tamanu's build publishes its [Seedling definitions](overview.md) as OCI artefacts, and how a definition is run from the repository for development and testing.

## Artefacts

- Every build that pushes Tamanu's server images also publishes their definitions: the central definition with the central server image, and the facility definition with the facility server image.
- A definition is published as an entry in the image index of its server image, under every tag that index is pushed under.
- One reference, such as the central server image at a release tag, therefore names both the images and the definition that runs them.
- Each definition entry declares the Seedling versions its bundle supports, as Seedling's [definition fetching](https://github.com/beyondessential/seedling/blob/main/.workhorse/specs/interface/definitions.md#fetching) reads them.
- A build whose definition fails to publish fails, rather than pushing images with no definition beside them.

## Published version

- A published definition carries the image build it was published with, and its version parameter [defaults to that build](upgrades.md#version-parameter).

## From the repository

- A definition can be run straight from its folder in the Tamanu repository (`seedling/central` or `seedling/facility`), at any branch, tag or commit, through Seedling's GitHub source.
- A definition run from the repository carries no build, so its version parameter has no default and must be set.
