import { createWorkspace } from '../../domain/workspace/workspace-model.js';

export function createWorkspaceService(repository) {
  if (!repository) throw new Error('Workspace repository is required.');

  return Object.freeze({
    create(input) {
      const workspace = createWorkspace(input);
      repository.save(workspace);
      return workspace;
    },
    load(id) {
      return repository.load(id);
    },
    list() {
      return repository.list();
    },
    save(workspace) {
      repository.save(workspace);
      return workspace;
    },
    remove(id) {
      return repository.remove(id);
    }
  });
}
