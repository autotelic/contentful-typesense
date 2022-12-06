import { bulkIndexing } from "./bulkIndexing.js"
import { dropAndCreateCollections } from './dropAndCreateCollections.js'
import { upsertDocument } from "./upsertDocument.js"
import { deleteDocument } from "./deleteDocument.js"

export const run = async ({
  core,
  github,
  contentfulClient,
  typesenseClient,
  contentTypeMappings,
  runBulkIndexing = bulkIndexing,
  runDropAndCreateCollections = dropAndCreateCollections,
  runUpsertDocument = upsertDocument,
  runDeleteDocument = deleteDocument
}) => {
  const { context } = github
  const { eventName } = context

  const locale = core.getInput('locale')
  const spaceId = core.getInput('contentfulSpaceId')
  const environmentName = core.getInput('contentfulEnvironment')
  const includeDrafts = core.getInput('includeDrafts')
  const managementToken = core.getInput('contentManagementToken')

  if (eventName === 'workflow_dispatch') {
    const typesenseAction = core.getInput('typesenseAction')

    if (typesenseAction === 'dropAndCreateCollections') {
      core.info(`Running drop and create collections`)
      await runDropAndCreateCollections({
        contentfulClient,
        typesenseClient,
        spaceId,
        environmentName,
        contentTypeMappings
      })
    }

    if (typesenseAction === 'bulkIndexing') {
      await runBulkIndexing({
        contentfulClient,
        typesenseClient,
        locale,
        spaceId,
        managementToken,
        environmentName,
        contentTypeMappings,
        includeDrafts
      })
    }
  }

  if (eventName === 'schedule') {
    await runBulkIndexing({
      contentfulClient,
      typesenseClient,
      locale,
      spaceId,
      managementToken,
      environmentName,
      contentTypeMappings,
      includeDrafts
    })
  }

  if (eventName === 'repository_dispatch') {
    const { payload: webhookPayload } = context
    const { client_payload: clientPayload } = webhookPayload
    const { topic, payload, content_type_id: contentTypeId } = clientPayload

    core.info(`Contentful webhook with topic '${topic}' for content type '${contentTypeId}'`)

    if (Object.keys(contentTypeMappings).includes(contentTypeId)) {
      const { sys } = payload
      const {
        publishedVersion,
        version,
        id
      } = sys

      const isDraft = !publishedVersion
      const isChanged = !!publishedVersion && version >= publishedVersion + 2
      const isPublished = !!publishedVersion && version === publishedVersion + 1

      let upsertEntry = false
      let deleteEntry = false

      if (topic === 'ContentManagement.Entry.create' && includeDrafts) upsertEntry = true
      if (topic === 'ContentManagement.Entry.publish') upsertEntry = true
      if (topic === 'ContentManagement.Entry.unarchive' && includeDrafts) upsertEntry = true
      if (topic === 'ContentManagement.Entry.archive' && (isPublished || isChanged)) deleteEntry = true
      if (topic === 'ContentManagement.Entry.archive' && isDraft && includeDrafts) deleteEntry = true
      if (topic === 'ContentManagement.Entry.delete' && (isPublished || isChanged)) deleteEntry = true
      if (topic === 'ContentManagement.Entry.delete' && isDraft && includeDrafts) deleteEntry = true
      if (topic === 'ContentManagement.Entry.unpublish' && !includeDrafts) deleteEntry = true

      if (upsertEntry) {
        core.info(`Upserting document with id ${id}`)
        await runUpsertDocument({
          contentfulClient,
          typesenseClient,
          locale,
          spaceId,
          environmentName,
          includeDrafts,
          contentTypeMappings,
          payload
        })
      }

      if (deleteEntry) {
        core.info(`Deleting document with id ${id}`)
        await runDeleteDocument({
          typesenseClient,
          includeDrafts,
          payload
        })
      }

      const { webhookHandler } = contentTypeMappings[contentTypeId]
      if (typeof webhookHandler === 'function') {
        core.info(`Running repo-defined webhookHandler for '${contentTypeId}'`)
        await webhookHandler({
          contentfulClient,
          typesenseClient,
          locale,
          spaceId,
          environmentName,
          includeDrafts,
          contentTypeMappings,
          payload,
          entryId: id,
          topic,
          isDraft,
          isChanged,
          isPublished,
          upsertEntry,
          deleteEntry
        })
      }

    } else {
      core.info(`Content type '${contentTypeId}' not mapped for indexing`)
    }
  }
}
