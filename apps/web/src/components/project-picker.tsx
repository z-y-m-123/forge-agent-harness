import { FolderGit2, GitBranch } from 'lucide-react'
import type { DemoProject } from '../domain/demo-data'

export function ProjectPicker({ projects, onSelect }: { projects: DemoProject[]; onSelect: (id: string) => void }) {
  return <div className="project-grid">{projects.map(project => <button className="project-card" key={project.id} onClick={() => onSelect(project.id)}><div className="project-icon"><FolderGit2 size={20} /></div><strong>{project.name}</strong><span>{project.description}</span><small><GitBranch size={13} />{project.language}</small></button>)}</div>
}
