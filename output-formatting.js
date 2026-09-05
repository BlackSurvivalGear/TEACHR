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
    .ai-result-body{font-size:13px;line-height:1.6;color:#33445a}
    .ai-result-body p{margin:0 0 8px}.ai-result-body p:last-child{margin-bottom:0}
    .ai-result-body strong{font-weight:800;color:#18283b}.ai-result-body em{font-style:italic}
    .ai-result-body code{padding:2px 5px;border-radius:5px;background:rgba(20,40,70,.08);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.92em}
    .ai-result-body ul,.ai-result-body ol{margin:4px 0 10px 20px;padding:0}.ai-result-body li{margin:3px 0;padding-left:2px}
    .ai-result-body h5{margin:8px 0 5px;font-size:13px}
    .ai-table-wrap{overflow-x:auto;margin:8px 0}.ai-table{width:100%;border-collapse:collapse;font-size:12px;background:rgba(255,255,255,.5)}
    .ai-table th,.ai-table td{border:1px solid rgba(20,50,80,.12);padding:7px 8px;text-align:left;vertical-align:top}.ai-table th{font-weight:800;background:rgba(20,50,80,.06)}
  `;
  document.head.appendChild(style);
})();
