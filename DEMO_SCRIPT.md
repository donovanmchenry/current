# Current Build Week Demo

Target runtime: 2 minutes 45 seconds. This leaves a 15-second buffer below the submission limit.

## Recording script

| Time | Screen action | Narration |
| --- | --- | --- |
| 0:00-0:15 | Open the Learning Map on the seeded AI agent engineering path. | "AI can explain almost anything, but explanations do not guarantee understanding, and fast-changing fields quickly make static courses stale. Current is a source-grounded learning workspace for lifelong learners." |
| 0:15-0:30 | Briefly show Map, List, and Updates, then open Compaction. | "Instead of another chat window, Current organizes subjects into living learning paths. Concepts remember progress and misconceptions, while research updates stay separate and inspectable." |
| 0:30-0:50 | In Read, open Sources and add the source-backed note. | "Each lesson begins with material grounded in sources the learner chose. This concept uses OpenAI's official compaction documentation, and useful claims remain linked to their source." |
| 0:50-1:20 | Enter Recall, submit the prepared incomplete answer, and reveal the evaluation and support choices. | "Recall removes the source and asks me to reconstruct the idea. Current routes this frequent check to GPT-5.6 Luna for efficient, low-latency feedback against a narrow source-backed rubric. It does not just mark this wrong; it preserves the missing relationship so the next activity can target it." |
| 1:20-1:40 | Choose Visual sequence, click Try again, and submit the prepared complete answer. | "Because I struggled, Current offers a visual sequence or concrete example. I can choose the support, retry, and the concept-level gap clears only when I can explain the complete flow." |
| 1:40-2:00 | Complete the Apply interaction, enter Reflect, add the prepared reflection, and schedule review. | "Apply checks whether I can use the pattern, then reflection connects it to my own work. The result schedules spaced review, with a shorter interval when a concept required more support." |
| 2:00-2:23 | Return to the Map, open Updates, inspect the source delta, and apply it. | "Current also keeps learning paths current. A research update shows the old and new evidence, names the affected concepts, and requires approval before changing the curriculum. Accepting it creates a review instead of silently rewriting the lesson." |
| 2:23-2:35 | Open New Path, choose Use sample, generate the path, then jump cut to the Sol-labeled outline. | "A learner can start another path from a subject, a goal, files, and links. Sol plans the curriculum, Terra authors each lesson, and Luna handles frequent coaching. This path was generated from the attached evaluation note, not seeded into the demo." |
| 2:35-2:45 | End on the full Learning Map. | "I built and refined Current in one continuous Codex task. Codex helped pressure-test the idea, rebuild the interface, implement the GPT-5.6 workflows and persistence, and verify the product with 23 automated tests. Current turns information into understanding that can keep changing with the field." |

## Prepared responses

Incomplete recall:

```text
Compaction makes a conversation smaller when it gets long.
```

Complete recall:

```text
When the context window crosses its configured threshold, compaction creates an opaque compact item that preserves the conversation state and reasoning needed for later turns. Send that item with the recent turns in the next request, or continue the chain with previous_response_id, instead of summarizing and pruning the history manually.
```

Reflection:

```text
I would use compaction in a long-running research agent so it can preserve decisions and tool context while keeping later requests within the context window.
```

## Recording preflight

1. Open the production deployment and choose **Reset demo** from the Learning Map.
2. Confirm the Compaction lesson opens at Read and no notes, reviews, or custom paths remain.
3. Confirm the recall result says **Evaluated by GPT-5.6 Luna**, not **Checked against the lesson**.
4. Keep the prepared responses available for quick paste and close unrelated browser tabs.
5. Record at a viewport where the learning path, lesson, and active side panel are readable without zooming.
6. Record the Use sample path generation separately and cut from the populated form to the Sol-labeled outline so the main take does not wait on generation.
7. Keep the exported video below 2:55, publish it publicly on YouTube, and verify audio before submitting.

## Submission checklist

- Select **Education** as the category.
- Link the public GitHub repository and confirm the MIT license is visible.
- Confirm README setup instructions work from a clean clone.
- Include the public YouTube URL for the sub-three-minute video.
- Mention both Codex and GPT-5.6 in the video audio.
- Run `/feedback` in the primary Codex task and add that session ID to the submission.
- Test the hosted URL in a signed-out browser window.
