const READ_ONLY_TOOLS = new Set(['listFiles', 'searchCode', 'readFile'])

export async function executeReadOnlyTool(tool: string): Promise<string | string[]> {
  if (!READ_ONLY_TOOLS.has(tool)) throw new Error(`Tool is not allowed: ${tool}`)

  switch (tool) {
    case 'listFiles':
      return ['src/http/retry.ts', 'src/http/retry.test.ts']
    case 'searchCode':
      return 'retryRequest found in src/http/retry.ts'
    case 'readFile':
      return 'demo source excerpt'
    default:
      throw new Error(`Tool is not allowed: ${tool}`)
  }
}
