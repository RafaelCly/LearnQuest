import type { Route, RouteProgress } from "../models/route.js";
import type { NodeDocument } from "../services/llm/types.js";
import type { Challenge } from "../schemas/challenge.schema.js";

/**
 * Contrato de persistencia. La implementación en memoria es suficiente para
 * el MVP de portafolio; cuando se conecte Supabase, se escribe una
 * SupabaseRouteRepository que implemente esta misma interfaz y solo cambia
 * un import en repositories/index.ts — controllers y services no se tocan.
 */
export interface RouteRepository {
  createRoute(route: Route): Promise<void>;
  getRoute(routeId: string): Promise<Route | null>;
  saveNodeDocument(routeId: string, nodeId: string, document: NodeDocument): Promise<void>;
  saveNodeChallenge(routeId: string, nodeId: string, challenge: Challenge): Promise<void>;
  getProgress(routeId: string): Promise<RouteProgress>;
  markNodeCompleted(routeId: string, nodeId: string): Promise<RouteProgress>;
}

export class InMemoryRouteRepository implements RouteRepository {
  private routes = new Map<string, Route>();
  private progress = new Map<string, RouteProgress>();

  async createRoute(route: Route): Promise<void> {
    this.routes.set(route.id, route);
    this.progress.set(route.id, { routeId: route.id, completedNodeIds: [] });
  }

  async getRoute(routeId: string): Promise<Route | null> {
    return this.routes.get(routeId) ?? null;
  }

  async saveNodeDocument(routeId: string, nodeId: string, document: NodeDocument): Promise<void> {
    const route = this.requireRoute(routeId);
    route.documentsByNodeId[nodeId] = document;
  }

  async saveNodeChallenge(routeId: string, nodeId: string, challenge: Challenge): Promise<void> {
    const route = this.requireRoute(routeId);
    route.challengesByNodeId[nodeId] = challenge;
  }

  async getProgress(routeId: string): Promise<RouteProgress> {
    return this.progress.get(routeId) ?? { routeId, completedNodeIds: [] };
  }

  async markNodeCompleted(routeId: string, nodeId: string): Promise<RouteProgress> {
    const current = await this.getProgress(routeId);
    if (!current.completedNodeIds.includes(nodeId)) {
      current.completedNodeIds.push(nodeId);
    }
    this.progress.set(routeId, current);
    return current;
  }

  private requireRoute(routeId: string): Route {
    const route = this.routes.get(routeId);
    if (!route) throw new NotFoundError(`Route ${routeId} no existe`);
    return route;
  }
}

export class NotFoundError extends Error {}
