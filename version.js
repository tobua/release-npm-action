import { manifest } from 'pacote'
import { info } from '@actions/core'

export const getVersion = async (name) => {
  info(`version for ${name}`)

  let first = true
  let version

  try {
    const contents = await manifest(name)
    first = !contents.version
    version = contents.version
  } catch (error) {
    first = true
  }

  info(`version ${version} first ${first}`)

  return {
    first,
    version,
  }
}
