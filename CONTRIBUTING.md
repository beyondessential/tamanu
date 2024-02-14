# Tamanu Contributions Guide

Thank you for taking the time to contribute, and welcome the open-source project for Tamanu!
We value your expertise, insights, and commitment to making Tamanu a global good. This 
document is a guide on how to contribute to Tamanu effectively, ensuring it remains a 
cohesive, maintainable, and globally valuable product.

## Code of Conduct

This project and everyone participating in it is governed by the
[BES Open Source Code of Conduct](CODE_OF_CONDUCT.md).
By participating, you are expected to uphold this code. Please report unacceptable behavior
to [opensource@tamanu.io](opensource@tamanu.io).

## Copyright Attribution

All open-source contributors to Tamanu will be required to sign a Contributor License Agreement (CLA)
before BES can accept your contribution into the project code. This is done so that we can continue 
to maintain the codebase covered by a single license. Signing a CLA can be done through GitHub 
before merging in your first pull request.

## Our Philosophy

Our core philosophy is to maintain the long-term sustainability of Tamanu. We, at BES work hard 
to maintain a cohesive vision for the project. While we encourage collaboration and contributions, 
we also want to avoid fragmentation that could compromise Tamanu's usability, maintainability, 
and value. We believe that the best way to contribute is to align your efforts with our existing 
product roadmap.

## Contributing

Before considering becoming an open-source contributor for Tamanu, please take note that becoming 
an open-source contributor requires a significant amount of time onboarding, and ongoing 
coordination and support from BES as the project maintainers. As such we encourage contributions 
from individuals and organizations who are prepared to invest significant amounts of time into 
their work, ensuring alignment with our roadmap and the highest quality results. While we appreciate 
the interest of potential casual contributors, we aim to collaborate with contributors who are 
serious about their commitment to Tamanu. If you're ready to deeply engage and uphold Tamanu's 
vision and standards, we warmly welcome your involvement.

### Following Our Roadmap

Before making your contribution, make sure that it aligns with our product roadmap for Tamanu. 
This ensures that your contribution builds towards a cohesive vision for Tamanu. This generally 
means pulling in features from our existing roadmap, and speeding up the delivery process into the 
core product. We will gladly co-design features if you identify something missing from the roadmap 
that will benefit the users of Tamanu.

The Tamanu product roadmap can be found [here](https://www.bes.au/tamanu-roadmap/).

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
committed contributors, But we will ask to see evidence of your commitment as well as a CV.

Steps for onboarding and setting up your development environment can be found on the [BES Slab Wiki](INSERT APPROPRIATE LINK HERE).
However, it's most likely that support is needed from a BES developer in order for a successful and 
stable onboarding.

### Collaborative Tech Design

For contributions involving significant complexity, a collaborative tech design session with a 
BES developer is required. This ensures that your contribution aligns with Tamanu's project 
architecture and standards, thus leading to a smoother integration process and a stronger final 
product.

### Making Your Code Contribution

#### Code Quality

When making your contribution, please ensure that your code is of high quality. Follows best
practices, write clean and readable code, add comments where necessary, and thoroughly test your
code. We have a code review process for all contributions, and have a high standard for quality.

#### Branch Naming Conventions

For open-source contribution branches, the naming convention is:

    <contribution-type>/<issue-id>-<description>

For example, `fix/1736-pdf-export-crash`

The following prefixes are conventional:

- `epic/` for large features or changes that span multiple issues
- `feature/` for new features and improvements
- `fix/` for bug fixes
- `merge/` for branches that merge other branches (resolving conflicts or doing complex merges)

Additionally, `feature/` branches should be named after the Linear card they are associated with:

```plain
feature/team-123-my-feature
```

The following prefixes are reserved and must not be created manually:

- `dependabot/` for branches created by Dependabot
- `release/` for release branches

#### Branching Strategy

1. When creating a branch for your contribution, branch off the latest `main`.
2. Make your commits on the branch you made.
3. Once your changes are complete, pull from the latest `main` and create a pull request on GitHub

#### Pull Requests

When your contribution is ready for review, create a pull request. A BES developer will review
your changes and provide feedback. If your pull request has been approved by a reviewer, it
will then go through a round of internal testing. Once your changes have passed testing, they
can be merged into main and be included in an upcoming Tamanu release.

#### Pull Request Title

The title of pull requests must be in [Conventional Commit](https://www.conventionalcommits.org/en/v1.0.0/)
format. This is used to generate changelogs, and to provide a consistent format for commits landing
in the main branch, as pull requests are merged in "squash" mode.

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

- `ci` for changes to the CI/CD workflows
- `config` for changes to the Tamanu configuration files
- `db` for changes to the database schema, migrations, etc
- `deps` for changes to dependencies or dependency upgrades
- `doc` for documentation changes
- `feat` for new features
- `fix` for bug fixes
- `fmt` for automatic formatting changes (ignored in changelogs)
- `refactor` for code refactoring
- `release` for changes that are part of the release process (generally automated commits, not manual use)
- `repo` for changes to the repository structure, or for config/dotfiles (e.g. `.gitignore`, `.editorconfig`, etc)
- `revert` for reverting a previous commit
- `style` for stylistic changes that do not affect the meaning of the code
- `test` for adding missing tests or correcting existing tests
- `tweak` for minor changes that do not fit into any other category

When merging, additional change lines may be added to the squashed commit message to provide further
context to be pulled into changelogs.

Using Conventional Commit format for actual commit messages within pull requests is not required.

## Note on Forking

While Tamanu is open-source, there is always the possibility for forking the repository, which 
we strongly recommend against. We will not provide any support for forked versions of Tamanu. 
We have seen projects struggle and even fail because of this type of splintering. Instead, we 
encourage you to collaborate with us on the mainline product roadmap.

## License 

Any contributions you make will be licensed under our [open-source license](license).

---

Again, thank you for considering contributing to Tamanu. With your help, we can make Tamanu a
sustainable, useful, and valuable global good.

The Tamanu Team
