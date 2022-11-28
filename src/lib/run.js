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
  const managementToken = core.getInput('contentManagementToken')

  if (eventName === 'workflow_dispatch') {
    const typesenseAction = core.getInput('typesenseAction')

    if (typesenseAction === 'dropAndCreateCollections') {
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
        contentTypeMappings
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
      contentTypeMappings
    })
  }

  if (eventName === 'repository_dispatch') {
    const { payload: webhookPayload } = context
    const { client_payload: clientPayload } = webhookPayload
    const { topic, payload, content_type_id: contentTypeId } = clientPayload

    core.info(`Contentful webhook with topic ${topic} for content type ${contentTypeId}`)

    if (Object.keys(contentTypeMappings).includes(contentTypeId)) {
      if (['ContentManagement.Entry.publish', 'ContentManagement.Entry.create', 'ContentManagement.Entry.unarchive'].includes(topic)) {
        await runUpsertDocument({
          contentfulClient,
          typesenseClient,
          locale,
          spaceId,
          environmentName,
          contentTypeMappings,
          payload
        })
      }

      if (['ContentManagement.Entry.delete', 'ContentManagement.Entry.archive', 'ContentManagement.Entry.unpublish'].includes(topic)) {
        await runDeleteDocument({
          typesenseClient,
          payload
        })
      }
    }
  }
}
