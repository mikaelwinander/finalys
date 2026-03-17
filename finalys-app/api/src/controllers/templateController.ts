// /api/src/controllers/templateController.ts
import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api.types';
import { templateService } from '../services/templateService';
import { logger } from '../utils/logger';

export const templateController = {
  async saveTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const clientId = req.user!.clientId;
      const userId = req.user!.uid;
      const { templateName, description, isDefault, rowDimensions, colDimensions, measures, filters } = req.body;

      if (!templateName || !rowDimensions || !colDimensions || !measures) {
        res.status(400).json({ error: 'Missing required template layout data' });
        return;
      }

      const templateId = await templateService.saveTemplate({
        clientId, userId, templateName, description, isDefault, 
        rowDimensions, colDimensions, measures, filters
      });

      res.status(200).json({ success: true, templateId });
    } catch (error: any) {
      logger.error('Failed to save template', { error: error.message });
      res.status(500).json({ error: 'Internal Server Error while saving template' });
    }
  },

  async getTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const clientId = req.user!.clientId;
      const templates = await templateService.getTemplates(clientId);
      res.status(200).json({ data: templates });
    } catch (error: any) {
      logger.error('Failed to fetch templates', { error: error.message });
      res.status(500).json({ error: 'Internal Server Error while fetching templates' });
    }
  }
};