import { promises as fs } from 'fs'
import contentful from 'contentful-management'
import Typesense from 'typesense'
import sinon from 'sinon'

import { run } from '../src/lib/run.js'
import { contentTypeMappings } from './contentTypeMappings.js'

const managementToken = process.env.CONTENFUL_CMA_KEY

const contentfulClient = contentful.createClient({
  accessToken: managementToken
})

const typesenseClient = new Typesense.Client({
  nodes: [
    {
      url: 'http://localhost:8108'
    }
  ],
  apiKey: process.env.TYPESENSE_ADMIN_API_KEY,
  numRetries: 3,
  connectionTimeoutSeconds: 10,
  logLevel: 'debug'
})

;(async () => {
  const context = JSON.parse(await fs.readFile('./runnerContext.json', 'utf8'))
  const github = { context }

  const getInput = sinon.stub()
  getInput.withArgs('locale').returns('en-US')
  getInput.withArgs('contentfulSpaceId').returns('opxulaoc9o1m')
  getInput.withArgs('contentfulEnvironment').returns('master')
  getInput.withArgs('contentManagementToken').returns(managementToken)
  const core = { getInput, info: msg => console.log(msg) }

  await run({
    github,
    core,
    contentfulClient,
    typesenseClient,
    contentTypeMappings
  })
})()
