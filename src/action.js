import 'any-observable/register/zen'

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
  const contentTypeMappingsPath = core.getInput('contentTypeMappingsPath')
  const { contentTypeMappings } = await import(contentTypeMappingsPath)

  run({ core, github, contentfulClient, typesenseClient, contentTypeMappings }).catch(error => {
    core.setFailed(error.message)
  })
})()
