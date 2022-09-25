# Getting started

In order to use **semantic-release** you must follow these steps:

1. [Install](./installation.md#installation) **semantic-release** in your project
2. Configure your Continuous Integration service to [run **semantic-release**](./ci-configuration.md#run-semantic-release-only-after-all-tests-succeeded)
3. Configure your Git repository and package manager repository [authentication](ci-configuration.md#authentication) in your Continuous Integration service
4. Configure **semantic-release** [options and plugins](./configuration.md#configuration)

Alternatively those steps can be easily done with the [**semantic-release** interactive CLI](https://github.com/semantic-release/cli):

```bash
cd your-module
npx semantic-release-cli setup
```

![dialogue](../../media/semantic-release-cli.png)

See the [semantic-release-cli](https://github.com/semantic-release/cli#what-it-does) documentation for more details.

**Note**: only a limited number of options, CI services and plugins are currently supported by `semantic-release-cli`.
