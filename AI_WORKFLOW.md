# AI Workflow Note

## AI tools used

- ChatGPT for scoping, tradeoff planning, README drafting, and implementation review
- AI coding assistance for generating initial React/Supabase scaffolding and validation logic

## Where AI materially helped

AI helped me move faster in four areas:

1. Breaking down the ambiguous assignment into a focused MVP scope
2. Drafting the Supabase schema and document sharing model
3. Generating initial UI and service-layer structure
4. Creating documentation that clearly explains setup, tradeoffs, and review steps

## What I changed or rejected

I rejected AI suggestions that added too much scope, including:

- full authentication
- real-time collaboration
- complex editor permissions
- DOCX parsing
- multi-role enterprise access control

I kept the product intentionally scoped so the core document workflow could be tested end to end.

## Verification approach

I verified correctness through:

- manual testing of create, edit, save, reopen, import, and share flows
- switching seeded users to confirm owned/shared distinctions
- validating unsupported file types are rejected
- running the included Vitest validation test
- reviewing the UI from the perspective of a busy evaluator who needs to test quickly

## Judgment retained by me

AI accelerated execution, but I made the product decisions around scope, tradeoffs, and what to defer. The final product slice reflects practical delivery judgment under a tight timebox rather than attempting to recreate Google Docs.
