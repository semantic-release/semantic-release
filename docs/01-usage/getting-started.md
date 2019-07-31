# Getting started

## Manual setup

You can use **semantic-release** with the following manual setup steps:
1. [Install **semantic-release**](installation.md) either locally for your project or globally
1. Configure:
    1. Your Continuous Integration service to [run **semantic-release**](ci-configuration.md#run-semantic-release-only-after-all-tests-succeeded)
    1. Your Git repository and package manager repository [authentication](ci-configuration.md#authentication) in your Continuous Integration service
    1. **semantic-release**'s [options and plugins](configuration.md)

## Guided setup through `semantic-release-cli`
Alternatively you can be guided through those setup steps thanks to the [interactive CLI `semantic-release-cli`](https://github.com/semantic-release/cli).

First install `semantic-release-cli`:
```bash
$ npm install -g semantic-release-cli
```

Then go to your project's directory and run the command:
```bash
$ cd your-module
$ semantic-release-cli setup
```
The output looks something like this:
![dialogue](../../media/semantic-release-cli.png)

Available options and other information can be found on [`semantic-release-cli`'s doc](https://github.com/semantic-release/cli#semantic-release-cli).

> **Note**: only a limited number of options, CI services and plugins are currently supported by `semantic-release-cli`.
