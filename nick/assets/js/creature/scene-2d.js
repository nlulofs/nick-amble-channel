/* SVG output uses the same appearance and wardrobe records as the 3D view. */
(() => {
  'use strict';
  function render(agent,coat,layers,lift=1,legacyArtwork='') {
    const body=window.CreatureFlatBodies.build(agent.shape,coat,agent.pattern,agent.pose,lift,agent.seed);
    const escape=window.CreatureWardrobe.escape;
    const aura=agent.aura==='off'?'':`<circle cx="160" cy="177" r="${agent.aura==='quiet'?104:124}" fill="${coat.accent}" opacity=".12"/><circle cx="160" cy="177" r="${agent.aura==='quiet'?104:124}" fill="none" stroke="${coat.accent}" opacity=".4" stroke-dasharray="2 7"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${body.viewBox}" role="img" aria-label="${escape(agent.shape+' wearing '+layers.map(t=>t.word).join(' and '))}"><title>${escape(agent.shape+' · '+layers.map(t=>t.word).join(' / '))}</title>${aura}${body.markup}${legacyArtwork}${window.CreatureWardrobe.flat(layers,body.anchor,coat)}</svg>`;
  }
  window.CreatureFlat={render};
})();
