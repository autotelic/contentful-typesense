export const deleteDocument = async({
  typesenseClient,
  payload
}) => {
  const { sys } = payload
  const { id: entryId, contentType: { sys: { id: contentTypeId } } } = sys

  typesenseClient
    .collections(contentTypeId)
    .documents(entryId)
    .delete()
}
