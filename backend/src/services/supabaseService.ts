import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { storeService } from './storeService.js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || url.includes('placeholder') || key.includes('placeholder')) {
    return null;
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err) {
      console.warn('[Supabase Init Warning]:', (err as Error).message);
      return null;
    }
  }

  return supabaseClient;
}

export const dbService = {
  async getProfile(userId: string) {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('[Supabase getProfile Error]:', (err as Error).message);
      }
    }
    // Fallback store
    const local = storeService.getUser(userId);
    return local ? local.profile : null;
  },

  async saveRoadmap(userId: string, roadmap: any) {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('career_roadmaps')
          .upsert({
            id: roadmap.id,
            user_id: userId,
            target_role: roadmap.targetRole,
            summary: roadmap.summary,
            timeline_months: roadmap.timelineMonths,
            total_skills: roadmap.totalSkills || roadmap.nodes?.length || 0,
            completed_skills: roadmap.completedSkills || 0,
            phases: roadmap.phases,
            roles: roadmap.roles,
            certifications: roadmap.certifications,
            projects: roadmap.projects,
            milestones: roadmap.milestones,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .select();
        if (!error) {
          // Also persist nodes
          if (roadmap.nodes && Array.isArray(roadmap.nodes)) {
            for (const node of roadmap.nodes) {
              await sb.from('roadmap_nodes').upsert({
                id: node.id,
                roadmap_id: roadmap.id,
                user_id: userId,
                title: node.name,
                type: node.type,
                category: node.category,
                level: node.level,
                estimated_weeks: node.estimatedWeeks,
                why_it_matters: node.whyItMatters,
                status: node.status,
                dependencies: node.dependencies,
                resources: node.resources,
                interview_questions: node.interviewQuestions,
                project_details: node.project,
                missions: node.missions,
              });
            }
          }
        }
      } catch (err) {
        console.warn('[Supabase saveRoadmap Error]:', (err as Error).message);
      }
    }

    // Always mirror to reliable storeService
    storeService.saveRoadmap(userId, roadmap);
    return roadmap;
  },

  async getActiveRoadmap(userId: string) {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('career_roadmaps')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          // Fetch its nodes
          const { data: nodesData } = await sb
            .from('roadmap_nodes')
            .select('*')
            .eq('roadmap_id', data.id);

          const formattedNodes = (nodesData || []).map((n: any) => ({
            id: n.id,
            name: n.title,
            type: n.type,
            category: n.category,
            level: n.level,
            estimatedWeeks: n.estimated_weeks,
            whyItMatters: n.why_it_matters,
            status: n.status,
            dependencies: n.dependencies || [],
            resources: n.resources || [],
            interviewQuestions: n.interview_questions || [],
            project: n.project_details,
            missions: n.missions || [],
          }));

          return {
            id: data.id,
            userId: data.user_id,
            targetRole: data.target_role,
            summary: data.summary,
            timelineMonths: data.timeline_months,
            totalSkills: data.total_skills,
            completedSkills: data.completed_skills,
            phases: data.phases,
            roles: data.roles,
            certifications: data.certifications,
            projects: data.projects,
            milestones: data.milestones,
            nodes: formattedNodes.length > 0 ? formattedNodes : (data.phases?.[0]?.nodeIds || []),
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch (err) {
        console.warn('[Supabase getActiveRoadmap Error]:', (err as Error).message);
      }
    }

    return storeService.getActiveRoadmap(userId);
  },

  async updateNodeStatus(userId: string, roadmapId: string, nodeId: string, status: string) {
    const sb = getSupabase();
    if (sb) {
      try {
        await sb
          .from('roadmap_nodes')
          .update({ status, updated_at: new Date().toISOString() })
          .match({ roadmap_id: roadmapId, id: nodeId, user_id: userId });
      } catch (err) {
        console.warn('[Supabase updateNodeStatus Error]:', (err as Error).message);
      }
    }
    return storeService.updateNodeStatus(userId, roadmapId, nodeId, status);
  },

  async completeMission(userId: string, missionId: string) {
    return storeService.completeMission(userId, missionId);
  },

  async getCareerReadiness(userId: string) {
    return storeService.calculateReadiness(userId);
  }
};
