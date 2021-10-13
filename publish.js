import { execSync } from 'child_process'
import { getInput, setFailed } from '@actions/core'

export const publish = (dry) => {
  let command = 'npm publish'

  if (dry) {
    command += ' --dry-run'
  }

  const env = {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_AUTH_TOKEN: getInput('NPM_TOKEN'),
    },
  }

  try {
    execSync(command, env)
  } catch (error) {
    setFailed('Failed to publish to npm.')
  }
}
