import { createRequire } from 'node:module'
import { join } from 'node:path'
import process from 'node:process'

const { Client } = createRequire(join(process.env.RIG_SOURCE, 'package.json'))('pg')
const [url, ...statements] = process.argv.slice(2)
const client = new Client({ connectionString: url })
await client.connect()
try {
  for (const statement of statements) {
    const { rows } = await client.query(statement)
    for (const row of rows) process.stdout.write(`${Object.values(row).join('|')}\n`)
  }
} finally {
  await client.end()
}
