import { Writable } from 'stream'
import { execSync } from 'child_process'
import { info, getInput, setFailed } from '@actions/core'
import semanticRelease from 'semantic-release'

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

const createWritableStream = () => {
  const data = []
  const stream = new Writable()

  // Needs to be manually implemented.
  stream._write = (chunk, encoding, next) => {
    data.push(chunk.toString())
    next()
  }

  stream._print = () => data.join('')

  return stream
}

export const createRelease = async (debugMode) => {
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
  const branchConfiguration = { name: currentBranch }
  const dryRun = getInput('DRY_RUN') === 'true' || debugMode
  const channelInput = getInput('CHANNEL')

  if (channelInput) {
    branchConfiguration.channel = channelInput
  }

  if (channelInput) {
    info(`Release channel ${channelInput}.`)
  }

  if (dryRun) {
    info('Running release in dry run mode.')
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

  const logs = createWritableStream()
  const errors = createWritableStream()

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
      setFailed('Failed to create or publish release.')
      return info(errors._print())
    }

    const { nextRelease } = releaseResult
    const { version, gitTag, channel } = nextRelease

    info(`Released version ${version} in ${channel} channel with ${gitTag} tag.`)
  } catch (error) {
    setFailed(`semantic-release failed with ${error}.`)

    info(logs._print())
    info(errors._print())
  }
}
