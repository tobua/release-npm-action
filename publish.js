import { execSync } from 'child_process'
import { info, getInput } from '@actions/core'

export const publish = (dry) => {
  let command = 'npm publish'

  if (dry) {
    command += ' --dry-run'
  }

  let env = null

  if (getInput('NPM_TOKEN')) {
    env = {
      env: {
        NODE_AUTH_TOKEN: getInput('NPM_TOKEN'),
      },
    }
  }

  try {
    execSync(command, env)
  } catch (error) {
    info('Failed to publish to npm.')
    info(error)
  }
}
