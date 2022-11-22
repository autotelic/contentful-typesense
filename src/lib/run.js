import { bulkIndexing } from "./bulkIndexing.js"

export const run = async ({
  core,
  github,
  contentfulClient,
  typesenseClient,
  contentTypeMappings,
  runBulkIndexing = bulkIndexing
}) => {
  const { context } = github
  const { eventName } = context

  const locale = core.getInput('locale')
  const spaceId = core.getInput('contentfulSpaceId')
  const environmentName = core.getInput('contentfulEnvironment')
  const managementToken = core.getInput('contentManagementToken')

  if (['workflow_dispatch', 'schedule'].includes(eventName)) {
    const dropAndCreateCollections = core.getInput('dropAndCreateCollections')
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

  if (['repository_dispatch'].includes(eventName)) {
    const { payload } = context
  }
}
