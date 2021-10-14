import pacote from 'pacote'
import { getPackage } from '../package.js'
import { getRelease } from '../release.js'
import { getVersion } from '../version.js'

test('package: gets package contents.', () => {
  const { name, scripts, error } = getPackage()

  expect(error).toBeUndefined()
  expect(name).toBe('release-npm-action')
  expect(scripts.build).toContain('esbuild')
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
