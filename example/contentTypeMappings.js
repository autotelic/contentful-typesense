import { normalize, schema } from 'normalizr'

export const contentTypeMappings = {
  building: {
    webhookHandler: async ({
      contentfulClient,
      typesenseClient,
      entryId,
      spaceId,
      environmentName,
      locale,
      payload
    }) => {
      const space = await contentfulClient.getSpace(spaceId)
      const environment = await space.getEnvironment(environmentName)
      const buildingEntities = {
        entryId: payload
      }
      const linkedProperties = await environment.getEntries({
        links_to_entry: entryId
      })
      const { total, items } = linkedProperties
      if (total > 0) {
        for await (const property of items) {
          const { sys, fields } = property
          const { id: propertyId } = sys
          const { propertyBuilding } = fields
          const buildingIds = propertyBuilding[locale].map(ref => ref.sys.id)
          const buildingsToFetch = buildingIds.filter(id => !Object.keys(buildingEntities).includes(id))
          if (buildingsToFetch.length > 0) {
            const propertyBuildings = await environment.getEntries({
              content_type: 'building',
              'sys.id[in]': buildingsToFetch.join(',')
            })
            propertyBuildings.items.forEach(building => {
              const { sys: { id } } = building
              buildingEntities[id] = building
            })
          }
          const locations = buildingIds.map(id => {
            const building = buildingEntities[id]
            const { fields: { buildingLocation } } = building
            return Object.values(buildingLocation[locale]).reverse()
          })

          typesenseClient
            .collections('property')
            .documents()
            .upsert({
              id: propertyId,
              locations
            })
        }
      }
    }
  },
  property: {
    extraFields: [
      { name: 'locations', type: 'geopoint[]' }
    ],
    fieldMappings: {
      locations: async (fields, locale, isBulk, ...extraArgs) => {
        const { propertyBuilding: buildings } = fields
        if (buildings === undefined) return []
        let buildingEntities
        if (isBulk) {
          const [allEntities] = extraArgs
          buildingEntities = allEntities['building']
        } else {
          const [environment] = extraArgs
          const buildingIds = buildings[locale].map(ref => ref.sys.id)
          const propertyBuildings = await environment.getEntries({
            content_type: 'building',
            'sys.id[in]': buildingIds.join(',')
          })
          const buildingSchema = new schema.Entity('building', {}, { idAttribute: value => value.sys.id })
          const buildingListSchema = [buildingSchema]
          const normalizedData = normalize(propertyBuildings.items, buildingListSchema)
          buildingEntities = normalizedData.entities['building']
        }

        return buildings[locale].filter(ref => {
          const building = buildingEntities[ref.sys.id]
          if (building === undefined) return false
          const { fields: { buildingLocation } } = building
          if (buildingLocation === undefined) return false
          return true
        }).map(ref => {
          const building = buildingEntities[ref.sys.id]
          const { fields: { buildingLocation } } = building
          return Object.values(buildingLocation[locale]).reverse()
        })
      }
    }
  }
}
