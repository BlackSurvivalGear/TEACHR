# VLE card visibility root cause

The VLE card existed in the legacy `index.html` tool grid, but signed-in users do not use that grid. `app-shell.js` creates a separate authenticated dashboard from `TOOL_LABELS`, and VLE was not registered there.

The fix registers VLE in the authenticated dashboard and routes its card directly to `vle.html` while leaving the six generator tools and Resource Library routing unchanged.
