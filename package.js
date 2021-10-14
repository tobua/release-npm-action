import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { info } from '@actions/core'

export const getPackageJsonPath = () => join(process.cwd(), 'package.json')

export const getPackage = () => {
  const packageJsonPath = getPackageJsonPath()
  info(packageJsonPath)
  const packageJsonFound = existsSync(packageJsonPath)
  info(packageJsonFound)

  if (!packageJsonFound) {
    return { error: 'package.json not found.' }
  }

  const contents = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

  if (!contents.name) {
    return { error: 'package.json is missing "name" property.' }
  }

  return {
    name: contents.name,
    scripts: contents.scripts,
  }
}

export const addPackageProperties = (newProperties) => {
  const packageJsonPath = getPackageJsonPath()
  const existingContents = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

  const newContents = { ...existingContents, ...newProperties }

  writeFileSync(packageJsonPath, JSON.stringify(newContents, null, 2))
}
