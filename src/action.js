import path from 'path'
import * as core from '@actions/core'
import * as github from '@actions/github'
import contentful from 'contentful-management'
import Typesense from 'typesense'

import { run } from './lib/run.js'

const contentfulClient = contentful.createClient({
  accessToken: core.getInput('contentManagementToken')
})

const typesenseClient = new Typesense.Client({
  nodes: [
    {
      url: core.getInput('typesenseUrl')
    }
  ],
  apiKey: core.getInput('typesenseAdminApiKey'),
  numRetries: 3,
  connectionTimeoutSeconds: 10,
  logLevel: 'debug'
})

;(async () => {
  try {
    const contentTypeMappingsPath = core.getInput('contentTypeMappingsPath')
    const { context } = github
    console.log(context)
    const { contentTypeMappings } = await import(path.join('', contentTypeMappingsPath))
    await run({ core, github, contentfulClient, typesenseClient, contentTypeMappings })
  } catch (error) {
    core.setFailed(error.message)
  }
})()
