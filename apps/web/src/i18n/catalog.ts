import type { Locale } from '../domain/types'

export type MessageKey = 'project.choose' | 'project.connectGithub' | 'mode.workspace' | 'mode.issue' | 'mode.chat' | 'task.approve' | 'task.returnToExplore' | 'language.english' | 'language.chinese'

export const catalog: Record<Locale, Record<MessageKey, string>> = {
  'zh-CN': {
    'project.choose': '选择一个项目', 'project.connectGithub': 'GitHub 演示连接', 'mode.workspace': '代码工作台', 'mode.issue': 'Issue 任务', 'mode.chat': '自由对话', 'task.approve': '批准任务并创建计划', 'task.returnToExplore': '请求扩大范围', 'language.english': 'English', 'language.chinese': '中文'
  },
  'en-US': {
    'project.choose': 'Choose a project', 'project.connectGithub': 'GitHub demo connection', 'mode.workspace': 'Code workspace', 'mode.issue': 'Issue task', 'mode.chat': 'Free conversation', 'task.approve': 'Approve task and create plan', 'task.returnToExplore': 'Request broader scope', 'language.english': 'English', 'language.chinese': 'Chinese'
  }
}
