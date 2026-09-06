// Lightweight regression checks for the Phase 1 output-cleanup rules.
const cleanBody = value => String(value ?? '')
  .replace(/^\s*```(?:text|plaintext|pseudocode|python|javascript)?\s*$/gim, '')
  .replace(/^\s*```\s*$/gim, '')
  .replace(/^\s*\.\.\.\s*$/gm, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim();
const cleaned = cleanBody('```text\nINPUT score\nOUTPUT score\n```\n...');
if (cleaned.includes('```') || /^\.\.\.$/m.test(cleaned)) throw new Error('Output cleanup regression');
if (!cleaned.includes('INPUT score') || !cleaned.includes('OUTPUT score')) throw new Error('Useful content was removed');
console.log('Phase 1 output cleanup checks passed.');
