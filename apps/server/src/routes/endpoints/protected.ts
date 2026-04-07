import { Elysia, t } from 'elysia';
import { concepts_db } from '../../db';

// 3. Create the Protected Plugin
export const privateRoutes = new Elysia({ prefix: '/private' })
    .onBeforeHandle(({ headers, set }) => {
        const devKey = process.env.DEVELOPER_API_KEY;
        const authHeader = headers['authorization'];

        if (!authHeader || authHeader !== `Bearer ${devKey}`) {
            set.status = 401;
            return { success: false, error: 'Unauthorized. Invalid API Key.' };
        }
    })

    // --- ROUTE 1: PREVIEW THE AI PROMPT (Testing) ---
    .get('/preview-prompt', async ({ query, set }) => {
        const { subject, chapter, subTopic } = query;

        try {
            // Fetch the concept seed from Turso
            const result = await concepts_db.execute({
                sql: `SELECT * FROM concepts WHERE subject = ? AND chapter = ? AND sub_topic = ?`,
                args: [subject, chapter, subTopic]
            });

            if (result.rows.length === 0) {
                set.status = 404;
                return { success: false, error: 'Concept seed not found in database.' };
            }

            const row = result.rows[0];
            
            // Reconstruct the JSON strings back into objects for clean formatting
            const conceptData = {
                core_principles: row.core_principles,
                key_formulas: JSON.parse(row.key_formulas as string),
                neet_traps: JSON.parse(row.neet_traps as string),
                distractor_concepts: JSON.parse(row.distractor_concepts as string)
            };

            // Build the exact system prompt you will send to Groq
            const systemPrompt = `You are an expert NEET Exam question setter for ${subject}.
Your task is to generate ONE highly accurate, difficult multiple-choice question for the topic: "${chapter} - ${subTopic}".

Use the following concept data to ground your question:
---
Core Principles: ${conceptData.core_principles}
Key Formulas/Pathways: ${conceptData.key_formulas.join(', ')}
NEET Traps to Test: ${conceptData.neet_traps.join(' | ')}
Distractor Concepts (Use these to build wrong options): ${conceptData.distractor_concepts.join(' | ')}
---

REQUIREMENTS:
1. Create a challenging question based on the concept.
2. Provide exactly 4 options. 1 must be correct, 3 must be plausible but incorrect distractors.
3. Provide a clear explanation of why the answer is correct and why the distractors are wrong.
4. YOU MUST RETURN STRICT VALID JSON ONLY. NO MARKDOWN. NO INTRODUCTIONS.

JSON FORMAT:
{
  "question": "The question text here...",
  "options": [
    {"text": "Option A", "isCorrect": false}, ...
  ],
  "explanation": "Detailed explanation here..."
}`;

            return { success: true, prompt: systemPrompt };

        } catch (error) {
            console.error(error);
            set.status = 500;
            return { success: false, error: 'Database query failed' };
        }
    }, {
        // Enforce strong typing for incoming queries
        query: t.Object({
            subject: t.String(),
            chapter: t.String(),
            subTopic: t.String()
        })
    })