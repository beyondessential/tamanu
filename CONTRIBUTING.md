# Tamanu Contributions Guide

Thank you for taking the time to contribute, and welcome the open-source project for Tamanu! We
value your expertise, insights, and commitment to making Tamanu a global good. This document is a
guide on how to contribute to Tamanu effectively, ensuring it remains a cohesive, maintainable, and
globally valuable product.

[BES Open Source Code of Conduct]: ./CODE_OF_CONDUCT.md
[Contributor License Agreement]: ./CONTRIBUTOR-LICENSE-AGREEMENT.md
[product roadmap]: https://www.bes.au/tamanu-roadmap/
[BES Slab Wiki]: https://beyond-essential.slab.com/posts/bes-dev-culture-best-practices-4745nkso
[Conventional Commit]: https://www.conventionalcommits.org/en/v1.0.0/
[GNU General Public License 3.0]: ./LICENSE-GPL
[Business Source License]: ./LICENSE-BSL
[COPYRIGHT]: ./COPYRIGHT

## Code of Conduct

This project and everyone participating in it is governed by the [BES Open Source Code of Conduct].
By participating, you are expected to uphold this code. Please report unacceptable behavior to
[opensource@tamanu.io](opensource@tamanu.io).

## Contributor License Agreement

All open-source contributors to Tamanu will be required to sign this [Contributor License Agreement]
(CLA) before BES can accept your contribution into the project code. Instructions on how to sign are
provided in the CLA document linked above.

## Our Philosophy

Our core philosophy is to maintain the long-term sustainability of Tamanu. We, at BES work hard to
maintain a cohesive vision for the project. While we encourage collaboration and contributions, we
also want to avoid fragmentation that could compromise Tamanu's usability, maintainability, and
value. We believe that the best way to contribute is to align your efforts with our existing
[product roadmap].

## Contributing

Before considering becoming an open-source contributor for Tamanu, please take note that becoming an
open-source contributor requires a significant amount of time onboarding, and ongoing coordination
and support from BES as the project maintainers. As such we encourage contributions from individuals
and organizations who are prepared to invest significant amounts of time into their work, ensuring
alignment with our roadmap and the highest quality results. While we appreciate the interest of
potential casual contributors, we aim to collaborate with contributors who are serious about their
commitment to Tamanu. If you're ready to deeply engage and uphold Tamanu's vision and standards, we
warmly welcome your involvement.

### Following Our Roadmap

Before making your contribution, make sure that it aligns with our product roadmap for Tamanu. This
ensures that your contribution builds towards a cohesive vision for Tamanu. This generally means
pulling in features from our existing roadmap, and speeding up the delivery process into the core
product. We will gladly co-design features if you identify something missing from the roadmap that
will benefit the users of Tamanu.

The Tamanu product roadmap can be found [here][product roadmap].

#### Meaningful Contributions

To assess whether or not your contribution will be meaningful to the development of Tamanu before
making your contribution, assess your contribution idea against the following criteria:

**Documentation:**
- If there is no documentation for a specific aspect of Tamanu
- If a specific area in the project's documentation is either: lacking detail, outdated or unclear.

**Features:**
- If the feature aligns with the Tamanu roadmap
- If your feature has been co-designed with a BES developer

### Developer Onboarding and Orientation

Being a complex product, Tamanu is at the stage where supported onboarding is necessary for the
project's contributors. The BES Tamanu team are happy to provide hands-on support for serious and
committed contributors, but we will ask to see evidence of your commitment as well as a CV.

Steps for onboarding and setting up your development environment can be found on the [BES Slab Wiki].
However, it's most likely that support is needed from a BES developer in order for a successful and
stable onboarding.

### Collaborative Tech Design

For contributions involving significant complexity, a collaborative tech design session with a BES
developer is required. This ensures that your contribution aligns with Tamanu's project architecture
and standards, thus leading to a smoother integration process and a stronger final product.

### Making Your Code Contribution

#### Code Quality

When making your contribution, please ensure that your code is of high quality. Follows best
practices, write clean and readable code, add comments where necessary, and thoroughly test your
code. We have a code review process for all contributions, and have a high standard for quality.

#### Pull Requests

When your contribution is ready for review, create a pull request. A BES developer will review your
changes and provide feedback. If your pull request has been approved by a reviewer, it will then go
through a round of internal testing. Once your changes have passed testing, they can be merged into
main and be included in an upcoming Tamanu release.

#### Pull Request Title

The title of pull requests must be in [Conventional Commit] format. This is used to generate
changelogs, and to provide a consistent format for commits landing in the main branch, as pull
requests are merged in "squash" mode.

```plain
type: <description>
type(scope): <description>
```

When a Linear card is applicable, the Linear card number should be included:

```plain
type: TEAM-123: <description>
type(scope): TEAM-123: <description>
```

The following types are conventional:

- `feat` for new features
- `fix` for bug fixes
- `tweak` for minor changes
- `refactor` for code refactoring
- `chore` for anything else

There's also two special types:

- `merge` for merging between branches (generally between `main` and `release/*`)
- `release` which are generated by the release tooling exclusively

When merging, additional change lines may be added to the squashed commit message to provide further
context to be pulled into changelogs.

Using Conventional Commit format for "work" commit messages _within_ pull requests is not required.

## Note on Forking

While Tamanu is open-source, there is always the possibility for forking the repository, which we
strongly recommend against. We will not provide any support for forked versions of Tamanu. We have
seen projects struggle and even fail because of this type of splintering. Instead, we encourage you
to collaborate with us on the mainline [product roadmap].

## License

Any contributions you make will be licensed under the [GNU General Public License 3.0].

Contribution to certain areas of the Tamanu codebase may be subject to the [Business Source License]
and may not be accepted. This includes the FHIR API and other vendor integrations. Please refer to
the [COPYRIGHT] file for more information.

---

Again, thank you for considering contributing to Tamanu. With your help, we can make Tamanu a
sustainable, useful, and valuable global good.

The Tamanu Team
