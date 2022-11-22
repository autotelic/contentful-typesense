import test from 'ava'
import sinon from 'sinon'
import { createDocument } from '../lib/createDocument.js'

test('createDocument', async t => {
  const schemaFields = [
    { name: 'name', type: 'string', optional: true },
    { name: 'dateOfSomething', type: 'int64', optional: true },
    { name: 'anotherField', type: 'string' },
    { name: 'locations', type: 'geopoint[]' }
  ]

  const fields = {
    name: {
      'en-US': 'Entry Name'
    },
    referenceField: {
      'en-US': {
        sys: {
          type: 'Link',
          linkType: 'Entry',
          id: '015g6yMTAzynfl7ezgPhtK'
        }
      }
    },
    dateOfSomething: {
      'en-US': '2015-11-06T09:45:27'
    }
  }

  const fieldTypes = {
    name: 'Symbol',
    dateOfSomething: 'Date'
  }

  const fieldMappings = {
    locations: sinon.stub().returns([
      [51.509865, -0.118092],
      [49.246292, -123.116226]
    ])
  }

  const fieldFormatters = {
    'Date': sinon.stub().returns(1446831927)
  }

  const document = await createDocument({
    entryId: '5p6Frfcx7wVhdrmPncy6Q9',
    schemaFields,
    fields,
    fieldTypes,
    locale: 'en-US',
    fieldMappings,
    fieldFormatters,
    fieldMappersExtraArgs: ['arg1', 'arg2']
  })

  t.true(fieldMappings.locations.calledOnceWithExactly(fields, 'en-US', 'arg1', 'arg2'))
  t.true(fieldFormatters['Date'].calledOnceWithExactly('2015-11-06T09:45:27'))
  t.deepEqual(document, {
    id: '5p6Frfcx7wVhdrmPncy6Q9',
    name: 'Entry Name',
    dateOfSomething: 1446831927,
    locations: [[51.509865, -0.118092], [49.246292, -123.116226]]
  })
})
