# release-npm-action

Verifies, versions and documents a plugin release to npm.

- Creates GitHub release with body from `CHANGELOG.md`
- Tags and publishes release to npm
- No version and changelog commits made
- No versioning in `package.json` required

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
      type:
        description: Regular or major release?
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
          # Hand over manual input type.
          type: ${{ github.event.inputs.type }}
```
