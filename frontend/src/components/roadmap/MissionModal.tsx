import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Zap, ArrowRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Mission, RoadmapNodeData } from '../../types/career';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface MissionModalProps {
  mission: Mission | null;
  node: RoadmapNodeData | null;
  onClose: () => void;
  onCompleted: (missionId: string, xpGained: number) => void;
}

export const MissionModal: React.FC<MissionModalProps> = ({
  mission,
  node,
  onClose,
  onCompleted,
}) => {
  const { updateUserStats } = useAuth();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  if (!mission) return null;

  const quiz = mission.content?.quizQuestions?.[0];

  const handleOptionSelect = (idx: number) => {
    if (isSubmitted) return;
    setSelectedOption(idx);
  };

  const handleFinishMission = async () => {
    setIsCompleting(true);
    try {
      const res = await api.completeMission(mission.id);
      const xp = res.xpGained || mission.xp || 50;

      // Gamification confetti celebration
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });

      updateUserStats(xp);
      onCompleted(mission.id, xp);
      onClose();
    } catch (err) {
      console.error(err);
      // Fallback local complete
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
      updateUserStats(mission.xp || 50);
      onCompleted(mission.id, mission.xp || 50);
      onClose();
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
              <Zap className="w-4 h-4 fill-brand-500 text-brand-500" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {node?.name || 'Roadmap Mission'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quest Title & Details */}
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {mission.title}
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
              +{mission.xp} XP
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            {mission.description}
          </p>
        </div>

        {/* Practice Challenge / Knowledge Question */}
        {quiz ? (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {quiz.question}
            </h4>

            <div className="space-y-2">
              {quiz.options.map((opt, i) => {
                const isChosen = selectedOption === i;
                const isCorrect = quiz.correctAnswer === i;

                let optClass = "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300";
                if (isSubmitted) {
                  if (isCorrect) {
                    optClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200";
                  } else if (isChosen && !isCorrect) {
                    optClass = "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200";
                  }
                } else if (isChosen) {
                  optClass = "border-brand-600 bg-brand-50/40 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300";
                }

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleOptionSelect(i)}
                    className={`w-full p-3 rounded-lg border text-left text-xs font-medium transition-colors flex items-center justify-between ${optClass}`}
                  >
                    <span>{opt}</span>
                    {isSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {isSubmitted && isChosen && !isCorrect && <AlertCircle className="w-4 h-4 text-red-500" />}
                  </button>
                );
              })}
            </div>

            {isSubmitted && (
              <div className="p-3 rounded-lg bg-white dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                <strong className="block text-slate-800 dark:text-slate-200 mb-0.5">Explanation:</strong>
                {quiz.explanation}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <strong className="block text-slate-900 dark:text-white mb-1">Execution Checklist:</strong>
            {mission.content?.instructions || "Review the official documentation, implement the test suite, and verify against production constraints."}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            Cancel
          </button>

          {quiz && !isSubmitted ? (
            <button
              onClick={() => setIsSubmitted(true)}
              disabled={selectedOption === null}
              className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              Check Answer
            </button>
          ) : (
            <button
              onClick={handleFinishMission}
              disabled={isCompleting}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isCompleting ? 'Claiming XP...' : 'Complete Mission & Claim XP'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
