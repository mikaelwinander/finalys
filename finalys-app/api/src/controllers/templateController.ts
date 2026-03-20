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
      
      // FIX: Added dimensionSettings to the extracted body fields
      const { templateName, description, isDefault, rowDimensions, colDimensions, measures, filters, dimensionSettings } = req.body;

      if (!templateName || !rowDimensions || !colDimensions || !measures) {
        res.status(400).json({ error: 'Missing required template layout data' });
        return;
      }

      const templateId = await templateService.saveTemplate({
        clientId, 
        userId, 
        templateName, 
        description, 
        isDefault, 
        rowDimensions, 
        colDimensions, 
        measures, 
        filters,
        dimensionSettings // <-- Passed to service
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
  },

  async deleteTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const clientId = req.user!.clientId;
      
      // Explicitly tell TypeScript this is a single string
      const templateId = req.params.templateId as string; 

      if (!templateId) {
        res.status(400).json({ error: 'Template ID is required' });
        return;
      }

      await templateService.deleteTemplate(clientId, templateId);
      
      res.status(200).json({ success: true, message: 'Template deleted' });
    } catch (error: any) {
      logger.error('Failed to delete template', { error: error.message });
      res.status(500).json({ error: 'Internal Server Error while deleting template' });
    }
  },

  async updateTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const clientId = req.user!.clientId;
      const templateId = req.params.templateId as string;
      
      // FIX: Added dimensionSettings to the extracted body fields
      const { templateName, rowDimensions, colDimensions, measures, filters, dimensionSettings } = req.body;

      if (!templateId || !rowDimensions || !colDimensions || !measures) {
        res.status(400).json({ error: 'Missing required layout data for update' });
        return;
      }

      // Pass everything as a single object to match the new service signature
      await templateService.updateTemplate({
        clientId,
        templateId,
        templateName,
        rowDimensions,
        colDimensions,
        measures,
        filters,
        dimensionSettings // <-- Passed to service
      });
      
      res.status(200).json({ success: true, message: 'Template updated successfully' });
    } catch (error: any) {
      logger.error('Failed to update template', { error: error.message });
      res.status(500).json({ error: 'Internal Server Error while updating template' });
    }
  }
};