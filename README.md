# contentful-typesense

A GitHub Action and CLI tool for indexing [Contentful](https://www.contentful.com/) CMS data into [Typesense](https://typesense.org/) search engine. Supports bulk indexing, collection management, and real-time webhook-driven updates.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Bulk Indexing** — Export all Contentful entries and import them into Typesense collections
- **Collection Management** — Automatically create Typesense collections based on Contentful content types
- **Real-time Updates** — Handle Contentful webhooks via GitHub `repository_dispatch` events for instant index updates
- **Scheduled Syncing** — Support for scheduled workflows to keep indexes fresh
- **Custom Field Mappings** — Transform Contentful fields with custom logic before indexing
- **Extra Fields** — Add computed or derived fields that don't exist in Contentful
- **Custom Webhook Handlers** — Execute custom logic when specific content types receive webhook events
- **Draft Support** — Optionally include draft entries in your search index

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
  - [GitHub Action](#github-action)
  - [CLI](#cli)
- [Configuration](#configuration)
  - [Action Inputs](#action-inputs)
  - [Content Type Mappings](#content-type-mappings)
- [Field Type Mapping](#field-type-mapping)
- [Webhook Events](#webhook-events)
- [Examples](#examples)
- [Development](#development)
- [License](#license)

## Installation

```bash
npm install @autotelic/contentful-typesense
```

Or use it directly as a GitHub Action (see [GitHub Action](#github-action) section).

## Quick Start

### 1. Create a Content Type Mappings File

Create a `contentTypeMappings.js` file that defines which Contentful content types to index:

```javascript
export const contentTypeMappings = {
  article: {},
  product: {
    extraFields: [
      { name: 'priceRange', type: 'string' }
    ],
    fieldMappings: {
      priceRange: (fields, locale) => {
        const min = fields.minPrice?.[locale] || 0
        const max = fields.maxPrice?.[locale] || 0
        return `$${min} - $${max}`
      }
    }
  }
}
```

### 2. Set Up GitHub Action

```yaml
name: Index Contentful to Typesense

on:
  workflow_dispatch:
    inputs:
      typesenseAction:
        description: 'Action to perform'
        required: true
        default: 'bulkIndexing'
        type: choice
        options:
          - bulkIndexing
          - dropAndCreateCollections
  repository_dispatch:
    types: [contentful_webhook]
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight

jobs:
  index:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: autotelic/contentful-typesense@v1
        with:
          contentfulSpaceId: ${{ secrets.CONTENTFUL_SPACE_ID }}
          contentManagementToken: ${{ secrets.CONTENTFUL_MANAGEMENT_TOKEN }}
          typesenseAdminApiKey: ${{ secrets.TYPESENSE_ADMIN_API_KEY }}
          typesenseUrl: ${{ secrets.TYPESENSE_URL }}
          contentTypeMappingsPath: ./contentTypeMappings.js
```

## Usage

### GitHub Action

The action can be triggered by three GitHub event types:

| Event | Description |
|-------|-------------|
| `workflow_dispatch` | Manual trigger with action selection (`bulkIndexing` or `dropAndCreateCollections`) |
| `schedule` | Scheduled runs—automatically performs bulk indexing |
| `repository_dispatch` | Webhook events from Contentful for real-time updates |

#### Action Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `locale` | No | `en-US` | Contentful locale to index |
| `includeDrafts` | No | `true` | Whether to include draft entries |
| `typesenseAction` | No | `bulkIndexing` | Action to perform: `bulkIndexing` or `dropAndCreateCollections` |
| `contentfulSpaceId` | **Yes** | — | Contentful Space ID |
| `contentfulEnvironment` | No | `master` | Contentful environment |
| `contentTypeMappingsPath` | No | `./contentTypeMappings.js` | Path to content type mappings file |
| `contentManagementToken` | **Yes** | — | Contentful Management API token |
| `typesenseAdminApiKey` | **Yes** | — | Typesense Admin API key |
| `typesenseUrl` | No | `http://localhost:8108` | Typesense server URL |

### CLI

The package includes a CLI for local development and scripting:

```bash
contentful-typesense \
  --mappings-path ./contentTypeMappings.js \
  --locale en-US \
  --environment-name master \
  --typesense-action bulkIndexing \
  --include-drafts
```

#### CLI Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--mappings-path` | `-m` | Path to content type mappings file |
| `--locale` | `-l` | Contentful locale |
| `--environment-name` | `-e` | Contentful environment |
| `--typesense-action` | `-a` | Action: `bulkIndexing` or `dropAndCreateCollections` |
| `--include-drafts` | `-i` | Include draft entries |

#### Environment Variables (CLI)

| Variable | Description |
|----------|-------------|
| `CONTENFUL_CMA_KEY` | Contentful Management API token |
| `CONTENTFUL_SPACE_ID` | Contentful Space ID |
| `TYPESENSE_URL` | Typesense server URL |
| `TYPESENSE_ADMIN_API_KEY` | Typesense Admin API key |

## Configuration

### Content Type Mappings

The content type mappings file defines which Contentful content types to index and how to transform their data.

```javascript
export const contentTypeMappings = {
  // Simple mapping - just index this content type as-is
  article: {},

  // Advanced mapping with extra fields and custom transformations
  property: {
    // Add fields that don't exist in Contentful
    extraFields: [
      { name: 'locations', type: 'geopoint[]' }
    ],

    // Custom field value transformations
    fieldMappings: {
      locations: async (fields, locale, isBulk, extraArg) => {
        // isBulk: true during bulk indexing, false during webhook updates
        // extraArg: normalized entities (bulk) or Contentful environment (webhook)
        const { propertyBuilding: buildings } = fields
        if (!buildings) return []

        // Transform linked entries into geopoints
        return buildings[locale].map(ref => {
          // ... transformation logic
          return [longitude, latitude]
        })
      }
    },

    // Custom webhook handler for complex update scenarios
    webhookHandler: async ({
      contentfulClient,
      typesenseClient,
      entryId,
      spaceId,
      environmentName,
      locale,
      payload,
      topic,
      isDraft,
      isChanged,
      isPublished,
      upsertEntry,
      deleteEntry
    }) => {
      // Custom logic when this content type receives a webhook
      // Useful for updating related entries
    }
  }
}
```

### Extra Fields

Add computed or derived fields to your Typesense schema:

```javascript
extraFields: [
  { name: 'fullName', type: 'string' },
  { name: 'locations', type: 'geopoint[]' },
  { name: 'score', type: 'float' }
]
```

### Field Mappings

Transform field values before indexing:

```javascript
fieldMappings: {
  // Combine multiple fields
  fullName: (fields, locale) => {
    return `${fields.firstName?.[locale] || ''} ${fields.lastName?.[locale] || ''}`.trim()
  },

  // Handle async operations (e.g., fetching linked entries)
  authorName: async (fields, locale, isBulk, extraArg) => {
    const authorRef = fields.author?.[locale]
    if (!authorRef) return null

    if (isBulk) {
      const allEntities = extraArg
      const author = allEntities['author']?.[authorRef.sys.id]
      return author?.fields?.name?.[locale]
    } else {
      const environment = extraArg
      const author = await environment.getEntry(authorRef.sys.id)
      return author.fields.name[locale]
    }
  }
}
```

## Field Type Mapping

Contentful field types are automatically mapped to Typesense types:

| Contentful Type | Typesense Type |
|-----------------|----------------|
| `Symbol` | `string` |
| `Text` | `string` |
| `Location` | `geopoint` |
| `Integer` | `int32` |
| `Number` | `float` |
| `Boolean` | `bool` |
| `Date` | `int64` (Unix timestamp) |

**Note:** Fields with types not in this mapping (e.g., `Array`, `Link`, `RichText`) are not automatically indexed. Use `fieldMappings` to handle these types.

### Special Field Formatters

- **Location**: Automatically converted from `{ lat, lon }` to `[lon, lat]` array (Typesense geopoint format)
- **Date**: Automatically converted to Unix timestamp (seconds)

## Webhook Events

When using `repository_dispatch` for real-time updates, the action handles these Contentful webhook topics:

| Topic | Action | Conditions |
|-------|--------|------------|
| `ContentManagement.Entry.create` | Upsert | Only if `includeDrafts: true` |
| `ContentManagement.Entry.publish` | Upsert | Always |
| `ContentManagement.Entry.unarchive` | Upsert | Only if `includeDrafts: true` |
| `ContentManagement.Entry.archive` | Delete | If entry was published/changed, or draft with `includeDrafts: true` |
| `ContentManagement.Entry.delete` | Delete | If entry was published/changed, or draft with `includeDrafts: true` |
| `ContentManagement.Entry.unpublish` | Delete | Only if `includeDrafts: false` |

### Setting Up Contentful Webhooks

1. In Contentful, go to **Settings → Webhooks**
2. Create a new webhook pointing to:
   ```
   https://api.github.com/repos/{owner}/{repo}/dispatches
   ```
3. Set the `Authorization` header: `Bearer {GITHUB_TOKEN}`
4. Set the `Content-Type` header: `application/json`
5. Configure the payload:
   ```json
   {
     "event_type": "contentful_webhook",
     "client_payload": {
       "topic": "{ /topic }",
       "content_type_id": "{ /payload/sys/contentType/sys/id }",
       "payload": "{ /payload }"
     }
   }
   ```

## Examples

### Basic Article Indexing

```javascript
// contentTypeMappings.js
export const contentTypeMappings = {
  article: {}
}
```

### Property with Linked Buildings (Geolocation)

```javascript
// contentTypeMappings.js
import { normalize, schema } from 'normalizr'

export const contentTypeMappings = {
  building: {},
  property: {
    extraFields: [
      { name: 'locations', type: 'geopoint[]' }
    ],
    fieldMappings: {
      locations: async (fields, locale, isBulk, extraArg) => {
        const { propertyBuilding: buildings } = fields
        if (!buildings) return []

        let buildingEntities
        if (isBulk) {
          buildingEntities = extraArg['building']
        } else {
          const environment = extraArg
          const buildingIds = buildings[locale].map(ref => ref.sys.id)
          const propertyBuildings = await environment.getEntries({
            content_type: 'building',
            'sys.id[in]': buildingIds.join(',')
          })
          const buildingSchema = new schema.Entity('building', {}, {
            idAttribute: value => value.sys.id
          })
          const normalizedData = normalize(propertyBuildings.items, [buildingSchema])
          buildingEntities = normalizedData.entities['building']
        }

        return buildings[locale]
          .filter(ref => buildingEntities[ref.sys.id]?.fields?.buildingLocation)
          .map(ref => {
            const { buildingLocation } = buildingEntities[ref.sys.id].fields
            return Object.values(buildingLocation[locale]).reverse()
          })
      }
    }
  }
}
```

### GitHub Actions Workflow with Contentful Webhooks

```yaml
name: Contentful Typesense Sync

on:
  workflow_dispatch:
    inputs:
      typesenseAction:
        description: 'Typesense action'
        required: true
        default: 'bulkIndexing'
        type: choice
        options:
          - bulkIndexing
          - dropAndCreateCollections

  repository_dispatch:
    types: [contentful_webhook]

  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: autotelic/contentful-typesense@v1
        with:
          locale: en-US
          includeDrafts: false
          contentfulSpaceId: ${{ secrets.CONTENTFUL_SPACE_ID }}
          contentfulEnvironment: master
          contentManagementToken: ${{ secrets.CONTENTFUL_MANAGEMENT_TOKEN }}
          typesenseAdminApiKey: ${{ secrets.TYPESENSE_ADMIN_API_KEY }}
          typesenseUrl: ${{ secrets.TYPESENSE_URL }}
          contentTypeMappingsPath: ./contentTypeMappings.js
```

## Development

### Prerequisites

- Node.js 16+
- npm

### Setup

```bash
git clone https://github.com/autotelic/contentful-typesense.git
cd contentful-typesense
npm install
```

### Testing

```bash
# Run tests with 100% coverage requirement
npm test
```

### Building

```bash
# Build the GitHub Action distribution
npm run build
```

### Project Structure

```
contentful-typesense/
├── bin/
│   └── index.js          # CLI entry point
├── src/
│   ├── action.js         # GitHub Action entry point
│   ├── lib/
│   │   ├── run.js        # Main orchestration logic
│   │   ├── bulkIndexing.js
│   │   ├── dropAndCreateCollections.js
│   │   ├── upsertDocument.js
│   │   ├── deleteDocument.js
│   │   ├── createDocument.js
│   │   └── utils.js
│   └── test/             # Test files
├── dist/                 # Built action
├── example/              # Example configurations
├── action.yml            # GitHub Action definition
└── package.json
```

## License

[MIT](LICENSE) © [Autotelic](https://github.com/autotelic)
