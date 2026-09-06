/* TEACHR Phase 1 output quality fixes.
 * Keeps the existing generator intact and improves teacher-facing output rendering,
 * print pagination, timing validation, lesson-design coverage and lesson-output instructions.
 */
(() => {
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[c]));

  const readDurationMinutes = () => {
    const selected = document.getElementById('duration')?.value || '';
    const match = selected.match(/(\d+)\s*minutes?/i);
    return match ? Number(match[1]) : null;
  };

  const sectionMinutes = heading => {
    const text = String(heading || '');
    const match = text.match(/(?:^|[—–-])\s*(\d+)\s*minutes?\b/i) || text.match(/(\d+)\s*minutes?\b/i);
    return match ? Number(match[1]) : 0;
  };

  const timingSummary = sections => {
    const timed = sections.map(([heading]) => [heading, sectionMinutes(heading)]).filter(([, minutes]) => minutes > 0);
    const total = timed.reduce((sum, [, minutes]) => sum + minutes, 0);
    const expected = readDurationMinutes();
    return { timed, total, expected, valid: expected == null || total === expected };
  };

  const readBalancedGroup = (text, start) => {
    if (text[start] !== '{') return null;
    let depth = 0;
    for (let i = start; i < text.length; i += 1) {
      if (text[i] === '{') depth += 1;
      else if (text[i] === '}') {
        depth -= 1;
        if (depth === 0) return { value: text.slice(start + 1, i), end: i + 1 };
      }
    }
    return null;
  };

  const latexInline = value => {
    const text = String(value ?? '')
      .replace(/\\\(|\\\)/g, '')
      .replace(/\\\[|\\\]/g, '')
      .replace(/\\qquad|\\quad/g, ' ')
      .replace(/\\,/g, ' ')
      .replace(/\\textstyle|\\displaystyle/g, '')
      .replace(/\\pm/g, '±')
      .replace(/\\times/g, '×')
      .replace(/\\cdot/g, '·')
      .replace(/\\leq?/g, '≤')
      .replace(/\\geq?/g, '≥')
      .replace(/\\neq/g, '≠')
      .replace(/\\rightarrow/g, '→')
      .replace(/\\left|\\right/g, '')
      .replace(/\\text\s*\{/g, '{');

    const renderGroups = input => {
      let output = '';
      for (let i = 0; i < input.length;) {
        if (input.startsWith('\\boxed', i)) {
          const group = readBalancedGroup(input, i + 6);
          if (group) {
            output += `<span class="teachr-math-box">${renderGroups(group.value)}</span>`;
            i = group.end;
            continue;
          }
        }
        if (input.startsWith('\\frac', i)) {
          const numerator = readBalancedGroup(input, i + 5);
          if (numerator) {
            const denominator = readBalancedGroup(input, numerator.end);
            if (denominator) {
              output += `<span class="teachr-math-frac"><span>${renderGroups(numerator.value)}</span><span>${renderGroups(denominator.value)}</span></span>`;
              i = denominator.end;
              continue;
            }
          }
        }
        if (input[i] === '{') {
          const group = readBalancedGroup(input, i);
          if (group) {
            output += renderGroups(group.value);
            i = group.end;
            continue;
          }
        }
        output += escapeHtml(input[i]);
        i += 1;
      }
      return output;
    };
    return renderGroups(text);
  };

  const shouldRenderMath = text => /\\(?:frac|boxed|pm|times|cdot|leq?|geq?|neq|rightarrow)|\\\(|\\\[/.test(text);
  const renderMathNodes = root => {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (!shouldRenderMath(node.nodeValue)) return;
      const span = document.createElement('span');
      span.className = 'teachr-math';
      span.innerHTML = latexInline(node.nodeValue);
      node.parentNode?.replaceChild(span, node);
    });
  };

  // Remove presentation artefacts that are useful in an AI response but not in a teacher-facing document.
  const cleanBody = value => String(value ?? '')
    .replace(/^\s*```(?:text|plaintext|pseudocode|python|javascript)?\s*$/gim, '')
    .replace(/^\s*```\s*$/gim, '')
    .replace(/^\s*\.\.\.\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const normaliseSections = sections => (Array.isArray(sections) ? sections : [])
    .map(section => [String(section?.[0] ?? '').trim(), cleanBody(section?.[1])])
    .filter(([heading, body]) => heading || body)
    .filter(([heading, body]) => heading !== '...' && body !== '...');

  const fieldValue = id => document.getElementById(id)?.value?.trim() || '';
  const ensureLessonDesignSections = sections => {
    const output = normaliseSections(sections);
    const activeLesson = document.querySelector('.tool-card.active')?.dataset.tool === 'lesson';
    if (!activeLesson) return output;

    const additions = [
      ['Key vocabulary', fieldValue('v2Vocabulary')],
      ['Retrieval starter', fieldValue('v2Starter')],
      ['Common misconceptions', fieldValue('v2Misconceptions')],
      ['Stretch & challenge', fieldValue('v2Challenge')],
      ['Support / SEND / EAL', fieldValue('supportNeeds')],
      ['Resources', fieldValue('resourcesNeeded')],
      ['Homework / next step', fieldValue('v2Homework')],
      ['Lesson sequence', fieldValue('v2Sequence')],
      ['Teacher reflection', fieldValue('v2Reflection')]
    ];

    const hasHeading = wanted => output.some(([heading]) => heading.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().includes(wanted.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()));
    additions.forEach(([heading, body]) => {
      if (body && !hasHeading(heading)) output.push([heading, body]);
    });
    return output;
  };

  const installStyles = () => {
    if (document.getElementById('teachrPhase1Styles')) return;
    const style = document.createElement('style');
    style.id = 'teachrPhase1Styles';
    style.textContent = `
      .teachr-math{font-family:Georgia,'Times New Roman',serif;font-size:1.08em;color:inherit;white-space:nowrap}
      .teachr-math-frac{display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;line-height:1.05;margin:0 .12em;min-width:1.1em}
      .teachr-math-frac>span:first-child{border-bottom:1px solid currentColor;padding:0 .14em .08em}.teachr-math-frac>span:last-child{padding:.08em .14em 0}
      .teachr-math-box{display:inline-block;border:1.5px solid currentColor;border-radius:3px;padding:1px 5px;margin:0 .1em;font-weight:700}
      .phase1-timing{margin:0 0 14px;padding:9px 12px;border:1px solid #cfdbe8;border-radius:9px;background:#f5f9fc;color:#38516b;font-size:12px}.phase1-timing strong{color:#172b43}.phase1-timing.invalid{border-color:#e6b4b4;background:#fff5f5;color:#8d3f3f}
      html[data-theme="dark"] .phase1-timing{border-color:#34516d;background:#102b47;color:#aec0d2}html[data-theme="dark"] .phase1-timing strong{color:#f3f8fd}
      @media print {
        @page{size:A4;margin:12mm}
        html,body{background:#fff!important;color:#111!important}
        body{font-family:Arial,Helvetica,sans-serif!important}
        .app-shell>header,main>.hero,main>#library,main>.feature-strip,#workspace>.section-heading,#workspace>.stats-grid,#workspace>.tool-grid,#builderPanel>.builder-header,#builderPanel>form,#result .result-actions,.toast{display:none!important}
        #workspace{padding:0!important;margin:0!important;display:block!important}
        #builderPanel{display:block!important;margin:0!important;padding:0!important;border:0!important;box-shadow:none!important;background:#fff!important}
        #result{display:block!important;position:static!important;visibility:visible!important;background:#fff!important;color:#111!important}
        #result .result-head{display:block!important;border-bottom:2px solid #17304d;padding:0 0 10px;margin:0 0 12px}
        #result .result-head h4{font-size:22px!important;color:#17304d!important;margin:0 0 4px}
        #result .result-sub{color:#52677f!important;font-size:11px!important}
        #result .result-grid{display:block!important;margin:0!important}
        #result .result-item{display:block!important;break-inside:auto!important;page-break-inside:auto!important;margin:0 0 9px!important;padding:9px 11px!important;border:1px solid #d9e2ec!important;border-radius:7px!important;background:#fff!important;box-shadow:none!important;color:#111!important}
        #result .result-item>b{display:block!important;color:#17304d!important;font-size:12px!important;margin:0 0 5px!important}
        #result .ai-result-body{color:#26384c!important;font-size:10.5pt!important;line-height:1.4!important}
        #result .ai-result-body p,#result .ai-result-body li{color:#26384c!important}
        #result .ai-result-body strong,#result .ai-result-body h5{color:#17304d!important}
        #result .ai-result-body ul,#result .ai-result-body ol{margin-top:2px!important;margin-bottom:6px!important}
        #result .ai-table-wrap{break-inside:avoid!important;page-break-inside:avoid!important}
        #result .ai-table{font-size:9pt!important;background:#fff!important;color:#111!important}
        #result .ai-table th,#result .ai-table td{color:#26384c!important;border-color:#bfcddd!important;background:#fff!important}
        .teachr-math{color:#111!important}
        .phase1-timing{display:none!important}
      }
    `;
    document.head.appendChild(style);
  };

  const addTimingNotice = sections => {
    const result = document.getElementById('result');
    if (!result) return;
    result.querySelector('.phase1-timing')?.remove();
    const summary = timingSummary(sections);
    if (!summary.timed.length) return;
    const notice = document.createElement('div');
    notice.className = `phase1-timing${summary.valid ? '' : ' invalid'}`;
    if (summary.expected == null) notice.innerHTML = `<strong>Timing check:</strong> ${summary.total} minutes scheduled across timed lesson sections.`;
    else if (summary.valid) notice.innerHTML = `<strong>Timing check:</strong> ${summary.total} minutes scheduled — matches the selected ${summary.expected}-minute lesson.`;
    else notice.innerHTML = `<strong>Timing check:</strong> ${summary.total} minutes scheduled, but the selected lesson is ${summary.expected} minutes. Review the generated timings before printing.`;
    result.querySelector('.result-head')?.after(notice);
  };

  const originalRenderResult = window.renderResult;
  if (typeof originalRenderResult === 'function') {
    window.renderResult = function phase1RenderResult(output, source) {
      const prepared = output && Array.isArray(output.sections)
        ? { ...output, sections: ensureLessonDesignSections(output.sections) }
        : output;
      originalRenderResult(prepared, source);
      installStyles();
      addTimingNotice(prepared?.sections || []);
      document.querySelectorAll('#result .ai-result-body').forEach(renderMathNodes);
    };
  }

  const originalBuildPrompt = window.buildPrompt;
  if (typeof originalBuildPrompt === 'function') {
    window.buildPrompt = function phase1BuildPrompt(data) {
      const base = originalBuildPrompt(data);
      return `${base}

PHASE 1 OUTPUT QUALITY REQUIREMENTS:
- Produce a complete teacher-facing lesson, not a generic outline.
- Use the teacher's Lesson Design fields as binding generation requirements.
- If Key vocabulary is supplied, include a clearly labelled Key vocabulary section and use those terms accurately.
- If a retrieval starter is supplied, include it as a distinct starter/retrieval section.
- Include distinct sections for misconceptions, support/SEND/EAL, challenge, resources, homework/next step, lesson sequence and teacher reflection when those fields are supplied.
- Do not output raw LaTeX commands such as \\frac, \\boxed, \\text, \\[ or \\]. Use plain-text or Unicode mathematical notation where practical.
- Do not wrap pseudocode, algorithms or code in Markdown code fences. Present them as clean preformatted or clearly separated text without literal fence markers.
- Do not output placeholder artefacts such as '...' as standalone content.
- The generated lesson must respect the selected lesson duration. Timed lesson-section headings must add up exactly to the requested duration.
- Do not reuse independent-practice questions as the exit ticket. The exit ticket must contain new questions that assess the same objectives.
- Keep question numbering unique and sequential within the student worksheet.
- Keep teacher guidance separate from student-facing worksheet content.
- Prefer concise sections and avoid repeating the same instruction in multiple sections.
- Do not create empty sections. If a section has no useful content, omit it.
`;
    };
  }

  installStyles();
})();
