import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db, concepts_db } from '../db';
import {
  neetExam,
  neetExamAttempt,
  neetExamAttemptAnswer,
  neetExamOption,
  neetExamQuestion,
} from '../db/schema';

type BlueprintChapter = {
  chapter: string;
  questions_allocated: number;
  sub_topics: string[];
};

type Blueprint = {
  exam_config: {
    total_questions: number;
    subjects: string[];
  };
  blueprint: Record<string, BlueprintChapter[]>;
};

type ConceptRow = {
  id: number;
  subject: string;
  chapter: string;
  sub_topic: string;
  core_principles: string;
  key_formulas: string;
  neet_traps: string;
  distractor_concepts: string;
};

type GeneratedOption = {
  text: string;
  isCorrect: boolean;
};

type GeneratedQuestion = {
  question: string;
  options: GeneratedOption[];
  explanation: string;
  difficulty?: string;
};

type QueuedPlanItem = {
  subject: string;
  chapter: string;
  subTopic: string;
  count: number;
  concept: ConceptRow;
};

type JobProgress = {
  status: 'queued' | 'running' | 'completed' | 'failed';
  generatedCount: number;
  totalQuestions: number;
  failureReason?: string;
  examId: string;
  apiCalls: number;
  parseFailures: number;
};

type ExamType = 'full' | 'chapter';

const BLUEPRINT_PATH = new URL('../../public/neet_blueprint.json', import.meta.url);
const DEFAULT_SUBJECT_QUESTION_COUNT = 45;
const DEFAULT_TOTAL_QUESTIONS = 180;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const LOG_DIR = new URL('../../logs/', import.meta.url);
const LOG_FILE = new URL('neet-generation.log', LOG_DIR);
const PARSE_ERROR_LOG_FILE = new URL('neet-generation-parse-errors.log', LOG_DIR);
const IS_DEV_LOGGING = process.env.NODE_ENV === 'development';
const GROQ_MAX_RPM_PER_KEY = 15;
const GROQ_MAX_TPM_PER_KEY = 12_000;
const GROQ_MIN_INTERVAL_MS = 4100;
const GROQ_WINDOW_MS = 60_000;
const ACTIVE_CHAPTER_GENERATION_CONSTRAINT = 'neet_exam_active_chapter_generation_uidx';

let blueprintCache: Blueprint | null = null;

const jobProgressMap = new Map<string, JobProgress>();
const jobProgressByJobId = new Map<string, JobProgress>();

const groqKeys = [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_ALT].filter(
  (key): key is string => Boolean(key),
);

let groqRoundRobinIndex = 0;
const groqKeyState = new Map<
  string,
  {
    lastCalledAt: number;
    minuteWindowStart: number;
    requestCount: number;
    tokenCount: number;
  }
>();

function hashConcept(concept: ConceptRow) {
  return createHash('sha256')
    .update(`${concept.subject}|${concept.chapter}|${concept.sub_topic}|${concept.core_principles}`)
    .digest('hex');
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureLogDir() {
  if (!IS_DEV_LOGGING) return;
  await mkdir(LOG_DIR, { recursive: true });
}

function sanitizeForLog(value: string, maxLength = 4000) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...<truncated>`;
}

function isConstraintUniqueViolation(error: unknown, constraint: string) {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as {
    code?: string;
    constraint?: string;
    message?: string;
    detail?: string;
  };

  if (candidate.code !== '23505') return false;

  return (
    candidate.constraint === constraint ||
    candidate.message?.includes(constraint) === true ||
    candidate.detail?.includes(constraint) === true
  );
}

async function writeStructuredLog(event: string, payload: Record<string, unknown>) {
  if (!IS_DEV_LOGGING) return;
  await ensureLogDir();
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    event,
    ...payload,
  });
  await appendFile(LOG_FILE, `${line}\n`, 'utf8');
}

async function writeParseErrorLog(payload: Record<string, unknown>) {
  if (!IS_DEV_LOGGING) return;
  await ensureLogDir();
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    event: 'parse_error',
    ...payload,
  });
  await appendFile(PARSE_ERROR_LOG_FILE, `${line}\n`, 'utf8');
}

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function pickRandom<T>(items: T[]): T {
  return items[randomInt(items.length)] as T;
}

function normalizeQuestionKey(text: string) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function extractMarkdownCodeBlock(raw: string) {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return match?.[1]?.trim() ?? null;
}

function extractJsonObjectCandidate(raw: string) {
  const firstCurly = raw.indexOf('{');
  const lastCurly = raw.lastIndexOf('}');
  if (firstCurly >= 0 && lastCurly > firstCurly) {
    return raw.slice(firstCurly, lastCurly + 1);
  }
  return null;
}

function extractJsonArrayCandidate(raw: string) {
  const firstBracket = raw.indexOf('[');
  const lastBracket = raw.lastIndexOf(']');
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    return raw.slice(firstBracket, lastBracket + 1);
  }
  return null;
}

function parseJsonArrayLike(content: string): GeneratedQuestion[] {
  const trimmed = content.trim();

  const candidates = [trimmed];

  const markdownExtracted = extractMarkdownCodeBlock(trimmed);
  if (markdownExtracted) candidates.push(markdownExtracted);

  const objectCandidate = extractJsonObjectCandidate(trimmed);
  if (objectCandidate) candidates.push(objectCandidate);

  const arrayCandidate = extractJsonArrayCandidate(trimmed);
  if (arrayCandidate) candidates.push(arrayCandidate);

  if (markdownExtracted) {
    const nestedObjectCandidate = extractJsonObjectCandidate(markdownExtracted);
    if (nestedObjectCandidate) candidates.push(nestedObjectCandidate);
    const nestedArrayCandidate = extractJsonArrayCandidate(markdownExtracted);
    if (nestedArrayCandidate) candidates.push(nestedArrayCandidate);
  }

  const deduped = [...new Set(candidates)];
  for (const candidate of deduped) {
    const parsed = tryParseGenerated(candidate);
    if (parsed) return parsed;
  }

  throw new Error('Invalid JSON from model');
}

function tryParseGenerated(raw: string): GeneratedQuestion[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown;

    if (Array.isArray(parsed)) {
      return parsed as GeneratedQuestion[];
    }

    if (parsed && typeof parsed === 'object' && 'questions' in parsed) {
      const maybeQuestions = (parsed as { questions?: unknown }).questions;
      if (Array.isArray(maybeQuestions)) {
        return maybeQuestions as GeneratedQuestion[];
      }
    }

    return null;
  } catch {
    return null;
  }
}

function validateGeneratedQuestion(question: GeneratedQuestion): boolean {
  if (!question || typeof question !== 'object') return false;
  if (!question.question || typeof question.question !== 'string') return false;
  if (!question.explanation || typeof question.explanation !== 'string') return false;
  if (!Array.isArray(question.options) || question.options.length !== 4) return false;

  let correctCount = 0;
  for (const option of question.options) {
    if (!option || typeof option.text !== 'string' || typeof option.isCorrect !== 'boolean') {
      return false;
    }
    if (option.isCorrect) correctCount += 1;
  }

  return correctCount === 1;
}

async function loadBlueprint(): Promise<Blueprint> {
  if (blueprintCache) return blueprintCache;

  const raw = await readFile(BLUEPRINT_PATH, 'utf8');
  const parsed = JSON.parse(raw) as Blueprint;
  blueprintCache = parsed;
  return parsed;
}

async function fetchConceptsBySubjectAndChapter(subject: string, chapter: string): Promise<ConceptRow[]> {
  const result = await concepts_db.execute({
    sql: `SELECT id, subject, chapter, sub_topic, core_principles, key_formulas, neet_traps, distractor_concepts
          FROM concepts
          WHERE subject = ? AND chapter = ?`,
    args: [subject, chapter],
  });

  return result.rows as unknown as ConceptRow[];
}

async function fetchConceptsBySubject(subject: string): Promise<ConceptRow[]> {
  const result = await concepts_db.execute({
    sql: `SELECT id, subject, chapter, sub_topic, core_principles, key_formulas, neet_traps, distractor_concepts
          FROM concepts
          WHERE subject = ?`,
    args: [subject],
  });

  return result.rows as unknown as ConceptRow[];
}

function allocateAcrossChapters(chapters: BlueprintChapter[], target: number): Map<string, number> {
  const allocation = new Map<string, number>();
  for (const chapter of chapters) {
    allocation.set(chapter.chapter, 0);
  }

  const totalCapacity = chapters.reduce((sum, chapter) => sum + chapter.questions_allocated, 0);
  if (totalCapacity < target) {
    throw new Error(`Chapter capacity (${totalCapacity}) is lower than required target (${target})`);
  }

  let remaining = target;
  while (remaining > 0) {
    const eligible = chapters.filter((chapter) => {
      const current = allocation.get(chapter.chapter) ?? 0;
      return current < chapter.questions_allocated;
    });

    if (eligible.length === 0) {
      throw new Error('No eligible chapters left while allocating questions');
    }

    const weightedPool: BlueprintChapter[] = [];
    for (const chapter of eligible) {
      const current = allocation.get(chapter.chapter) ?? 0;
      const remainingCapacity = chapter.questions_allocated - current;
      for (let i = 0; i < remainingCapacity; i += 1) {
        weightedPool.push(chapter);
      }
    }

    const picked = pickRandom(weightedPool);
    allocation.set(picked.chapter, (allocation.get(picked.chapter) ?? 0) + 1);
    remaining -= 1;
  }

  return allocation;
}

function buildQuestionPrompt(concept: ConceptRow, requestedCount: number) {
  const keyFormulas = safeParseStringArray(concept.key_formulas);
  const neetTraps = safeParseStringArray(concept.neet_traps);
  const distractors = safeParseStringArray(concept.distractor_concepts);

  return `You are an expert NEET exam question setter for ${concept.subject}.
Generate ${requestedCount} challenging NEET-style MCQ questions for topic: "${concept.chapter} - ${concept.sub_topic}".

Use this seed data:
Core Principles: ${concept.core_principles}
Key Formulas/Pathways: ${keyFormulas.join(', ')}
NEET Traps: ${neetTraps.join(' | ')}
Distractor Concepts: ${distractors.join(' | ')}

Rules:
1. Return strictly valid JSON only.
2. Return object with key "questions" as array.
3. Each question must have exactly 4 options.
4. Exactly 1 option must be correct.
5. Keep language concise, NEET-level difficulty.
6. Provide a clear explanation.

JSON Schema:
{
  "questions": [
    {
      "question": "...",
      "options": [
        {"text": "...", "isCorrect": false},
        {"text": "...", "isCorrect": false},
        {"text": "...", "isCorrect": true},
        {"text": "...", "isCorrect": false}
      ],
      "explanation": "...",
      "difficulty": "medium"
    }
  ]
}`;
}

function safeParseStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) return parsed.filter((entry): entry is string => typeof entry === 'string');
    return [];
  } catch {
    return [];
  }
}

function estimateRequestTokens(prompt: string) {
  const chars = prompt.length;
  return Math.ceil(chars / 4) + 700;
}

function getOrInitKeyState(key: string) {
  const now = Date.now();
  const current = groqKeyState.get(key);

  if (!current) {
    const created = {
      lastCalledAt: 0,
      minuteWindowStart: now,
      requestCount: 0,
      tokenCount: 0,
    };
    groqKeyState.set(key, created);
    return created;
  }

  if (now - current.minuteWindowStart >= GROQ_WINDOW_MS) {
    current.minuteWindowStart = now;
    current.requestCount = 0;
    current.tokenCount = 0;
    groqKeyState.set(key, current);
  }

  return current;
}

async function nextGroqKey(): Promise<string> {
  if (groqKeys.length === 0) {
    throw new Error('Missing GROQ_API_KEY / GROQ_API_KEY_ALT');
  }

  const attempts = groqKeys.length;
  for (let i = 0; i < attempts; i += 1) {
    const idx = (groqRoundRobinIndex + i) % groqKeys.length;
    const key = groqKeys[idx] as string;
    const state = getOrInitKeyState(key);

    if (state.requestCount < GROQ_MAX_RPM_PER_KEY && state.tokenCount < GROQ_MAX_TPM_PER_KEY) {
      groqRoundRobinIndex = (idx + 1) % groqKeys.length;

      const now = Date.now();
      const waitMs = GROQ_MIN_INTERVAL_MS - (now - state.lastCalledAt);
      if (waitMs > 0) await sleep(waitMs);

      state.lastCalledAt = Date.now();
      groqKeyState.set(key, state);
      return key;
    }
  }

  const nextResetMs = Math.min(
    ...groqKeys.map((key) => {
      const state = getOrInitKeyState(key as string);
      return Math.max(0, state.minuteWindowStart + GROQ_WINDOW_MS - Date.now());
    }),
  );

  if (nextResetMs > 0) {
    await sleep(nextResetMs + 50);
  }

  return nextGroqKey();
}

async function generateQuestionsWithGroq(params: {
  concept: ConceptRow;
  count: number;
  examId: string;
  jobId: string;
  subject: string;
  chapter: string;
  subTopic: string;
  onApiCall: () => void;
  onParseFailure: () => void;
}): Promise<GeneratedQuestion[]> {
  const { concept, count, examId, jobId, subject, chapter, subTopic, onApiCall, onParseFailure } = params;
  const apiKey = await nextGroqKey();
  const prompt = buildQuestionPrompt(concept, count);
  const estimatedTokens = estimateRequestTokens(prompt);
  const keyState = getOrInitKeyState(apiKey);

  if (keyState.requestCount + 1 > GROQ_MAX_RPM_PER_KEY) {
    throw new Error('Groq per-key RPM limit reached for current window');
  }

  if (keyState.tokenCount + estimatedTokens > GROQ_MAX_TPM_PER_KEY) {
    throw new Error('Groq per-key TPM limit reached for current window');
  }

  keyState.requestCount += 1;
  keyState.tokenCount += estimatedTokens;
  groqKeyState.set(apiKey, keyState);

  await writeStructuredLog('groq_request_start', {
    examId,
    jobId,
    subject,
    chapter,
    subTopic,
    requestedCount: count,
    estimatedTokens,
    keyRequestCount: keyState.requestCount,
    keyTokenCount: keyState.tokenCount,
    model: GROQ_MODEL,
    apiKeySlot: apiKey === process.env.GROQ_API_KEY ? 'primary' : 'alternate',
  });

  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.5,
      messages: [
        {
          role: 'system',
          content: 'You generate strict JSON only for NEET questions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    onApiCall();
    await writeStructuredLog('groq_request_error', {
      examId,
      jobId,
      subject,
      chapter,
      subTopic,
      requestedCount: count,
      status: response.status,
      body: sanitizeForLog(errorText),
    });
    throw new Error(`Groq request failed: ${response.status} ${errorText}`);
  }

  onApiCall();

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    onParseFailure();
    await writeParseErrorLog({
      examId,
      jobId,
      subject,
      chapter,
      subTopic,
      requestedCount: count,
      parseStage: 'missing_content',
      prompt: sanitizeForLog(prompt),
      modelPayload: sanitizeForLog(JSON.stringify(payload)),
    });
    throw new Error('Groq response missing choices content');
  }

  await writeStructuredLog('groq_response_received', {
    examId,
    jobId,
    subject,
    chapter,
    subTopic,
    requestedCount: count,
    rawLength: content.length,
  });

  let parsed: GeneratedQuestion[] = [];
  try {
    parsed = parseJsonArrayLike(content);
  } catch (error) {
    onParseFailure();
    await writeParseErrorLog({
      examId,
      jobId,
      subject,
      chapter,
      subTopic,
      requestedCount: count,
      parseStage: 'json_parse',
      parseError: error instanceof Error ? error.message : 'Unknown parse error',
      prompt: sanitizeForLog(prompt),
      aiResponse: sanitizeForLog(content),
    });
    throw error;
  }

  const validated = parsed.filter(validateGeneratedQuestion);

  await writeStructuredLog('groq_response_parsed', {
    examId,
    jobId,
    subject,
    chapter,
    subTopic,
    requestedCount: count,
    parsedCount: parsed.length,
    validCount: validated.length,
  });

  if (validated.length !== parsed.length) {
    onParseFailure();
    await writeParseErrorLog({
      examId,
      jobId,
      subject,
      chapter,
      subTopic,
      requestedCount: count,
      parseStage: 'schema_validation',
      parsedCount: parsed.length,
      validCount: validated.length,
      prompt: sanitizeForLog(prompt),
      aiResponse: sanitizeForLog(content),
    });
  }

  return validated;
}

function distributeCountsAcrossConcepts(concepts: ConceptRow[], totalCount: number): Map<number, number> {
  const countByConcept = new Map<number, number>();
  if (concepts.length === 0 || totalCount === 0) return countByConcept;

  for (let i = 0; i < totalCount; i += 1) {
    const concept = pickRandom(concepts);
    countByConcept.set(concept.id, (countByConcept.get(concept.id) ?? 0) + 1);
  }

  return countByConcept;
}

async function buildGenerationPlanForSubject(
  subject: string,
  chapters: BlueprintChapter[],
  subjectQuestionTarget: number,
): Promise<QueuedPlanItem[]> {
  if (subjectQuestionTarget <= 0) return [];

  const chapterAllocation = allocateAcrossChapters(chapters, subjectQuestionTarget);
  const plan: QueuedPlanItem[] = [];

  for (const chapter of chapters) {
    const chapterCount = chapterAllocation.get(chapter.chapter) ?? 0;
    if (chapterCount <= 0) continue;

    const concepts = await fetchConceptsBySubjectAndChapter(subject, chapter.chapter);
    const allowedTopics = new Set(chapter.sub_topics);
    const eligibleConcepts = concepts.filter((concept) => allowedTopics.has(concept.sub_topic));
    const source = eligibleConcepts.length > 0 ? eligibleConcepts : concepts;

    if (source.length === 0) continue;

    const countByConcept = distributeCountsAcrossConcepts(source, chapterCount);

    for (const concept of source) {
      const conceptCount = countByConcept.get(concept.id) ?? 0;
      if (conceptCount <= 0) continue;

      plan.push({
        subject,
        chapter: concept.chapter,
        subTopic: concept.sub_topic,
        count: conceptCount,
        concept,
      });
    }
  }

  const plannedCount = plan.reduce((sum, item) => sum + item.count, 0);
  const shortfall = subjectQuestionTarget - plannedCount;

  if (shortfall > 0) {
    const fallbackConcepts = await fetchConceptsBySubject(subject);
    if (fallbackConcepts.length === 0) {
      throw new Error(`No fallback concepts available for subject ${subject}`);
    }

    const extraCountByConcept = distributeCountsAcrossConcepts(fallbackConcepts, shortfall);
    for (const concept of fallbackConcepts) {
      const conceptCount = extraCountByConcept.get(concept.id) ?? 0;
      if (conceptCount <= 0) continue;

      plan.push({
        subject,
        chapter: concept.chapter,
        subTopic: concept.sub_topic,
        count: conceptCount,
        concept,
      });
    }
  }

  return plan;
}

async function findActiveChapterGeneration(params: { subject: string; chapter: string }) {
  return db.query.neetExam.findFirst({
    where: and(
      eq(neetExam.examType, 'chapter'),
      eq(neetExam.scopeSubject, params.subject),
      eq(neetExam.scopeChapter, params.chapter),
      inArray(neetExam.status, ['queued', 'running']),
    ),
    orderBy: [desc(neetExam.createdAt)],
  });
}

function buildSubjectTargets(subjects: string[], totalQuestions: number): Map<string, number> {
  const targets = new Map<string, number>();
  if (subjects.length === 0) return targets;

  const base = Math.floor(totalQuestions / subjects.length);
  let remainder = totalQuestions % subjects.length;

  for (const subject of subjects) {
    const plusOne = remainder > 0 ? 1 : 0;
    targets.set(subject, base + plusOne);
    if (remainder > 0) remainder -= 1;
  }

  return targets;
}

type PersistedQuestion = {
  subject: string;
  chapter: string;
  subTopic: string;
  questionText: string;
  explanation: string;
  difficulty?: string;
  sourceConceptId: number;
  sourceConceptHash: string;
  options: GeneratedOption[];
};

type PersistContext = {
  examId: string;
  jobId: string;
  examType: ExamType;
  totalQuestions: number;
};

function buildProgressUpdaters(examId: string, jobId: string) {
  return {
    onApiCall: () => {
      const progress = jobProgressMap.get(examId);
      if (progress) {
        progress.apiCalls += 1;
        jobProgressMap.set(examId, progress);
        jobProgressByJobId.set(jobId, progress);
      }
    },
    onParseFailure: () => {
      const progress = jobProgressMap.get(examId);
      if (progress) {
        progress.parseFailures += 1;
        jobProgressMap.set(examId, progress);
        jobProgressByJobId.set(jobId, progress);
      }
    },
  };
}

async function persistGeneratedQuestions(context: PersistContext, generated: PersistedQuestion[]) {
  const trimmed = generated.slice(0, context.totalQuestions);

  await db.transaction(async (tx) => {
    for (let i = 0; i < trimmed.length; i += 1) {
      const question = trimmed[i] as PersistedQuestion;
      const questionId = randomUUID();

      await tx.insert(neetExamQuestion).values({
        id: questionId,
        examId: context.examId,
        questionNumber: i + 1,
        subject: question.subject,
        chapter: question.chapter,
        subTopic: question.subTopic,
        questionText: question.questionText,
        explanation: question.explanation,
        difficulty: question.difficulty,
        sourceConceptId: question.sourceConceptId,
        sourceConceptHash: question.sourceConceptHash,
      });

      for (let optionIndex = 0; optionIndex < question.options.length; optionIndex += 1) {
        const option = question.options[optionIndex] as GeneratedOption;
        await tx.insert(neetExamOption).values({
          id: randomUUID(),
          questionId,
          optionIndex,
          optionText: option.text,
          isCorrect: option.isCorrect,
        });
      }
    }
  });

  await writeStructuredLog('job_generation_persisted', {
    examId: context.examId,
    jobId: context.jobId,
    examType: context.examType,
    persistedQuestions: trimmed.length,
  });
}

async function generateAndPersistFullExam(
  examId: string,
  jobId: string,
  totalQuestions = DEFAULT_TOTAL_QUESTIONS,
) {
  await writeStructuredLog('job_generation_started', {
    examId,
    jobId,
    totalQuestions,
  });

  const blueprint = await loadBlueprint();
  const subjectTargets =
    totalQuestions === DEFAULT_TOTAL_QUESTIONS
      ? new Map(blueprint.exam_config.subjects.map((subject) => [subject, DEFAULT_SUBJECT_QUESTION_COUNT]))
      : buildSubjectTargets(blueprint.exam_config.subjects, totalQuestions);

  await writeStructuredLog('job_subject_targets', {
    examId,
    jobId,
    totalQuestions,
    subjectTargets: Object.fromEntries(subjectTargets.entries()),
  });

  const plansBySubject: Record<string, QueuedPlanItem[]> = {};
  for (const subject of blueprint.exam_config.subjects) {
    const chapters = blueprint.blueprint[subject] || [];
    plansBySubject[subject] = await buildGenerationPlanForSubject(
      subject,
      chapters,
      subjectTargets.get(subject) ?? DEFAULT_SUBJECT_QUESTION_COUNT,
    );

    const planned = plansBySubject[subject]?.reduce((sum, item) => sum + item.count, 0) ?? 0;
    await writeStructuredLog('subject_plan_ready', {
      examId,
      jobId,
      subject,
      plannedQuestions: planned,
      planItems: plansBySubject[subject]?.length ?? 0,
    });
  }

  const generated: PersistedQuestion[] = [];
  const dedupe = new Set<string>();

  for (const subject of blueprint.exam_config.subjects) {
    const subjectTarget = subjectTargets.get(subject) ?? DEFAULT_SUBJECT_QUESTION_COUNT;
    const subjectPlan = plansBySubject[subject] || [];
    let subjectGeneratedCount = 0;

    for (const item of subjectPlan) {
      if (subjectGeneratedCount >= subjectTarget) break;

      const pending = Math.min(item.count, subjectTarget - subjectGeneratedCount);
      if (pending <= 0) continue;

      let batch: GeneratedQuestion[] = [];
      try {
        batch = await generateQuestionsWithGroq({
          concept: item.concept,
          count: pending,
          examId,
          jobId,
          subject: item.subject,
          chapter: item.chapter,
          subTopic: item.subTopic,
          onApiCall: () => {
            const progress = jobProgressMap.get(examId);
            if (progress) {
              progress.apiCalls += 1;
              jobProgressMap.set(examId, progress);
              jobProgressByJobId.set(jobId, progress);
            }
          },
          onParseFailure: () => {
            const progress = jobProgressMap.get(examId);
            if (progress) {
              progress.parseFailures += 1;
              jobProgressMap.set(examId, progress);
              jobProgressByJobId.set(jobId, progress);
            }
          },
        });
      } catch (error) {
        await writeStructuredLog('groq_batch_failed', {
          examId,
          jobId,
          subject: item.subject,
          chapter: item.chapter,
          subTopic: item.subTopic,
          requestedCount: pending,
          error: error instanceof Error ? error.message : 'Unknown generation error',
        });
        continue;
      }

      for (const question of batch) {
        if (subjectGeneratedCount >= subjectTarget) break;
        const dedupeKey = normalizeQuestionKey(question.question);
        if (dedupe.has(dedupeKey)) continue;
        if (!validateGeneratedQuestion(question)) continue;

        dedupe.add(dedupeKey);
        generated.push({
          subject: item.subject,
          chapter: item.chapter,
          subTopic: item.subTopic,
          questionText: question.question.trim(),
          explanation: question.explanation.trim(),
          difficulty: question.difficulty,
          sourceConceptId: item.concept.id,
          sourceConceptHash: hashConcept(item.concept),
          options: question.options,
        });
        subjectGeneratedCount += 1;

        const progress = jobProgressMap.get(examId);
        if (progress) {
          progress.generatedCount = generated.length;
          jobProgressMap.set(examId, progress);
          jobProgressByJobId.set(jobId, progress);
        }
      }
    }

    const shortfall = subjectTarget - subjectGeneratedCount;
    await writeStructuredLog('subject_generation_pass_complete', {
      examId,
      jobId,
      subject,
      target: subjectTarget,
      generated: subjectGeneratedCount,
      shortfall,
    });

    if (shortfall > 0) {
      const fallbackConcepts = await fetchConceptsBySubject(subject);
      for (let i = 0; i < shortfall; i += 1) {
        if (fallbackConcepts.length === 0) break;
        const concept = pickRandom(fallbackConcepts);
        try {
          const [one] = await generateQuestionsWithGroq({
            concept,
            count: 1,
            examId,
            jobId,
            subject,
            chapter: concept.chapter,
            subTopic: concept.sub_topic,
            onApiCall: () => {
              const progress = jobProgressMap.get(examId);
              if (progress) {
                progress.apiCalls += 1;
                jobProgressMap.set(examId, progress);
                jobProgressByJobId.set(jobId, progress);
              }
            },
            onParseFailure: () => {
              const progress = jobProgressMap.get(examId);
              if (progress) {
                progress.parseFailures += 1;
                jobProgressMap.set(examId, progress);
                jobProgressByJobId.set(jobId, progress);
              }
            },
          });
          if (!one || !validateGeneratedQuestion(one)) continue;

          const dedupeKey = normalizeQuestionKey(one.question);
          if (dedupe.has(dedupeKey)) continue;

          dedupe.add(dedupeKey);
          generated.push({
            subject,
            chapter: concept.chapter,
            subTopic: concept.sub_topic,
            questionText: one.question.trim(),
            explanation: one.explanation.trim(),
            difficulty: one.difficulty,
            sourceConceptId: concept.id,
            sourceConceptHash: hashConcept(concept),
            options: one.options,
          });
          subjectGeneratedCount += 1;

          const progress = jobProgressMap.get(examId);
          if (progress) {
            progress.generatedCount = generated.length;
            jobProgressMap.set(examId, progress);
            jobProgressByJobId.set(jobId, progress);
          }
        } catch (error) {
          await writeStructuredLog('groq_fallback_failed', {
            examId,
            jobId,
            subject,
            chapter: concept.chapter,
            subTopic: concept.sub_topic,
            requestedCount: 1,
            error: error instanceof Error ? error.message : 'Unknown fallback generation error',
          });
          continue;
        }
      }
    }
  }

  if (generated.length < totalQuestions) {
    await writeStructuredLog('job_generation_shortfall', {
      examId,
      jobId,
      generatedCount: generated.length,
      requiredCount: totalQuestions,
    });
    throw new Error(`Generated only ${generated.length} questions out of ${totalQuestions}`);
  }

  await persistGeneratedQuestions(
    { examId, jobId, examType: 'full', totalQuestions },
    generated,
  );
}

async function markExamFailed(examId: string, jobId: string, reason: string) {
  await db
    .update(neetExam)
    .set({
      status: 'failed',
      failureReason: reason.slice(0, 2000),
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(neetExam.id, examId));

  const progress = jobProgressMap.get(examId);
  if (progress) {
    progress.status = 'failed';
    progress.failureReason = reason;
    jobProgressMap.set(examId, progress);
    jobProgressByJobId.set(jobId, progress);
  }

  await writeStructuredLog('job_generation_failed', {
    examId,
    jobId,
    reason,
  });
}

async function generateAndPersistChapterExam(params: {
  examId: string;
  jobId: string;
  subject: string;
  chapter: string;
  totalQuestions: number;
}) {
  const { examId, jobId, subject, chapter, totalQuestions } = params;

  await writeStructuredLog('chapter_generation_started', {
    examId,
    jobId,
    subject,
    chapter,
    totalQuestions,
  });

  const concepts = await fetchConceptsBySubjectAndChapter(subject, chapter);
  if (concepts.length === 0) {
    throw new Error(`No concepts found for ${subject} - ${chapter}`);
  }

  const generated: PersistedQuestion[] = [];
  const dedupe = new Set<string>();
  const conceptQueue = [...concepts].sort(() => Math.random() - 0.5);

  const counters = buildProgressUpdaters(examId, jobId);

  let guard = 0;
  while (generated.length < totalQuestions && guard < totalQuestions * 8) {
    guard += 1;
    const concept = conceptQueue[(guard - 1) % conceptQueue.length] as ConceptRow;

    try {
      const batch = await generateQuestionsWithGroq({
        concept,
        count: 1,
        examId,
        jobId,
        subject,
        chapter,
        subTopic: concept.sub_topic,
        onApiCall: counters.onApiCall,
        onParseFailure: counters.onParseFailure,
      });

      const one = batch[0];
      if (!one || !validateGeneratedQuestion(one)) continue;

      const dedupeKey = normalizeQuestionKey(one.question);
      if (dedupe.has(dedupeKey)) continue;

      dedupe.add(dedupeKey);
      generated.push({
        subject,
        chapter,
        subTopic: concept.sub_topic,
        questionText: one.question.trim(),
        explanation: one.explanation.trim(),
        difficulty: one.difficulty,
        sourceConceptId: concept.id,
        sourceConceptHash: hashConcept(concept),
        options: one.options,
      });

      const progress = jobProgressMap.get(examId);
      if (progress) {
        progress.generatedCount = generated.length;
        jobProgressMap.set(examId, progress);
        jobProgressByJobId.set(jobId, progress);
      }
    } catch (error) {
      await writeStructuredLog('chapter_generation_attempt_failed', {
        examId,
        jobId,
        subject,
        chapter,
        attempt: guard,
        error: error instanceof Error ? error.message : 'Unknown chapter generation error',
      });
    }
  }

  if (generated.length < totalQuestions) {
    throw new Error(`Generated only ${generated.length} questions out of ${totalQuestions} for chapter exam`);
  }

  await persistGeneratedQuestions(
    { examId, jobId, examType: 'chapter', totalQuestions },
    generated,
  );

  await writeStructuredLog('chapter_generation_completed', {
    examId,
    jobId,
    subject,
    chapter,
    generatedCount: generated.length,
  });
}

export async function enqueueNeetGenerationJob(input: {
  jobId: string;
  testId?: string;
  totalQuestions?: number;
}) {
  const existing = await db.query.neetExam.findFirst({
    where: eq(neetExam.jobId, input.jobId),
  });

  if (existing) {
    await writeStructuredLog('job_reused', {
      examId: existing.id,
      jobId: existing.jobId,
      status: existing.status,
    });

    return {
      examId: existing.id,
      jobId: existing.jobId,
      status: existing.status,
      reused: true,
    };
  }

  const examId = randomUUID();
  const totalQuestions = input.totalQuestions ?? DEFAULT_TOTAL_QUESTIONS;
  if (totalQuestions <= 0) {
    throw new Error('totalQuestions must be greater than 0');
  }

  if (totalQuestions > DEFAULT_TOTAL_QUESTIONS) {
    throw new Error(`totalQuestions cannot exceed ${DEFAULT_TOTAL_QUESTIONS}`);
  }

  await db.insert(neetExam).values({
    id: examId,
    jobId: input.jobId,
    externalTestId: input.testId,
    examType: 'full',
    status: 'running',
    totalQuestions,
    startedAt: new Date(),
    blueprintVersion: 'neet_blueprint.json',
  });

  jobProgressMap.set(examId, {
    status: 'running',
    generatedCount: 0,
    totalQuestions,
    examId,
    apiCalls: 0,
    parseFailures: 0,
  });

  jobProgressByJobId.set(input.jobId, {
    status: 'running',
    generatedCount: 0,
    totalQuestions,
    examId,
    apiCalls: 0,
    parseFailures: 0,
  });

  await writeStructuredLog('job_enqueued', {
    examId,
    jobId: input.jobId,
    testId: input.testId ?? null,
    totalQuestions,
  });

  void (async () => {
    try {
      await generateAndPersistFullExam(examId, input.jobId, totalQuestions);
      await db
        .update(neetExam)
        .set({
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(neetExam.id, examId));

      const progress = jobProgressMap.get(examId);
      if (progress) {
        progress.status = 'completed';
        progress.generatedCount = totalQuestions;
        jobProgressMap.set(examId, progress);
        jobProgressByJobId.set(input.jobId, progress);

        await writeStructuredLog('job_generation_completed', {
          examId,
          jobId: input.jobId,
          generatedCount: progress.generatedCount,
          totalQuestions,
          apiCalls: progress.apiCalls,
          parseFailures: progress.parseFailures,
        });
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown generation error';
      await markExamFailed(examId, input.jobId, reason);
    }
  })();

  return {
    examId,
    jobId: input.jobId,
    status: 'running',
    reused: false,
  };
}

export async function enqueueChapterExamGenerationJob(input: {
  jobId: string;
  testId?: string;
  subject: string;
  chapter: string;
  totalQuestions: number;
}) {
  if (input.totalQuestions < 1 || input.totalQuestions > 15) {
    throw new Error('Chapter exam questions must be between 1 and 15');
  }

  const existing = await db.query.neetExam.findFirst({
    where: eq(neetExam.jobId, input.jobId),
  });

  if (existing) {
    await writeStructuredLog('job_reused', {
      examId: existing.id,
      jobId: existing.jobId,
      status: existing.status,
    });

    return {
      examId: existing.id,
      jobId: existing.jobId,
      status: existing.status,
      reused: true,
    };
  }

  const examId = randomUUID();

  try {
    await db.insert(neetExam).values({
      id: examId,
      jobId: input.jobId,
      externalTestId: input.testId,
      examType: 'chapter',
      scopeSubject: input.subject,
      scopeChapter: input.chapter,
      status: 'running',
      totalQuestions: input.totalQuestions,
      startedAt: new Date(),
      blueprintVersion: 'neet_blueprint.json',
    });
  } catch (error) {
    if (isConstraintUniqueViolation(error, ACTIVE_CHAPTER_GENERATION_CONSTRAINT)) {
      const active = await findActiveChapterGeneration({
        subject: input.subject,
        chapter: input.chapter,
      });

      if (active) {
        await writeStructuredLog('chapter_generation_reused_active', {
          examId: active.id,
          jobId: active.jobId,
          subject: input.subject,
          chapter: input.chapter,
        });

        return {
          examId: active.id,
          jobId: active.jobId,
          status: active.status,
          reused: true,
        };
      }
    }

    throw error;
  }

  const progress: JobProgress = {
    status: 'running',
    generatedCount: 0,
    totalQuestions: input.totalQuestions,
    examId,
    apiCalls: 0,
    parseFailures: 0,
  };

  jobProgressMap.set(examId, progress);
  jobProgressByJobId.set(input.jobId, progress);

  await writeStructuredLog('job_enqueued', {
    examId,
    jobId: input.jobId,
    examType: 'chapter',
    testId: input.testId ?? null,
    totalQuestions: input.totalQuestions,
    subject: input.subject,
    chapter: input.chapter,
  });

  void (async () => {
    try {
      await generateAndPersistChapterExam({
        examId,
        jobId: input.jobId,
        subject: input.subject,
        chapter: input.chapter,
        totalQuestions: input.totalQuestions,
      });

      await db
        .update(neetExam)
        .set({
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(neetExam.id, examId));

      const inMemory = jobProgressMap.get(examId);
      if (inMemory) {
        inMemory.status = 'completed';
        inMemory.generatedCount = input.totalQuestions;
        jobProgressMap.set(examId, inMemory);
        jobProgressByJobId.set(input.jobId, inMemory);
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown generation error';
      await markExamFailed(examId, input.jobId, reason);
    }
  })();

  return {
    examId,
    jobId: input.jobId,
    status: 'running',
    reused: false,
  };
}

export async function getNeetGenerationStatus(jobId: string) {
  const inMemoryByJob = jobProgressByJobId.get(jobId);

  const exam = await db.query.neetExam.findFirst({
    where: eq(neetExam.jobId, jobId),
  });

  if (!exam && inMemoryByJob) {
    return {
      examId: inMemoryByJob.examId,
      jobId,
      status: inMemoryByJob.status,
      generatedCount: inMemoryByJob.generatedCount,
      totalQuestions: inMemoryByJob.totalQuestions,
      apiCalls: inMemoryByJob.apiCalls,
      parseFailures: inMemoryByJob.parseFailures,
      failureReason: inMemoryByJob.failureReason,
      startedAt: null,
      completedAt: null,
    };
  }

  if (!exam) return null;

  const persistedQuestionCount = await db.query.neetExamQuestion.findMany({
    where: eq(neetExamQuestion.examId, exam.id),
    columns: { id: true },
  });

  const memoryProgress = jobProgressMap.get(exam.id);
  return {
    examId: exam.id,
    jobId: exam.jobId,
    status: memoryProgress?.status ?? exam.status,
    generatedCount: memoryProgress?.generatedCount ?? persistedQuestionCount.length,
    totalQuestions: exam.totalQuestions,
    apiCalls: memoryProgress?.apiCalls ?? 0,
    parseFailures: memoryProgress?.parseFailures ?? 0,
    failureReason: memoryProgress?.failureReason ?? exam.failureReason,
    startedAt: exam.startedAt,
    completedAt: exam.completedAt,
  };
}

export async function getLatestCompletedExamWithQuestions() {
  const exam = await db.query.neetExam.findFirst({
    where: and(eq(neetExam.status, 'completed'), eq(neetExam.examType, 'full')),
    orderBy: [desc(neetExam.createdAt)],
  });

  if (!exam) return null;

  const questions = await db.query.neetExamQuestion.findMany({
    where: eq(neetExamQuestion.examId, exam.id),
    orderBy: (table, { asc }) => [asc(table.questionNumber)],
    with: {
      options: {
        orderBy: (table, { asc }) => [asc(table.optionIndex)],
      },
    },
  });

  return {
    exam,
    questions,
  };
}

export async function getLatestCompletedChapterExams(limit = 20) {
  const exams = await db.query.neetExam.findMany({
    where: and(eq(neetExam.status, 'completed'), eq(neetExam.examType, 'chapter')),
    orderBy: [desc(neetExam.createdAt)],
    limit,
  });

  return exams.map((exam) => ({
    testId: exam.externalTestId ?? exam.id,
    examId: exam.id,
    subject: exam.scopeSubject,
    chapter: exam.scopeChapter,
    questions: exam.totalQuestions,
    createdAt: exam.createdAt,
  }));
}

export async function getLatestAttemptedExams(params: {
  userId: string;
  limit?: number;
}) {
  const attempts = await db.query.neetExamAttempt.findMany({
    where: and(eq(neetExamAttempt.userId, params.userId), eq(neetExamAttempt.status, 'submitted')),
    orderBy: [desc(neetExamAttempt.submittedAt), desc(neetExamAttempt.updatedAt)],
    limit: params.limit ?? 20,
    with: {
      exam: true,
    },
  });

  return attempts.map((attempt) => ({
    attemptId: attempt.id,
    examId: attempt.exam.id,
    testId: attempt.exam.externalTestId,
    examType: attempt.exam.examType,
    subject: attempt.exam.scopeSubject,
    chapter: attempt.exam.scopeChapter,
    questions: attempt.exam.totalQuestions,
    score: attempt.score,
    correctCount: attempt.correctCount,
    wrongCount: attempt.wrongCount,
    unattemptedCount: attempt.unattemptedCount,
    submittedAt: attempt.submittedAt,
    createdAt: attempt.exam.createdAt,
  }));
}

export async function getSubjectChaptersWithLatestTest(subject: string) {
  const concepts = await concepts_db.execute({
    sql: `SELECT DISTINCT chapter FROM concepts WHERE lower(subject) = lower(?) ORDER BY chapter ASC`,
    args: [subject],
  });

  const chapters = concepts.rows
    .map((row) => {
      const chapter = row.chapter;
      if (typeof chapter === 'string' && chapter.trim().length > 0) {
        return chapter.trim();
      }
      return null;
    })
    .filter((chapter): chapter is string => Boolean(chapter));

  const latestChapterExams = await db.query.neetExam.findMany({
    where: and(
      eq(neetExam.status, 'completed'),
      eq(neetExam.examType, 'chapter'),
      eq(neetExam.scopeSubject, subject),
    ),
    orderBy: [desc(neetExam.createdAt)],
  });

  const latestByChapter = new Map<string, (typeof latestChapterExams)[number]>();
  for (const exam of latestChapterExams) {
    const chapter = exam.scopeChapter;
    if (!chapter) continue;
    if (!latestByChapter.has(chapter)) {
      latestByChapter.set(chapter, exam);
    }
  }

  return chapters.map((chapter) => {
    const latest = latestByChapter.get(chapter);
    return {
      chapter,
      hasLatestTest: Boolean(latest),
      latestTestId: latest?.externalTestId ?? latest?.id ?? null,
      latestExamId: latest?.id ?? null,
      latestCreatedAt: latest?.createdAt ?? null,
    };
  });
}

export async function requestChapterExamForUser(params: {
  userId: string;
  subject: string;
  chapter: string;
  totalQuestions?: number;
}) {
  const attempts = await db.query.neetExamAttempt.findMany({
    where: and(eq(neetExamAttempt.userId, params.userId), eq(neetExamAttempt.status, 'submitted')),
    columns: {
      examId: true,
    },
  });

  const attemptedExamIds = new Set(attempts.map((attempt) => attempt.examId));

  const completedChapterExams = await db.query.neetExam.findMany({
    where: and(
      eq(neetExam.status, 'completed'),
      eq(neetExam.examType, 'chapter'),
      eq(neetExam.scopeSubject, params.subject),
      eq(neetExam.scopeChapter, params.chapter),
    ),
    orderBy: [desc(neetExam.createdAt)],
  });

  const unattemptedExam = completedChapterExams.find((exam) => !attemptedExamIds.has(exam.id));
  if (unattemptedExam) {
    return {
      status: 'ready' as const,
      source: 'existing_unattempted' as const,
      examId: unattemptedExam.id,
      jobId: null,
      subject: params.subject,
      chapter: params.chapter,
    };
  }

  const activeGeneration = await findActiveChapterGeneration({
    subject: params.subject,
    chapter: params.chapter,
  });

  if (activeGeneration) {
    return {
      status: 'generating' as const,
      source: 'active_generation' as const,
      examId: activeGeneration.id,
      jobId: activeGeneration.jobId,
      subject: params.subject,
      chapter: params.chapter,
    };
  }

  const queued = await enqueueChapterExamGenerationJob({
    jobId: randomUUID(),
    testId: randomUUID(),
    subject: params.subject,
    chapter: params.chapter,
    totalQuestions: params.totalQuestions ?? 15,
  });

  return {
    status: 'generating' as const,
    source: queued.reused ? ('active_generation' as const) : ('queued_generation' as const),
    examId: queued.examId,
    jobId: queued.jobId,
    subject: params.subject,
    chapter: params.chapter,
  };
}

export async function getChapterExamByTestId(testId: string) {
  const exam = await db.query.neetExam.findFirst({
    where: and(eq(neetExam.status, 'completed'), eq(neetExam.examType, 'chapter'), eq(neetExam.externalTestId, testId)),
  });

  if (!exam) return null;

  const questions = await db.query.neetExamQuestion.findMany({
    where: eq(neetExamQuestion.examId, exam.id),
    orderBy: (table, { asc }) => [asc(table.questionNumber)],
    with: {
      options: {
        orderBy: (table, { asc }) => [asc(table.optionIndex)],
      },
    },
  });

  return { exam, questions };
}

export async function getCompletedExamWithQuestionsByExamId(examId: string) {
  const exam = await db.query.neetExam.findFirst({
    where: and(eq(neetExam.status, 'completed'), eq(neetExam.id, examId)),
  });

  if (!exam) return null;

  const questions = await db.query.neetExamQuestion.findMany({
    where: eq(neetExamQuestion.examId, exam.id),
    orderBy: (table, { asc }) => [asc(table.questionNumber)],
    with: {
      options: {
        orderBy: (table, { asc }) => [asc(table.optionIndex)],
      },
    },
  });

  return { exam, questions };
}

export async function submitNeetExamAnswers(input: {
  examId: string;
  userId: string;
  answers: Array<{ questionId: string; selectedOptionId: string | null }>;
}) {
  const exam = await db.query.neetExam.findFirst({
    where: and(eq(neetExam.id, input.examId), eq(neetExam.status, 'completed')),
  });

  if (!exam) {
    throw new Error('Exam not found or not ready');
  }

  const questions = await db.query.neetExamQuestion.findMany({
    where: eq(neetExamQuestion.examId, input.examId),
  });

  if (questions.length === 0) {
    throw new Error('Exam has no questions');
  }

  const questionIds = questions.map((question) => question.id);

  const options = await db.query.neetExamOption.findMany({
    where: inArray(neetExamOption.questionId, questionIds),
  });

  const optionById = new Map(options.map((option) => [option.id, option]));
  const correctOptionIdByQuestion = new Map<string, string>();

  for (const option of options) {
    if (option.isCorrect) {
      correctOptionIdByQuestion.set(option.questionId, option.id);
    }
  }

  const submittedByQuestion = new Map(input.answers.map((answer) => [answer.questionId, answer.selectedOptionId]));

  for (const answer of input.answers) {
    if (!questionIds.includes(answer.questionId)) {
      throw new Error(`Invalid questionId: ${answer.questionId}`);
    }

    if (answer.selectedOptionId) {
      const selected = optionById.get(answer.selectedOptionId);
      if (!selected || selected.questionId !== answer.questionId) {
        throw new Error(`Invalid selectedOptionId for question ${answer.questionId}`);
      }
    }
  }

  const existingAttempt = await db.query.neetExamAttempt.findFirst({
    where: and(eq(neetExamAttempt.examId, input.examId), eq(neetExamAttempt.userId, input.userId)),
  });

  const attemptId = existingAttempt?.id ?? randomUUID();

  let correctCount = 0;
  let wrongCount = 0;
  let unattemptedCount = 0;
  let score = 0;

  const evaluatedAnswers: Array<{
    questionId: string;
    selectedOptionId: string | null;
    isCorrect: boolean | null;
    marksAwarded: number;
    subject: string;
    chapter: string;
    subTopic: string;
  }> = [];

  for (const question of questions) {
    const selectedOptionId = submittedByQuestion.get(question.id) ?? null;
    const correctOptionId = correctOptionIdByQuestion.get(question.id);

    let isCorrect: boolean | null = null;
    let marksAwarded = exam.scoringUnattemptedMarks;

    if (!selectedOptionId) {
      unattemptedCount += 1;
      isCorrect = null;
    } else if (selectedOptionId === correctOptionId) {
      correctCount += 1;
      isCorrect = true;
      marksAwarded = exam.scoringCorrectMarks;
    } else {
      wrongCount += 1;
      isCorrect = false;
      marksAwarded = exam.scoringWrongMarks;
    }

    score += marksAwarded;

    evaluatedAnswers.push({
      questionId: question.id,
      selectedOptionId,
      isCorrect,
      marksAwarded,
      subject: question.subject,
      chapter: question.chapter,
      subTopic: question.subTopic,
    });
  }

  await db.transaction(async (tx) => {
    await tx
      .insert(neetExamAttempt)
      .values({
        id: attemptId,
        examId: input.examId,
        userId: input.userId,
        status: 'submitted',
        startedAt: existingAttempt?.startedAt ?? new Date(),
        submittedAt: new Date(),
        score,
        correctCount,
        wrongCount,
        unattemptedCount,
      })
      .onConflictDoUpdate({
        target: [neetExamAttempt.examId, neetExamAttempt.userId],
        set: {
          status: 'submitted',
          submittedAt: new Date(),
          score,
          correctCount,
          wrongCount,
          unattemptedCount,
          updatedAt: new Date(),
        },
      });

    for (const answer of evaluatedAnswers) {
      await tx
        .insert(neetExamAttemptAnswer)
        .values({
          id: randomUUID(),
          attemptId,
          questionId: answer.questionId,
          selectedOptionId: answer.selectedOptionId,
          isCorrect: answer.isCorrect,
          marksAwarded: answer.marksAwarded,
          subject: answer.subject,
          chapter: answer.chapter,
          subTopic: answer.subTopic,
        })
        .onConflictDoUpdate({
          target: [neetExamAttemptAnswer.attemptId, neetExamAttemptAnswer.questionId],
          set: {
            selectedOptionId: answer.selectedOptionId,
            isCorrect: answer.isCorrect,
            marksAwarded: answer.marksAwarded,
            subject: answer.subject,
            chapter: answer.chapter,
            subTopic: answer.subTopic,
            updatedAt: new Date(),
          },
        });
    }
  });

  return {
    attemptId,
    score,
    correctCount,
    wrongCount,
    unattemptedCount,
    totalQuestions: questions.length,
  };
}

export async function getAttemptedChapterTestReview(params: {
  userId: string;
  testId: string;
}) {
  const exam = await db.query.neetExam.findFirst({
    where: and(
      eq(neetExam.status, 'completed'),
      eq(neetExam.examType, 'chapter'),
      eq(neetExam.externalTestId, params.testId),
    ),
  });

  if (!exam) return null;

  const attempt = await db.query.neetExamAttempt.findFirst({
    where: and(eq(neetExamAttempt.examId, exam.id), eq(neetExamAttempt.userId, params.userId)),
  });

  if (!attempt) return null;

  const questions = await db.query.neetExamQuestion.findMany({
    where: eq(neetExamQuestion.examId, exam.id),
    orderBy: (table, { asc }) => [asc(table.questionNumber)],
    with: {
      options: {
        orderBy: (table, { asc }) => [asc(table.optionIndex)],
      },
    },
  });

  const answers = await db.query.neetExamAttemptAnswer.findMany({
    where: eq(neetExamAttemptAnswer.attemptId, attempt.id),
  });

  const answerByQuestionId = new Map(answers.map((answer) => [answer.questionId, answer]));

  return {
    exam,
    attempt,
    questions: questions.map((question) => {
      const selected = answerByQuestionId.get(question.id);
      const correct = question.options.find((option) => option.isCorrect);

      return {
        id: question.id,
        questionNumber: question.questionNumber,
        questionText: question.questionText,
        explanation: question.explanation,
        selectedOptionId: selected?.selectedOptionId ?? null,
        correctOptionId: correct?.id ?? null,
        options: question.options.map((option) => ({
          id: option.id,
          optionIndex: option.optionIndex,
          optionText: option.optionText,
        })),
      };
    }),
  };
}

export async function getAttemptedExamReviewByExamId(params: {
  userId: string;
  examId: string;
}) {
  const exam = await db.query.neetExam.findFirst({
    where: and(eq(neetExam.status, 'completed'), eq(neetExam.id, params.examId)),
  });

  if (!exam) return null;

  const attempt = await db.query.neetExamAttempt.findFirst({
    where: and(eq(neetExamAttempt.examId, exam.id), eq(neetExamAttempt.userId, params.userId)),
  });

  if (!attempt) return null;

  const questions = await db.query.neetExamQuestion.findMany({
    where: eq(neetExamQuestion.examId, exam.id),
    orderBy: (table, { asc }) => [asc(table.questionNumber)],
    with: {
      options: {
        orderBy: (table, { asc }) => [asc(table.optionIndex)],
      },
    },
  });

  const answers = await db.query.neetExamAttemptAnswer.findMany({
    where: eq(neetExamAttemptAnswer.attemptId, attempt.id),
  });

  const answerByQuestionId = new Map(answers.map((answer) => [answer.questionId, answer]));

  return {
    exam,
    attempt,
    questions: questions.map((question) => {
      const selected = answerByQuestionId.get(question.id);
      const correct = question.options.find((option) => option.isCorrect);

      return {
        id: question.id,
        questionNumber: question.questionNumber,
        questionText: question.questionText,
        explanation: question.explanation,
        selectedOptionId: selected?.selectedOptionId ?? null,
        correctOptionId: correct?.id ?? null,
        options: question.options.map((option) => ({
          id: option.id,
          optionIndex: option.optionIndex,
          optionText: option.optionText,
        })),
      };
    }),
  };
}
