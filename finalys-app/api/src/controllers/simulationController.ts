//finalys-app/api/src/controllers/simulationController.ts
import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api.types';
import { simulationService } from '../services/simulationService'; // Keep this here
import { bigqueryService } from '../services/bigqueryService';     // Add this separate import
import { aiService } from '../services/aiService'; // Hypothetical AI wrapper
import { cacheService } from '../services/cacheService';

export const simulationController = {
  async processAdjustment(req: AuthenticatedRequest, res: Response) {
    try {
      const { datasetId, coordinates, oldValue, userInput } = req.body;
      const clientId = req.user!.clientId;
      const userId = req.user!.uid;

      const mappings = await bigqueryService.getDimensionMapping(clientId);
      const translatedCoordinates: Record<string, string> = {};

      for (const [key, value] of Object.entries(coordinates as Record<string, string>)) {
        if (key === 'period' || key === 'period_id') {
          translatedCoordinates['period_id'] = value;
        } else {
          const mapping = mappings.find(m => m.dim_id === key);
          if (mapping) {
            const physicalCol = `dim${String(mapping.position).padStart(2, '0')}`;
            translatedCoordinates[physicalCol] = value;
          }
        }
      }

      let newValue: number;

      // 1. Determine if the input is a number or an AI instruction
      if (!isNaN(Number(userInput))) {
        newValue = Number(userInput);
      } else if (userInput.includes('%')) {
        const percent = parseFloat(userInput) / 100;
        newValue = oldValue * (1 + percent);
      } else {
        // 2. Call the AI Interpreter for natural language instructions
        // e.g., "Decrease by half of our last year's churn rate"
        newValue = await aiService.interpretInstruction(oldValue, userInput);
      }

      // 3. Execute the Proportional Spread in BigQuery
      await simulationService.spreadAdjustment({
        clientId,
        userId,
        datasetId,
        coordinates: translatedCoordinates, // Use translated version
        totalOldValue: oldValue,
        totalNewValue: newValue,
        comment: `Simulation: ${userInput}`
      });

      // 4. Invalidate cache so the Pivot Table refreshes with new data
      await cacheService.invalidateClientCache(clientId);

      res.status(200).json({ newValue });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const clientId = req.user!.clientId;
      const { datasetId } = req.query;
      
      const history = await simulationService.getHistory(clientId, String(datasetId));
      res.status(200).json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async undoAdjustment(req: AuthenticatedRequest, res: Response) {
    try {
      const clientId = req.user!.clientId;
      const { timestampId } = req.params;
      const { datasetId } = req.body;

      // FIX: Wrap datasetId and timestampId in String() to satisfy TypeScript
      await simulationService.undoAdjustment(
        clientId, 
        String(datasetId), 
        String(timestampId)
      );
      
      // Clear cache so the UI updates instantly
      await cacheService.invalidateClientCache(clientId);
      
      res.status(200).json({ message: 'Simulation undone successfully' });
    } catch (error: any) {
      console.error("[CONTROLLER] getHistory failed:", error); // <-- Add this!
      res.status(500).json({ error: error.message });
    }
  }
};