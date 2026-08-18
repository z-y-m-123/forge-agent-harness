import { describe, expect, it } from 'vitest'
import { executeReadOnlyTool } from './read-only-tools.js'

describe('read-only tool boundary', () => {
  it('supports the deterministic demo read tools', async () => {
    await expect(executeReadOnlyTool('readFile')).resolves.toBe('demo source excerpt')
    await expect(executeReadOnlyTool('listFiles')).resolves.toEqual(['src/http/retry.ts', 'src/http/retry.test.ts'])
    await expect(executeReadOnlyTool('searchCode')).resolves.toBe('retryRequest found in src/http/retry.ts')
  })

  it('rejects tools outside the read-only allowlist', async () => {
    await expect(executeReadOnlyTool('writeFile')).rejects.toThrow('Tool is not allowed')
  })
})
