import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api.types';

export const simulationController = {
  async createSimulation(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Placeholder for saving a user simulation to BigQuery
    res.status(201).json({ message: 'Simulation created' });
  }
};