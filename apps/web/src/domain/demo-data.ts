export interface DemoProject {
  id: string
  name: string
  description: string
  language: string
}

export const demoProjects: DemoProject[] = [
  { id: 'api-service', name: 'acme/api-service', description: '支付与账户 API', language: 'TypeScript' },
  { id: 'web-console', name: 'acme/web-console', description: '团队运营控制台', language: 'React' },
  { id: 'agent-tools', name: 'acme/agent-tools', description: '内部开发工具链', language: 'Python' }
]
