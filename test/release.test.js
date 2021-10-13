import { readFileSync, writeFileSync } from 'fs'
import { createRelease } from '../release.js'
import { getPackageJsonPath } from '../package.js'
import { publish } from '../publish.js'

// standard-version run takes time.
jest.setTimeout(15000)

// Restore initial package.json contents after tests.
let packageContents

beforeAll(() => {
  packageContents = readFileSync(getPackageJsonPath(), 'utf-8')
})

afterAll(() => {
  writeFileSync(getPackageJsonPath(), packageContents)
})

console.info = jest.fn()

// Remove ascii formatting from text, bold etc.
const removeFormatting = (text) =>
  // eslint-disable-next-line no-control-regex
  text.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')

test('Creates release tags with different configurations.', async () => {
  expect(console.info.mock.calls.length).toBe(0)

  let initialVersion = '1.0.0'
  let targetVersion = '1.' // Actual bump depends on commits made.

  await createRelease(initialVersion, false, false)

  expect(console.info.mock.calls.length).toBe(6)

  let bump = removeFormatting(console.info.mock.calls[0][0])
  let changelogEntry = removeFormatting(console.info.mock.calls[3][0])
  let tagging = removeFormatting(console.info.mock.calls[4][0])

  expect(bump).toContain(`${initialVersion} to ${targetVersion}`)
  expect(changelogEntry).toContain(`# ${targetVersion}`)
  expect(tagging).toContain(`v${targetVersion}`)

  initialVersion = '1.0.0'
  targetVersion = '2.0.0'

  await createRelease(initialVersion, false, true)

  expect(console.info.mock.calls.length).toBe(12)

  bump = removeFormatting(console.info.mock.calls[6][0])
  changelogEntry = removeFormatting(console.info.mock.calls[9][0])
  tagging = removeFormatting(console.info.mock.calls[10][0])

  expect(bump).toContain(`${initialVersion} to ${targetVersion}`)
  expect(changelogEntry).toContain(`# ${targetVersion}`)
  expect(tagging).toContain(`v${targetVersion}`)

  initialVersion = '1.0.0'
  targetVersion = '1.0.0'

  await createRelease(initialVersion, true, false)

  expect(console.info.mock.calls.length).toBe(18)

  bump = removeFormatting(console.info.mock.calls[12][0])
  changelogEntry = removeFormatting(console.info.mock.calls[15][0])
  tagging = removeFormatting(console.info.mock.calls[16][0])

  expect(bump).toContain('skip version bump')
  expect(changelogEntry).toContain(`## ${targetVersion}`)
  expect(tagging).toContain(`v${targetVersion}`)
})

test('Successfully publishes to npm.', () => {
  // Dry run to verify published contents.
  publish(true)
})
