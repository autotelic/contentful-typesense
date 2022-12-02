import contentfulExport from 'contentful-export'
import contentful from 'contentful-management'
import Typesense from 'typesense'

// import { dropAndCreateCollections } from '../src/lib/dropAndCreateCollections.js'
import { bulkIndexing } from '../src/lib/bulkIndexing.js'
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
  // await dropAndCreateCollections({
  //   contentfulClient,
  //   typesenseClient,
  //   spaceId: 'opxulaoc9o1m',
  //   environmentName: 'master',
  //   contentTypeMappings
  // })

  await bulkIndexing({
    contentfulClient,
    typesenseClient,
    locale: 'en-US',
    spaceId: 'opxulaoc9o1m',
    managementToken,
    environmentName: 'master',
    contentTypeMappings,
    includeDrafts: true,
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
})()
