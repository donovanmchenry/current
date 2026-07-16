# OpenAI Build Week Brainstorm

Date: 2026-07-14

## Current Thesis

Education is likely our highest-leverage category because the lived experience is close: student, intern, self-directed learner, and someone actively using AI to build and learn. The winning angle should not be "another AI tutor." It should feel like a learning operating system: an agent platform that helps a student convert messy inputs into durable mastery.

The product should combine:

- Active recall
- Spaced repetition
- Pomodoro-style focus cycles
- Learning style adaptation: hands-on, visual, verbal, physical, project-based
- A second-brain memory layer
- Agentic planning and reflection
- A complete, polished learning workflow

## Problem Framing

Students do not mainly need more content. They already have lectures, PDFs, docs, videos, notes, Discord threads, ChatGPT chats, homework, projects, and half-finished explanations.

The real problem: students struggle to turn all of that into retained understanding, consistent practice, and confidence under pressure.

This can expand beyond traditional students. Everyone is becoming a lifelong learner because fields change faster than static curricula can keep up. Students, interns, engineers, founders, creators, and professionals all need to continuously update what they know, remember what matters, and practice in the format that actually works for them.

Current AI study tools often stop at summarization, flashcards, or chat. That is useful but shallow. A stronger product would close the loop:

1. Ingest what the student is learning.
2. Identify concepts, prerequisites, weak spots, deadlines, and goals.
3. Build a personalized study plan.
4. Run focused sessions using evidence-based techniques.
5. Test recall without giving away answers too early.
6. Update the student's second brain based on performance.
7. Schedule the next review at the right time.
8. Adapt the format to how the student learns best.

## Product Direction

Working title ideas:

Selected product name:

- Current

Naming principle:

Use "Current" as the simple product name. Avoid overloading the demo with too much product-specific vocabulary. The three-minute demo should be immediately understandable to judges, so labels should be plain: updates, sources, concepts, practice, notes, review, mastery, and sessions.

Core concept: an agentic second brain for students that turns courses, notes, docs, codebases, and projects into adaptive learning loops.

The user drops in course material or a learning goal. The system builds a living knowledge graph, generates active recall tasks, schedules spaced reviews, and runs focus sessions that adapt to the learner's mode.

Example user story:

"I have a data structures exam in 10 days and I also need to understand this internship repo. Help me learn graphs, dynamic programming, and the codebase without passively rereading notes."

The app responds with:

- A concept map of what matters
- A review queue
- A daily plan
- Pomodoro blocks
- Hands-on coding labs
- Visual explanations
- Oral/written recall prompts
- Misconception tracking
- A memory timeline showing what the learner has actually mastered

## Why This Is Better Than A Generic Tutor

A generic tutor answers questions. This product manages the learning loop.

A generic tutor explains. This product tests, schedules, remembers, adapts, and helps the student practice.

A generic tutor is conversation-first. This product is workflow-first, with chat as one surface inside a larger system.

A generic flashcard app creates cards. This product decides what needs to become a card, when to review it, whether the student truly recalled it, and what form the next practice should take.

## How To Use GPT-5.6 Strengths

We should be careful not to make unverifiable claims about model internals. For the demo, we can show model strengths through behavior:

- Long-context synthesis: ingest messy notes, syllabi, slides, docs, or code snippets and extract a coherent learning map.
- Reasoning: infer prerequisites, likely misconceptions, and next-best practice activities.
- Multimodal/adaptive explanation: turn the same concept into a visual explanation, Socratic dialogue, hands-on lab, analogy, or physical activity.
- Agentic tool use: delegate to specialized agents for mapping, scheduling, quizzing, lab creation, reflection, and progress tracking.
- Evaluation: grade free-form recall, explain why an answer is incomplete, and update mastery signals.
- Personalization: maintain a learner model over time instead of treating each prompt as a fresh chat.

Demo moment we want:

The student answers a recall prompt incorrectly. The system diagnoses the misconception, shifts into a different learning mode, creates a short practice task, updates the memory graph, and reschedules the concept.

## How To Use Codex Strengths

Codex should be visibly important to the project, not just mentioned in the demo script.

Strong Codex usage story:

- Build the full-stack product quickly from a blank repo.
- Generate and iterate on a rich product UI: dashboard, session runner, concept graph, review queue, agent timeline.
- Implement the agent architecture and tool contracts.
- Create realistic sample data for demo courses and internship/code learning scenarios.
- Add tests for scheduling, scoring, and agent workflows.
- Write the README, setup script, and demo seed flow.
- Use Codex sessions as a visible build log: design decisions, implementation, debugging, and polish.

Potential technical architecture:

- Frontend: Next.js or React app with a dense but polished student cockpit.
- Backend: Node/Express or Next API routes.
- Storage: SQLite or local JSON for hackathon speed; schema should still look real.
- AI layer: agent orchestration around learning tasks.
- Scheduler: spaced repetition algorithm such as SM-2 or a simplified FSRS-inspired scheduler.
- Visualization: concept graph, mastery heatmap, session timeline.
- Demo data: CS course, internship onboarding packet, or AP/college exam pack.

## Agent Platform Sketch

Specialist agents:

- Ingestion Agent: parses notes, syllabi, docs, or pasted code/context.
- Concept Mapper: extracts concepts, prerequisites, and relationships.
- Recall Coach: generates active recall prompts and evaluates answers.
- Spaced Review Scheduler: schedules concepts based on confidence, difficulty, and recall history.
- Focus Coach: builds Pomodoro study blocks with concrete tasks.
- Modality Adapter: transforms a concept into visual, hands-on, verbal, physical, or project-based practice.
- Misconception Tracker: stores recurring mistakes and triggers targeted remediation.
- Reflection Agent: summarizes each session and updates the learner model.

Important: the agents should not just be labels. The UI should show their actions in an agent timeline so judges can see the system thinking and coordinating.

## Core Screens

1. Study Cockpit

- Today's focus plan
- Upcoming deadlines
- Review queue
- Mastery trend
- Current weak spots

2. Knowledge Graph

- Concepts as nodes
- Prerequisite edges
- Mastery state
- Misconception markers
- Source references

3. Session Runner

- Pomodoro timer
- Current task
- Active recall prompt
- Answer box or voice-style transcript field
- Feedback after attempt, not before
- Mode switcher: visual, hands-on, Socratic, physical, project

4. Review Queue

- Spaced repetition schedule
- Due today / soon / later
- Difficulty and confidence
- Last mistake

5. Agent Timeline

- Shows what each agent did
- Makes Codex/GPT-5.6 usage feel concrete
- Useful for demo narration

## Wider Product Flow Decision

The course folder opens a Learning Map that connects the focused lesson loop to the learner's wider set of paths. The entire path header is the navigation target, rather than making the folder icon a small isolated control.

The Learning Map should remain useful rather than becoming an ornamental Obsidian-style node cloud:

- Path nodes show the fields the learner is actively pursuing.
- Concept nodes appear where they clarify prerequisites, overlap, or the next learning action.
- Edges represent specific relationships such as foundations, shared concepts, and research-backed recommendations.
- A Map/List segmented control provides both spatial exploration and a fast, accessible scanning view.
- Selecting a path reveals mastery, the next concept, and an action such as continuing or planning the next session.

Research agents are visible through concrete work rather than avatars or generic activity labels:

- Checking official sources
- Proposing a source-backed clarification
- Showing which concept and review schedule would change
- Suggesting a genuinely adjacent learning path based on concept overlap
- Adding approved paths directly to the graph

Current may research autonomously, but meaningful learning-path changes remain reviewable. The learner can apply, dismiss, or restore proposals, preserving trust while still demonstrating agentic behavior.

Recommended demo expansion:

1. Finish or pause the Compaction lesson.
2. Open the Learning Map from the path folder.
3. Review a source change found by the research agent.
4. Apply the clarification and see Compaction marked as updated.
5. Add the suggested Agent reliability path and see it connect to the graph.
6. Return directly to the Read, Recall, Apply, Reflect loop.

## MVP Scope

The hackathon MVP should avoid trying to become a full school platform. It should prove one tight loop extremely well.

Recommended MVP:

"A student uploads or pastes learning material. The app builds a concept graph, creates an adaptive review plan, and runs a 15-minute study session that uses active recall, modality switching, and spaced repetition updates."

Must-have features:

- Seed demo material
- Concept extraction
- Knowledge graph
- Active recall prompt generation
- Free-response answer grading
- Misconception diagnosis
- Review scheduling
- Pomodoro session runner
- Learning mode switcher
- Session summary

Nice-to-have features:

- Voice mode simulation
- Calendar export
- Browser extension
- Real document upload
- Codebase ingestion for interns
- Peer/teacher dashboard
- Long-term analytics

## Demo Narrative

Opening:

"Students do not need another chatbot that explains homework. They need a system that helps them remember, practice, and adapt over time."

Demo flow:

1. Pick a sample goal: "Master graph algorithms for an exam and internship code review."
2. Import notes or use seeded material.
3. Show generated concept graph.
4. Start a Pomodoro session.
5. Answer an active recall question incorrectly.
6. Show misconception diagnosis.
7. Switch to hands-on or visual mode.
8. Complete a short task.
9. Show updated mastery and spaced review schedule.
10. Show agent timeline and explain how GPT-5.6 and Codex were used.

## Risks

- Too broad: "learning operating system" could become vague if we do not choose a tight demo loop.
- Too familiar: flashcards, timers, and summaries already exist. The differentiation must be the closed-loop agent system.
- Learning styles are controversial if framed as fixed categories. Better framing: "practice modes" or "learning modalities" that adapt to the task and user preference.
- Judging risk: if the AI behavior is hidden behind generic chat, the implementation may look less impressive.
- Time risk: real uploads, auth, calendar integrations, and persistence can eat time without improving the demo.

## Sharper Positioning Options

Option A: Second Brain For Students

Broadest and most ambitious. Great story, but needs careful MVP control.

Option B: Adaptive Active Recall Agent

Tighter and more defensible. Focuses on evidence-based learning and mastery tracking.

Option C: Internship Learning OS

Most personal and differentiated. Helps interns learn a codebase, company docs, tickets, and new technical concepts through active recall and spaced repetition. Could blend Education and Developer Tools, but submission category can remain Education.

Option D: Exam-To-Mastery Coach

Most recognizable to judges. Turns a syllabus and notes into a 10-day mastery plan with sessions, quizzes, and review scheduling.

Current favorite: Option C or a hybrid of C + B.

Why: "student/intern" is our credibility edge. A codebase-aware learning system lets Codex matter naturally, while active recall and spaced repetition make it educational rather than just a developer tool.

## Previous Hackathon / Winner Research Notes

Need a cleaner pass on previous OpenAI-specific winners. Quick search did not surface a reliable canonical page of prior OpenAI Build Week winners.

Useful research leads:

- Devpost powers many hackathons and is where submissions/winners often live: https://devpost.com/
- Research on hackathon winners suggests strong teams use fast divergent/convergent design loops, specific problem framing, and demonstrable prototypes: https://arxiv.org/abs/2206.04744
- Research on hackathon code reuse suggests winning-grade projects often combine pre-existing scaffolding with meaningful new code, rather than building every piece from scratch: https://arxiv.org/abs/2103.01145
- A 2025 OpenAI-associated buildathon article highlighted practical, socially relevant projects across education, healthcare, legal, agriculture, and finance: https://timesofindia.indiatimes.com/city/vijayawada/over-1000-students-showcase-ai-innovations-at-vijayawada-buildathon/articleshow/125039487.cms

Research questions:

- What OpenAI Build Week or OpenAI-sponsored winners had the strongest demos?
- Did winners tend to build new interfaces, infrastructure/tools, or vertical workflows?
- How much did winning projects emphasize model capabilities versus product clarity?
- What made education winners feel credible and not generic?

## Next Decisions

1. Choose target user:

- College student preparing for exams
- CS student learning a hard topic
- New intern learning a codebase
- Teacher supporting students

2. Choose demo material:

- Algorithms and data structures
- Machine learning class
- Internship repo onboarding
- Biology / anatomy / other visually rich subject

3. Choose product spine:

- Study cockpit first
- Session runner first
- Knowledge graph first

4. Choose implementation stack:

- Fast full-stack web app
- Local-first demo with seeded data
- AI-backed calls with mock fallback for reproducible judging

## Current Recommendation

Build a polished web app called something like "LearnLoop" or "RecallOS":

An agentic second brain for students and interns that turns messy learning material into active recall sessions, spaced review schedules, and adaptive practice modes.

The demo should show a closed learning loop, not just content generation.

The strongest demo hook:

"Watch the system learn how I learn."

## Architecture Draft

Product spine:

"Trusted sources change -> research agent detects a knowledge delta -> curriculum patch updates concept graph -> learning engine turns patch into practice -> scheduler keeps it alive."

High-level system:

1. Source Layer

- Trusted source registry: docs pages, changelogs, GitHub releases, RSS feeds, course materials, uploaded notes, pasted URLs, repo files.
- Each source has type, trust level, refresh cadence, last checked time, and topic tags.
- For the MVP, use seeded technical sources and optionally one live fetch path.

2. Ingestion Layer

- Fetch or accept content.
- Normalize into documents and chunks.
- Extract metadata: title, source URL, date, version, topic, author/provider.
- Store source snapshots so the app can compare old vs new content.
- Keep citations attached to every generated learning object.

3. Knowledge Graph Layer

Core objects:

- Concept: "Responses API", "tool calling", "streaming events", "vector stores", "rate limits".
- Claim: a specific learnable statement tied to one or more sources.
- Edge: prerequisite, related, changed-by, contradicts, replaces.
- Mastery: user-specific confidence, recall history, difficulty, last reviewed, next review.
- Patch: a detected update that changes what the learner should know.

The graph is the product's memory. It is how the app knows what the user believes, what changed, and what needs practice.

4. Agent Orchestration Layer

Specialized agents:

- Research Agent: checks trusted sources for important updates.
- Delta Agent: compares new source snapshots against the current knowledge graph.
- Curriculum Patch Agent: turns deltas into concept/claim updates.
- Concept Mapper: maintains prerequisites and relationships.
- Recall Coach: generates active recall prompts and grades free-response answers.
- Practice Mode Agent: creates visual, Socratic, hands-on, project-based, or concise explanation tasks.
- Scheduler Agent: updates spaced repetition timing.
- Reflection Agent: summarizes sessions and updates the learner model.

Implementation note:

Agents should emit structured events, not just chat text. The UI can show these events in an agent timeline.

5. Learning Engine

Responsibilities:

- Generate active recall prompts from concepts and patches.
- Grade answers against rubrics and source-backed claims.
- Detect misconceptions.
- Update mastery state.
- Schedule future reviews using SM-2 or simplified FSRS-inspired logic.
- Pick next practice mode based on performance, task type, and user preference.

Important framing:

Use "adaptive practice modes" rather than fixed "learning styles." The system adapts based on outcomes.

6. Application Backend

Likely MVP stack:

- Next.js app with API routes, or React + Node/Express.
- SQLite for local-first persistence.
- Optional vector search later; for MVP, structured data and keyword/source matching may be enough.
- AI calls return structured JSON with strict schemas.
- Mock fallback data for reproducible demo and judging.

Suggested tables:

- users
- interests
- sources
- source_snapshots
- documents
- chunks
- concepts
- concept_edges
- claims
- patches
- review_items
- attempts
- study_sessions
- agent_events

7. Frontend Surfaces

Study Cockpit:

- Today's patches
- Due reviews
- Mastery trend
- Watched fields
- Next recommended session

Watchlist:

- Fields/topics the learner cares about
- Trusted sources being monitored
- Last checked
- New changes detected

Patch Review:

- "What changed"
- "Why it matters"
- Source citations
- Concepts affected
- Suggested practice

Knowledge Graph:

- Concepts and relationships
- Mastery state
- Stale or updated concepts
- Source-backed claims

Study Session:

- Pomodoro timer
- Active recall prompt
- Answer input
- Feedback after attempt
- Practice mode switcher
- Next review date

Agent Timeline:

- Research started
- Sources checked
- Delta detected
- Patch created
- Recall prompt generated
- Mastery updated

8. Demo Architecture

The demo should use a controlled scenario:

- User watches "OpenAI API / AI engineering".
- User has stale notes or a stale concept graph.
- Source update appears in trusted source data.
- Research Agent detects the update.
- Delta Agent explains the difference between old knowledge and new source.
- Curriculum Patch Agent updates the graph.
- Recall Coach tests the user.
- User gives a partially wrong answer.
- Practice Mode Agent switches to hands-on or visual mode.
- Scheduler Agent sets the next review.
- Agent Timeline shows the full chain.

9. MVP Build Order

Phase 1: Static but convincing product shell

- Create polished UI with seeded data.
- Show cockpit, patch review, graph, study session, timeline.

Phase 2: Real learning engine

- Implement review scheduling.
- Implement answer grading with structured AI output or deterministic demo rubrics.
- Persist attempts and mastery changes.

Phase 3: Agent workflow

- Implement agent event pipeline.
- Create patch generation from a source snapshot delta.
- Show source citations and audit trail.

Phase 4: Live-ish research

- Add one real source connector or simulated trusted-source refresh.
- Keep a mock fallback so the demo never fails.

Phase 5: Polish and submission

- README, seed script, demo script, sample data, tests.
- Explicit Codex/GPT-5.6 build story.

## Architectural Principle

Do not make the app look like chat with extra buttons.

The architecture should make learning state visible:

- What does the learner know?
- What changed in the field?
- What knowledge got patched?
- What should they practice now?
- What will the system revisit later?

If those questions are visible in the UI, the project will feel like a real product rather than a thin AI wrapper.

## Design Flow / User Flow Draft

Design principle:

The app should feel like an interactive learning workspace, not a chat app. The system should throw useful learning objects at the user: short readings, highlighted deltas, notepad prompts, multiple-choice checks, true/false checks, open-ended recall, hands-on tasks, and scheduled reviews.

Core UI metaphor:

"A learning cockpit with modular panes."

Possible layout:

- Left rail: fields, sources, sessions, review queue, knowledge graph.
- Main workspace: current module, reading, patch, task, or question.
- Right pane: notepad, citations, concept context, agent timeline, mastery updates.
- Bottom/session bar: timer, progress, next action, review status.

Avoid:

- A single chat thread as the center of the product.
- Long AI-generated walls of text.
- Passive summaries without immediate interaction.
- Hiding the agent workflow.

## Primary User Flow

Flow: "Learn what changed and make it stick."

1. Onboarding / Field Setup

User chooses fields they care about:

- OpenAI API
- AI engineering
- Next.js
- Cybersecurity
- Machine learning
- Course-specific topics

User selects goals:

- Stay current
- Prepare for exam
- Learn for internship
- Build project skill
- Maintain professional knowledge

User chooses trusted sources:

- Official docs
- Changelogs
- GitHub releases
- Course materials
- Uploaded notes
- Curated feeds

2. Cockpit

The user lands on a dashboard showing:

- New curriculum patches detected
- Due reviews
- Current mastery map
- Stale concepts
- Suggested next session
- Watched sources and last refresh

Primary CTA:

"Start 15-minute update session"

3. Patch Review

The system presents one important update:

- What changed
- Why it matters
- Old understanding vs new understanding
- Concepts affected
- Source citations
- Estimated learning effort

The user can:

- Accept patch
- Save for later
- Ask for simpler explanation
- Start practice

4. Reading Module

The app gives a short, focused reading:

- 2-5 paragraphs max
- Key terms highlighted
- Source citations inline
- "What to notice" callouts
- Notepad prompt on the side

Notepad examples:

- "Write the difference in your own words."
- "What would break if you used the old approach?"
- "What is one example where this matters?"

5. Comprehension Checks

The system generates mixed checks:

- Multiple choice
- True / false
- Open-ended recall
- Explain-the-delta
- Spot-the-bug
- Match concept to source
- Rank steps in order

Important behavior:

- User answers before seeing explanation.
- Feedback references the source-backed claim.
- Wrong answers update misconception tracking.

6. Practice Task

For technical topics, the app should generate a small task:

- Update stale code to use the new API pattern.
- Identify which docs section supports the answer.
- Write a tiny function.
- Choose the correct migration path.
- Explain a code diff.

This is where Codex can matter in the product story.

7. Reflection / Mastery Update

After the session, the app summarizes:

- What changed in the learner's knowledge graph
- What the learner got right
- What misconceptions appeared
- What is scheduled for review
- What source changed the curriculum

8. Review Queue

The patch becomes durable memory:

- Concepts become review items.
- Reviews are scheduled using spaced repetition.
- The next session mixes older weak concepts with new field updates.

## Secondary User Flows

Flow: "I found something I want to learn."

1. User pastes a link, doc, note, or repo snippet.
2. Ingestion Agent extracts concepts and claims.
3. App asks what goal this supports.
4. Concept Mapper adds it to the graph.
5. Learning Engine creates a mini-session.

Flow: "I have 10 minutes."

1. User clicks quick session.
2. App picks one due review and one new patch.
3. User completes a compressed reading + recall + task loop.
4. Scheduler updates next review.

Flow: "Show me why this matters."

1. User opens a patch.
2. App shows source delta, affected concepts, and practical implications.
3. User can switch mode: concise, visual, hands-on, Socratic, project task.

Flow: "Audit my learning."

1. User opens knowledge graph.
2. App shows mastered, weak, stale, and newly patched concepts.
3. User clicks any node to see source history, attempts, notes, and scheduled reviews.

## Screen-Level Design Notes

Study Cockpit:

- Dense, calm, glanceable.
- Not a marketing dashboard.
- Should feel like a daily operating panel.

Patch Card:

- Title
- Source
- Change type: new, updated, deprecated, contradicted, best-practice shift
- Confidence / source trust
- Concepts affected
- Start practice button

Reading Pane:

- Short text blocks
- Highlighted claims
- Citation chips
- "Add to notes" affordance
- Adjacent notepad

Notepad:

- Plain text by default
- Can be promoted into a saved note
- Can be turned into recall prompts
- Can be compared against source-backed answer after submission

Question Module:

- Stable layout for multiple question types
- Explanation appears after attempt
- Shows related concept and mastery impact

Task Module:

- For code/API topics, include code snippets or mini diffs.
- For non-code topics, include scenario tasks, classification, ordering, or applied examples.

Agent Timeline:

- Compact event feed, not noisy logs.
- Shows enough to prove the system is agentic.
- Useful labels: "Checked docs", "Detected delta", "Created patch", "Generated recall", "Updated mastery".

## Design Demo Flow

Demo scenario:

User is tracking AI engineering / OpenAI API.

1. Cockpit shows "2 new curriculum patches."
2. User opens a patch: "Tool-calling response format changed" or similar seeded example.
3. Patch review shows old note vs new source-backed claim.
4. User enters a 15-minute session.
5. App gives a short reading.
6. User writes a quick note in the notepad.
7. App asks a multiple-choice question.
8. App asks an open-ended "explain the delta" prompt.
9. User makes a partial mistake.
10. App diagnoses misconception and gives a hands-on code task.
11. User completes task.
12. Mastery updates and next review is scheduled.
13. Agent timeline shows the full chain from research to review scheduling.

## Standout Pressure Test

Question: will the current ideas really stand out?

Honest answer: not enough if framed as "AI study app," "AI tutor," "second brain," or "smart flashcards." Those are crowded categories. The product needs a sharper, more surprising wedge.

The strongest differentiator may be the speed of change itself:

"A living learning system for fast-changing knowledge."

Instead of only helping a student remember static material, the system notices when the subject has changed, researches the latest reliable information, explains what changed, updates the learner's concept graph, and creates new active recall or practice tasks.

Expanded positioning:

"A personal learning agent for lifelong learners that adapts to how you learn and keeps up with the fields you care about."

This moves the product beyond school while still fitting the Education category. The user is not only "a student before an exam"; the user is anyone trying to stay sharp in a changing domain.

This is especially strong for:

- AI / machine learning
- Software engineering
- APIs and developer tools
- Cybersecurity
- Medicine / health policy, if handled carefully
- Law / policy, if handled carefully
- Any class where lectures lag behind the field

Potential positioning:

"Most study tools help you remember yesterday's curriculum. This one keeps your curriculum alive."

Or:

"A research agent plus memory system for learning fields that will not sit still."

## Research Agent Idea

Core loop:

1. Student chooses a learning goal or imports existing notes.
2. System builds a concept graph and study plan.
3. Research Agent checks for recent changes from trusted sources.
4. Delta Agent identifies what changed compared with the student's current knowledge base.
5. Recall Coach creates active recall prompts specifically around the deltas.
6. Scheduler adds those concepts to the spaced repetition queue.
7. Session Runner teaches the update in the user's preferred practice mode.

Example:

The student is learning the OpenAI API or Next.js. The system checks docs, changelogs, release notes, and examples. It tells the student: "Your notes say X, but the latest docs recommend Y. Here is the difference, here is why it matters, and here is a 10-minute hands-on exercise."

Why this could stand out:

- It turns "latest information" into a learning workflow, not just search results.
- It creates a memorable demo moment: stale note -> research -> detected update -> revised concept graph -> new recall task.
- It uses GPT-5.6 strengths naturally: synthesis, reasoning, evaluating source relevance, explaining deltas, generating practice.
- It uses Codex strengths naturally if we focus on software/API learning: Codex can help implement the app and also power code-oriented labs, examples, tests, and repo-aware learning.

Risks:

- Needs trustworthy sourcing; "latest" cannot mean random web summaries.
- Could become too broad if it supports every subject.
- The demo must show a concrete before/after update, not merely "the agent searched the web."

Best version:

Focus on fast-changing technical education for students and interns.

"An AI learning OS that keeps your study plan current with the latest docs, release notes, and course materials, then uses active recall and spaced repetition to make the updates stick."

Alternate broader version:

"An AI learning OS for lifelong learners that tracks your interests, watches trusted sources for important changes, and turns new information into personalized practice."

The broad story is lifelong learning. The demo should still be specific, likely technical learning, because specificity makes the product credible.

## Staleness / Competitive Landscape

As of 2026-07-14, the broad idea is crowded. The wedge must be sharper than "AI tutor," "AI flashcards," "document summarizer," or "second brain."

What already exists:

- Spaced repetition and active recall are mature. Anki, SuperMemo, Quizlet, RemNote, Brainscape, Gizmo, and others already cover parts of this space.
- AI-generated study materials are common. Quizlet has AI-powered study features and course-oriented study experiences. Gizmo markets AI quizzes plus conversion from YouTube, PDFs, notes, and PowerPoints into flashcards. NotebookLM added flashcards, quizzes, learning guides, and source-grounded study tools.
- Personalized AI tutors are an active research and product category. Systems like PAPPL and other intelligent tutoring frameworks already use learner models, hints, analytics, and misconception tracking.
- Deep research agents already exist. OpenAI Deep Research, Gemini Deep Research, Perplexity-style research tools, and many open-source deep-research agents can already browse, synthesize sources, and generate reports.

Sources / leads:

- Anki and spaced repetition: https://en.wikipedia.org/wiki/Anki
- Flashcard software AI comparison: https://en.wikipedia.org/wiki/List_of_flashcard_software
- Quizlet product direction and AI expansion: https://en.wikipedia.org/wiki/Quizlet
- Gizmo study tooling: https://gizmo.ai/
- NotebookLM study tools: https://www.techlearning.com/news/6-new-features-added-to-google-notebooklm
- NotebookLM mobile flashcards and quizzes: https://www.androidcentral.com/apps-software/ai/notebooklm-is-becoming-a-better-android-study-tool-with-flashcards-and-quizzes
- OpenAI Deep Research: https://en.wikipedia.org/wiki/ChatGPT_Deep_Research
- Personalized AI-Powered Progressive Learning Platform: https://arxiv.org/abs/2508.14109
- KG-RAG adaptive tutor: https://arxiv.org/abs/2311.17696

Conclusion:

The idea is stale if it is:

- "Chat with your notes"
- "Generate flashcards from PDFs"
- "AI tutor that adapts to learning styles"
- "Second brain for students"
- "Research assistant for learners"

The idea is not stale if it becomes:

"A curriculum-change detector and mastery engine for fast-moving fields."

In other words, the product should not merely help people learn content. It should notice when a learner's knowledge is out of date, explain the delta, patch the concept graph, and convert the update into durable practice.

This is the memorable wedge:

1. Track fields the user cares about.
2. Watch trusted sources.
3. Detect meaningful changes.
4. Compare those changes against the user's current knowledge graph.
5. Generate a "curriculum patch."
6. Teach the patch through active recall, hands-on work, and spaced repetition.
7. Keep an audit trail of sources and mastery changes.

Potential phrasing:

"Duolingo for staying current in fast-moving fields."

"Anki plus Deep Research, but for curriculum updates instead of static facts."

"A living curriculum that patches your knowledge when the field changes."

Important learning-science caveat:

Avoid claiming fixed "learning styles" in the VARK sense. That framing is scientifically weak and could hurt credibility. Better language:

- adaptive practice modes
- multimodal explanations
- evidence-based study strategies
- learner preference and performance feedback
- strategy selection based on outcomes, not personality labels

The product can still adapt between visual, hands-on, verbal, Socratic, and project-based modes, but it should do that because the task and performance data call for it, not because the user is permanently labeled as a "visual learner."

## OpenAI-Themed UI

An OpenAI-inspired UI could help the project feel native to the Build Week context, but it should be tasteful and product-specific rather than looking like an official OpenAI product.

Good direction:

- Clean, restrained, high-trust interface
- Agent timeline inspired by Codex task logs
- Study cockpit with a model/workbench feel
- Subtle green/neutral accent palette
- Clear "built with OpenAI + Codex" demo affordances
- UI language that feels like a learning lab or research console

Avoid:

- Using official OpenAI logos as if the project is made by OpenAI
- Making the UI a generic ChatGPT clone
- Letting theme overpower product clarity

Potential visual metaphor:

"Codex for your brain": a calm agent workspace where learning tasks, research updates, recall prompts, and mastery changes happen in visible, inspectable threads.

## Second-Pass Product Reset

The first implementation missed the product thesis. It presented Current as a generic light-mode SaaS dashboard with synthetic metrics, streaks, update cards, and an agent trail. Those elements made the prototype look broad before it proved that the learning experience itself was useful.

The revised MVP starts inside the act of learning:

- OpenAI / ChatGPT-inspired dark mode, without copying official branding.
- A concept path on the left, one active learning module in the center, and a persistent notebook on the right.
- Four explicit modes: Read, Recall, Apply, and Reflect.
- Source-grounded material from official OpenAI documentation.
- Real adaptation: a weak recall answer offers a visual sequence or a concrete example before retrying.
- Hands-on application that checks an actual Responses API compaction configuration.
- No fake streaks, vanity mastery percentages, decorative agent logs, or dashboard as the first screen.

The three-minute demo should prove one claim: Current does not merely answer questions about a topic. It structures the work required to understand it, notices the missing link, and changes the next learning interaction accordingly.

## Learning Map Usability Pass

The learning map should expose decisions, not simulate background intelligence. The graph is therefore limited to learning paths the user can select, continue, or queue; concept-level nodes should only return when they have a distinct concept workflow.

Agent work appears as inspectable outputs with sources and explicit choices. Accepted updates schedule real review work, path suggestions can be added or dismissed, and those decisions persist across navigation and refresh. Indefinite spinners, decorative agent counts, and status text that cannot be verified do not belong in the MVP.

## User-Created Learning Paths

Creating a path is a primary workflow, not an agent suggestion disguised as one. The user starts from a structured surface in the Learning Map, names the subject, describes the outcome they want, and adds up to four public links and four PDF or text-based files. Current generates a five-to-seven concept sequence with an objective for each concept, then requires the learner to review that outline before adding it.

Created paths persist locally with their concept objectives and source references. They appear in Map and List views, can be inspected, queued next, and removed with confirmation. GPT-5.6 Sol performs the source-grounded generation when an API key is configured; the no-key demo path derives its outline from action phrases, source headings, file headings, and conservative domain prerequisites.

User-created concepts now enter a dynamic Read, Recall, Apply, Reflect lesson generated from the path and its sources. Uploaded text is retained as a source snapshot for later lesson generation; preserving and reopening the original uploaded binary remains outside the MVP.

## Bounded Research Agent

The MVP research agent checks one stale linked source when the learning map becomes active. It prioritizes the active path, runs at most once per browser session, and pauses when another source update already awaits review. This keeps the behavior genuinely autonomous without creating an unbounded crawl, hidden token spend, or a pile of unattended proposals.

The agent uses the same inspectable evidence delta and apply-or-dismiss workflow as a manual source check. Scheduled server-side monitoring and notifications remain a post-MVP capability that will require durable hosted state rather than browser-local scheduling.
