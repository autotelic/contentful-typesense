import { normalize, schema } from 'normalizr'

export const contentTypeMappings = {
  building: {},
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
