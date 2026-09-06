/* TEACHR PR #34 — authenticated application shell and dashboard. */
(function initTeachrApplicationShell() {
  const TOOL_LABELS = {
    lesson: ['Lesson Builder', 'Build a complete lesson from a short brief.'],
    worksheet: ['Worksheet Generator', 'Create structured student practice and answers.'],
    quiz: ['Assessment Generator', 'Create quizzes, tests and answer keys.'],
    differentiate: ['Differentiation Engine', 'Turn one activity into support, core and stretch.'],
    curriculum: ['Curriculum Planner', 'Map topics into units, weeks and lessons.'],
    revision: ['Revision Pack', 'Build revision guides, flashcards and exam practice.'],
    parent: ['Parent Message', 'Draft clear, professional parent communication.'],
    library: ['Resource Library', 'Search, reuse and organise your teaching materials.']
  };
  const TOOL_ICONS = { lesson: '✦', worksheet: '▤', quiz: '?', differentiate: '◈', curriculum: '▦', revision: '◆', parent: '✉', library: '▣' };
  const TOOL_CLASSES = { lesson: 'blue', worksheet: 'purple', quiz: 'cyan', differentiate: 'violet', curriculum: 'green', revision: 'orange', parent: 'pink', library: 'teal' };
  let publicNav = null;

  function createShell() {
    if (document.getElementById('teachrApp')) return document.getElementById('teachrApp');
    const root = document.createElement('section');
    root.id = 'teachrApp';
    root.className = 'teachr-app';
    root.innerHTML = `
      <div class="teachr-app-head">
        <div>
          <p class="eyebrow"><span class="pulse"></span> TEACHR · TEACHER WORKSPACE</p>
          <h1 id="appWelcome">Welcome back.</h1>
          <p id="appGreeting">Your teaching workspace is ready.</p>
        </div>
        <button class="app-home-button" id="appHomeButton" type="button">Dashboard</button>
      </div>
      <div class="app-view" id="appDashboard">
        <div class="app-intro"><h2>What would you like to create?</h2><p>Choose a tool to start. Each tool has its own focused workspace.</p></div>
        <div class="app-tool-grid" id="appToolGrid"></div>
      </div>
      <div class="app-view" id="appToolView" hidden>
        <div class="app-breadcrumb"><button id="backToTools" type="button">← All tools</button><span id="appToolName"></span></div>
        <div id="appToolMount"></div>
      </div>`;
    document.querySelector('main').prepend(root);

    const grid = root.querySelector('#appToolGrid');
    Object.entries(TOOL_LABELS).forEach(([key, [toolTitle, description]]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'app-tool-card';
      button.dataset.tool = key;
      button.innerHTML = `<span class="app-tool-icon ${TOOL_CLASSES[key]}">${TOOL_ICONS[key]}</span><strong>${toolTitle}</strong><small>${description}</small><span class="app-tool-arrow">→</span>`;
      button.addEventListener('click', () => openTool(key));
      grid.appendChild(button);
    });
    root.querySelector('#appHomeButton').addEventListener('click', showDashboard);
    root.querySelector('#backToTools').addEventListener('click', showDashboard);
    return root;
  }

  function setApplicationNavigation(signedIn) {
    const nav = document.querySelector('.topnav');
    const brand = document.querySelector('.brand');
    if (!nav) return;
    if (!publicNav) publicNav = nav.innerHTML;
    if (signedIn) {
      nav.innerHTML = '<a href="#app-dashboard" id="appNavDashboard">Dashboard</a><a href="#app-library" id="appNavLibrary">Library</a>';
      document.getElementById('appNavDashboard')?.addEventListener('click', event => { event.preventDefault(); showDashboard(); });
      document.getElementById('appNavLibrary')?.addEventListener('click', event => { event.preventDefault(); openTool('library'); });
      brand?.setAttribute('href', '#app-dashboard');
      brand?.addEventListener('click', handleBrandClick);
    } else {
      nav.innerHTML = publicNav;
      brand?.setAttribute('href', '#home');
      brand?.removeEventListener('click', handleBrandClick);
    }
  }

  function handleBrandClick(event) {
    if (document.documentElement.dataset.auth === 'signed-in') {
      event.preventDefault();
      showDashboard();
    }
  }

  function moveApplicationContent() {
    const root = createShell();
    const mount = document.getElementById('appToolMount');
    const builder = document.getElementById('builderPanel');
    const library = document.getElementById('library');
    if (builder && builder.parentElement !== mount) mount.appendChild(builder);
    if (library && library.parentElement !== mount) mount.appendChild(library);
    document.querySelectorAll('main > section:not(#teachrApp)').forEach(section => section.classList.add('public-section-hidden'));
    document.querySelector('footer')?.classList.add('public-section-hidden');
    root.hidden = false;
    setApplicationNavigation(true);
    updateGreeting();
  }

  function restorePublicContent() {
    const root = document.getElementById('teachrApp');
    if (root) root.hidden = true;
    document.querySelectorAll('.public-section-hidden').forEach(section => section.classList.remove('public-section-hidden'));
    const main = document.querySelector('main');
    const workspace = document.getElementById('workspace');
    const library = document.getElementById('library');
    const builder = document.getElementById('builderPanel');
    if (workspace && builder && builder.parentElement !== workspace) workspace.appendChild(builder);
    if (main && library && library.parentElement !== main) main.appendChild(library);
    setApplicationNavigation(false);
  }

  function updateGreeting() {
    const user = window.TEACHR_AUTH?.getUser?.();
    const name = user?.displayName || user?.email?.split('@')[0] || 'Teacher';
    const first = name.trim().split(/\s+/)[0] || 'Teacher';
    document.getElementById('appWelcome').textContent = `Welcome back, ${first}.`;
    document.getElementById('appGreeting').textContent = 'Your teaching workspace is ready.';
  }

  function showDashboard() {
    createShell();
    document.getElementById('appDashboard').hidden = false;
    document.getElementById('appToolView').hidden = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openTool(tool) {
    moveApplicationContent();
    const dashboard = document.getElementById('appDashboard');
    const toolView = document.getElementById('appToolView');
    const mount = document.getElementById('appToolMount');
    const builder = document.getElementById('builderPanel');
    const library = document.getElementById('library');
    dashboard.hidden = true;
    toolView.hidden = false;
    document.getElementById('appToolName').textContent = TOOL_LABELS[tool]?.[0] || 'Tool';

    if (tool === 'library') {
      mount.classList.add('library-mode');
      builder.hidden = true;
      library.hidden = false;
      library.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    mount.classList.remove('library-mode');
    library.hidden = true;
    builder.hidden = false;
    const legacyCard = document.querySelector(`.tool-card[data-tool="${tool}"]`);
    if (legacyCard) legacyCard.click();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const style = document.createElement('style');
  style.textContent = `
    .teachr-app{max-width:1280px;margin:0 auto;padding:54px 6vw 90px;min-height:calc(100vh - 78px)}
    .teachr-app[hidden]{display:none}
    .public-section-hidden{display:none!important}
    .teachr-app-head{display:flex;align-items:flex-end;justify-content:space-between;gap:30px;margin-bottom:42px}
    .teachr-app-head h1{font-size:clamp(36px,5vw,58px);letter-spacing:-.05em;line-height:1;margin:0 0 10px}
    .teachr-app-head>div>p:last-child{margin:0;color:#8195b1;font-size:14px}
    .app-home-button{border:1px solid var(--line);background:rgba(255,255,255,.04);color:#d9e7f8;border-radius:11px;padding:10px 15px;font-weight:700}
    .app-intro{margin-bottom:24px}.app-intro h2{font-size:30px;letter-spacing:-.04em;margin:0 0 5px}.app-intro p{color:#748aa8;margin:0;font-size:13px}
    .app-tool-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
    .app-tool-card{position:relative;text-align:left;min-height:190px;padding:24px;border:1px solid var(--line);border-radius:20px;background:linear-gradient(145deg,rgba(19,40,72,.72),rgba(8,23,45,.8));color:#fff;transition:.2s ease;box-shadow:0 12px 35px rgba(0,0,0,.12)}
    .app-tool-card:hover{transform:translateY(-4px);border-color:rgba(83,170,255,.42);box-shadow:0 20px 50px rgba(0,0,0,.22)}
    .app-tool-icon{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;margin-bottom:25px;font-weight:800;font-size:18px}
    .app-tool-card strong{display:block;font-size:17px}.app-tool-card small{display:block;color:#8297b3;font-size:11px;line-height:1.55;margin-top:7px;max-width:220px}.app-tool-arrow{position:absolute;right:21px;bottom:20px;color:#73bfff;font-size:17px}
    .app-view[hidden]{display:none}.app-breadcrumb{display:flex;align-items:center;gap:14px;margin-bottom:18px;color:#7d91ad;font-size:12px}.app-breadcrumb button{border:0;background:none;color:#76beff;padding:0;font-weight:700}.app-breadcrumb span{color:#b9c9df;font-weight:700}
    #appToolMount>.builder{margin:0}.library-mode{display:block}.library-mode #library{padding:0}.library-mode .section-heading{margin-bottom:22px}
    @media(max-width:1050px){.app-tool-grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:700px){.teachr-app{padding:38px 20px 60px}.teachr-app-head{align-items:flex-start;flex-direction:column;margin-bottom:30px}.app-tool-grid{grid-template-columns:1fr}.app-tool-card{min-height:165px}}
  `;
  document.head.appendChild(style);

  window.addEventListener('teachr:authchange', event => {
    if (event.detail?.status === 'signed-in') {
      moveApplicationContent();
      showDashboard();
    } else if (event.detail?.status === 'public') {
      restorePublicContent();
    }
  });
})();
