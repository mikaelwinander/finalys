import { bigqueryRepository } from '../repositories/bigqueryRepository';

// In a real application, you would query your Azure SQL metadata to validate these,
// but for safety, we enforce regex validation on dynamic column names.
const isValidIdentifier = (name: string) => /^[a-zA-Z0-9_]+$/.test(name);

export interface PivotQueryRequest {
  tenantId: string;
  userId: string;
  datasetId: string; // Maps to "Versions" in your domain
  dimensions: string[]; // Maps to "Dimension types"
  measures: string[]; // E.g., ['amount']
}

export const bigqueryService = {
  /**
   * Constructs and executes a safe, multi-tenant Pivot aggregation query.
   */
  async getPivotAggregation<T>(request: PivotQueryRequest): Promise<T[]> {
    const { tenantId, datasetId, dimensions, measures } = request;

    // 1. Security: Validate dynamic identifiers to prevent SQL injection
    if (!dimensions.every(isValidIdentifier) || !measures.every(isValidIdentifier)) {
      throw new Error('Invalid dimension or measure identifier format');
    }

    // 2. Build the SELECT clause dynamically based on requested dimensions
    const selectColumns = dimensions.join(', ');
    
    // 3. Build the aggregation measures (e.g., SUM(amount) as amount)
    const selectMeasures = measures
      .map((measure) => `SUM(${measure}) AS ${measure}`)
      .join(', ');

    // 4. Build the GROUP BY clause based on dimensions
    const groupByColumns = dimensions.join(', ');

    // 5. Construct the parameterized query enforcing tenant isolation
    // The dataset table name would typically be resolved from a configuration or metadata lookup.
    // Here we use a hypothetical combined dataset view.
    const query = `
      SELECT 
        ${selectColumns},
        ${selectMeasures}
      FROM 
        \`snbx-efcpa-effectplan-vcdm.finalys_dataset.financial_data_view\`
      WHERE 
        tenant_id = @tenantId
        AND dataset_id = @datasetId
      GROUP BY 
        ${groupByColumns}
    `;

    // 6. Define the secure parameters
    const params = {
      tenantId: tenantId,
      datasetId: datasetId
    };

    // 7. Execute via the repository
    return await bigqueryRepository.executeQuery<T>(query, params);
  }
};