# Using semantic-release with [Azure Pipelines](https://docs.microsoft.com/en-us/azure/devops/pipelines/?view=azure-devops)

In Azure Pipelines you can use `semantic-release` with any programming language as there is no need to have `npm` installed. Just add [Semantic-Release Extension](https://marketplace.visualstudio.com/items?itemName=danielhabenicht.semantic-release) to your build configuration.

## Configuration

1. Go to the [Extensions Marketplace Site](https://marketplace.visualstudio.com/items?itemName=danielhabenicht.semantic-release)
2. Click 'Get it free' 
3. Install the extension in your project

### with `azure-pipeline.yml` Code

Here is an example configuration. For more information go to the [extensions github page](https://github.com/DanielHabenicht/AzurePipelines-SemanticRelease).
```yml
steps:
- task: danielhabenicht.semantic-release.tasks.freestyle@1
  displayName: 'Semantic Release'
  inputs:
    # You can provide Credentials through service connections or as environment variables (make sure to set them before executing this task)
    gitHubServiceConnection: 'My Github Connection'
    configPath: ./path/to/your/.releaserc.json
```

### in the online editor

Add the task to your build by searching for 'Semantic Release' and selecting the according task.
