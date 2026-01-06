# shopify-codegen

Generate TypeScript types from Shopify Liquid section schemas.

## Installation

```bash
yarn add -D shopify-codegen
# or
npm install -D shopify-codegen
```

## Usage

### CLI

```bash
shopify-codegen [sections-dir]
```

If `sections-dir` is not provided, it defaults to `./sections`.

Example:
```bash
shopify-codegen ./sections > src/types/shopify/liquid.types.ts
```

### Library

```typescript
import { generateTypes } from 'shopify-codegen'

const types = await generateTypes({
  sectionsDir: './sections'
})

console.log(types)
```

## How it works

The tool scans all `.liquid` files in the specified directory, extracts JSON schemas from `{% schema %}` blocks, and generates TypeScript interfaces for:

- **Section types**: Based on filename (e.g., `video.liquid` → `Video`)
- **Block types**: Prefixed with section name to avoid conflicts (e.g., `VideoSlide`)
- **Settings types**: With proper optionality based on defaults

### Special handling

- `@app` blocks are typed as generic `BlockSettings` since their structure is app-defined
- Interface names are derived from filenames to avoid duplicates
- The `name` property in interfaces preserves the original schema name (can be translation keys like `t:sections.footer.name`)

## Example

Given a `sections/video.liquid` file with a schema, the tool generates:

```typescript
export interface Video extends ShopifySection {
  name: 'Video'
  tag: 'section'
  settings: {
    cover_text: string
    video_url?: { id: string; type: string }
    // ...
  }
  blocks: Block[]
}
```
