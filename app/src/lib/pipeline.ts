import { Stage, STAGES } from "../types";

export const STAGE_VERB: Record<Stage, string> = {
  idea: "Shape",
  research: "Research",
  script: "Script",
  record: "Record",
  edit: "Edit",
  thumbnail: "Thumbnail",
  seo: "SEO",
  scheduled: "Finalize",
  published: "Review",
  analytics: "Analyze",
};

export function stageIndex(stage: Stage): number {
  return STAGES.indexOf(stage);
}

export function nextStage(stage: Stage): Stage | null {
  const i = stageIndex(stage);
  return i < STAGES.length - 1 ? STAGES[i + 1] : null;
}

export function prevStage(stage: Stage): Stage | null {
  const i = stageIndex(stage);
  return i > 0 ? STAGES[i - 1] : null;
}

export const PRODUCTION_STAGES: Stage[] = ["research", "script", "record", "edit", "thumbnail", "seo"];
export const ACTIVE_STAGES: Stage[] = [...PRODUCTION_STAGES, "idea", "scheduled"];
