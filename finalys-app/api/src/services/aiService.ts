import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from '../utils/logger';

// Initialize the Gemini SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const aiService = {
  /**
   * Interprets natural language instructions into a target numeric value.
   */
  async interpretInstruction(oldValue: number, instruction: string): Promise<number> {
    try {
      const prompt = `
        You are a financial math engine. 
        Current Cell Value: ${oldValue}
        User Instruction: "${instruction}"

        TASK: Calculate the new total value based on the instruction.
        - If the user says "increase by 10%", calculate ${oldValue} * 1.1.
        - If the user says "set to 5000", the answer is 5000.
        - Handle complex logic like "reduce by a quarter" or "double it".

        OUTPUT: Return ONLY the final numeric result. Do not include currency symbols, commas, or explanations.
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      
      // Clean the response (remove any non-numeric characters just in case)
      const cleanValue = parseFloat(responseText.replace(/[^0-9.]/g, ''));

      if (isNaN(cleanValue)) {
        throw new Error("AI could not determine a numeric value from the instruction.");
      }

      logger.info(`AI Interpreted "${instruction}" for value ${oldValue} as ${cleanValue}`);
      return cleanValue;
    } catch (error) {
      logger.error('AI Interpretation failed', { error });
      throw new Error("Failed to process AI simulation instruction.");
    }
  }
};