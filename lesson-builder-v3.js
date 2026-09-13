(() => {
  /*
   * Legacy Lesson Builder V3 used to intercept lesson form submissions and
   * render a local DEMO MODE example. Generation is now handled centrally by
   * app.js -> TEACHR_AI.generate(), exactly like the other five generators.
   *
   * Keep this file as a compatibility shim because index.html still loads it
   * and older cached pages may reference it. Do not attach a submit handler
   * here: multiple generator submit handlers can bypass AI, usage enforcement,
   * authentication, or error handling.
   */
  window.TEACHR_LESSON_BUILDER_V3 = Object.freeze({
    mode: 'ai',
    submitOwner: 'app.js'
  });
})();
