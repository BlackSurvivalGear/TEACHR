/* TEACHR generation allowance presentation and client-side guidance. */
(function initialiseUsageUi() {
  const generatingTools = new Set(window.TEACHR_GENERATION_USAGE?.GENERATING_TOOL_IDS || []);

  function ensureSummary() {
    const intro = document.querySelector('#appDashboard .app-intro');
    if (!intro) return null;
    let summary = document.getElementById('appUsageSummary');
    if (!summary) {
      summary = document.createElement('p');
      summary.id = 'appUsageSummary';
      summary.className = 'app-usage-summary';
      summary.setAttribute('role', 'status');
      summary.setAttribute('aria-live', 'polite');
      intro.appendChild(summary);
    }
    return summary;
  }

  function ensureToolBadge(card) {
    let badge = card.querySelector('.app-tool-usage');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'app-tool-usage';
      card.appendChild(badge);
    }
    return badge;
  }

  function ensureBuilderStatus() {
    const header = document.querySelector('#builderPanel .builder-header > div');
    if (!header) return null;
    let status = document.getElementById('builderUsageStatus');
    if (!status) {
      status = document.createElement('p');
      status.id = 'builderUsageStatus';
      status.className = 'builder-usage-status';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      header.appendChild(status);
    }
    return status;
  }

  function renderToolCards(snapshot) {
    document.querySelectorAll('.app-tool-card[data-tool]').forEach(card => {
      const toolId = card.dataset.tool;
      if (!generatingTools.has(toolId)) return;
      const badge = ensureToolBadge(card);
      const usage = snapshot.tools?.[toolId];
      card.classList.remove('usage-exhausted', 'usage-unavailable');
      if (snapshot.status === 'loading') badge.textContent = 'Checking uses…';
      else if (snapshot.status === 'error') {
        badge.textContent = 'Uses unavailable';
        card.classList.add('usage-unavailable');
      } else if (snapshot.status === 'ready' && snapshot.unlimited) badge.textContent = 'Unlimited';
      else if (snapshot.status === 'ready' && usage) {
        badge.textContent = `${usage.remaining} of ${usage.allowance} free left`;
        card.classList.toggle('usage-exhausted', usage.remaining === 0);
      } else badge.textContent = '';
    });
  }

  function renderActiveTool(snapshot) {
    const status = ensureBuilderStatus();
    if (!status) return;
    const toolId = document.querySelector('.tool-card.active')?.dataset.tool;
    const usage = snapshot.tools?.[toolId];
    status.className = 'builder-usage-status';
    if (snapshot.status === 'loading') status.textContent = 'Checking your generation allowance…';
    else if (snapshot.status === 'error') {
      status.textContent = 'Generation allowance is temporarily unavailable.';
      status.classList.add('usage-error');
    } else if (snapshot.status === 'ready' && snapshot.unlimited) status.textContent = 'Unlimited generations with Pro TEACHR.';
    else if (snapshot.status === 'ready' && usage) {
      status.textContent = usage.remaining === 0
        ? 'No free generations remaining for this tool. Upgrade to continue.'
        : `${usage.remaining} of ${usage.allowance} free generations remaining for this tool.`;
      status.classList.toggle('usage-exhausted', usage.remaining === 0);
    } else status.textContent = '';
  }

  function render(snapshot) {
    const summary = ensureSummary();
    if (summary) {
      summary.textContent = snapshot.status === 'ready'
        ? (snapshot.unlimited ? 'Your Pro account includes unlimited generations.' : 'Your free allowance is tracked separately for each tool.')
        : snapshot.status === 'error' ? 'Generation counts are temporarily unavailable.' : 'Loading your generation allowances…';
    }
    renderToolCards(snapshot);
    renderActiveTool(snapshot);
  }

  window.addEventListener('teachr:usagechange', event => render(event.detail || {}));
  document.addEventListener('click', event => {
    if (!event.target.closest('.app-tool-card[data-tool]')) return;
    queueMicrotask(() => renderActiveTool(window.TEACHR_USAGE?.getSnapshot?.() || {}));
  });

  const style = document.createElement('style');
  style.textContent = `.app-usage-summary{margin-top:8px!important;color:#9eb2cc!important}.app-tool-usage{position:absolute;left:24px;bottom:20px;padding:5px 8px;border:1px solid rgba(92,225,161,.24);border-radius:999px;background:rgba(92,225,161,.08);color:#75e4ae;font-size:9px;font-weight:800;letter-spacing:.03em}.app-tool-card.usage-exhausted{border-color:rgba(255,180,93,.35)}.app-tool-card.usage-exhausted .app-tool-usage{border-color:rgba(255,180,93,.35);background:rgba(255,180,93,.1);color:#ffc779}.app-tool-card.usage-unavailable .app-tool-usage{border-color:var(--line);background:rgba(255,255,255,.035);color:#8195b1}.builder-usage-status{margin:10px 0 0;color:#75e4ae;font-size:11px;font-weight:700}.builder-usage-status.usage-exhausted,.builder-usage-status.usage-error{color:#ffc779}`;
  document.head.appendChild(style);
})();
