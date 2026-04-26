# Considerations

**semantic-release** is

- an opinionated release tool
- a tool to simplify versioning releases semantically first, automating steps related to a release process second
- a tool that encourages engineering practices that support delivering high quality at a sustainable pace (continuous deployment/release, trunk based deployment)

## Are you interested in **semantic-release** because of our primary or secondary goals

If your primary attraction is for automatic release note generation rather than semantic versioning, you may want to reconsider if **semantic-release** is the right fit for your goals.

## Do you actually need semantic versioning?

The use of the word "semantic" in the term "semantic versioning" has the intent that the structure of the version conveys specific meaning.
Consult https://semver.org/ for details about the details of the specific meaning, but keep in mind that the semantics are from the perspective of a consumer.

Semantic versioning is most useful for software releases that are consumed programmatically.
Common examples are libraries/packages consumed as dependencies.
Base Docker images can also fall in this category because they are consumed in a way that other layers build on top of them.

Applications that are deployed directly to a runtime environment lack an audience to benefit from the benefits of semantic versioning.
Docker images that are published to a registry only for the purpose of deploying directly to a runtime environment fall into this category, even though they are a published asset.
Often, using the git SHA as the version for such assets is a better choice than versioning them semantically.

## Can you simplify the release steps automated by **semantic-release**?

Updating the version in the `package.json` of an npm package or providing release notes in a `CHANGELOG.md` file are popular release steps
that can be enabled with **semantic-release** using the [changelog](https://github.com/semantic-release/changelog) and [git](https://github.com/semantic-release/git) plugins.
However, those two plugins are intentionally _not_ included in the default configuration of **semantic-release** because
[they are not necessary for **semantic-release** to function](https://semantic-release.gitbook.io/semantic-release/support/faq#it-is-not-needed-for-semantic-release-to-do-its-job)
and [making commits during the release process adds significant complexity](https://semantic-release.gitbook.io/semantic-release/support/faq#making-commits-during-the-release-process-adds-significant-complexity).

Please consider the trade-offs of adding those plugins to your release configuration for potentially unnecessary goals.

## Is the branching strategy of your project supported by **semantic-release**?

[supported branching strategies](./supported-branching.md)
