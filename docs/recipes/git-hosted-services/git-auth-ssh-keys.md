# Git authentication with SSH keys

When using [environment variables](../../usage/ci-configuration.md#authentication) to set up the Git authentication, the remote Git repository will automatically be accessed via [https](https://git-scm.com/book/en/v2/Git-on-the-Server-The-Protocols#_the_http_protocols), independently of the [`repositoryUrl`](../../usage/configuration.md#repositoryurl) format configured in the **semantic-release** [Configuration](../../usage/configuration.md#configuration) (the format will be automatically converted as needed).

Alternatively the Git repository can be accessed via [SSH](https://git-scm.com/book/en/v2/Git-on-the-Server-The-Protocols#_the_ssh_protocol) by creating SSH keys, adding the public one to your Git hosted account and making the private one available on the CI environment.

**Note:** SSH keys allow to push the [Git release tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging) associated to the released version. Some plugins might also require an API token. See each plugin documentation for additional information.

## Generating the SSH keys

In your local repository root:

```bash
$ ssh-keygen -t rsa -b 4096 -C "<your_email>" -f git_deploy_key -N "<ssh_passphrase>"
```

`your_email` must be the email associated with your Git hosted account. `ssh_passphrase` must be a long and hard to guess string. It will be used later.

This will generate a public key in `git_deploy_key.pub` and a private key in `git_deploy_key`.

## Adding the SSH public key to the Git hosted account

Step by step instructions are provided for the following Git hosted services:

- [GitHub](#adding-the-ssh-public-key-to-github)

### Adding the SSH public key to GitHub

Open the `git_deploy_key.pub` file (public key) and copy the entire content.

In GitHub **Settings**, click on **SSH and GPG keys** in the sidebar, then on the **New SSH Key** button.

Paste the entire content of `git_deploy_key.pub` file (public key) and click the **Add SSH Key** button.

Delete the `git_deploy_key.pub` file:

```bash
$ rm git_deploy_key.pub
```

See [Adding a new SSH key to your GitHub account](https://help.github.com/articles/adding-a-new-ssh-key-to-your-github-account/) for more details.

## Adding the SSH private key to the CI environment

In order to be available on the CI environment, the SSH private key must be encrypted, committed to the Git repository and decrypted by the CI service.

Step by step instructions are provided for the following environments:

- [Travis CI](#adding-the-ssh-private-key-to-travis-ci)
- [Circle CI](#adding-the-ssh-private-key-to-circle-ci)

### Adding the SSH private key to Travis CI

Install the [Travis CLI](https://github.com/travis-ci/travis.rb#installation):

```bash
$ gem install travis
```

[Login](https://github.com/travis-ci/travis.rb#login) to Travis with the CLI:

```bash
$ travis login
```

Add the [environment](https://github.com/travis-ci/travis.rb#env) variable `SSH_PASSPHRASE` to Travis with the value set during the [SSH keys generation](#generating-the-ssh-keys) step:

```bash
$ travis env set SSH_PASSPHRASE <ssh_passphrase>
```

[Encrypt](https://github.com/travis-ci/travis.rb#encrypt) the `git_deploy_key` (private key) using a symmetric encryption (AES-256), and store the secret in a secure environment variable in the Travis environment:

```bash
$ travis encrypt-file git_deploy_key
```

The `travis encrypt-file` will encrypt the private key into the `git_deploy_key.enc` file and output in the console the command to add to your `.travis.yml` file. It should look like `openssl aes-256-cbc -K $encrypted_KKKKKKKKKKKK_key -iv $encrypted_VVVVVVVVVVVV_iv -in git_deploy_key.enc -out git_deploy_key -d`.

Copy this command to your `.travis.yml` file in the `before_install` step. Change the output path to write the unencrypted key in `/tmp`: `-out git_deploy_key` => `/tmp/git_deploy_key`. This will avoid to commit / modify / delete the unencrypted key by mistake on the CI. Then add the commands to decrypt the ssh private key and make it available to `git`:

```yaml
before_install:
  # Decrypt the git_deploy_key.enc key into /tmp/git_deploy_key
  - openssl aes-256-cbc -K $encrypted_KKKKKKKKKKKK_key -iv $encrypted_VVVVVVVVVVVV_iv -in git_deploy_key.enc -out /tmp/git_deploy_key -d
  # Make sure only the current user can read the private key
  - chmod 600 /tmp/git_deploy_key
  # Create a script to return the passphrase environment variable to ssh-add
  - echo 'echo ${SSH_PASSPHRASE}' > /tmp/askpass && chmod +x /tmp/askpass
  # Start the authentication agent
  - eval "$(ssh-agent -s)"
  # Add the key to the authentication agent
  - DISPLAY=":0.0" SSH_ASKPASS="/tmp/askpass" setsid ssh-add /tmp/git_deploy_key </dev/null
```

See [Encrypting Files](https://docs.travis-ci.com/user/encrypting-files) for more details.

Delete the local private key as it won't be used anymore:

```bash
$ rm git_deploy_key
```

Commit the encrypted private key and the `.travis.yml` file to your repository:

```bash
$ git add git_deploy_key.enc .travis.yml
$ git commit -m "ci(travis): Add the encrypted private ssh key"
$ git push
```

### Adding the SSH private key to Circle CI

First we encrypt the `git_deploy_key` (private key) using a symmetric encryption (AES-256). Run the following `openssl` command and _make sure to note the output which we'll need later_:

```bash
$ openssl aes-256-cbc -e -p -in git_deploy_key -out git_deploy_key.enc -K `openssl rand -hex 32` -iv `openssl rand -hex 16`
salt=SSSSSSSSSSSSSSSS
key=KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK
iv =VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
```

Add the following [environment variables](https://circleci.com/docs/2.0/env-vars/#adding-environment-variables-in-the-app) to Circle CI:

- `SSL_PASSPHRASE` - the value set during the [SSH keys generation](#generating-the-ssh-keys) step.
- `REPO_ENC_KEY` - the `key` (KKK) value from the `openssl` step above.
- `REPO_ENC_IV` - the `iv` (VVV) value from the `openssl` step above.

Then add to your `.circleci/config.yml` the commands to decrypt the ssh private key and make it available to `git`:

```yaml
version: 2
jobs:
  coverage_test_publish:
    # docker, working_dir, etc
    steps:
      - run:
          # Decrypt the git_deploy_key.enc key into /tmp/git_deploy_key
          - openssl aes-256-cbc -d -K $REPO_ENC_KEY -iv $REPO_ENC_IV -in git_deploy_key.enc -out /tmp/git_deploy_key
          # Make sure only the current user can read the private key
          - chmod 600 /tmp/git_deploy_key
          # Create a script to return the passphrase environment variable to ssh-add
          - echo 'echo ${SSL_PASSPHRASE}' > /tmp/askpass && chmod +x /tmp/askpass
          # Start the authentication agent
          - eval "$(ssh-agent -s)"
          # Add the key to the authentication agent
          - DISPLAY=":0.0" SSH_ASKPASS="/tmp/askpass" setsid ssh-add /tmp/git_deploy_key </dev/null
      # checkout, restore_cache, run: yarn install, save_cache, etc.
      # Run semantic-release after all the above is set.
```

The unencrypted key is written to `/tmp` to avoid to commit / modify / delete the unencrypted key by mistake on the CI environment.

Delete the local private key as it won't be used anymore:

```bash
$ rm git_deploy_key
```

Commit the encrypted private key and the `.circleci/config.yml` file to your repository:

```bash
$ git add git_deploy_key.enc .circleci/config.yml
$ git commit -m "ci(circle): Add the encrypted private ssh key"
$ git push
```
