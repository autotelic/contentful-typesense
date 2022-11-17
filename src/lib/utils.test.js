import test from 'ava'
import {
  defaultFieldsFilter,
  getSchemaFieldTypes,
  getCollectionFields,
  fieldFormatters
} from './utils.js'

const fieldsFilterMacro = test.macro({
  exec(t, input, assertion) {
    t[assertion](defaultFieldsFilter(input))
  },
  title(providedTitle = '') {
    return `fieldsFilter: ${providedTitle}`
  }
})

test('disabled field filtered out', fieldsFilterMacro, {
  disabled: true,
  omitted: false
}, 'false')

test('omitted field filtered out', fieldsFilterMacro, {
  disabled: false,
  omitted: true
}, 'false')

test('disabled and omitted field filtered out', fieldsFilterMacro, {
  disabled: true,
  omitted: true
}, 'false')

test('not disabled or omitted field not filtered out', fieldsFilterMacro, {
  disabled: false,
  omitted: false
}, 'true')

const schemaFields = [
  {
    type: 'Symbol',
    id: 'foo'
  },
  {
    type: 'Text',
    id: 'bar'
  },
  {
    type: 'Location',
    id: 'fooBar'
  },
  {
    type: 'Integer',
    id: 'barFoo'
  },
  {
    type: 'Number',
    id: 'fizz'
  },
  {
    type: 'Boolean',
    id: 'buzz'
  },
  {
    type: 'Date',
    id: 'fizzBuzz'
  },
  {
    type: 'Unmapped',
    id: 'buzzFizz'
  }
]

test('getSchemaFieldTypes', t => {
  t.deepEqual(
    getSchemaFieldTypes(schemaFields, _field => true),
    {
      foo: 'Symbol',
      bar: 'Text',
      fooBar: 'Location',
      barFoo: 'Integer',
      fizz: 'Number',
      buzz: 'Boolean',
      fizzBuzz: 'Date',
      buzzFizz: 'Unmapped',
    }
  )
})

const sortByName = (a, b) => {
  const { name: aName} = a
  const { name: bName } = b
  if (bName.toUpperCase() > aName.toUpperCase()) return -1
  if (bName.toUpperCase() < aName.toUpperCase()) return 1
  return 0
}

test('getCollectionFields', t => {
  const actual = getCollectionFields(
    schemaFields,
    [{ name: 'locations', type: 'geopoint[]' }],
    _field => true
  )
  const expected = [
    { name: 'foo', type: 'string', optional: true },
    { name: 'bar', type: 'string', optional: true },
    { name: 'fooBar', type: 'geopoint', optional: true },
    { name: 'barFoo', type: 'int32', optional: true },
    { name: 'fizz', type: 'float', optional: true },
    { name: 'buzz', type: 'bool', optional: true },
    { name: 'fizzBuzz', type: 'int64', optional: true },
    { name: 'locations', type: 'geopoint[]' }
  ]
  t.deepEqual(actual.sort(sortByName), expected.sort(sortByName))
})

test('Location fieldFormatter', t => {
  const { Location: locationFormatter } = fieldFormatters

  t.deepEqual(locationFormatter({
    lat: -0.118092,
    lon: 51.509865
  }), [51.509865, -0.118092])
})

test('Date fieldFormatter', t => {
  const { Date: dateFormatter } = fieldFormatters

  t.is(dateFormatter("2015-11-06T09:45:27"), 1446831927)
})
