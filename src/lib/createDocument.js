export const createDocument = async ({
  entryId,
  collectionFields,
  fields,
  fieldTypes,
  locale,
  fieldMappers,
  fieldFormatters,
  fieldMappersExtraArgs = []
}) => {
  const defaultFieldFormatter = value => value
  return {
    id: entryId,
    ...await collectionFields.reduce(async (documentFields, schemaField) => {
      const { name } = schemaField
      if (fieldMappers[name] !== undefined) {
        return {
          ...await documentFields,
          [name]: await fieldMappers[name](fields, locale, ...fieldMappersExtraArgs)
        }
      }
      if (fields[name] !== undefined) {
        const formatter = fieldFormatters[fieldTypes[name]] || defaultFieldFormatter
        return {
          ...await documentFields,
          [name]: formatter(fields[name][locale])
        }
      }

      return {
        ...await documentFields
      }
    }, {})
  }
}
