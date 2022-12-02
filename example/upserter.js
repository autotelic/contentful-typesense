import { promises as fs } from 'fs'
import contentful from 'contentful-management'
import Typesense from 'typesense'

import { upsertDocument } from '../src/lib/upsertDocument.js'
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
  const payload = JSON.parse(await fs.readFile('./upsertPayload.json', 'utf8'))
  await upsertDocument({
    contentfulClient,
    typesenseClient,
    locale: 'en-US',
    spaceId: 'opxulaoc9o1m',
    environmentName: 'master',
    includeDrafts: true,
    contentTypeMappings,
    payload
  })
})()
