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
  .option('-s, --space-id <space-id>', 'Contentful space id')
  .option('-e, --environment-name <env>', 'Contentful environment')
  .option('-a, --typesense-action <action>', 'Action')
  .option('-i, --include-drafts', 'Include drafts (boolean)')
  .option('-t, --typesense-url <typesense url>', 'Typesense url')

;(async function () {
  console.log(program)
  await program.parseAsync(process.argv)

  const options = program.opts()

  const {
    mappingsPath,
    typesenseUrl,
    spaceId,
    environmentName,
    typesenseAction,
    includeDrafts,
    locale
  } = options

  console.log(options)

  const require = createRequire(import.meta.url)
  const contentTypeMappings = require(resolve(process.cwd(), mappingsPath))

  const managementToken = process.env.CONTENFUL_CMA_KEY

  const contentfulClient = contentful.createClient({
    accessToken: managementToken
  })

  const typesenseClient = new Typesense.Client({
    nodes: [
      {
        url: typesenseUrl
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
