import {
  getEnvironment,
  getCollections
} from './utils.js'

export const dropAndCreateCollections = async ({
  contentfulClient,
  typesenseClient,
  spaceId,
  environmentName,
  contentTypeMappings,
  getContentfulEnvironment = getEnvironment
}) => {
  const environment = await getContentfulEnvironment(contentfulClient, spaceId, environmentName)
  const contentTypes = await environment.getContentTypes()
  const collectionSchemas = await getCollections(contentTypes, contentTypeMappings)

  collectionSchemas.forEach(collection => {
    const { name } = collection
    try {
      typesenseClient.collections(name).delete()
    } catch (error) {}
    typesenseClient.collections().create(collection)
  })
}
