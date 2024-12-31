# RufasDB

[![npm version](https://img.shields.io/npm/v/rufasdb.svg)](https://www.npmjs.com/package/rufasdb)
[![Development Status](https://img.shields.io/badge/status-beta-yellow.svg)](https://github.com/whaleen/rufasdb)

RufasDB is a lightweight, flat-file database with a Prisma-like interface designed for browser environments. It provides a simple, intuitive ORM (Object-Relational Mapping) using the File System Access API to manage data persistently in web applications.

## Features

- File System Access API integration
- Prisma-inspired query API
- TypeScript support
- CRUD operations
- Built-in locking mechanism for concurrent operations

## Installation

```bash
npm install rufasdb@beta
```

## Quick Start

### 1. Create a Schema

Create a `schema.rufas` file to define your data models:

```
user {
  name: string
  email: string
  age: number
}

post {
  title: string
  content: string
  authorId: string
}
```

### 2. Generate Types

Generate TypeScript types from your schema:

```bash
npx rufas generate
```

This will create a `rufas.d.ts` file with your type definitions.

### 3. Initialize and Use RufasDB

```typescript
import { RufasClient } from 'rufasdb'

// Define your schema type
type Schema = {
  user: {
    id: string
    name: string
    email: string
    age: number
  }
  post: {
    id: string
    title: string
    content: string
    authorId: string
  }
}

async function setupDatabase() {
  // Request directory access from the user
  const dirHandle = await window.showDirectoryPicker()

  // Create a RufasDB client
  const db = new RufasClient<Schema>(dirHandle, {
    user: {},
    post: {},
  })

  // Create a new user
  const newUser = await db.model('user').create({
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
  })

  // Find users
  const users = await db.model('user').findMany({
    where: {
      age: { gt: 25 },
    },
    take: 10,
    orderBy: { age: 'asc' },
  })

  // Update a user
  await db.model('user').update(newUser.id, {
    age: 31,
  })

  // Delete a user
  await db.model('user').delete(newUser.id)
}
```

## Query Options

RufasDB supports a basic set of query options:

- `where`: Filter records with various conditions
  - Supports `equals`, `gt`, `gte`, `lt`, `lte`, `contains`, `startsWith`, `endsWith`
  - Supports `AND`, `OR`, `NOT` logic
- `take`: Limit the number of records
- `skip`: Skip a number of records
- `orderBy`: Sort records

### Example Query

```typescript
const filteredPosts = await db.model('post').findMany({
  where: {
    OR: [{ title: { contains: 'TypeScript' } }, { authorId: newUser.id }],
    NOT: { content: '' },
  },
  take: 5,
  orderBy: { title: 'asc' },
})
```

## Limitations

- Works only in browser environments with File System Access API
- Designed for client-side storage, not for server-side applications
- Performance may vary with large datasets. You should not be surprised.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
