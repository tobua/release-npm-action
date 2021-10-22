import { Writable } from 'stream'
import { execSync } from 'child_process'
import { info, getInput, setFailed, setOutput } from '@actions/core'
import semanticRelease from 'semantic-release'

export const getRelease = () => {
  const commitMessage = execSync('git log -1 --pretty=%B').toString()
  let release = commitMessage.includes('release-npm')
  let type = 'Release requested through commit annotation.'

  // Manual trigger precedes last commit information.
  if (getInput('MANUAL_TRIGGER') === 'regular') {
    release = true
    type = 'Release requested through manual workflow run.'
  }

  if (getInput('NPM_TOKEN') === 'debug') {
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
  // eslint-disable-next-line no-underscore-dangle
  stream._write = (chunk, encoding, next) => {
    data.push(chunk.toString())
    next()
  }

  stream.print = () => data.join('')

  return stream
}

export const createRelease = async () => {
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
  const branchConfiguration = { name: currentBranch }
  const dryRun = getInput('DRY_RUN') === 'true' || getInput('NPM_TOKEN') === 'debug'
  const debug = getInput('DEBUG') === 'true'
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

  if (debug) {
    info('Running release in debug mode.')
  }

  const env = {
    ...process.env,
    GITHUB_TOKEN: getInput('GITHUB_TOKEN'),
    NPM_TOKEN: getInput('NPM_TOKEN'),
  }

  const logs = createWritableStream()
  const errors = createWritableStream()

  try {
    const releaseResult = await semanticRelease(
      {
        branches: [branchConfiguration],
        dryRun,
        debug,
      },
      {
        env,
        stdout: logs,
        stderr: errors,
      }
    )

    if (!releaseResult) {
      const printedLogs = logs.print()
      const printedErrors = errors.print()

      if (printedLogs.includes('no relevant changes, so no new')) {
        if (getInput('FAIL_ON_SKIP') !== 'false') {
          setFailed('Failed to create or publish release.')
        }
        info('There are no relevant changes, so no new version is released.')
        info(
          'See https://github.com/tobua/release-npm-action#troubleshooting for more information.'
        )
        return
      }

      setFailed('Failed to create or publish release.')

      if (printedErrors) {
        info(printedErrors)
      }
      info(printedLogs)
      return
    }

    const { nextRelease } = releaseResult
    const { version, gitTag, channel } = nextRelease

    info(`Released version ${version} in ${channel} channel with ${gitTag} tag.`)

    setOutput('version', version)
    setOutput('channel', channel)
    setOutput('tag', gitTag)
  } catch (error) {
    setFailed(`semantic-release failed with ${error}.`)

    info(logs.print())
    info(errors.print())
  }
}
