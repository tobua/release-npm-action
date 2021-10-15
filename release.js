import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import { info, debug, getInput } from '@actions/core'
import { context, getOctokit } from '@actions/github'
import standardVersion from 'standard-version'
import { addPackageProperties } from './package.js'

export const getRelease = (debugMode) => {
  // Get body of latest commit.
  const commitMessage = execSync('git log -1 --pretty=%B').toString()
  info(`commitMessage ${commitMessage}`)
  let release = commitMessage.includes('release-npm')
  let major = commitMessage.includes('release-npm major')

  info(`release type input: ${getInput('type')}`)

  const manualTriggerType = getInput('type')

  // Manual trigger will override last commit information.
  if (manualTriggerType === 'regular' || manualTriggerType === 'major') {
    release = true
    major = manualTriggerType === 'major' ? true : false
  }

  return {
    release: debugMode || release, // TODO true for debugging purposes.
    major,
  }
}

export const createRelease = async (version, first, major) => {
  const debugMode = !getInput('NPM_TOKEN') || getInput('NPM_TOKEN') === 'debug'

  if (first && !version) {
    version = '0.0.0'
  }

  // Add version to be picked up by standard-version.
  addPackageProperties({ version })

  const username = process.env.GITHUB_ACTOR
  const email = `${process.env.GITHUB_ACTOR}@users.noreply.github.com`

  info(`git config --global user.name "${username}"`)

  execSync(
    `git config --global user.name "${username}" && git config --global user.email "${email}"`
  )

  await standardVersion({
    dryRun: debugMode,
    skip: {
      // Don't create a commit, as version not persisted and changelog in github releases.
      commit: true,
    },
    firstRelease: first,
    releaseAs: major ? 'major' : undefined,
  })

  execSync('git push --follow-tags')

  let tagName = `v${version}`

  if (!debugMode) {
    tagName = execSync('git describe HEAD --abbrev=0')

    info(`Pushed release tag ${tagName}.`)
  }

  debug(`version: ${version} tagName: ${tagName}`)

  if (getInput('GITHUB_TOKEN')) {
    info('has github input')
  }

  if (process.env.GITHUB_TOKEN) {
    info('has github token')
  }

  if (debugMode) {
    return
  }

  if (existsSync(join(process.cwd(), 'CHANGELOG.md'))) {
    info('has changelog')
    info(readFileSync(join(process.cwd(), 'CHANGELOG.md'), 'utf-8'))
  }

  const octokit = new getOctokit(getInput('GITHUB_TOKEN'))

  const createReleaseResponse = await octokit.rest.repos.createRelease({
    owner: context.repo.owner,
    repo: context.repo.repo,
    tag_name: tagName,
    name: tagName,
    // TODO Read body from CHANGELOG.md created when not in dry run mode.
    body: 'body',
  })

  const {
    data: { id: releaseId, html_url: htmlUrl, upload_url: uploadUrl },
  } = createReleaseResponse

  info(`Release created ${releaseId} url: ${htmlUrl} upload: ${uploadUrl}.`)
}
