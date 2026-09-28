export function createWorkspace({
  id,
  name,
  assetIds=[],
  frameIds=[],
  timelineIds=[],
  hypothesisIds=[],
  metadata={},
}={}){
  if(!id) throw new TypeError('Workspace requires id');
  if(!name) throw new TypeError('Workspace requires name');

  return Object.freeze({
    id,
    name,
    assetIds:[...new Set(assetIds)],
    frameIds:[...new Set(frameIds)],
    timelineIds:[...new Set(timelineIds)],
    hypothesisIds:[...new Set(hypothesisIds)],
    metadata:{...metadata},
  });
}
