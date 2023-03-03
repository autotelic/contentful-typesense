#!/usr/bin/env node

import contentfulExport from 'contentful-export'
import contentful from 'contentful-management'
import Typesense from 'typesense'
import { createRequire } from 'node:module'
import { Command } from 'commander'
import { resolve } from 'path'
import { dropAndCreateCollections } from '../src/lib/dropAndCreateCollections.js'
import { bulkIndexing } from '../src/lib/bulkIndexing.js'

const program = new Command()

program
  .option('-m, --mappings-path <mappings path>', 'Content type mappings')
  .option('-l, --locale <locale>', 'Contentful locale')
  .option('-e, --environment-name <env>', 'Contentful environment')
  .option('-a, --typesense-action <action>', 'Action')
  .option('-i, --include-drafts', 'Include drafts (boolean)')

;(async function () {
  await program.parseAsync(process.argv)

  const options = program.opts()

  const {
    mappingsPath,
    environmentName,
    typesenseAction,
    includeDrafts,
    locale
  } = options

  const require = createRequire(import.meta.url)
  const contentTypeMappings = require(resolve(process.cwd(), mappingsPath))

  const managementToken = process.env.CONTENTFUL_CMA_KEY
  const spaceId = process.env.CONTENTFUL_SPACE_ID

  const contentfulClient = contentful.createClient({
    accessToken: managementToken
  })

  const typesenseClient = new Typesense.Client({
    nodes: [
      {
        url: process.env.TYPESENSE_URL
      }
    ],
    apiKey: process.env.TYPESENSE_ADMIN_API_KEY,
    numRetries: 3,
    connectionTimeoutSeconds: 10,
    logLevel: 'debug'
  })

  if (typesenseAction === 'dropAndCreateCollections') {
    await dropAndCreateCollections({
      contentfulClient,
      typesenseClient,
      spaceId,
      environmentName,
      contentTypeMappings
    })
  }

  if (typesenseAction === 'bulkIndexing') {
    await bulkIndexing({
      contentfulClient,
      typesenseClient,
      locale,
      spaceId,
      managementToken,
      environmentName,
      contentTypeMappings,
      includeDrafts,
      getContentfulExportData: async ({
        managementToken,
        spaceId,
        environmentName,
        includeDrafts
      }) => await contentfulExport({
        spaceId,
        managementToken,
        environmentName,
        includeDrafts,
        contentOnly: true,
        saveFile: false
      })
    })
  }
})()
