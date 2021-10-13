import { getInput, info, debug, setFailed } from '@actions/core'
import { execSync } from 'child_process'
import { getPackage } from './package.js'
import { getRelease, createRelease } from './release.js'
import { getVersion } from './version.js'
import { publish } from './publish.js'

// Top-level await not yet supported out of the box with default eslint-parser.
const run = async () => {
  try {
    const token = getInput('NPM_TOKEN')

    if (!token) {
      return setFailed('Missing NPM_TOKEN action secret.')
    }

    debug(`release-npm-action with node: ${execSync('node -v').toString()}`)

    const debugMode = token === 'debug'

    if (debugMode) {
      info('Running in debug mode...')
    }

    const { release, major } = getRelease(debugMode)

    if (!release) {
      return info('No release requested.')
    }

    info(`${major ? 'Major' : 'Regular'} release requested.`)

    const { name, scripts, error } = getPackage()

    if (error && !debugMode) {
      return setFailed(error)
    }

    const { first, version } = await getVersion(name)

    info(`Publishing ${name} ${first ? 'as first release' : `as ${version}`}.`)

    createRelease(version, first, major)

    publish(debugMode)
  } catch (error) {
    setFailed(error.message)
  }
}

run()
