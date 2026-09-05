(() => {
  const inlineMarkdown = value => {
    let text = escapeHtml(value);
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return text;
  };

  const renderRichText = value => {
    const lines = String(value ?? '').split(/\n+/).map(line => line.trim()).filter(Boolean);
    if (!lines.length) return '';
    const html = [];
    let listType = null;
    let tableRows = [];

    const closeList = () => {
      if (listType) {
        html.push(`</${listType}>`);
        listType = null;
      }
    };

    const flushTable = () => {
      if (!tableRows.length) return;
      const rows = tableRows.filter(row => !/^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(row));
      if (rows.length) {
        html.push('<div class="ai-table-wrap"><table class="ai-table"><tbody>');
        rows.forEach((row, index) => {
          const cells = row.replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());
          html.push(`<tr>${cells.map(cell => `${index === 0 ? '<th>' : '<td>'}${inlineMarkdown(cell)}${index === 0 ? '</th>' : '</td>'}`).join('')}</tr>`);
        });
        html.push('</tbody></table></div>');
      }
      tableRows = [];
    };

    lines.forEach(line => {
      if (line.includes('|') && /^\|?.+\|.+\|?$/.test(line)) {
        closeList();
        tableRows.push(line);
        return;
      }
      flushTable();

      const bullet = line.match(/^[-*]\s+(.+)$/);
      const numbered = line.match(/^\d+[.)]\s+(.+)$/);
      if (bullet || numbered) {
        const nextType = numbered ? 'ol' : 'ul';
        if (listType !== nextType) {
          closeList();
          html.push(`<${nextType}>`);
          listType = nextType;
        }
        html.push(`<li>${inlineMarkdown((bullet || numbered)[1])}</li>`);
        return;
      }

      closeList();
      if (/^#{1,4}\s+/.test(line)) {
        html.push(`<h5>${inlineMarkdown(line.replace(/^#{1,4}\s+/, ''))}</h5>`);
      } else {
        html.push(`<p>${inlineMarkdown(line)}</p>`);
      }
    });

    closeList();
    flushTable();
    return html.join('');
  };

  const parseSections = content => {
    const lines = String(content ?? '').split(/\r?\n/);
    const sections = [];
    let current = null;
    let preamble = [];

    const startSection = heading => {
      current = [heading.trim(), ''];
      sections.push(current);
    };

    lines.forEach(raw => {
      const line = raw.trim();
      if (!line) {
        if (current && current[1]) current[1] += '\n';
        return;
      }

      const markdownHeading = line.match(/^#{1,4}\s+(.+)$/);
      const boldHeading = line.match(/^\*\*(.+?)\*\*:?$/);
      if (markdownHeading || boldHeading) {
        startSection(markdownHeading ? markdownHeading[1] : boldHeading[1]);
        return;
      }

      if (!current) {
        preamble.push(line);
        return;
      }
      current[1] += `${current[1] ? '\n' : ''}${line}`;
    });

    if (preamble.length) {
      const first = preamble.join('\n');
      const looksLikeRepeatedTitle = /lesson plan|worksheet|assessment|revision pack|curriculum map/i.test(first) && first.length < 160;
      if (!looksLikeRepeatedTitle || !sections.length) sections.unshift(['Overview', first]);
    }

    return sections.length ? sections : [['AI output', String(content ?? '')]];
  };

  const originalBuildPrompt = window.buildPrompt;
  window.buildPrompt = function buildPromptWithOutputSpec(data) {
    const base = originalBuildPrompt ? originalBuildPrompt(data) : `Create teacher-ready material for ${data.year} ${data.subject} on ${data.topic}.`;
    const worksheetRule = activeToolIsLesson()
      ? 'For a lesson plan, include a ready-to-print Student Worksheet section when the topic naturally supports written practice, questions, tables, classification, problem solving or retrieval. Include a short Worksheet Answer Key section. If a worksheet is not appropriate, provide a suitable classroom activity instead.'
      : '';
    return `${base} Do not repeat the lesson/resource title or input metadata as the first content. Use clear Markdown section headings, numbered steps or questions, bullet lists, inline code for technical terms, and Markdown tables only when they improve clarity. Keep teacher guidance and student-facing material clearly separated. ${worksheetRule}`;
  };

  const activeToolIsLesson = () => document.querySelector('.tool-card.active')?.dataset.tool === 'lesson';

  window.parseAISections = parseSections;

  const originalRenderResult = window.renderResult;
  window.renderResult = function renderFormattedResult(output, source) {
    if (!output || !Array.isArray(output.sections)) {
      return originalRenderResult?.(output, source);
    }

    const result = document.getElementById('result');
    if (!result) return originalRenderResult?.(output, source);

    result.hidden = false;
    const badge = source === 'ai' ? 'AI GENERATED' : 'DEMO MODE';
    result.innerHTML = `<div class="result-head"><div><p class="eyebrow">${badge}</p><h4>${escapeHtml(output.title)}</h4><span class="result-sub">${escapeHtml(output.summary)}</span></div><div class="result-actions"><button class="btn btn-ghost" id="printResult" type="button">Print / PDF</button><button class="btn btn-primary" id="saveResult" type="button">Save to library</button></div></div><div class="result-grid">${output.sections.map(([heading, body]) => `<div class="result-item"><b>${escapeHtml(heading)}</b><div class="ai-result-body">${renderRichText(body)}</div></div>`).join('')}</div>`;

    document.getElementById('saveResult').addEventListener('click', () => {
      saveResource({ id: Date.now(), type: toolConfig[activeTool].type, title: output.title, summary: output.summary, sections: output.sections, createdAt: new Date().toISOString() });
      showToast('Saved to your resource library.');
    });
    document.getElementById('printResult').addEventListener('click', () => window.print());
  };

  const style = document.createElement('style');
  style.textContent = `
    .ai-result-body{font-size:13px;line-height:1.65;color:#e7eef9}
    .ai-result-body p{margin:0 0 8px;color:#dce7f5}.ai-result-body p:last-child{margin-bottom:0}
    .ai-result-body strong{font-weight:800;color:#ffffff}.ai-result-body em{font-style:italic;color:#edf4ff}
    .ai-result-body code{padding:2px 5px;border-radius:5px;background:rgba(121,184,255,.16);color:#f2f7ff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.92em}
    .ai-result-body ul,.ai-result-body ol{margin:4px 0 10px 20px;padding:0;color:#dce7f5}.ai-result-body li{margin:4px 0;padding-left:2px;color:#dce7f5}
    .ai-result-body h5{margin:8px 0 5px;font-size:13px;color:#ffffff}
    .ai-table-wrap{overflow-x:auto;margin:8px 0}.ai-table{width:100%;border-collapse:collapse;font-size:12px;background:rgba(255,255,255,.06);color:#e7eef9}
    .ai-table th,.ai-table td{border:1px solid rgba(174,207,244,.25);padding:7px 8px;text-align:left;vertical-align:top;color:#e7eef9}.ai-table th{font-weight:800;color:#ffffff;background:rgba(121,168,220,.18)}

    .theme-toggle{display:inline-flex;align-items:center;gap:8px;margin-right:18px;color:#cbd9eb;font-size:11px;font-weight:700;white-space:nowrap}
    .theme-toggle-label{opacity:.82}.theme-toggle-label.active{opacity:1;color:#fff}
    .theme-switch{position:relative;width:42px;height:23px;border:1px solid rgba(155,190,255,.28);border-radius:999px;background:#17365a;padding:0;cursor:pointer;flex:0 0 auto}
    .theme-switch::after{content:'';position:absolute;top:3px;left:3px;width:15px;height:15px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.3);transition:transform .2s ease}
    .theme-switch[aria-checked="true"]{background:#27aef2}.theme-switch[aria-checked="true"]::after{transform:translateX(19px)}
    .theme-switch:focus-visible{outline:3px solid rgba(39,184,255,.35);outline-offset:2px}

    /* Refined dark mode: softer input surfaces, clearer labels and placeholders. */
    html[data-theme="dark"] .builder.glass{background:linear-gradient(145deg,rgba(15,35,62,.94),rgba(7,23,44,.94));border-color:rgba(103,160,221,.22)}
    html[data-theme="dark"] #aiProviderPanel{background:linear-gradient(145deg,rgba(17,43,73,.72),rgba(8,27,50,.76));border-color:rgba(83,170,255,.24)}
    html[data-theme="dark"] .field input,html[data-theme="dark"] .field select,html[data-theme="dark"] .field textarea,
    html[data-theme="dark"] .aip-key-wrap input{background:#132b48!important;color:#e8f1fb!important;border-color:rgba(116,164,211,.34)!important;color-scheme:dark}
    html[data-theme="dark"] .field input:hover,html[data-theme="dark"] .field select:hover,html[data-theme="dark"] .field textarea:hover,
    html[data-theme="dark"] .aip-key-wrap input:hover{border-color:rgba(116,184,229,.48)!important;background:#16304f!important}
    html[data-theme="dark"] .field input:focus,html[data-theme="dark"] .field select:focus,html[data-theme="dark"] .field textarea:focus,
    html[data-theme="dark"] .aip-key-wrap input:focus{background:#142f4e!important;border-color:rgba(74,190,255,.65)!important;box-shadow:0 0 0 3px rgba(39,184,255,.10)!important}
    html[data-theme="dark"] .field input::placeholder,html[data-theme="dark"] .field textarea::placeholder,
    html[data-theme="dark"] .aip-key-wrap input::placeholder{color:#9fb2c9!important;opacity:1}
    html[data-theme="dark"] .field label{color:#b9c9dc!important}.field label span{color:#8398b2!important}
    html[data-theme="dark"] .builder-description,html[data-theme="dark"] .aip-head span,html[data-theme="dark"] .aip-note{color:#8fa6c0!important}
    html[data-theme="dark"] .aip-toggle{color:#a9bdd5}.aip-test{color:#dce9f8;background:rgba(49,112,167,.16)}
    html[data-theme="dark"] .aip-test:hover{background:rgba(58,133,193,.24);color:#fff}

    /* Refined light mode: stronger text hierarchy without harsh white panels. */
    html[data-theme="light"] body{background:#f4f7fb;color:#182334}
    html[data-theme="light"] .topbar{background:rgba(255,255,255,.96);border-bottom-color:rgba(31,54,82,.14)}
    html[data-theme="light"] .topnav a{color:#53657d}.topnav a:hover{color:#17263a}
    html[data-theme="light"] .profile-chip{background:#fff;color:#26364b;border-color:rgba(31,54,82,.14)}
    html[data-theme="light"] .glass{background:linear-gradient(145deg,#ffffff,#f7faff);border-color:rgba(31,54,82,.16);box-shadow:0 20px 55px rgba(36,54,78,.10)}
    html[data-theme="light"] .hero-text,html[data-theme="light"] .section-sub,html[data-theme="light"] .builder-description{color:#52677f}
    html[data-theme="light"] .tool-card{background:#fff;color:#17263a;border-color:rgba(31,54,82,.14)}
    html[data-theme="light"] .tool-card:hover,html[data-theme="light"] .tool-card.active{background:#f8fbff;border-color:rgba(39,145,220,.35)}
    html[data-theme="light"] .tool-card small{color:#5d718a}.tool-card strong{color:inherit}
    html[data-theme="light"] .stat-card,html[data-theme="light"] .result-item,html[data-theme="light"] .resource-card,html[data-theme="light"] .feature-points span{background:#fff;border-color:rgba(31,54,82,.14)}
    html[data-theme="light"] .stat-card span,html[data-theme="light"] .stat-card small,html[data-theme="light"] .resource-date{color:#5d718a}
    html[data-theme="light"] .builder{background:#fff}
    html[data-theme="light"] .field input,html[data-theme="light"] .field select,html[data-theme="light"] .field textarea,
    html[data-theme="light"] .aip-key-wrap input{background:#fff!important;color:#172b43!important;border-color:#c8d5e3!important;color-scheme:light}
    html[data-theme="light"] .field input:hover,html[data-theme="light"] .field select:hover,html[data-theme="light"] .field textarea:hover,
    html[data-theme="light"] .aip-key-wrap input:hover{border-color:#aebfd2!important}
    html[data-theme="light"] .field input:focus,html[data-theme="light"] .field select:focus,html[data-theme="light"] .field textarea:focus,
    html[data-theme="light"] .aip-key-wrap input:focus{border-color:#4a9fdb!important;box-shadow:0 0 0 3px rgba(39,184,255,.12)!important}
    html[data-theme="light"] .field input::placeholder,html[data-theme="light"] .field textarea::placeholder,
    html[data-theme="light"] .aip-key-wrap input::placeholder{color:#667b92!important;opacity:1}
    html[data-theme="light"] .field label{color:#3c536d!important}.field label span{color:#667c94!important}
    html[data-theme="light"] .aip-head strong{color:#172b43}.aip-head span{color:#667b92}
    html[data-theme="light"] .aip-status{color:#5d7188}.aip-status.ready{color:#15985e}.aip-status.error{color:#c44747}
    html[data-theme="light"] .aip-toggle{color:#54708e}.aip-test{color:#245a8a;background:#eef5fb;border-color:#c4d5e5}
    html[data-theme="light"] .aip-test:hover{background:#e3eff9;color:#174b76}
    html[data-theme="light"] .btn-ghost{color:#26364b;background:#fff;border-color:rgba(31,54,82,.18)}
    html[data-theme="light"] .result-sub,html[data-theme="light"] .online{color:#5b7089}
    html[data-theme="light"] .result-item b{color:#18283a}
    html[data-theme="light"] .ai-result-body{color:#24364c}.ai-result-body p{color:inherit}
    html[data-theme="light"] .ai-result-body strong,html[data-theme="light"] .ai-result-body h5{color:#14253a}
    html[data-theme="light"] .ai-result-body code{background:#e8f1fa;color:#16314e}
    html[data-theme="light"] .ai-result-body ul,html[data-theme="light"] .ai-result-body ol,html[data-theme="light"] .ai-result-body li{color:#263b53}
    html[data-theme="light"] .ai-table{background:#fff;color:#263b53}.ai-table th,.ai-table td{color:inherit;border-color:rgba(31,54,82,.18)}
    html[data-theme="light"] .ai-table th{color:#162b43;background:#eaf1f7}
    html[data-theme="light"] .theme-toggle{color:#26364b}.theme-toggle-label.active{color:inherit}
    html[data-theme="light"] .filter{color:#52657d;background:#fff;border-color:rgba(31,54,82,.14)}
    html[data-theme="light"] footer{color:#61738b;border-top-color:rgba(31,54,82,.12)}
    html[data-theme="light"] footer strong{color:#33485f}

    @media print{
      html[data-theme="light"] body,html[data-theme="dark"] body{background:#fff!important;color:#111!important}
      .ai-result-body,.ai-result-body p,.ai-result-body li,.ai-result-body ul,.ai-result-body ol,.ai-result-body td,.ai-result-body th{color:#222!important}
      .ai-result-body strong,.ai-result-body h5{color:#111!important}.ai-result-body code{color:#111!important;background:#eee!important}
      .ai-table{background:#fff!important}.ai-table th{background:#eee!important;color:#111!important}.ai-table td,.ai-table th{border-color:#bbb!important}
      .theme-toggle{display:none!important}
    }
  `;
  document.head.appendChild(style);

  const installThemeToggle = () => {
    const topbar = document.querySelector('.topbar');
    const profile = document.getElementById('profileButton');
    if (!topbar || !profile || document.getElementById('themeToggle')) return;

    const stored = localStorage.getItem('teachr-theme');
    const initial = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.dataset.theme = initial;

    const wrap = document.createElement('div');
    wrap.className = 'theme-toggle';
    wrap.innerHTML = '<span class="theme-toggle-label" data-theme-label="light">Light</span><button class="theme-switch" id="themeToggle" type="button" role="switch" aria-label="Switch between light and dark mode"></button><span class="theme-toggle-label" data-theme-label="dark">Dark</span>';
    topbar.insertBefore(wrap, profile);

    const button = document.getElementById('themeToggle');
    const labels = wrap.querySelectorAll('[data-theme-label]');
    const apply = theme => {
      document.documentElement.dataset.theme = theme;
      button.setAttribute('aria-checked', theme === 'dark' ? 'true' : 'false');
      labels.forEach(label => label.classList.toggle('active', label.dataset.themeLabel === theme));
      localStorage.setItem('teachr-theme', theme);
    };
    button.addEventListener('click', () => apply(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
    apply(initial);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installThemeToggle, { once: true });
  } else {
    installThemeToggle();
  }
})();
