export interface PhysicalQueryRequest {
    clientId: string;
    userId: string;
    datasetIds: string[];
    dimensions: string[]; // These must be physical columns (e.g., dim01, period_id)
    measures: string[];
    filters: Record<string, any>; // These must be physical columns
    includeAdjustments: boolean;
  }
  
  export const sqlBuilder = {
    buildPivotQuery(request: PhysicalQueryRequest): { query: string; params: Record<string, any> } {
      // 1. Strict Identifier Validation (Anti-SQL Injection)
      const isValidIdentifier = (str: string) => /^[a-zA-Z0-9_]+$/.test(str);
      
      if (!request.dimensions.every(isValidIdentifier)) throw new Error("Invalid dimension identifier.");
      if (!request.measures.every(isValidIdentifier)) throw new Error("Invalid measure identifier.");
  
      // 2. Select & Group By Fragments
      const selectColumns = `dataset_id, ${request.dimensions.join(', ')}`;
      const groupByColumns = `dataset_id, ${request.dimensions.join(', ')}`;
      const selectMeasures = request.measures.map(m => `SUM(${m}) AS ${m}`).join(', ');
  
      // 3. Parameters Object
      const params: Record<string, any> = {
        clientId: request.clientId,
        userId: request.userId,
        datasetIds: request.datasetIds
      };
  
      // 4. Safe Filter Generation
      let filterSql = '';
      let filterIndex = 0;
      for (const [key, value] of Object.entries(request.filters)) {
        if (!isValidIdentifier(key)) continue;
        const paramName = `filterVal${filterIndex}`;
        filterSql += ` AND ${key} = @${paramName}`;
        params[paramName] = value;
        filterIndex++;
      }
  
      // 5. The Data Source & UNION ALL Logic
      let fromClause = `\`snbx-efcpa-effectplan-vcdm.finalys_dataset.financial_data_view\``;
  
      if (request.includeAdjustments) {
        // Security Boundary: Enforces user_id or shared_flag for private simulations
        fromClause = `(
          SELECT client_id, dataset_id, period_id, amount_type_id,
                 dim01, dim02, dim03, dim04, dim05, dim06, dim07, dim08, dim09, dim10, dim11, dim12,
                 amount
          FROM \`snbx-efcpa-effectplan-vcdm.finalys_dataset.financial_data_view\`
          WHERE client_id = @clientId
          
          UNION ALL
          
          SELECT client_id, dataset_id, period_id, 'Simulated' AS amount_type_id,
                 dim01, dim02, dim03, dim04, dim05, dim06, dim07, dim08, dim09, dim10, dim11, dim12,
                 adjustment_amount AS amount
          FROM \`snbx-efcpa-effectplan-vcdm.finalys_dataset.financial_adjustments\`
          WHERE client_id = @clientId
            AND (user_id = @userId OR shared_flag = true) 
        )`;
      }
  
      // 6. Final Query Assembly
      const query = `
        SELECT 
          ${selectColumns},
          ${selectMeasures}
        FROM 
          ${fromClause}
        WHERE 
          client_id = @clientId
          AND dataset_id IN UNNEST(@datasetIds)
          ${filterSql}
        GROUP BY 
          ${groupByColumns}
      `;
  
      return { query, params };
    }
  };