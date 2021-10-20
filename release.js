import { execSync } from 'child_process'
import { info, getInput, setFailed } from '@actions/core'
import semanticRelease from 'semantic-release'
import { WritableStreamBuffer } from 'stream-buffers'

export const getRelease = (debugMode) => {
  const commitMessage = execSync('git log -1 --pretty=%B').toString()
  let release = commitMessage.includes('release-npm')
  let type = 'Release requested through commit annotation.'

  // Manual trigger precedes last commit information.
  if (getInput('MANUAL_TRIGGER') === 'regular') {
    release = true
    type = 'Release requested through manual workflow run.'
  }

  if (debugMode) {
    release = true
    type = 'Release requested through debug mode.'
  }

  return {
    release,
    type,
  }
}

export const createRelease = async (debugMode) => {
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
  const branchConfiguration = { name: currentBranch }
  const dryRun = getInput('DRY_RUN') === 'true'
  const channelInput = getInput('CHANNEL')

  if (channelInput) {
    branchConfiguration.channel = channelInput
  }

  if (channelInput) {
    info(`Release channel ${channelInput}.`)
  }

  if (debugMode) {
    return info(`Skipping release in debug mode.`)
  }

  const env = {
    ...process.env,
    GITHUB_TOKEN: getInput('GITHUB_TOKEN'),
    NPM_TOKEN: getInput('NPM_TOKEN'),
  }

  // TODO document
  const optionalValues = [
    'GIT_AUTHOR_NAME',
    'GIT_AUTHOR_EMAIL',
    'GIT_COMMITTER_NAME',
    'GIT_COMMITTER_EMAIL',
  ]

  optionalValues.forEach((key) => {
    const value = getInput(key)
    if (value) {
      env[key] = value
    }
  })

  const logs = WritableStreamBuffer()
  const errors = WritableStreamBuffer()

  try {
    const releaseResult = await semanticRelease(
      {
        branches: [branchConfiguration],
        dryRun: dryRun,
        debug: dryRun,
      },
      {
        env,
        stdout: logs,
        stderr: errors,
      }
    )

    if (!releaseResult) {
      info(errors.getContentsAsString('utf8'))
      return setFailed('Failed to create or publish release.')
    }

    const { nextRelease } = releaseResult
    const { version, gitTag, channel } = nextRelease

    info(`Released version ${version} in ${channel} channel with ${gitTag} tag.`)
  } catch (error) {
    setFailed(`semantic-release failed with ${error}.`)
  }
}
