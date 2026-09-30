/**
 * Modern Web Platform View Transitions Helper
 * Uses document.startViewTransition if supported by the browser,
 * otherwise gracefully falls back to immediate execution.
 */
export function transitionView(updateCallback) {
  if (typeof document !== 'undefined' && 'startViewTransition' in document) {
    return document.startViewTransition(() => {
      updateCallback();
    });
  }
  updateCallback();
}
