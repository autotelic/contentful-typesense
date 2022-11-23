import test from 'ava'
import sinon from 'sinon'

import { dropAndCreateCollections } from '../lib/dropAndCreateCollections.js'

test.beforeEach(t => {
  const contentfulClient = sinon.stub()
  const deleteCollection = sinon.stub().throws(new Error)
  const createCollection = sinon.spy()
  const collections = sinon.stub().returns({
    create: createCollection,
    delete: deleteCollection
  })
  const typesenseClient = { collections }
  const spaceId = 'fgt354678998'
  const environmentName = 'master'
  const contentTypeMappings = {
    foo: {},
    bar: {}
  }

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
    spaceId,
    environmentName,
    contentTypeMappings,
    getContentfulEnvironment,
    getContentTypes,
    collections,
    deleteCollection,
    createCollection
  }
})

test('dropAndCreateCollections', async t => {
  const { context } = t
  const {
    contentfulClient,
    typesenseClient,
    spaceId,
    environmentName,
    contentTypeMappings,
    getContentfulEnvironment,
    getContentTypes,
    collections,
    deleteCollection,
    createCollection
  } = context

  await dropAndCreateCollections({
    contentfulClient,
    typesenseClient,
    spaceId,
    environmentName,
    contentTypeMappings,
    getContentfulEnvironment
  })

  t.true(getContentfulEnvironment.calledOnceWithExactly(contentfulClient, spaceId, environmentName))
  t.true(getContentTypes.calledOnceWithExactly())
  t.is(collections.callCount, 4)
  t.deepEqual(collections.args, [['foo'], [], ['bar'], []])
  t.throws(deleteCollection)
  t.true(createCollection.calledTwice)
})
