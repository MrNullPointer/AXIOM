// Tiny helpers that warm up route chunks before the user clicks. Vite
// dedupes the dynamic imports against the lazy() calls in App.jsx, so the
// hover handler kicks off the same fetch the click would; by the time the
// user releases the mouse the chunk is usually already parsed.
//
// Each prefetcher remembers it has fired so a hovered card doesn't re-trigger.
let conceptStarted = false;
export function prefetchConceptPage() {
  if (conceptStarted) return;
  conceptStarted = true;
  import('../pages/ConceptPage.jsx');
}

let domainStarted = false;
export function prefetchDomainPage() {
  if (domainStarted) return;
  domainStarted = true;
  import('../pages/DomainPage.jsx');
}
