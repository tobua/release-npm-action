import { getInput, info, debug, setOutput, setFailed } from '@actions/core'
import { wait } from './wait.js'

// Top-level await not yet supported out of the box with default eslint-parser.
const run = async () => {
  try {
    const ms = getInput('milliseconds')
    info(`Waiting ${ms} milliseconds ...`)

    debug(new Date().toTimeString()) // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true
    await wait(parseInt(ms))
    info(new Date().toTimeString())

    setOutput('time', new Date().toTimeString())
  } catch (error) {
    setFailed(error.message)
  }
}

run()
