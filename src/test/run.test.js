import test from 'ava'
import sinon from 'sinon'

import { run } from '../lib/run.js'

test.beforeEach(t => {
  const getInput = sinon.stub()
  const info = sinon.spy()
  getInput.withArgs('locale').returns('en-US')
  getInput.withArgs('contentfulSpaceId').returns('abc-1234')
  getInput.withArgs('contentfulEnvironment').returns('master')
  getInput.withArgs('contentManagementToken').returns('cmt-123456')
  const core = { getInput, info }

  const contentfulClient = {}
  const typesenseClient = {}

  const contentTypeMappings = {
    property: {}
  }

  const runBulkIndexing = sinon.spy()
  const runDropAndCreateCollections = sinon.spy()

  t.context = {
    core,
    contentfulClient,
    typesenseClient,
    runBulkIndexing,
    runDropAndCreateCollections,
    contentTypeMappings,
    getInput
  }
})

const bulkIndexingMacro = test.macro({
  async exec(t, eventName) {
    const { context } = t
    const {
      core,
      contentfulClient,
      typesenseClient,
      runBulkIndexing,
      contentTypeMappings,
      getInput
    } = context
    const github = {
      context: { eventName }
    }
    getInput.withArgs('typesenseAction').returns('bulkIndexing')
    getInput.withArgs('includeDrafts').returns(true)

    await run({
      core,
      github,
      contentfulClient,
      typesenseClient,
      contentTypeMappings,
      runBulkIndexing
    })

    t.true(runBulkIndexing.calledOnceWithExactly({
      contentfulClient,
      typesenseClient,
      locale: 'en-US',
      spaceId: 'abc-1234',
      managementToken: 'cmt-123456',
      environmentName: 'master',
      contentTypeMappings,
      includeDrafts: true
    }))
  },
  title(_providedTitle, eventName) {
    return `bulkIndexing on ${eventName}`
  }
})

test(bulkIndexingMacro, 'workflow_dispatch')
test(bulkIndexingMacro, 'schedule')

test('dropAndCreateCollections on workflow_dispatch', async t => {
  const { context } = t
  const {
    core,
    contentfulClient,
    typesenseClient,
    runDropAndCreateCollections,
    contentTypeMappings,
    getInput
  } = context
  const github = {
    context: {
      eventName: 'workflow_dispatch'
    }
  }
  getInput.withArgs('typesenseAction').returns('dropAndCreateCollections')

  await run({
    core,
    github,
    contentfulClient,
    typesenseClient,
    contentTypeMappings,
    runDropAndCreateCollections
  })

  t.true(runDropAndCreateCollections.calledOnceWithExactly({
    contentfulClient,
    typesenseClient,
    spaceId: 'abc-1234',
    environmentName: 'master',
    contentTypeMappings
  }))
})

const upsertDocumentMacro = test.macro({
  async exec(t, topic, includeDrafts, upsertCalled) {
    const { context } = t
    const {
      core,
      contentfulClient,
      typesenseClient,
      contentTypeMappings,
      getInput
    } = context
    getInput.withArgs('includeDrafts').returns(includeDrafts)
    const payload = { sys }
    const github = {
      context: {
        eventName: 'repository_dispatch',
        payload: {
          client_payload: {
            topic, payload, content_type_id: 'property'
          }
        }
      }
    }
    const runUpsertDocument = sinon.spy()
    await run({
      core,
      github,
      contentfulClient,
      typesenseClient,
      contentTypeMappings,
      runUpsertDocument
    })


    t[String(upsertCalled)](runUpsertDocument.calledOnceWithExactly({
      contentfulClient,
      typesenseClient,
      locale: 'en-US',
      spaceId: 'abc-1234',
      environmentName: 'master',
      includeDrafts,
      contentTypeMappings,
      payload
    }))
    t[String(!upsertCalled)](runUpsertDocument.notCalled)
  },
  title(_providedTitle, topic, includeDrafts) {
    return `upsertDocument on repository_dispatch with topic ${topic}, includeDrafts: ${includeDrafts}`
  }
})

test(upsertDocumentMacro, 'ContentManagement.Entry.create', true, true)
test(upsertDocumentMacro, 'ContentManagement.Entry.publish', false, true)
test(upsertDocumentMacro, 'ContentManagement.Entry.publish', true, true)
test(upsertDocumentMacro, 'ContentManagement.Entry.unarchive', false, false)
test(upsertDocumentMacro, 'ContentManagement.Entry.unarchive', true, true)

const deleteDocumentMacro = test.macro({
  async exec(t, topic, sys, includeDrafts, deleteCalled) {
    const { context } = t
    const {
      core,
      contentfulClient,
      typesenseClient,
      contentTypeMappings,
      getInput
    } = context
    getInput.withArgs('includeDrafts').returns(includeDrafts)
    const payload = {}
    const github = {
      context: {
        eventName: 'repository_dispatch',
        payload: {
          client_payload: {
            topic, payload, content_type_id: 'property'
          }
        }
      }
    }
    const runDeleteDocument = sinon.spy()
    await run({
      core,
      github,
      contentfulClient,
      typesenseClient,
      contentTypeMappings,
      runDeleteDocument
    })

    t.true(runDeleteDocument.calledOnceWithExactly({
      typesenseClient,
      payload
    }))
  },
  title(_providedTitle, topic) {
    return `deleteDocument on repository_dispatch with topic ${topic}`
  }
})

// test(deleteDocumentMacro, 'ContentManagement.Entry.archive', true, true)
// test(deleteDocumentMacro, 'ContentManagement.Entry.delete')
// test(deleteDocumentMacro, 'ContentManagement.Entry.unpublish')
// test(deleteDocumentMacro, 'ContentManagement.Entry.archive')

const wrongContentTypeIdMacro = test.macro({
  async exec(t, topic) {
    const { context } = t
    const {
      core,
      contentfulClient,
      typesenseClient,
      contentTypeMappings
    } = context
    const payload = {}
    const github = {
      context: {
        eventName: 'repository_dispatch',
        payload: {
          client_payload: {
            topic, payload, content_type_id: 'anotherTypeId'
          }
        }
      }
    }
    const runDeleteDocument = sinon.spy()
    const runUpsertDocument = sinon.spy()
    await run({
      core,
      github,
      contentfulClient,
      typesenseClient,
      contentTypeMappings,
      runDeleteDocument,
      runUpsertDocument
    })

    t.true(runDeleteDocument.notCalled)
    t.true(runUpsertDocument.notCalled)
  },
  title(_providedTitle, topic) {
    return `nothing called on repository_dispatch with topic ${topic}`
  }
})

test(wrongContentTypeIdMacro, 'ContentManagement.Entry.create')
test(wrongContentTypeIdMacro, 'ContentManagement.Entry.delete')
