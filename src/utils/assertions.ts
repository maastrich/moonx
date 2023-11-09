import {
  PartialWorkspaceProjects,
  PartialWorkspaceProjectsConfig,
} from "@moonrepo/types";

export function isWorkspaceProjectsConfig(
  projects: PartialWorkspaceProjects,
): projects is PartialWorkspaceProjectsConfig {
  if (projects instanceof Array) {
    return false;
  }
  return Object.values(projects).some((v) => typeof v !== "string");
}
