// export const defaultFieldFormatter = value => value

export const fieldFormatters = {
  'Location': value => Object.values(value).reverse(),
  'Date': value => Date.parse(value) / 1000
}

// export const getEnvironment = async (client, spaceId, environmentName) => {
//   const space = await client.getSpace(spaceId)
//   return await space.getEnvironment(environmentName)
// }

export const defaultFieldsFilter = ({ disabled, omitted }) => !disabled && !omitted

export const getSchemaFieldTypes = (schemaFields, fieldsFilter = defaultFieldsFilter) => Object.fromEntries(schemaFields.filter(fieldsFilter).map(field => {
  const { type, id: name } = field
  return [name, type]
}))

const typeMapper = {
  'Symbol': 'string',
  'Text': 'string',
  'Location': 'geopoint',
  'Integer': 'int32',
  'Number': 'float',
  'Boolean': 'bool',
  'Date': 'int64'
}

export const getCollectionFields = (schemaFields, extraFields = [], fieldsFilter = defaultFieldsFilter) => {
  return schemaFields
    .filter(fieldsFilter)
    .reduce((collectionFields, field) => {
      const { type, id: name } = field
      const tsType = typeMapper[type]
      if (tsType !== undefined) return [
        { name, type: tsType, optional: true },
        ...collectionFields
      ]
      return collectionFields
    }, [
      ...extraFields
    ])
}
