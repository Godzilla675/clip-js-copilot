import { Router } from 'express';
import { ProjectManager } from '../project/state.js';

export function createProjectRouter(projectManager: ProjectManager): Router {
  const router = Router();

  router.get('/:id', async (req, res) => {
    try {
      const project = await projectManager.loadProject(req.params.id);
      res.json(project);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const { name, settings } = req.body;
      if (!name || !settings) {
          return res.status(400).json({ error: 'Name and settings are required' });
      }
      const project = await projectManager.createProject(name, settings);
      res.json(project);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const project = await projectManager.updateProject(req.params.id, req.body);
      res.json(project);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  });

  router.get('/:id/export', (req, res) => {
    // Trigger export (Agent 06 - FFmpeg?)
    // Placeholder
    res.json({ message: 'Export triggered (not implemented)' });
  });

  return router;
}
