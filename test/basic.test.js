import path from 'path'
import pacote from 'pacote'
import { execSync } from 'child_process'
import { getPackage } from '../package.js'
import { getRelease } from '../release.js'
import { getVersion } from '../version.js'

test('package: gets package contents.', () => {
  const { name, scripts, error } = getPackage()

  expect(error).toBeUndefined()
  expect(name).toBe('release-npm-action')
  expect(scripts.build).toContain('ncc build')
})

test('release: identifies release from latest commit.', () => {
  const debugModeRelease = getRelease(true)

  expect(debugModeRelease.release).toBe(true)
  expect(debugModeRelease.major).toBe(false)

  const regularRelease = getRelease(false)

  expect(regularRelease.release).toBe(false)
  expect(regularRelease.major).toBe(false)
})

test('version: tries to get the version from npm.', async () => {
  const actionData = await getVersion('release-npm-action')

  expect(actionData.first).toBe(true)
  expect(actionData.version).toBeUndefined()

  const manifest = await pacote.manifest('debug')

  const debugData = await getVersion('debug')

  expect(debugData.first).toBe(false)
  expect(debugData.version).toBe(manifest.version)
})

// shows how the runner will run a javascript action with env / stdout protocol
test('full: attempts to perform a release but fails.', () => {
  process.env['NPM_TOKEN'] = 'debug'
  process.env['ACTIONS_RUNNER_DEBUG'] = true

  const filePath = path.join(process.cwd(), 'dist/index.js')

  try {
    console.log(execSync(`node ${filePath}`, { env: process.env }).toString())
  } catch (error) {
    console.log('error', error)
  }
})
