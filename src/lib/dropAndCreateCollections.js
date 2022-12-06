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

  console.log(collectionSchemas, contentTypeMappings)

  for await (const collection of collectionSchemas) {
    const { name } = collection
    try {
      await typesenseClient.collections(name).delete()
    } catch (error) {
      console.log(error)
    }

    await typesenseClient.collections().create(collection)
  }
}
