import { execSync } from 'child_process'
import { info, getInput, setFailed } from '@actions/core'
import semanticRelease from 'semantic-release'

export const getRelease = (debugMode) => {
  // Get body of latest commit.
  const commitMessage = execSync('git log -1 --pretty=%B').toString()
  let release = commitMessage.includes('release-npm')

  info(`commitMessage ${commitMessage}`)
  info(`release type input: ${getInput('MANUAL_TRIGGER')}`)

  const manualTriggerType = getInput('MANUAL_TRIGGER')

  // Manual trigger will override last commit information.
  if (manualTriggerType === 'regular') {
    release = true
  }

  return {
    release: debugMode || release, // TODO true for debugging purposes.
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

  info(`current branch: ${currentBranch}, channel: ${channelInput}.`)
  info(`author ${getInput('GIT_AUTHOR_NAME')}, ${getInput('GIT_COMMITTER_NAME')}.`)
  info(`dry run: ${getInput('DRY_RUN')}, ${dryRun}.`)

  if (debugMode) {
    return info(`Skipping release in debug mode.`)
  }

  const releaseResult = await semanticRelease(
    {
      branches: [branchConfiguration],
      dryRun: dryRun,
      debug: dryRun,
    },
    {
      env: {
        ...process.env,
        GITHUB_TOKEN: getInput('GITHUB_TOKEN'),
        NPM_TOKEN: getInput('NPM_TOKEN'),
        // process.env.GITHUB_ACTOR is available.
        GIT_AUTHOR_NAME: getInput('GIT_AUTHOR_NAME'),
        GIT_AUTHOR_EMAIL: getInput('GIT_AUTHOR_EMAIL'),
        GIT_COMMITTER_NAME: getInput('GIT_COMMITTER_NAME'),
        GIT_COMMITTER_EMAIL: getInput('GIT_COMMITTER_EMAIL'),
      },
    }
  )

  if (!releaseResult) {
    return setFailed('Failed to create or publish release.')
  }

  const { nextRelease } = releaseResult
  const { version, gitTag, channel } = nextRelease

  info(`Released version ${version} in ${channel} channel with ${gitTag} tag.`)
}
