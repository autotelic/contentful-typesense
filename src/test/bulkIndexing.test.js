import test from 'ava'
import sinon from 'sinon'

import { bulkIndexing } from '../lib/bulkIndexing.js'

test.beforeEach(t => {
  const contentfulClient = sinon.stub()
  const importDocuments = sinon.spy()
  const collections = sinon.stub().returns({
    documents: sinon.stub().returns({ import: importDocuments })
  })
  const typesenseClient = { collections }
  const locale = 'en-US'
  const spaceId = 'fgt354678998'
  const managementToken = 'cmat-12345667'
  const environmentName = 'master'
  const contentTypeMappings = {
    foo: {},
    bar: {}
  }
  const includeDrafts = true
  const contentfulExportClient = sinon.stub().returns({
    entries: [
      {
        sys: {
          id: '1234',
          contentType: {
            sys: { id: 'foo' }
          }
        },
      },
      {
        sys: {
          id: '5678',
          contentType: {
            sys: { id: 'bar' }
          }
        }
      }
    ]
  })
  const getContentTypes = sinon.stub().returns({
    items: [
      {
        sys: { id: 'foo' },
        fields: []
      },
      {
        sys: { id: 'bar' },
        fields: []
      }
    ]
  })
  const getContentfulEnvironment = sinon.stub().returns({ getContentTypes })

  t.context = {
    contentfulClient,
    typesenseClient,
    locale,
    spaceId,
    managementToken,
    environmentName,
    contentTypeMappings,
    includeDrafts,
    contentfulExportClient,
    getContentfulEnvironment,
    getContentTypes,
    collections,
    importDocuments
  }
})

test('bulkIndexing - drop and create collections', async t => {
  const { context } = t
  const {
    contentfulClient,
    typesenseClient,
    locale,
    spaceId,
    managementToken,
    environmentName,
    contentTypeMappings,
    includeDrafts,
    contentfulExportClient,
    getContentfulEnvironment,
    getContentTypes,
    collections,
    importDocuments
  } = context

  await bulkIndexing({
    contentfulClient,
    typesenseClient,
    locale,
    spaceId,
    managementToken,
    environmentName,
    contentTypeMappings,
    includeDrafts,
    contentfulExportClient,
    getContentfulEnvironment,
    getContentTypes
  })

  t.true(getContentfulEnvironment.calledOnceWithExactly(contentfulClient, spaceId, environmentName))
  t.true(getContentTypes.calledOnceWithExactly())
  t.is(collections.callCount, 2)
  t.deepEqual(collections.args, [['foo'], ['bar']])

  t.true(contentfulExportClient.calledOnceWithExactly({
    spaceId,
    managementToken,
    includeDrafts,
    contentOnly: true,
    saveFile: false
  }))

  t.true(importDocuments.calledTwice)
  t.deepEqual(importDocuments.args, [
    [
      [{ id: '1234' }],
      { action: 'upsert', dirty_values: 'coerce_or_drop' }
    ],
    [
      [{ id: '5678' }],
      { action: 'upsert', dirty_values: 'coerce_or_drop' }
    ]
  ])
})
