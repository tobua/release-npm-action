import { join } from 'path'
import { execSync } from 'child_process'
import { test, expect } from 'vitest'

test('Release request in debug mode works without issues.', () => {
  process.env.INPUT_NPM_TOKEN = 'debug'
  process.env.INPUT_DRY_RUN = 'true'
  process.env.INPUT_DEBUG = 'true'
  process.env.INPUT_GITHUB_TOKEN = 'something'

  let hasCaught = false

  try {
    execSync(`node ${join(process.cwd(), 'index.js')}`, { env: process.env }).toString()
  } catch (error) {
    // NOTE action will always error since it cannot push to git repo.
    const output = `${error.stdout.toString()} ${error.stderr.toString()}`
    // Debug mode triggered by NPM_TOKEN=debug
    expect(output).toContain('Release requested through debug mode.')
    // Will not publish in debug mode.
    expect(output).toContain('Running release in dry run mode.')
    expect(output).toContain('Running release in debug mode.')

    hasCaught = true
  }

  expect(hasCaught).toBeTruthy()
})
