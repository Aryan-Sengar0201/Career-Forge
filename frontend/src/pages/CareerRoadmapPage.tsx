import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  Sparkles,
  Clock,
  Download,
  Share2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { CustomCareerNode } from '../components/roadmap/CustomCareerNode';
import { NodeDetailDrawer } from '../components/roadmap/NodeDetailDrawer';
import { MissionModal } from '../components/roadmap/MissionModal';
import { getLayoutedElements } from '../lib/dagreLayout';
import { api } from '../services/api';
import { CareerRoadmap, RoadmapNodeData, Mission } from '../types/career';

export const CareerRoadmapPage: React.FC = () => {
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Selected Node Drawer state
  const [selectedNode, setSelectedNode] = useState<RoadmapNodeData | null>(null);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [missionNode, setMissionNode] = useState<RoadmapNodeData | null>(null);

  // Dynamic Adaptation / Replanning state
  const [isAdapting, setIsAdapting] = useState(false);
  const [showReplanModal, setShowReplanModal] = useState(false);
  const [replanHours, setReplanHours] = useState(10);
  const [replanMonths, setReplanMonths] = useState(6);
  const [replanAdvice, setReplanAdvice] = useState<string | null>(null);

  // Share / Export state
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const nodeTypes = useMemo(() => ({
    careerNode: CustomCareerNode as any,
  }), []);

  // Convert roadmap data to React Flow nodes and edges
  const buildGraphElements = useCallback((data: CareerRoadmap): { nodes: Node[]; edges: Edge[] } => {
    if (!data.nodes || !Array.isArray(data.nodes)) return { nodes: [], edges: [] };

    const flowNodes: Node[] = data.nodes.map((node) => ({
      id: node.id,
      type: 'careerNode',
      position: { x: 0, y: 0 },
      data: node as any,
    }));

    const flowEdges: Edge[] = [];
    data.nodes.forEach((node) => {
      if (node.dependencies && Array.isArray(node.dependencies)) {
        node.dependencies.forEach((depId) => {
          flowEdges.push({
            id: `e-${depId}-${node.id}`,
            source: depId,
            target: node.id,
            type: 'smoothstep',
            animated: node.status === 'in_progress' || node.status === 'available',
            style: {
              stroke: node.status === 'completed' ? '#10b981' : node.status === 'available' ? '#4f6bf5' : '#94a3b8',
              strokeWidth: 2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: node.status === 'completed' ? '#10b981' : node.status === 'available' ? '#4f6bf5' : '#94a3b8',
              width: 16,
              height: 16,
            },
          });
        });
      }
    });

    return getLayoutedElements(flowNodes, flowEdges, 'TB');
  }, []);

  // Fetch active roadmap
  const loadRoadmap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCurrentRoadmap();
      if (res.success && res.roadmap) {
        setRoadmap(res.roadmap);
        const { nodes: lNodes, edges: lEdges } = buildGraphElements(res.roadmap);
        setNodes(lNodes);
        setEdges(lEdges);
        setReplanMonths(res.roadmap.timelineMonths || 6);
      } else {
        setError('No active roadmap found. Please complete onboarding.');
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to load roadmap.');
    } finally {
      setLoading(false);
    }
  }, [buildGraphElements, setNodes, setEdges]);

  useEffect(() => {
    loadRoadmap();
  }, [loadRoadmap]);

  // Handle clicking a node
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const nodeData = node.data as unknown as RoadmapNodeData;
    setSelectedNode(nodeData);
  }, []);

  // Handle "I Already Know This" — Prompt Section 17
  const handleAlreadyKnowThis = async (nodeId: string, nodeName: string) => {
    setIsAdapting(true);
    try {
      const res = await api.adaptCareerRoadmap({
        knownSkillId: nodeId,
        knownSkillName: nodeName,
      });

      if (res.success && res.roadmap) {
        setRoadmap(res.roadmap);
        const { nodes: lNodes, edges: lEdges } = buildGraphElements(res.roadmap);
        setNodes(lNodes);
        setEdges(lEdges);

        // Update selected node drawer if still open
        const updatedSelected = res.roadmap.nodes.find((n: RoadmapNodeData) => n.id === nodeId);
        if (updatedSelected) {
          setSelectedNode(updatedSelected);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdapting(false);
    }
  };

  // Handle Time-based Replanning — Prompt Section 18
  const handleReplanCommitment = async () => {
    setIsAdapting(true);
    try {
      if (replanHours < 8 && replanMonths <= 6) {
        setReplanAdvice(
          `Your target is ambitious for ${replanMonths} months at ${replanHours} hrs/week. CareerForge recommends ${Math.max(8, replanMonths + 3)} months based on your target role and available time.`
        );
      } else {
        setReplanAdvice(null);
      }

      const res = await api.adaptCareerRoadmap({
        updatedHoursPerWeek: replanHours,
        updatedTimelineMonths: replanMonths,
      });

      if (res.success && res.roadmap) {
        setRoadmap(res.roadmap);
        const { nodes: lNodes, edges: lEdges } = buildGraphElements(res.roadmap);
        setNodes(lNodes);
        setEdges(lEdges);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdapting(false);
    }
  };

  // Launch a mission from drawer
  const handleStartMission = (mission: Mission, node: RoadmapNodeData) => {
    setActiveMission(mission);
    setMissionNode(node);
  };

  // When a mission is completed
  const handleMissionCompleted = (missionId: string, _xpGained: number) => {
    if (!roadmap) return;
    const updatedRoadmap = { ...roadmap };
    for (const n of updatedRoadmap.nodes) {
      if (n.missions) {
        const targetM = n.missions.find(m => m.id === missionId);
        if (targetM) {
          targetM.isCompleted = true;
          if (n.missions.every(m => m.isCompleted)) {
            n.status = 'completed';
          }
          break;
        }
      }
    }
    setRoadmap(updatedRoadmap);
    const { nodes: lNodes, edges: lEdges } = buildGraphElements(updatedRoadmap);
    setNodes(lNodes);
    setEdges(lEdges);
  };

  const handleExportRoadmap = () => {
    if (!roadmap) return;
    const blob = new Blob([JSON.stringify(roadmap, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `careerforge-roadmap-${roadmap.targetRole.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShareRoadmap = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return (
      <div className="h-[75vh] flex flex-col items-center justify-center space-y-4">
        <Sparkles className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">
          Loading your reverse-engineered career roadmap...
        </p>
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Roadmap Available</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {error || 'Start by completing onboarding to reverse-engineer your dream role.'}
        </p>
        <a
          href="/onboarding"
          className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700"
        >
          Go to Onboarding
        </a>
      </div>
    );
  }

  const completedCount = roadmap.nodes.filter(n => n.status === 'completed').length;
  const totalCount = roadmap.nodes.length;
  const progressPercent = Math.round((completedCount / (totalCount || 1)) * 100);

  return (
    <div className="space-y-4 font-sans">
      {/* Top Roadmap Control Bar */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/40">
              Target Destination
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">{roadmap.timelineMonths} months timeline</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {roadmap.targetRole}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl line-clamp-1">
            {roadmap.summary}
          </p>
        </div>

        {/* Quick Stats & Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Progress pill */}
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center space-x-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white">{completedCount}/{totalCount}</span>
              <span className="text-slate-500 ml-1">Nodes ({progressPercent}%)</span>
            </div>
          </div>

          {/* Re-plan Time Button */}
          <button
            onClick={() => setShowReplanModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center space-x-1.5 transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-brand-500" />
            <span>Adjust Commitment</span>
          </button>

          {/* Export Button */}
          <button
            onClick={handleExportRoadmap}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
            title="Export Roadmap JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Share Button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
            title="Share Roadmap"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Visual Roadmap Graph Container */}
      <div className="h-[680px] w-full rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative bg-slate-50/40 dark:bg-[#090d16]/90 shadow-sm">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={1.5}
          attributionPosition="bottom-left"
        >
          <Background color="#94a3b8" gap={20} size={1} />
          <Controls className="!bg-white dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 !shadow-sm !rounded-lg" />
          <MiniMap
            nodeColor={(node: any) => {
              const nd = node.data as RoadmapNodeData;
              if (nd?.status === 'completed') return '#10b981';
              if (nd?.status === 'available') return '#4f6bf5';
              return '#cbd5e1';
            }}
            className="!bg-white dark:!bg-slate-900 !border-slate-200 dark:!border-slate-800 !rounded-lg"
          />
        </ReactFlow>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-md text-[11px] space-y-1.5 z-10 pointer-events-none">
          <div className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
            DAG Progression Key
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Completed / Known</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
            <span>Ready to Start / Current</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span>Locked (Prerequisites needed)</span>
          </div>
        </div>

        {/* Quick Hint */}
        <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-sm text-xs text-slate-500 z-10">
          💡 Click any node to open missions, projects, or say "I Already Know This"
        </div>
      </div>

      {/* Node Detail Drawer */}
      {selectedNode && (
        <NodeDetailDrawer
          node={selectedNode}
          targetRole={roadmap.targetRole}
          onClose={() => setSelectedNode(null)}
          onAlreadyKnow={handleAlreadyKnowThis}
          onStartMission={handleStartMission}
          isAdapting={isAdapting}
        />
      )}

      {/* Active Mission Runner Modal */}
      {activeMission && (
        <MissionModal
          mission={activeMission}
          node={missionNode}
          onClose={() => setActiveMission(null)}
          onCompleted={handleMissionCompleted}
        />
      )}

      {/* Time-Based Replanning Modal — Prompt Section 18 */}
      {showReplanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Clock className="w-4 h-4 text-brand-600" />
                <span>Adjust Time & Re-plan Career Path</span>
              </h3>
              <button onClick={() => setShowReplanModal(false)} className="text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Changed your schedule? Adjust your available hours or desired timeline. CareerForge AI will honestly evaluate feasibility and recalculate the optimal path.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Weekly Commitment: {replanHours} hours/week
                </label>
                <input
                  type="range"
                  min="5"
                  max="35"
                  step="5"
                  value={replanHours}
                  onChange={(e) => setReplanHours(Number(e.target.value))}
                  className="w-full accent-brand-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Target Timeline: {replanMonths} months
                </label>
                <input
                  type="range"
                  min="3"
                  max="18"
                  step="3"
                  value={replanMonths}
                  onChange={(e) => setReplanMonths(Number(e.target.value))}
                  className="w-full accent-brand-600"
                />
              </div>

              {replanAdvice && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300">
                  <strong className="block mb-0.5">Honest Career Calibration:</strong>
                  {replanAdvice}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowReplanModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleReplanCommitment();
                  setShowReplanModal(false);
                }}
                disabled={isAdapting}
                className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {isAdapting ? 'Recalculating Path...' : 'Re-plan My Career'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Share Your Career Path</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Copy this link to showcase your target roadmap and verified progress to mentors and recruiters.
            </p>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300 truncate">
              {window.location.href}
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500"
              >
                Close
              </button>
              <button
                onClick={handleShareRoadmap}
                className="px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700"
              >
                {copiedLink ? 'Copied to Clipboard!' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
