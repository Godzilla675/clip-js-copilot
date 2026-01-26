import { Router } from 'express';
import type { Server } from '../server.js';
import { updateEnvFile } from '../utils/env-manager.js';
import { config } from '../config.js';

export function createSettingsRouter(server: Server) {
  const router = Router();

  router.get('/', (req, res) => {
    // Check config status
    const status = {
      pexelsConfigured: !!process.env.PEXELS_API_KEY,
      unsplashConfigured: !!process.env.UNSPLASH_ACCESS_KEY,
      llmProvider: config.llm.provider,
      llmModel: config.llm.model,
      // Mask keys
      llmConfigured: config.llm.provider === 'copilot' ? true :
                     config.llm.provider === 'anthropic' ? !!config.llm.anthropicApiKey :
                     config.llm.provider === 'openai' ? !!config.llm.openaiApiKey :
                     config.llm.provider === 'gemini' ? !!config.llm.geminiApiKey :
                     config.llm.provider === 'custom' ? !!config.llm.baseUrl : false
    };
    res.json(status);
  });

  router.post('/', async (req, res) => {
    try {
      const {
        pexelsApiKey,
        unsplashAccessKey,
        llmProvider,
        llmModel,
        anthropicApiKey,
        openaiApiKey,
        geminiApiKey,
        copilotCliPath,
        llmBaseUrl
      } = req.body;

      const envUpdates: Record<string, string> = {};

      if (pexelsApiKey !== undefined) envUpdates.PEXELS_API_KEY = pexelsApiKey;
      if (unsplashAccessKey !== undefined) envUpdates.UNSPLASH_ACCESS_KEY = unsplashAccessKey;
      if (llmProvider !== undefined) envUpdates.LLM_PROVIDER = llmProvider;
      if (llmModel !== undefined) envUpdates.LLM_MODEL = llmModel;
      if (anthropicApiKey !== undefined) envUpdates.ANTHROPIC_API_KEY = anthropicApiKey;
      if (openaiApiKey !== undefined) envUpdates.OPENAI_API_KEY = openaiApiKey;
      if (geminiApiKey !== undefined) envUpdates.GEMINI_API_KEY = geminiApiKey;
      if (copilotCliPath !== undefined) envUpdates.COPILOT_CLI_PATH = copilotCliPath;
      if (llmBaseUrl !== undefined) envUpdates.LLM_BASE_URL = llmBaseUrl;

      // Update process.env
      Object.assign(process.env, envUpdates);

      // Update config object
      if (llmProvider) config.llm.provider = llmProvider;
      if (llmModel) config.llm.model = llmModel;
      if (anthropicApiKey) config.llm.anthropicApiKey = anthropicApiKey;
      if (openaiApiKey) config.llm.openaiApiKey = openaiApiKey;
      if (geminiApiKey) config.llm.geminiApiKey = geminiApiKey;
      if (llmBaseUrl) config.llm.baseUrl = llmBaseUrl;

      // Persist to .env
      await updateEnvFile(envUpdates);

      // Reload components
      // We run these in parallel or sequence? Sequence is safer.
      await server.reloadLLM();
      // Reloading MCP might take time and disconnect existing sessions.
      await server.reloadMCP();

      res.json({ success: true });
    } catch (error: any) {
      console.error('Failed to update settings:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
