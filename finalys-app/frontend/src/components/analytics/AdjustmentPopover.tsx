import React, { useState } from 'react';
import { simulationService } from '../../services/simulationService';

interface AdjustmentPopoverProps {
  cellData: {
    value: number;
    coordinates: Record<string, string>;
    datasetId: string;
  };
  authToken: string; // <--- Add this
  onSuccess: () => void;
  onClose: () => void;
}

export const AdjustmentPopover: React.FC<AdjustmentPopoverProps> = ({ cellData, authToken, onSuccess, onClose }) => {
  const oldValue = cellData.value;
  
  // Math States
  const [newValue, setNewValue] = useState<string>(String(oldValue));
  const [changeValue, setChangeValue] = useState<string>('0');
  const [changePercent, setChangePercent] = useState<string>('0');
  
  // AI States
  const [aiInstruction, setAiInstruction] = useState('');
  const [showAIConfirm, setShowAIConfirm] = useState(false); // NEW: Controls the confirmation screen
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- MATH HANDLERS ---
  const handleNewValueChange = (val: string) => {
    setNewValue(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      const diff = num - oldValue;
      setChangeValue(diff.toFixed(2));
      if (oldValue !== 0) setChangePercent(((diff / oldValue) * 100).toFixed(2));
    }
  };

  const handleChangeValueChange = (val: string) => {
    setChangeValue(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      const newTotal = oldValue + num;
      setNewValue(newTotal.toFixed(2));
      if (oldValue !== 0) setChangePercent(((num / oldValue) * 100).toFixed(2));
    }
  };

  const handleChangePercentChange = (val: string) => {
    setChangePercent(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      const diff = oldValue * (num / 100);
      setChangeValue(diff.toFixed(2));
      setNewValue((oldValue + diff).toFixed(2));
    }
  };

  // --- SUBMIT HANDLERS ---
  
  // 1. Manual Submit (Bypasses AI confirmation)
  const handleManualSubmit = async () => {
    await executeAdjustment(newValue);
  };

  // 2. AI Submit (Triggered from the confirmation screen)
  const handleAISubmit = async () => {
    await executeAdjustment(aiInstruction);
  };

  // Core execution logic
  const executeAdjustment = async (payloadInput: string) => {
    setIsSubmitting(true);
    try {
      await simulationService.processAdjustment({
        datasetId: cellData.datasetId,
        coordinates: cellData.coordinates,
        oldValue: cellData.value,
        userInput: payloadInput
      }, authToken); // <--- Pass the token here
      onSuccess(); 
    } catch (error) {
      console.error("Adjustment failed", error);
      alert("Something went wrong with the simulation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isManualPristine = newValue === String(oldValue);

  // ==========================================
  // VIEW 2: AI CONFIRMATION SCREEN
  // ==========================================
  if (showAIConfirm) {
    return (
      <div className="p-5 border border-purple-200 rounded-lg shadow-2xl bg-purple-50 w-96 font-sans">
        <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
          <span>✨</span> Confirm AI Simulation
        </h3>
        <p className="text-sm text-purple-800 mb-4">
          You are about to send the following instruction to the AI model. It will calculate the new value and proportionally spread the difference across all underlying transactions.
        </p>
        
        <div className="bg-white p-3 rounded border border-purple-100 mb-5 text-sm italic text-gray-700 shadow-inner">
          "{aiInstruction}"
        </div>

        <div className="flex justify-end gap-2">
          <button 
            onClick={() => setShowAIConfirm(false)} 
            disabled={isSubmitting}
            className="px-4 py-2 text-sm border border-purple-300 text-purple-700 rounded hover:bg-purple-100 transition-colors"
          >
            Back
          </button>
          <button 
            onClick={handleAISubmit} 
            disabled={isSubmitting}
            className="px-4 py-2 text-sm bg-purple-600 text-white font-medium rounded hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            {isSubmitting ? 'Processing...' : 'Confirm & Run AI'}
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 1: STANDARD CALCULATOR SCREEN
  // ==========================================
  return (
    <div className="p-5 border border-gray-200 rounded-lg shadow-2xl bg-white w-96 font-sans">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800">Adjust Value</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
      </div>

      <div className="text-sm text-gray-500 mb-4 bg-gray-50 p-2 rounded border border-gray-100 flex justify-between">
        <span>Current Total:</span>
        <span className="font-mono font-semibold text-gray-700">
          {new Intl.NumberFormat('en-US').format(oldValue)}
        </span>
      </div>
      
      {/* MANUAL CALCULATOR */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">New Value</label>
          <input 
            type="number" value={newValue} onChange={(e) => handleNewValueChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Change Amount (Δ)</label>
            <input 
              type="number" value={changeValue} onChange={(e) => handleChangeValueChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Change %</label>
            <input 
              type="number" value={changePercent} onChange={(e) => handleChangePercentChange(e.target.value)}
              disabled={oldValue === 0}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
            />
          </div>
        </div>
        
        <button 
          onClick={handleManualSubmit} disabled={isManualPristine || isSubmitting}
          className="w-full py-2 text-sm bg-blue-50 text-blue-600 font-medium rounded border border-blue-200 hover:bg-blue-100 disabled:opacity-50 transition-colors"
        >
          Apply Manual Change
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="h-px bg-gray-200 flex-1"></div>
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">OR AI Prompt</span>
        <div className="h-px bg-gray-200 flex-1"></div>
      </div>

      {/* AI INSTRUCTION */}
      <textarea
        className="w-full p-2 border border-gray-300 rounded mb-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
        placeholder="e.g., Increase by half of inflation..."
        value={aiInstruction}
        onChange={(e) => setAiInstruction(e.target.value)}
        rows={2}
      />
      
      <button 
        onClick={() => setShowAIConfirm(true)} 
        disabled={aiInstruction.trim() === '' || isSubmitting}
        className="w-full py-2 text-sm bg-purple-600 text-white font-medium rounded hover:bg-purple-700 disabled:bg-purple-300 transition-colors flex items-center justify-center gap-2"
      >
        <span>✨</span> Prepare AI Simulation
      </button>
    </div>
  );
};