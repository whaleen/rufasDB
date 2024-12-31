# Vision

RufasDB runs a database engine in the browser. It uses the File System Access API for storage and provides an ORM query interface. This creates an odd but useful scenario where database operations typically done server-side are running entirely in the browser.

## Core Principles

- **Browser-Native**: Built specifically for modern web browsers, not a server database adaptation
- **Developer Experience**: Type safety and intuitive APIs that make data management straightforward
- **Reliability**: Robust concurrency handling and data persistence without complexity
- **Pragmatic Performance**: Optimized for common client-side data operations while maintaining simplicity

## Primary Limitation

The File System Access API requires polling to detect changes, making real-time updates between browser tabs impossible. We mitigate this with a locking system that prevents write conflicts, but this is inherently less efficient than server-side database triggers and events. This limitation is fundamental to the browser environment in that the File System Access API does not allow an open two way connection - So we attempt to provide a database API where it shouldn't exist and it seems to mostly work. Sometimes you just need to wait a second or try a second time if you miss a write window - This needs elaboration in another document that will be written another day.

## Target Use Cases

RufasDB is designed for web applications that need structured data persistence beyond what localStorage offers, but don't require the complexity of a full client-server database. Examples include:

- Offline-first applications
- Personal productivity tools
- Local data caching
- Development and prototyping environments

This project prioritizes developer experience and reliable data operations over maximum performance, making it ideal for applications dealing with moderate amounts of structured data in the browser. There is no warning about this not being "production" ready as it is not intended for nor is it feasible to even use in a production environment.

It might be too finicky than it's worth in which case you might just spin up a database server and use a full-fledged ORM and database. It is fun to play with and can be useful for small projects or prototyping.

When you are ready to get a "real" database, RufasDB can be easily replaced with Prisma as that is the inspiration for the API design and your code should port over with little to no changes.
