# Current Build Week Demo

Target runtime: 2 minutes 50 seconds. This leaves a 10-second buffer below the submission limit.

## Recording script

| Time | Screen action | Narration |
| --- | --- | --- |
| 0:00-0:12 | Open the Learning Map on the seeded AI agent engineering path. | "AI can explain almost anything, but explanations do not guarantee understanding, and fast-changing fields quickly make static courses stale. Current is a source-grounded learning workspace." |
| 0:12-0:30 | Open Compaction, show the source-backed Read material, and add the note. | "Instead of another chat window, Current organizes knowledge into living learning paths. Each lesson begins with material grounded in sources the learner can inspect." |
| 0:30-0:55 | Enter Recall, submit the prepared incomplete answer, and reveal the evaluation. | "Recall removes the source and asks me to reconstruct the idea. Luna checks a narrow rubric, then preserves the exact missing relationship instead of simply marking the answer wrong." |
| 0:55-1:10 | Choose Visual sequence, retry, and submit the prepared complete answer. | "Current changes the support, not the objective. The gap clears only when I can explain the complete flow." |
| 1:10-1:25 | Complete Apply, enter Reflect, and schedule review. | "Apply checks transfer, reflection connects the concept to my work, and the result schedules spaced review based on how much support I needed." |
| 1:25-1:40 | Return to Updates, inspect the source delta, and apply it. | "A research agent can detect changed evidence, but updates stay inspectable and require approval before they patch the curriculum." |
| 1:40-1:50 | Open New Path, choose Use sample, then jump cut to the Sol-labeled outline. | "Sol can also plan a new source-grounded path from a goal, files, and links; this one came from the attached evaluation note." |
| 1:50-2:05 | Open Classroom, create a class from the sample roster, assign the new path, then jump cut to the seeded Algebra class. | "Current Classroom turns any learning path into a teacher-managed assignment. A teacher can create a roster, preserve one shared objective, and adapt the examples to each student's interests." |
| 2:05-2:20 | Choose Review group, assign the slope review, and launch Jordan's student session in a separate tab. | "Jordan needs help treating slope as a rate. Current gives him a separate assignment session using basketball scoring and unit labels without changing the class objective or rubric." |
| 2:20-2:34 | Jump cut to Jordan's completed recall, then return to the preserved Students view. | "His evidence returns to the teacher immediately. The misconception clears, mastery updates, and Jordan leaves the support cohort while every student's state remains isolated." |
| 2:34-2:45 | Open Classroom Updates and approve the proposed checkpoint. | "Research agents can propose a curriculum change and its class impact, but nothing reaches students until the teacher approves it. Approval creates the revised checkpoint and review queue." |
| 2:45-2:50 | End on the Classroom overview. | "I built Current in one continuous Codex task and routed planning, authoring, coaching, and research across GPT-5.6. Current helps every student go deeper without taking the teacher out of the loop." |

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

Classroom recall:

```text
Slope compares the change in output with the change in input. It is a rate per one unit, such as points per minute, so the units explain the relationship.
```

## Recording preflight

1. Open the production deployment and choose **Reset demo** from the Learning Map.
2. Confirm the Compaction lesson opens at Read and no notes, reviews, or custom paths remain.
3. Confirm the recall result says **Evaluated by GPT-5.6 Luna**, not **Checked against the lesson**.
4. Keep the prepared responses available for quick paste and close unrelated browser tabs.
5. Record at a viewport where the learning path, lesson, and active side panel are readable without zooming.
6. Confirm Classroom opens with Jordan selected and the pending update restored before recording that segment.
7. Record the Use sample path generation separately and cut from the populated form to the Sol-labeled outline so the main take does not wait on generation.
8. Keep the exported video below 2:55, publish it publicly on YouTube, and verify audio before submitting.

## Submission checklist

- Select **Education** as the category.
- Link the public GitHub repository and confirm the MIT license is visible.
- Confirm README setup instructions work from a clean clone.
- Include the public YouTube URL for the sub-three-minute video.
- Mention both Codex and GPT-5.6 in the video audio.
- Run `/feedback` in the primary Codex task and add that session ID to the submission.
- Test the hosted URL in a signed-out browser window.
