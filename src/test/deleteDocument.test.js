import test from 'ava'
import sinon from 'sinon'

import { deleteDocument } from '../lib/deleteDocument.js'

test.beforeEach(t => {
  const deleteDocumentSpy = sinon.spy()
  const documents = sinon.stub().returns({ delete: deleteDocumentSpy })
  const collections = sinon.stub().returns({ documents })
  const typesenseClient = { collections }

  const payload = {
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

  t.context = {
    typesenseClient,
    documents,
    collections,
    deleteDocumentSpy,
    payload
  }
})

test('deleteDocument', async t => {
  const { context } = t
  const {
    typesenseClient,
    documents,
    collections,
    deleteDocumentSpy,
    payload
  } = context

  await deleteDocument({
    typesenseClient,
    payload
  })

  t.true(collections.calledOnceWithExactly('foo'))
  t.true(documents.calledOnceWithExactly('xyz56789'))
  t.true(deleteDocumentSpy.calledOnceWithExactly())
})
