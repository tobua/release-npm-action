import fetch from 'node-fetch'
import { info } from '@actions/core'

export const getVersion = async (name) => {
  info(`version for ${name}`)

  let first = true
  let version

  try {
    const response = await fetch(`https://registry.npmjs.org/${name}/latest`)
    const body = await response.json()
    first = body === 'Not Found' || typeof body !== 'object' || !body.version
    version = body.version
  } catch (error) {
    first = true
  }

  info(`version ${version} first ${first}`)

  return {
    first,
    version,
  }
}
