# release-npm-action

<img align="right" src="https://github.com/tobua/release-npm-action/raw/main/logo.png" width="20%" alt="release-npm-action" />

GitHub action to version and document a plugin release to npm using [semantic-release](https://github.com/semantic-release/semantic-release).

- Creates tag for current version.
- GitHub release for tag with release notes based on commit messages.
- Publishes release to npm.
- No additional commits made.
- No version required in `package.json`.
- Release triggered through commit annotation.

## Usage

Add steps to build and test before the release as usual.

```yaml
name: push

# Runs always on commits, will only release when requested, see below.
on:
  push:
    branches: [main]

jobs:
  test:
    # regular test step
  build:
    # build if necessary
  release:
    # needs: [test, build]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '14'
          check-latest: true
      - uses: tobua/release-npm-action@v0
        with:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Request Release

### `release-npm` in Commit Body

To request the next commit to be released if the pipeline passes add a remark to the commit body.

```
feat(component): implement swipe and dot functionality for Intro

release-npm
```

If a `release-npm` token is found in the body a release will be triggered. Use `npm-release major` to force a major release. Patch, minor or major release type will otherwise be decided based on the commit history using `standard-version`.

```
fix(component): improve swipe behavior

This animates swipe between slides (release-npm major).
```

### Manually Triggered Workflow

Alternatively, you can manually trigger the release workflow action to create a release even without annotated commits. This requires the action to run on the `workflow_dispatch` trigger. When that is added a workflow can be triggered from the GitHub workflow UI for this action.

The UI will prompt for the type of release, either `regular` or `major` to force a major release.

```yaml
name: push

# Runs always on commits, will only release when requested, see below.
on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      manual:
        description: Manually trigger regular release?
        default: regular
        required: true

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      # ...
      - uses: tobua/release-npm-action@v0
        with:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # Hand over manual input trigger.
          MANUAL_TRIGGER: ${{ github.event.inputs.manual }}
```

## Options

The following options can be passed to the action.

| Option         | Values    | Required | Description                                                |
| -------------- | --------- | -------- | ---------------------------------------------------------- |
| NPM_TOKEN      | string    | true     | npm Automation or Publishing token.                        |
| GITHUB_TOKEN   | string    | true     | GitHub token automatically created by GitHub.              |
| MANUAL_TRIGGER | 'regular' | false    | Manually trigger a release even without commit annotation. |
| CHANNEL        | string    | false    | dist-tag to publish the npm release on, default latest.    |

## Caveats

The first version for a plugin release defaults to `1.0.0` and cannot be changed. The next version is based on the commit history since the latest release and cannot be changed.
