(function () {
  let hasPro = false;
  let usageState = { status: 'signed-out', tools: {} };
  const form = document.getElementById('builderForm');
  const planLink = document.getElementById('planLink');
  const adminLink = document.getElementById('adminLink');

  function canGenerate(user) {
    return user?.plan === 'pro' || ['pro', 'admin', 'superadmin'].includes(user?.role);
  }

  function updateAccess(detail) {
    const signedIn = detail?.status === 'signed-in';
    hasPro = signedIn && canGenerate(detail.user);
    if (planLink) {
      planLink.hidden = !signedIn;
      planLink.textContent = hasPro ? 'Pro TEACHR' : 'Member · Upgrade';
      planLink.dataset.plan = hasPro ? 'pro' : 'free';
      planLink.href = hasPro ? '#workspace' : 'upgrade.html';
    }
    if (adminLink) adminLink.hidden = !['admin', 'superadmin'].includes(detail?.user?.role);
    document.documentElement.dataset.proAccess = hasPro ? 'true' : 'false';
  }

  function notify(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  function activeTool() {
    return document.querySelector('.tool-card.active')?.dataset.tool || 'lesson';
  }

  form?.addEventListener('submit', (event) => {
    if (hasPro) return;
    const tool = activeTool();
    const remaining = usageState.tools?.[tool]?.remaining;
    if (usageState.status === 'ready' && remaining > 0) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (usageState.status !== 'ready') {
      notify('Please wait while TEACHR checks your free generations.');
      window.TEACHR_USAGE?.refresh?.();
      return;
    }
    const returnTo = `index.html?tool=${encodeURIComponent(tool)}#workspace`;
    window.location.href = `upgrade.html?return=${encodeURIComponent(returnTo)}`;
  }, true);

  window.addEventListener('teachr:authchange', (event) => updateAccess(event.detail));
  window.addEventListener('teachr:usagechange', (event) => { usageState = event.detail || usageState; });
})();
