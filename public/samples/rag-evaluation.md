# Evaluating retrieval-augmented generation

A retrieval-augmented generation system has two separable stages: retrieval selects evidence, then generation uses that evidence to answer. Evaluating only the final answer hides which stage failed.

## Retrieval quality

Retrieval evaluation asks whether the system found evidence that is relevant and sufficient for the question. Useful measures include recall at k, precision at k, and human judgments of whether the retrieved passages contain the facts needed for a correct answer.

## Answer quality

Answer evaluation asks whether the response is correct, useful, and faithful to the retrieved evidence. A fluent answer can still be unsupported. Faithfulness should therefore be evaluated separately from style and completeness.

## A small evaluation set

Start with representative user questions, expected evidence, and a reference answer or scoring rubric. Include straightforward cases, ambiguous requests, missing-evidence cases, and questions whose answer changed when the source changed. Record retrieval and answer scores separately so improvements target the failing stage.
