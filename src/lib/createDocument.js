export const createDocument = async (collectionFields, fields, fieldMappers, fieldFormatters) => {
  return {
    id: entryId,
    ...await collectionFields.reduce(async (documentFields, schemaField) => {
      const { name } = schemaField
      if (fieldMappings[name] !== undefined) {
        return {
          ...await documentFields,
          [name]: await fieldMappings[name](fields, locale, contentfulClient)
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
