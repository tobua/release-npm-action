import { getInput, info, debug, setFailed } from '@actions/core'
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

    const debugMode = token === 'debug'

    if (debugMode) {
      info('Running in debug mode...')
    }

    const { release, major } = getRelease(debugMode)

    if (!release) {
      return info('No release requested.')
    }

    info(release)

    debug('debug statement') // requires ACTIONS_RUNNER_DEBUG=true
    info('info statement')

    const { name, scripts, error } = getPackage()

    console.log('debug mode', debugMode)

    if (error && !debugMode) {
      return setFailed(error)
    }

    const { first, version } = await getVersion(name)

    info(version)

    createRelease(version, first, major)

    publish(debugMode)
  } catch (error) {
    setFailed(error.message)
  }
}

run()
