import { join } from 'path'
import { execSync } from 'child_process'

// shows how the runner will run a javascript action with env / stdout protocol
test('full: attempts to perform a release but fails.', () => {
  process.env['INPUT_NPM_TOKEN'] = 'debug'

  const filePath = join(process.cwd(), 'index.js')

  try {
    console.log(execSync(`node ${filePath}`, { env: process.env }).toString())
  } catch (error) {
    const output = error.stdout.toString()
    // Debug mode triggered by NPM_TOKEN=debug
    expect(output).toContain('Running in debug mode')
    // action itself will not be published to npm
    expect(output).toContain('Release requested.')
  }
})
