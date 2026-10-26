/** Reset the existing content pane without animated scrolling or storage writes. */
export function resetActivityViewport() {
  const content = document.getElementById('np-activity-content');
  if (content) { content.scrollTop = 0; content.scrollLeft = 0; }
}
