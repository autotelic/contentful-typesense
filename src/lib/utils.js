export const fieldFormatters = {
  'Location': value => Object.values(value).reverse(),
  'Date': value => Date.parse(value) / 1000
}

export const getEnvironment = async (client, spaceId, environmentName) => {
  const space = await client.getSpace(spaceId)
  return await space.getEnvironment(environmentName)
}

export const defaultFieldsFilter = ({ disabled, omitted }) => !disabled && !omitted

export const getSchemaFieldTypes = (schemaFields, fieldsFilter = defaultFieldsFilter) => Object.fromEntries(schemaFields.filter(fieldsFilter).map(field => {
  const { type, id: name } = field
  return [name, type]
}))

export const getContentfulFieldTypes = (contentTypes, contentTypeMappings) => {
  return Object.fromEntries(contentTypes.items
    .filter(({ sys }) => Object.keys(contentTypeMappings).includes(sys.id))
    .map(({ sys, fields }) => {
      const { id: name } = sys
      return [name, Object.fromEntries(fields.filter(defaultFieldsFilter).map(field => {
        const { type, id: name } = field
        return [name, type]
      }))]
    }))
}

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

export const getCollections = (contentTypes, contentTypeMappings, collectionFields = getCollectionFields) => {
  return contentTypes.items
    .filter(({ sys }) => Object.keys(contentTypeMappings).includes(sys.id))
    .map(({ sys, fields }) => {
      const { id: name } = sys
      const mappings = contentTypeMappings[name]
      const extraFields = mappings?.extraFields || []
      return {
        name,
        fields: collectionFields(fields, extraFields)
      }
    })
}
