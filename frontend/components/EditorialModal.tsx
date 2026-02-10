import React, { useState } from 'react';
import { BookOpen, Target, Code2, TrendingUp, Lightbulb, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Editorial {
  summary: string;
  approach: string;
  optimalSolution: string;
  timeComplexity: string;
  spaceComplexity: string;
  keyTakeaways: string[];
  commonMistakes: string[];
}

interface PlayerCode {
  code: string;
  language: string;
}

interface AIImprovement {
  player1?: string[];
  player2?: string[];
}

interface EditorialModalProps {
  editorial: Editorial;
  playerNames?: {
    player1?: string;
    player2?: string;
  };
  playerCodes?: {
    player1?: PlayerCode;
    player2?: PlayerCode;
  };
  aiImprovements?: AIImprovement;
  winner?: string;
  onClose: () => void;
}

const EditorialModal: React.FC<EditorialModalProps> = ({
  editorial,
  playerNames,
  playerCodes,
  aiImprovements,
  winner,
  onClose
}) => {
  const [selectedCode, setSelectedCode] = useState<'player1' | 'player2' | 'both'>('both');

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#282828] border border-gray-700 rounded-lg max-w-4xl w-full my-8 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-bold text-white">Post-Match Editorial</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* AI-Generated Improvements */}
          {aiImprovements && playerNames && (
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />
                AI Code Analysis & Improvements
              </h3>
              
              <div className={`grid grid-cols-1 ${playerNames.player2 && aiImprovements.player2 ? 'md:grid-cols-2' : ''} gap-4`}>
                {/* Player 1 Improvements */}
                {aiImprovements.player1 && aiImprovements.player1.length > 0 && (
                  <div className={`bg-[#282828] rounded-lg p-4 border-2 ${
                    winner === playerNames.player1 ? 'border-yellow-500' : 'border-gray-700'
                  }`}>
                    <div className="flex items-center mb-3">
                      <span className="font-semibold text-white flex items-center">
                        {playerNames.player1}
                        {winner === playerNames.player1 && (
                          <span className="ml-2 text-yellow-400">🏆</span>
                        )}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {aiImprovements.player1.map((improvement, idx) => (
                        <div key={idx} className="flex items-start text-sm">
                          <span className="text-cyan-400 mr-2 mt-0.5">→</span>
                          <span className="text-gray-300">{improvement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Player 2 Improvements */}
                {playerNames.player2 && aiImprovements.player2 && aiImprovements.player2.length > 0 && (
                  <div className={`bg-[#282828] rounded-lg p-4 border-2 ${
                    winner === playerNames.player2 ? 'border-yellow-500' : 'border-gray-700'
                  }`}>
                    <div className="flex items-center mb-3">
                      <span className="font-semibold text-white flex items-center">
                        {playerNames.player2}
                        {winner === playerNames.player2 && (
                          <span className="ml-2 text-yellow-400">🏆</span>
                        )}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {aiImprovements.player2.map((improvement, idx) => (
                        <div key={idx} className="flex items-start text-sm">
                          <span className="text-cyan-400 mr-2 mt-0.5">→</span>
                          <span className="text-gray-300">{improvement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Code Comparison Section */}
          {playerCodes && (playerCodes.player1 || playerCodes.player2) && playerNames && (
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Code2 className="w-5 h-5 mr-2" />
                Code Comparison
              </h3>
              
              {/* Toggle buttons for code view */}
              {playerNames.player2 && playerCodes.player1 && playerCodes.player2 && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setSelectedCode('player1')}
                    className={`px-4 py-2 rounded transition-colors ${
                      selectedCode === 'player1'
                        ? 'bg-cyan-600 text-white'
                        : 'bg-[#282828] text-gray-400 hover:bg-[#333333]'
                    }`}
                  >
                    {playerNames.player1}'s Code
                  </button>
                  <button
                    onClick={() => setSelectedCode('player2')}
                    className={`px-4 py-2 rounded transition-colors ${
                      selectedCode === 'player2'
                        ? 'bg-cyan-600 text-white'
                        : 'bg-[#282828] text-gray-400 hover:bg-[#333333]'
                    }`}
                  >
                    {playerNames.player2}'s Code
                  </button>
                  <button
                    onClick={() => setSelectedCode('both')}
                    className={`px-4 py-2 rounded transition-colors ${
                      selectedCode === 'both'
                        ? 'bg-cyan-600 text-white'
                        : 'bg-[#282828] text-gray-400 hover:bg-[#333333]'
                    }`}
                  >
                    Side by Side
                  </button>
                </div>
              )}

              {/* Code Display */}
              <div className={`grid ${selectedCode === 'both' && playerCodes.player1 && playerCodes.player2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-4`}>
                {/* Player 1 Code */}
                {(selectedCode === 'player1' || selectedCode === 'both') && playerCodes.player1 && (
                  <div className="bg-[#282828] rounded-lg overflow-hidden border border-gray-700">
                    <div className="bg-[#1a1a1a] px-4 py-2 border-b border-gray-700 flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">
                        {playerNames.player1}
                        {winner === playerNames.player1 && <span className="ml-2 text-yellow-400">🏆</span>}
                      </span>
                      <span className="text-xs text-gray-400 uppercase">{playerCodes.player1.language}</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <pre className="bg-[#0d1117] text-gray-300 p-4 text-sm">
                        <code>{playerCodes.player1.code}</code>
                      </pre>
                    </div>
                  </div>
                )}

                {/* Player 2 Code */}
                {(selectedCode === 'player2' || selectedCode === 'both') && playerCodes.player2 && (
                  <div className="bg-[#282828] rounded-lg overflow-hidden border border-gray-700">
                    <div className="bg-[#1a1a1a] px-4 py-2 border-b border-gray-700 flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">
                        {playerNames.player2}
                        {winner === playerNames.player2 && <span className="ml-2 text-yellow-400">🏆</span>}
                      </span>
                      <span className="text-xs text-gray-400 uppercase">{playerCodes.player2.language}</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <pre className="bg-[#0d1117] text-gray-300 p-4 text-sm">
                        <code>{playerCodes.player2.code}</code>
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Problem Summary */}
          {editorial.summary && (
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Problem Summary
              </h3>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{editorial.summary}</p>
            </div>
          )}

          {/* Optimal Approach */}
          {editorial.approach && (
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Optimal Approach
              </h3>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{editorial.approach}</p>
            </div>
          )}

          {/* Complexity Analysis */}
          {(editorial.timeComplexity || editorial.spaceComplexity) && (
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                <Code2 className="w-5 h-5 mr-2" />
                Complexity Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editorial.timeComplexity && (
                  <div className="bg-[#282828] rounded p-4">
                    <div className="text-sm text-gray-400 mb-1">Time Complexity</div>
                    <div className="text-lg font-mono text-cyan-400">{editorial.timeComplexity}</div>
                  </div>
                )}
                {editorial.spaceComplexity && (
                  <div className="bg-[#282828] rounded p-4">
                    <div className="text-sm text-gray-400 mb-1">Space Complexity</div>
                    <div className="text-lg font-mono text-cyan-400">{editorial.spaceComplexity}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Key Takeaways */}
          {editorial.keyTakeaways && editorial.keyTakeaways.length > 0 && (
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />
                Key Takeaways
              </h3>
              <ul className="space-y-2">
                {editorial.keyTakeaways.map((takeaway, index) => (
                  <li key={index} className="flex items-start text-gray-300">
                    <CheckCircle2 className="w-5 h-5 mr-2 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Common Mistakes */}
          {editorial.commonMistakes && editorial.commonMistakes.length > 0 && (
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-red-400" />
                Common Mistakes to Avoid
              </h3>
              <ul className="space-y-2">
                {editorial.commonMistakes.map((mistake, index) => (
                  <li key={index} className="flex items-start text-gray-300">
                    <span className="text-red-400 mr-2 flex-shrink-0">⚠</span>
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Optimal Solution */}
          {editorial.optimalSolution && (
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                <Code2 className="w-5 h-5 mr-2" />
                Reference Solution
              </h3>
              <pre className="bg-[#0d1117] text-gray-300 p-4 rounded overflow-x-auto text-sm">
                <code>{editorial.optimalSolution}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#1a1a1a] p-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorialModal;
