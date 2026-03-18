// /api/src/services/templateService.ts
import { BigQuery } from '@google-cloud/bigquery';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const BQ_PROJECT = 'snbx-efcpa-effectplan-vcdm';
const DATASET = 'finalys_dataset';
const bqClient = new BigQuery({ projectId: BQ_PROJECT });

export const templateService = {
  async saveTemplate(params: {
    clientId: string;
    userId: string;
    templateName: string;
    description?: string;
    isDefault?: boolean;
    rowDimensions: string[];
    colDimensions: string[];
    measures: string[];
    filters: Record<string, any>;
  }) {
    const templateId = crypto.randomUUID();
    
    // We use PARSE_JSON to safely insert JavaScript arrays/objects into BigQuery JSON columns
    const query = `
      INSERT INTO \`${BQ_PROJECT}.${DATASET}.report_templates\`
      (client_id, template_id, template_name, description, created_by, is_default, row_dimensions, col_dimensions, measures, filters)
      VALUES
      (@clientId, @templateId, @templateName, @description, @userId, @isDefault, 
       PARSE_JSON(@rowDims), PARSE_JSON(@colDims), PARSE_JSON(@measures), PARSE_JSON(@filters))
    `;

    await bqClient.query({
      query,
      params: {
        clientId: params.clientId,
        templateId,
        templateName: params.templateName,
        description: params.description || '',
        userId: params.userId,
        isDefault: params.isDefault || false,
        rowDims: JSON.stringify(params.rowDimensions),
        colDims: JSON.stringify(params.colDimensions),
        measures: JSON.stringify(params.measures),
        filters: JSON.stringify(params.filters || {})
      }
    });

    logger.info(`Template '${params.templateName}' saved for client ${params.clientId}`);
    return templateId;
  },

  // Add this inside the templateService object!
  async getTemplate(clientId: string, templateId: string) {
    const query = `
      SELECT 
        template_id as id,
        template_name as name,
        TO_JSON_STRING(row_dimensions) as rowDimensions,
        TO_JSON_STRING(col_dimensions) as colDimensions,
        TO_JSON_STRING(measures) as measures,
        TO_JSON_STRING(filters) as filters
      FROM \`${BQ_PROJECT}.${DATASET}.report_templates\`
      WHERE client_id = @clientId AND template_id = @templateId
      LIMIT 1
    `;

    const [rows] = await bqClient.query({
      query,
      params: { clientId, templateId }
    });

    if (!rows || rows.length === 0) return null;

    const row = rows[0];
    const rowDims = JSON.parse(row.rowDimensions || '[]');
    const colDims = JSON.parse(row.colDimensions || '[]');
    const measures = JSON.parse(row.measures || '[]');
    const filters = JSON.parse(row.filters || '{}');

    // Return the format that your pivotController's security guardrail expects
    return {
      id: row.id,
      name: row.name,
      allowedDimensions: [...rowDims, ...colDims],
      allowedMeasures: measures,
      mandatoryFilters: filters
    };
  },

  async getTemplates(clientId: string) {
    // We use TO_JSON_STRING so Node.js can easily parse the BigQuery JSON back into arrays
    const query = `
      SELECT 
        template_id as id,
        template_name as name,
        description,
        is_default as isDefault,
        TO_JSON_STRING(row_dimensions) as rowDimensions,
        TO_JSON_STRING(col_dimensions) as colDimensions,
        TO_JSON_STRING(measures) as measures,
        TO_JSON_STRING(filters) as filters
      FROM \`${BQ_PROJECT}.${DATASET}.report_templates\`
      WHERE client_id = @clientId
      ORDER BY created_at DESC
    `;

    const [rows] = await bqClient.query({
      query,
      params: { clientId }
    });

    return rows.map(row => ({
      ...row,
      rowDimensions: JSON.parse(row.rowDimensions),
      colDimensions: JSON.parse(row.colDimensions),
      measures: JSON.parse(row.measures),
      filters: JSON.parse(row.filters)
    }));
  },

  async deleteTemplate(clientId: string, templateId: string) {
    const query = `
      DELETE FROM \`${BQ_PROJECT}.${DATASET}.report_templates\`
      WHERE client_id = @clientId AND template_id = @templateId
    `;

    await bqClient.query({
      query,
      params: { clientId, templateId }
    });

    logger.info(`Template '${templateId}' deleted for client ${clientId}`);
  }
};

