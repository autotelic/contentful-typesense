import { promises as fs } from 'fs'
import * as exec from '@actions/exec'
import { normalize, schema } from 'normalizr'
import {
  getEnvironment,
  getCollections,
  getSchemaFieldTypes,
  fieldFormatters
} from './utils.js'
import { createDocument } from './createDocument.js'

export const bulkIndexing = async ({
  contentfulClient,
  typesenseClient,
  locale,
  spaceId,
  managementToken,
  environmentName,
  contentTypeMappings,
  includeDrafts,
  runExec = exec,
  getContentfulEnvironment = getEnvironment
}) => {
  const environment = await getContentfulEnvironment(contentfulClient, spaceId, environmentName)
  const contentTypes = await environment.getContentTypes()
  const collectionSchemas = await getCollections(contentTypes, contentTypeMappings)

  const arraySchema = new schema.Array(
    Object.keys(contentTypeMappings).reduce((schemas, name) => ({
      [name]: new schema.Entity(name, {}, { idAttribute: value => value.sys.id }),
      ...schemas
    }), {}),
    (input, _parent, _key) => input.sys.contentType.sys.id
  )

  const exportFileName = `contentfulExport-${spaceId}.json`
  await runExec.exec('contentful', [
    'space', 'export',
    '--use-verbose-renderer', 'true',
    '--space-id', spaceId,
    '--management-token', managementToken,
    '--include-drafts', includeDrafts,
    '--skip-content-model', 'true',
    '--skip-roles', 'true',
    '--skip-webhooks', 'true',
    '--skip-tags', 'true',
    '--content-file', exportFileName
  ])

  const data = JSON.parse(await fs.readFile(exportFileName, 'utf8'))

  const normalizedData = normalize(data.entries, arraySchema)

  const documents = Object.fromEntries(await Promise.all(Object.entries(normalizedData.entities).map(async ([collectionName, entities]) => {
    const mappings = contentTypeMappings[collectionName]
    const fieldMappings = mappings?.fieldMappings || {}
    const schema = collectionSchemas.find(schema => schema.name === collectionName)
    const { fields: schemaFields } = schema
    const fieldTypes = getSchemaFieldTypes(schemaFields)

    const promises = Object.entries(entities).map(async ([entryId, document]) => {
      const { fields } = document
      return await createDocument({
        entryId,
        schemaFields,
        fields,
        fieldTypes,
        locale,
        fieldMappings,
        fieldFormatters
      })
    })
    return [collectionName, await Promise.all(promises)]
  })))

  Object.entries(documents).forEach(([collectionName, docs]) => {
    typesenseClient
      .collections(collectionName)
      .documents()
      .import(docs, {
        action: 'upsert',
        dirty_values: 'coerce_or_drop'
      })
  })
}
