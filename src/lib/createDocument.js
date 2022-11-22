export const createDocument = async ({
  entryId,
  schemaFields,
  fields,
  fieldTypes,
  locale,
  fieldMappings,
  fieldFormatters,
  fieldMappersExtraArgs = []
}) => {
  const defaultFieldFormatter = value => value
  return {
    id: entryId,
    ...await schemaFields.reduce(async (documentFields, schemaField) => {
      const { name } = schemaField
      if (fieldMappings[name] !== undefined) {
        return {
          ...await documentFields,
          [name]: await fieldMappings[name](fields, locale, ...fieldMappersExtraArgs)
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
