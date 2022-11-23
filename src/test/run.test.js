import test from 'ava'
import sinon from 'sinon'

import { run } from '../lib/run.js'

test.beforeEach(t => {
  const getInput = sinon.stub()
  getInput.withArgs('locale').returns('en-US')
  getInput.withArgs('contentfulSpaceId').returns('abc-1234')
  getInput.withArgs('contentfulEnvironment').returns('master')
  getInput.withArgs('contentManagementToken').returns('cmt-123456')
  const core = { getInput }

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
    getInput.withArgs('typesenseAction').returns('bulkIndex')

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
      contentTypeMappings
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
  async exec(t, topic) {
    const { context } = t
    const {
      core,
      contentfulClient,
      typesenseClient,
      contentTypeMappings
    } = context
    const payload = { topic }
    const github = {
      context: {
        eventName: 'repository_dispatch',
        payload
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

    t.true(runUpsertDocument.calledOnceWithExactly({
      contentfulClient,
      typesenseClient,
      locale: 'en-US',
      spaceId: 'abc-1234',
      environmentName: 'master',
      contentTypeMappings,
      payload
    }))
  },
  title(_providedTitle, topic) {
    return `upsertDocument on repository_dispatch with topic ${topic}`
  }
})

test(upsertDocumentMacro, 'ContentManagement.Entry.create')
test(upsertDocumentMacro, 'ContentManagement.Entry.publish')
test(upsertDocumentMacro, 'ContentManagement.Entry.unarchive')

const deleteDocumentMacro = test.macro({
  async exec(t, topic) {
    const { context } = t
    const {
      core,
      contentfulClient,
      typesenseClient,
      contentTypeMappings
    } = context
    const payload = { topic }
    const github = {
      context: {
        eventName: 'repository_dispatch',
        payload
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

test(deleteDocumentMacro, 'ContentManagement.Entry.delete')
test(deleteDocumentMacro, 'ContentManagement.Entry.unpublish')
test(deleteDocumentMacro, 'ContentManagement.Entry.archive')
