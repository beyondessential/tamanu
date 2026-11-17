---
id: SDPUB
---

# Publishing Seedling definitions

Applies to how Tamanu's build publishes its [Seedling definitions](overview.md) as OCI artefacts, and how a definition is run from the repository for development and testing.

## Borrowed terms

- [Image index](https://github.com/opencontainers/image-spec/blob/main/image-index.md): an OCI document listing the manifests published under one image reference, such as one image per platform.
- [Definition artefact](https://github.com/beyondessential/seedling/blob/main/.workhorse/specs/interface/definitions.md#definition-artefact): an OCI manifest holding a Seedling definition bundle, which Seedling fetches by reference.

## Artefacts

- Every build that pushes Tamanu's server images also publishes their definitions: the central definition with the central server image, and the facility definition with the facility server image.
- A definition is published as a definition artefact entry in the image index of its server image, under every tag that index is pushed under.
- One reference, such as the central server image at a release tag, therefore names both the server's image and the definition that runs the server.
- Each definition entry declares the Seedling versions its bundle supports, as Seedling's [definition fetching](https://github.com/beyondessential/seedling/blob/main/.workhorse/specs/interface/definitions.md#fetching) reads them.
- The definition entry leaves pulling the server image from that index unchanged, for every platform that pulls it.
- A build whose definition fails to publish fails, rather than pushing images with no definition beside them.

## Published version

- A published definition carries the exact tag of the build it was published with: the release tag for a release build, and the commit tag for any other build. It is never a floating tag, such as a minor's.
- That tag is what the definition's [version parameter](upgrades.md#version-parameter) defaults to.

## From the repository

- A definition can be run straight from its folder in the Tamanu repository (`seedling/central` or `seedling/facility`), at any branch, tag or commit, through the Seedling CLI's GitHub source.
- A definition run from the repository carries no build.
