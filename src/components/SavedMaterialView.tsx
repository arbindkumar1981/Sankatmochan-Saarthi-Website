import React from 'react';
import type { SavedMaterial } from '../services/savedMaterials';
import { readTeacherArtifact, teacherArtifactText } from '../services/teacherArtifact';

export function SavedMaterialView({ material }: { material: SavedMaterial }) {
  const artifact = readTeacherArtifact(material.body);
  return <article>
    <h3 className="text-xl font-bold">{material.title}</h3>
    <p className="text-sm text-stone-500 mb-4">{material.curriculum}</p>
    {!material.contentId && <div className="whitespace-pre-wrap break-words leading-relaxed">{artifact ? teacherArtifactText(artifact) : material.body}</div>}
    {artifact && <aside className="mt-4 text-sm">
      <p>Personal study copy · {artifact.asset_type.replaceAll('_', ' ')}</p>
      <p>Sources recorded at generation:</p>
      <ul>{artifact.provenance.map((source, index) => <li key={index}>{source.source}</li>)}</ul>
    </aside>}
  </article>;
}
