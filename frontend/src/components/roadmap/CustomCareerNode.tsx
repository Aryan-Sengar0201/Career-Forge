import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  CheckCircle2,
  Lock,
  PlayCircle,
  Briefcase,
  Award,
  Flag,
  Target,
  Code2
} from 'lucide-react';
import { RoadmapNodeData, NodeType } from '../../types/career';

const nodeTypeIcons: Record<NodeType, React.ElementType> = {
  skill: Code2,
  project: Briefcase,
  intermediate_role: Target,
  certification: Award,
  milestone: Flag,
  target_role: Target,
};

const nodeTypeLabels: Record<NodeType, string> = {
  skill: 'Skill',
  project: 'Project',
  intermediate_role: 'Stepping Stone',
  certification: 'Certification',
  milestone: 'Milestone',
  target_role: 'Target Destination',
};

export const CustomCareerNode = memo(({ data, selected }: NodeProps<{ data: RoadmapNodeData } & any>) => {
  const node = data as RoadmapNodeData;
  const Icon = nodeTypeIcons[node.type] || Code2;
  const isTarget = node.type === 'target_role';
  const isCompleted = node.status === 'completed';
  const isAvailable = node.status === 'available' || node.status === 'in_progress';
  const isLocked = node.status === 'locked';

  // Card border and background based on state
  let statusBadge = (
    <span className="flex items-center space-x-1 text-[10px] font-semibold text-slate-400">
      <Lock className="w-2.5 h-2.5" />
      <span>Locked</span>
    </span>
  );

  let containerClasses = "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-70";

  if (isCompleted) {
    statusBadge = (
      <span className="flex items-center space-x-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="w-3 h-3" />
        <span>Completed</span>
      </span>
    );
    containerClasses = "border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/20";
  } else if (isAvailable) {
    statusBadge = (
      <span className="flex items-center space-x-1 text-[10px] font-semibold text-brand-600 dark:text-brand-400">
        <PlayCircle className="w-3 h-3" />
        <span>Ready to Start</span>
      </span>
    );
    containerClasses = "border-brand-500 dark:border-brand-500 bg-brand-50/20 dark:bg-brand-950/30 shadow-md shadow-brand-500/10";
  }

  if (isTarget) {
    containerClasses = "border-2 border-indigo-600 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/40 dark:to-purple-950/40 shadow-lg";
  }

  return (
    <div
      className={`w-64 rounded-xl border p-3.5 transition-all cursor-pointer relative text-left font-sans select-none ${containerClasses} ${
        selected ? 'ring-2 ring-brand-500 shadow-lg' : ''
      }`}
    >
      {/* React Flow Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-slate-400 dark:!bg-slate-600 !w-2.5 !h-2.5 !border-2 !border-white dark:!border-slate-900"
      />

      {/* Header Info */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1.5">
          <div className={`p-1 rounded-md ${isCompleted ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700' : isAvailable ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {nodeTypeLabels[node.type]}
          </span>
        </div>
        {statusBadge}
      </div>

      {/* Title */}
      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
        {node.name}
      </h4>

      {/* Meta Footer */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
        <span>{node.category || 'Core'}</span>
        {node.estimatedWeeks && (
          <span className="font-medium">~{node.estimatedWeeks}w</span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-brand-500 !w-2.5 !h-2.5 !border-2 !border-white dark:!border-slate-900"
      />
    </div>
  );
});

CustomCareerNode.displayName = 'CustomCareerNode';
