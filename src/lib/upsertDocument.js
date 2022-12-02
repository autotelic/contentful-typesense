import { createDocument } from "./createDocument.js"
import {
  getEnvironment,
  getCollectionFields,
  getContentfulFieldTypes,
  fieldFormatters
} from './utils.js'

export const upsertDocument = async({
  contentfulClient,
  typesenseClient,
  locale,
  spaceId,
  environmentName,
  contentTypeMappings,
  payload,
  getContentfulEnvironment = getEnvironment
}) => {
  const { sys, fields } = payload
  const { id: entryId, contentType: { sys: { id: contentTypeId } } } = sys

  const environment = await getContentfulEnvironment(contentfulClient, spaceId, environmentName)
  const contentType = await environment.getContentType(contentTypeId)

  const mappings = contentTypeMappings[contentTypeId]
  const fieldMappings = mappings?.fieldMappings || {}
  const extraFields = mappings?.extraFields || []

  const { fields: contentTypeFields } = contentType
  const schemaFields = getCollectionFields(contentTypeFields, extraFields)
  const fieldTypes = getContentfulFieldTypes(contentType)

  const isBulk = false

  const document = await createDocument({
    entryId,
    schemaFields,
    fields,
    fieldTypes,
    locale,
    fieldMappings,
    fieldFormatters,
    fieldMappersExtraArgs: [isBulk, environment]
  })

  typesenseClient
    .collections(contentTypeId)
    .documents()
    .upsert(document)
}
