import test from 'ava'
import sinon from 'sinon'

import { upsertDocument } from '../lib/upsertDocument.js'

test.beforeEach(t => {
  const contentfulClient = sinon.stub()
  const upsert = sinon.spy()
  const collections = sinon.stub().returns({
    documents: sinon.stub().returns({ upsert })
  })
  const typesenseClient = { collections }
  const locale = 'en-US'
  const spaceId = 'fgt354678998'
  const environmentName = 'master'
  const contentTypeMappings = { foo: {} }
  const getContentType = sinon.stub().returns({
    sys: { id: 'foo' },
    fields: [
      {
        type: 'Symbol',
        id: 'name'
      }
    ]
  })

  const getContentfulEnvironment = sinon.stub().returns({ getContentType })

  const payload = {
    payload: {
      sys: {
        id: 'xyz56789',
        contentType: {
          sys: {
            id: 'foo'
          }
        }
      },
      fields: {
        name: {
          'en-US': 'Entry Name'
        }
      }
    }
  }

  t.context = {
    contentfulClient,
    typesenseClient,
    locale,
    spaceId,
    environmentName,
    contentTypeMappings,
    getContentfulEnvironment,
    getContentType,
    collections,
    upsert,
    payload
  }
})

test('upsertDocument', async t => {
  const { context } = t
  const {
    contentfulClient,
    typesenseClient,
    locale,
    spaceId,
    environmentName,
    contentTypeMappings,
    getContentfulEnvironment,
    getContentType,
    collections,
    upsert,
    payload
  } = context

  await upsertDocument({
    contentfulClient,
    typesenseClient,
    locale,
    spaceId,
    environmentName,
    contentTypeMappings,
    payload,
    getContentfulEnvironment
  })

  t.true(getContentfulEnvironment.calledOnceWithExactly(contentfulClient, spaceId, environmentName))
  t.true(getContentType.calledOnceWithExactly('foo'))
  t.true(collections.calledOnceWithExactly('foo'))
  t.true(upsert.calledOnceWithExactly({
    id: 'xyz56789',
    name: 'Entry Name'
  }))
})
