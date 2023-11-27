# Tamanu Contributions Guide

Thank you for taking the time to contribute, and welcome the open-source project for Tamanu!
We value your expertise, insights, and commitment to making Tamanu a global good. This 
document is a guide on how to contribute to Tamanu effectively, ensuring it remains a 
cohesive, maintainable, and globally valuable product.

## Table of Contents

[//]: # (- [Code of Conduct]&#40;#code-of-conduct&#41;)

[//]: # (- [Contributing]&#40;#contributing&#41;)

[//]: # (    - [Bug Reporting]&#40;#bug-reporting&#41;)

[//]: # (    - [Suggesting Enhancements]&#40;#suggesting-enhancements&#41;)

[//]: # (    - [Making Your Code Contribution]&#40;#making-your-code-contribution&#41;)

[//]: # (- [Questions]&#40;#questions&#41;)

## Code of Conduct

This project and everyone participating in it is governed by the
[BES Open Source Code of Conduct](/CODE_OF_CONDUCT.md).
By participating, you are expected to uphold this code. Please report unacceptable behavior
to [support@tamanu.io](support@tamanu.io).

## Copyright Attribution

All open-source contributors to Tamanu will be required to sign a Contributor License Agreement (CLA)
before BES can accept your contribution into the project code. This is done so that we can continue 
to maintain the codebase covered by a single license. Signing a CLA can be done through GitHub 
before merging in your first pull request.

### --------------------------------------------------

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

#### Meaningful Contributions (under construction)

To assess whether or not your contribution will be meaningful to the development of Tamanu before 
making your contribution, put your contribution idea against the following criteria:

**Documentation:** 
- If there is no documentation for a specific aspect of Tamanu
- If a specific area in the project's documentation is either: lacking detail, outdated or unclear.

**Features:**
- If the feature aligns with the Tamanu roadmap
- If your feature has been co-designed with a BES developer

### Developer Orientation

Being a complex product, Tamanu is at the stage where it supported onboarding in necessary for the 
project's contributors. The BES Tamanu team are happy to provide hands-on support for serious and 
committed contributors, But we will ask to see evidence of your commitment as well as a CV.

Steps for onboarding and setting up your development environment can be found on the [BES Slab Wiki](INSERT APPROPRIATE LINK HERE).

### Collaborative Tech Design

For contributions involving significant complexity, a collaborative tech design session with a 
BES developer is required. This ensures that your contribution aligns with Tamanu's project 
architecture and standards, thus leading to a smoother integration process and a stronger final 
product.

### Code Quality

When making your contribution, please ensure that your code is of high quality. Follows best 
practices, write clean and readable code, add comments where necessary, and thoroughly test your 
code. We have a code review process for all contributions, and have a high bar for quality.

### Making Your Code Contribution

#### Branch Naming Conventions

For open-source contribution branches, the naming convention is:

    <contribution-type>/<issue-id>-<description>

For example, `fix/1736-pdf-export-crash`

#### Branching Strategy

1. When creating a branch for your contribution, branch off the latest `main`.
2. Make your commits on the branch you made.
3. Once your changes are complete, pull from the latest `main` and create a pull request on GitHub

#### Pull Requests

When your contribution is ready for review, create a pull request. A BES developer will review
your changes and provide feedback. If your pull request has been approved by a reviewer, it
will then go through a round of internal testing. Once your changes have passed testing, they
can be merged into main and be included in an upcoming Tamanu release.

_(potentially space for more information on the process of merging contributions into main (such 
as updating changelog and info about the pr template and also the auto deploy tests))_

## Note on Forking

While Tamanu is open-source, there is always the possibility for forking the repository, which 
we strongly recommend against it. We will not provide any support for forked versions of Tamanu. 
We have seen projects struggle and even fail because of this type of splintering. Instead, we 
encourage you to collaborate with us on the mainline product roadmap.

Again, thank you for considering contributing to Tamanu. With your help, we can make Tamanu a 
sustainable, useful, and valuable global good.

### --------------------------------------------------

## Contributing

All types of contributions are encouraged and valued. This section covers the different ways to contribute and details 
about how this project handles them. All types of contributions are encouraged and valued. Please make sure to read the 
sections relevant to your contribution before making one. It will make the experience much smoother for all those 
involved. The community looks forward to your contributions!

### Bug Reporting

#### Before submitting a Bug report

A good bug report shouldn't leave others needing to chase you up for more information. Therefore, we ask you to 
investigate carefully, collect information and describe the issue in detail in your report. Please complete the 
following steps in advance to help us fix any potential bug as fast as possible.

- Make sure that you are using the latest version.
- Determine if your bug is really a bug and not an error on your side e.g. using incompatible environment 
components/versions (Make sure that you have read the documentation. If you are looking for support, you might want to 
check [this section](#questions)).
- To see if other users have experienced (and potentially already solved) the same issue you are having, check if there 
is not already a bug report existing for your bug or error in the [bug tracker](https://github.com/beyondessential/tamanu-openissues?q=label%3Abug).
- Also make sure to search the internet (including Stack Overflow) to see if users outside the GitHub community have 
discussed the issue.
- Collect information about the bug:
    - Stack trace (Traceback)
    - OS, Platform and Version (Windows, Linux, macOS, x86, ARM)
    - Version of the interpreter, compiler, SDK, runtime environment, package manager, depending on what seems relevant.
    - Possibly your input and the output
    - Can you reliably reproduce the issue? And can you also reproduce it with older versions?

#### Submitting a good bug report

We use GitHub Issues to track bugs and errors. If you run into an issue with the project:

- Open an [Issue](https://github.com/beyondessential/tamanu-open/issues/new). (Since we can't be sure at this point 
whether it is a bug or not, we ask you not to talk about a bug yet and not to label the issue.)
- Explain the behaviour you would expect and the actual behaviour.
- Please provide as much context as possible and describe the _reproduction steps_ that someone else can follow to 
recreate the issue on their own. This usually includes your code. For good bug reports you should isolate the problem 
and create a reduced test case.
- Provide the information you collected in the previous section

Once it's filled:

- The project team will label the issue accordingly.
- A team member will try to reproduce the issue with your provided steps. If there are no reproduction steps or no 
obvious way to reproduce the issue, the team will ask you for those steps and mark the issue as `needs-repro`. Bugs with 
the `needs-repro` tag will not be addressed until they are reproduced.
- If the team is able to reproduce the issue, it will be marked `needs-fix`, as well as possible other tags


### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for Tamanu, **including completely new features and
minor improvements to existing functionality**. Following these guidelines will help maintainers and the community to 
understand your suggestion and find related suggestions.

#### Before submitting an Enhancement

- Make sure that you are using the latest version.
- Read the documentation carefully and find out if the functionality is already covered, maybe by an individual 
configuration.
- Perform a search in the [issues](https://github.com/beyondessential/tamanu-open/issues) to see if the enhancement has 
already been suggested. If it has, add a comment to the existing issue instead of opening a new one.
- Find out whether your idea fits with the scope and aims of the project. It's up to you to make a strong case to 
convince the project's developers of the merits of this feature. Keep in mind that we want features that will be useful 
to the majority of our users and not just a small subset. 

#### Submitting a Good Enhancement Suggestion

Enhancement suggestions are tracked as [GitHub issues](https://github.com/beyondessential/tamanu-open/issues).

- Use a **clear and descriptive title** for the issue to identify the suggestion.
- Provide a **step-by-step description of the suggested enhancement** in as many details as possible.
- **Describe the current behaviour** and **explain which behaviour you expected to see instead** and why. At this point 
you can also tell which alternatives do not work for you.
- You may want to **include screenshots and animated GIFs** which help you to demonstrate the steps or point out the 
part which the suggestion is related to. You can use [this tool](https://www.cockos.com/licecap/) to record GIFs on 
macOS and Windows, and [this tool](https://github.com/colinkeenan/silentcast) or 
[this tool](https://github.com/GNOME/byzanz) on Linux.
- **Explain why this enhancement would be useful** to most Tamanu users. You may also want to point out the other 
projects that solved it better and which could serve as inspiration.

### Making Your Code Contribution

#### Branch Naming Conventions

For bug fix / feature branches, the naming convention is:

    <contribution-type>/<issue-id>-description

For example, `fix/1736-pdf-export-crash`

#### Branching Strategy

1. When creating a branch for a bugfix / feature, branch off the latest `main`.
2. Make your commits on that bugfix / feature branch you made.
3. Once changes are complete, pull from the latest `main` and open a pull request
4. When the pull request and feature branch testing are completed by the project developers, merge the branch into 
`main` and delete the branch.

## Questions

Before asking a questions, it's best to search for existing [Issues](https://github.com/beyondessential/tamanu-open/issues/issues) that might help you. In case you have found a suitable issue and still need clarification, you can write your questions in this issue. It's also advisable to search the internet for answers first.

If you then still feel the need to ask a question and need clarification, we recommend the following:

- Open an [Issue](https://github.com/beyondessential/tamanu-open/issues/issues/new).
- Provide as much context as you can about what you're running into.
- Provide project and platform versions (nodejs, npm, etc), depending on what seems relevant

We will then take care of the issue as soon as possible.

## Attribution
This guide is based on the **contributing-gen**. [Make your own](https://github.com/bttger/contributing-gen)!

