# Current Roadmap

Current helps people turn abundant information into durable understanding. Its broader purpose is to encourage students and lifelong learners to pursue personal interests in the age of AI, while giving them the structure to read critically, practice actively, and keep their knowledge current.

This roadmap separates the Build Week completion gate from longer-term product development. The immediate goal is not to build a complete school platform. It is to prove one trustworthy, source-grounded learning loop and show how a teacher can apply it without surrendering curriculum control.

## Product principles

- Start with the learner's interests, goals, and source material.
- Generate learning work, not just explanations or summaries.
- Adapt practice strategies from observed outcomes rather than labeling people with fixed learning styles.
- Keep AI decisions inspectable through sources, evidence, and explicit learner or educator approval.
- Use automation to keep curricula current without silently rewriting what someone is learning.
- Build for individual learners first, then extend the same foundation to educators and groups.

## Phase 0: Complete the Build Week MVP

The MVP is complete when a judge can provide a source, receive a live GPT-5.6-generated path and lesson, answer incorrectly, see Current adapt the next activity, and watch a source change become a cited curriculum update and scheduled review.

### Live OpenAI experience

- Configure `OPENAI_API_KEY` for the hosted Sites deployment.
- Verify that path generation and recall evaluation use GPT-5.6 Sol in production.
- Preserve deterministic fallback behavior for a reliable demo, while making live and fallback execution distinguishable during development.

### Dynamic user-created lessons

- Generate a complete Read, Recall, Apply, Reflect lesson for every user-created concept.
- Ground reading material, prompts, rubrics, and feedback in the attached sources.
- Generate at least two meaningful practice formats per path, such as free response, multiple choice, true or false, code, scenario analysis, or a hands-on task.
- Evaluate application work against concept-specific criteria rather than response length.

### Real research update loop

- Store a source snapshot and allow the learner to run a source refresh.
- Detect a meaningful change between the old and new source.
- Explain the delta, cite the changed evidence, and identify affected concepts.
- Let the learner apply or dismiss the proposed curriculum patch.
- Turn an accepted update into a due review and preserve an audit trail.
- Keep autonomous scheduling as a later extension; one real user-triggered refresh is enough for the MVP.

### Closed-loop adaptation

- Track misconceptions and performance by concept.
- Use recall performance to select the next support mode, prompt difficulty, and review interval.
- Show the learner what changed and why without exposing unnecessary model narration.
- Confirm that Map, List, Updates, Notes, lesson navigation, and review completion all preserve state.

### Sources and persistence

- Preserve uploaded source content or a reopenable source artifact after path creation.
- Keep concept claims linked to source IDs and excerpts.
- Add a dependable demo reset so judges can start from the intended state.
- Local-first persistence is acceptable for Build Week; accounts and cloud sync are not MVP blockers.

### Evidence and project documentation

- [x] Add a learning-science section to the GitHub README.
- [x] Compile primary research and reputable reviews supporting active recall, the testing effect, spaced practice, interleaving, self-explanation, timely feedback, worked examples, mastery learning, and interest-driven motivation.
- [x] Document limitations, especially the weak evidence for fixed learning-style categories.
- [x] Connect each supported method to a concrete Current interaction rather than presenting a decorative bibliography.
- [x] Document the live GPT-5.6 and Codex implementation clearly enough that judges can verify their roles.
- [x] Add a timed recording script and submission preflight.

### Current Classroom proof

- [x] Show one shared objective with interest-aware examples for individual students.
- [x] Surface class-level misconception signals without ranking students publicly.
- [x] Let a teacher inspect the exact support and lesson a student will receive.
- [x] Require teacher approval before a research update changes the student path.
- [ ] Add class creation, reusable assignment authoring, and durable rosters after Build Week.

## Phase 1: Personal Current

### Profiles and setup

- Add learner profiles with goals, fields of interest, current projects, experience level, and accessibility preferences.
- Let users enter interests and practice preferences manually during setup.
- Show the interests and inferred preferences Current derives from activity.
- Make every inference editable, dismissible, and attributable to observable behavior.
- Separate stable profile information from temporary goals and topic-specific performance.

### Interest-driven learning

- Use personal interests to make examples and application tasks more motivating while preserving the original learning objective.
- Allow a learner to choose how strongly interests should shape generated material.
- Support interest-aware problems such as explaining a rate problem through the Batmobile traveling at 40 mph.
- Avoid forcing every lesson through a personal-interest theme when a direct or authentic domain example is better.

### Adaptive practice modes

- Expand beyond visual sequences and concrete examples to hands-on, verbal, Socratic, project-based, and physical practice where appropriate.
- Select modes using task fit and performance history, not a permanent learner label.
- Let users override the selected mode and feed that choice back into future sessions.
- Track which strategies improve recall for which kinds of concepts.

### Personal settings

- Add an optional Pomodoro or focus timer that never blocks the learning loop.
- Add optional light mode while retaining dark mode as the default Current identity.
- Include controls for session length, reminder behavior, reduced motion, and adaptation intensity.

## Phase 2: Durable Second Brain

- Add authenticated profiles and cross-device synchronization.
- Store notes, reflections, source artifacts, attempts, misconceptions, and review history durably.
- Add source version history and claim-level provenance.
- Let users edit, reorder, regenerate, archive, and merge learning paths.
- Build a focused daily queue from due reviews, active goals, deadlines, and available session time.
- Add export and deletion controls so learners retain ownership of their data.

## Phase 3: Current Classroom

The K-12 edition should be built with educators, not merely sold to them. Teacher controls should support judgment and differentiation rather than replace either.

### Teacher management

- Add educator and learner roles with a dedicated teacher management menu.
- Create classes or groups, assign learning goals, and monitor completion and misconception patterns.
- Let teachers review or approve generated paths, source sets, assessments, and research updates.
- Provide group-level signals without turning the product into a surveillance dashboard.
- Support accommodations, reading levels, and teacher-authored constraints.

### Personalized group learning

- Collect student interests with age-appropriate consent and teacher visibility.
- Personalize examples and practice contexts for individual students while keeping shared learning objectives aligned.
- Build group learning plans that combine common instruction with differentiated practice.
- Help teachers discover useful interest clusters without flattening students into permanent categories.
- Allow educators to lock required material while Current adapts examples, pacing, and practice.

### Education safeguards

- Design for student privacy, data minimization, accessibility, and age-appropriate controls from the beginning.
- Require clear source provenance and educator review for generated curriculum changes.
- Add school-friendly retention, export, and deletion policies before classroom deployment.
- Evaluate learning outcomes with educators and students rather than relying on engagement metrics alone.

## Phase 4: Living Curricula

- Monitor trusted sources on learner- or educator-defined schedules.
- Use research and delta agents to rank changes by relevance, confidence, and likely learning impact.
- Suggest new paths when source changes expose prerequisites or adjacent interests.
- Maintain a curriculum changelog showing what changed, why, and which practice was scheduled.
- Support fast-moving technical fields first, then expand monitoring patterns to other domains.

## Explicitly not required for the MVP

- A general-purpose chat interface
- Streaks, leaderboards, or vanity engagement metrics
- A broad analytics dashboard
- Calendar integrations
- Voice simulation
- A browser extension
- Full school administration
- More decorative graph complexity

These may become useful later, but none proves Current's central claim as directly as a live, adaptive, source-grounded learning loop.

## Near-term build order

1. Finish Classroom visual and interaction validation for the Build Week demo.
2. Add learner profiles and age-appropriate interest collection.
3. Let teachers create classes and assign any Current learning path.
4. Persist rosters, assignments, approvals, and student progress across devices.
5. Add teacher-authored constraints for sources, objectives, reading level, and accommodations.
6. Pilot the misconception and differentiation workflow with educators before expanding analytics.
