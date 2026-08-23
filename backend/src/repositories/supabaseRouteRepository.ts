import type { SupabaseClient } from "@supabase/supabase-js";
import type { Route, RouteProgress } from "../models/route.js";
import type { NodeDocument } from "../services/llm/types.js";
import type { Challenge } from "../schemas/challenge.schema.js";
import type { RouteRepository } from "./routeRepository.js";
import { NotFoundError } from "./routeRepository.js";

interface RouteRow {
  id: string;
  topic: string;
  title: string;
  description: string;
  nodes: Route["curriculum"]["nodes"];
  videos: Route["videosByNodeId"];
  documents: Route["documentsByNodeId"];
  challenges: Route["challengesByNodeId"];
  created_at: string;
}

interface ProgressRow {
  route_id: string;
  completed_node_ids: string[];
}

export class SupabaseRouteRepository implements RouteRepository {
  constructor(private readonly client: SupabaseClient) {}

  async createRoute(route: Route): Promise<void> {
    const { error: routeError } = await this.client.from("routes").insert({
      id: route.id,
      topic: route.curriculum.topic,
      title: route.curriculum.title,
      description: route.curriculum.description,
      nodes: route.curriculum.nodes,
      videos: route.videosByNodeId,
      documents: route.documentsByNodeId,
      challenges: route.challengesByNodeId,
    });
    if (routeError) throw routeError;

    const { error: progressError } = await this.client
      .from("route_progress")
      .insert({ route_id: route.id, completed_node_ids: [] });
    if (progressError) throw progressError;
  }

  async getRoute(routeId: string): Promise<Route | null> {
    const { data, error } = await this.client.from("routes").select("*").eq("id", routeId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return rowToRoute(data as RouteRow);
  }

  async saveNodeDocument(routeId: string, nodeId: string, document: NodeDocument): Promise<void> {
    const route = await this.requireRoute(routeId);
    const documents = { ...route.documentsByNodeId, [nodeId]: document };
    const { error } = await this.client.from("routes").update({ documents }).eq("id", routeId);
    if (error) throw error;
  }

  async saveNodeChallenge(routeId: string, nodeId: string, challenge: Challenge): Promise<void> {
    const route = await this.requireRoute(routeId);
    const challenges = { ...route.challengesByNodeId, [nodeId]: challenge };
    const { error } = await this.client.from("routes").update({ challenges }).eq("id", routeId);
    if (error) throw error;
  }

  async getProgress(routeId: string): Promise<RouteProgress> {
    const { data, error } = await this.client
      .from("route_progress")
      .select("*")
      .eq("route_id", routeId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { routeId, completedNodeIds: [] };
    const row = data as ProgressRow;
    return { routeId: row.route_id, completedNodeIds: row.completed_node_ids };
  }

  async markNodeCompleted(routeId: string, nodeId: string): Promise<RouteProgress> {
    const current = await this.getProgress(routeId);
    if (current.completedNodeIds.includes(nodeId)) return current;

    const completedNodeIds = [...current.completedNodeIds, nodeId];
    const { error } = await this.client
      .from("route_progress")
      .update({ completed_node_ids: completedNodeIds, updated_at: new Date().toISOString() })
      .eq("route_id", routeId);
    if (error) throw error;

    return { routeId, completedNodeIds };
  }

  private async requireRoute(routeId: string): Promise<Route> {
    const route = await this.getRoute(routeId);
    if (!route) throw new NotFoundError(`Route ${routeId} no existe`);
    return route;
  }
}

function rowToRoute(row: RouteRow): Route {
  return {
    id: row.id,
    curriculum: { topic: row.topic, title: row.title, description: row.description, nodes: row.nodes },
    videosByNodeId: row.videos,
    documentsByNodeId: row.documents,
    challengesByNodeId: row.challenges,
    createdAt: row.created_at,
  };
}
