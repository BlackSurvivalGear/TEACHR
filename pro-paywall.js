(function () {
  let hasPro = false;
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

  form?.addEventListener('submit', (event) => {
    if (hasPro) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const tool = document.querySelector('.tool-card.active')?.dataset.tool || 'lesson';
    const returnTo = `index.html?tool=${encodeURIComponent(tool)}#workspace`;
    window.location.href = `upgrade.html?return=${encodeURIComponent(returnTo)}`;
  }, true);

  window.addEventListener('teachr:authchange', (event) => updateAccess(event.detail));
})();
