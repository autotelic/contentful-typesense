import test from 'ava'
import sinon from 'sinon'

import { run } from '../lib/run.js'

test.beforeEach(t => {
  const getInput = sinon.stub()
  getInput.withArgs('locale').returns('en-US')
  getInput.withArgs('contentfulSpaceId').returns('abc-1234')
  getInput.withArgs('contentfulEnvironment').returns('master')
  getInput.withArgs('contentManagementToken').returns('cmt-123456')
  getInput.withArgs('dropAndCreateCollections').returns(true)
  const core = { getInput }

  const contentfulClient = {}
  const typesenseClient = {}

  const contentTypeMappings = {
    property: {}
  }

  const runBulkIndexing = sinon.spy()

  t.context = {
    core,
    contentfulClient,
    typesenseClient,
    runBulkIndexing,
    contentTypeMappings
  }
})

test('run: workflow_dispatch', async t => {
  const { context } = t
  const {
    core,
    contentfulClient,
    typesenseClient,
    runBulkIndexing,
    contentTypeMappings
  } = context
  const github = {
    context: {
      eventName: 'workflow_dispatch'
    }
  }

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
})

test('run: schedule', async t => {
  const { context } = t
  const {
    core,
    contentfulClient,
    typesenseClient,
    contentTypeMappings,
    runBulkIndexing
  } = context
  const github = {
    context: {
      eventName: 'schedule'
    }
  }

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
})
