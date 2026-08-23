import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import {
  GenerateRouteBodySchema,
  SubmitChallengeBodySchema,
  postGenerateRoute,
  getRoute,
  getNodeDocument,
  getNodeChallenge,
  postSubmitChallenge,
  getProgress,
} from "../controllers/routes.controller.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => res.json({ status: "ok" }));

apiRouter.post("/routes", validateBody(GenerateRouteBodySchema), postGenerateRoute);
apiRouter.get("/routes/:routeId", getRoute);
apiRouter.get("/routes/:routeId/progress", getProgress);

apiRouter.get("/routes/:routeId/nodes/:nodeId/document", getNodeDocument);
apiRouter.get("/routes/:routeId/nodes/:nodeId/challenge", getNodeChallenge);
apiRouter.post(
  "/routes/:routeId/nodes/:nodeId/challenge/submit",
  validateBody(SubmitChallengeBodySchema),
  postSubmitChallenge
);
