# TEACHR AI V2 — Hybrid Architecture

## Product model

TEACHR keeps six specialist teaching tools and adds a contextual TEACHR Assistant inside each tool.

The six generating tools are:

1. Lesson Builder
2. Worksheet Generator
3. Assessment Generator
4. Differentiation Engine
5. Curriculum Planner
6. Revision Pack

Parent Communication is removed from the product.

The Resource Library remains a non-generating workspace feature and does not consume generation allowance.

## Teacher experience

A verified teacher signs in and enters the workspace with AI already available. Teachers do not configure providers, models, API keys, or connection settings.

Each specialist tool retains its structured form. The TEACHR Assistant will be embedded inside each tool and will understand the active tool, form inputs, generated resource, and follow-up context.

A teacher can generate a primary resource and then refine it conversationally or move its context into another tool, for example Lesson Builder -> Worksheet Generator -> Assessment Generator.

## AI boundary

The browser never receives provider credentials.

Production architecture:

- GitHub Pages: TEACHR website and teaching workspace
- Firebase: authentication, verified-user identity, Firestore profile/usage state
- Vercel: secure TEACHR AI API
- OpenAI GPT: generation provider

The normal teacher interface exposes only TEACHR. Provider/model controls are reserved for a future Admin AI System.

## Usage policy

Free Member: 3 successful primary generations per generating tool.

Pro TEACHR, Admin and Superadmin: unlimited primary generations.

Failed AI calls consume no generation.

Assistant follow-up messages within an active resource session should not consume a new primary generation. Starting a new resource consumes the next generation. Exact session limits and abuse controls will be defined during Stage 6.

## Implementation stages

### Stage 1 — Architecture cleanup
- Remove Parent Communication from the UI, tool registry, quota model, admin usage controls and generation mappings.
- Remove obsolete teacher-facing AI settings/configuration surfaces.
- Preserve the six existing specialist tools and Resource Library.
- Record this architecture specification in the repository.

### Stage 2 — Production GPT backend
- Deploy a secure Vercel generation API.
- Verify Firebase ID tokens server-side.
- Keep provider credentials in server environment variables only.
- Preserve Member/Pro/Admin/Superadmin access and quota enforcement.

### Stage 3 — Restore generation
- Verify real GPT generation for Lesson, Worksheet, Assessment, Differentiation, Curriculum and Revision.
- Confirm failures do not consume allowance.

### Stage 4 — TEACHR Assistant
- Embed the contextual Assistant inside all six tools.
- Supply active-tool, form and generated-resource context.

### Stage 5 — Connected resources
- Carry resource context between tools.
- Support workflows such as Lesson -> Worksheet -> Assessment -> Differentiation -> Revision.

### Stage 6 — Assistant sessions
- Add resource-scoped conversation/refinement.
- Do not charge every follow-up as a new primary generation.
- Define reasonable session and abuse controls.

### Stage 7 — Admin AI System
- Add provider/model configuration, backend health, generation statistics and failure monitoring for Admin/Superadmin only.

### Stage 8 — Production verification
- Verify authentication, six-tool generation, quotas, Assistant context, cross-tool workflows, failure handling, CI and production deployment.
