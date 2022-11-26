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
  const runExec = { exec: sinon.spy() }
  const readFile = sinon.stub().returns({
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
    runExec,
    readFile,
    getContentfulEnvironment,
    getContentTypes,
    collections,
    importDocuments
  }
})

test('bulkIndexing', async t => {
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
    runExec,
    readFile,
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
    runExec,
    readFile,
    getContentfulEnvironment,
    getContentTypes
  })

  t.true(getContentfulEnvironment.calledOnceWithExactly(contentfulClient, spaceId, environmentName))
  t.true(getContentTypes.calledOnceWithExactly())
  t.is(collections.callCount, 2)
  t.deepEqual(collections.args, [['foo'], ['bar']])

  t.true(runExec.exec.calledOnceWithExactly('contentful', [
    'space',
    'export',
    '--management-token',
    managementToken,
    '--space-id',
    spaceId,
    '--environment-id',
    environmentName,
    '--include-drafts',
    true,
    '--skip-content-model',
    'true',
    '--skip-roles',
    'true',
    '--skip-webhooks',
    'true',
    '--skip-tags',
    'true',
    '--content-file',
    'contentfulExport-fgt354678998.json',
    '--use-verbose-renderer',
    'true'
  ]))

  t.true(readFile.calledOnceWithExactly('contentfulExport-fgt354678998.json'))

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
