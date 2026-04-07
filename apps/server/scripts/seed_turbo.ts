import { createClient } from "@libsql/client";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

// Initialize Turso Client
const db = createClient({
  url: process.env.TURSO_DATABASE_URL as string,
  authToken: process.env.TURSO_AUTH_TOKEN as string,
});

const SEEDS_DIR = join(import.meta.dir, "../../../dataset/concept_seeds");
const BLUEPRINT_PATH = join(import.meta.dir, "../../../dataset/neet_blueprint.json");

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function initDB() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS concepts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject TEXT NOT NULL,
        chapter TEXT NOT NULL,
        sub_topic TEXT NOT NULL,
        core_principles TEXT,
        key_formulas TEXT,
        neet_traps TEXT,
        distractor_concepts TEXT,
        UNIQUE(subject, chapter, sub_topic)
    );
  `);
  console.log("Database schema verified.");
}

async function seedDatabase() {
  await initDB();
  console.log(`Scanning directory: ${SEEDS_DIR}`);

  try {
    // Load and parse blueprint
    const blueprintRaw = await readFile(BLUEPRINT_PATH, "utf-8");
    const blueprintData = JSON.parse(blueprintRaw);
    const blueprint = blueprintData.blueprint;

    // Create a mapping of [subject][slug] -> original chapter name
    const chapterMap: Record<string, Record<string, string>> = {};
    for (const subjectKey of Object.keys(blueprint)) {
      chapterMap[subjectKey] = {};
      for (const item of blueprint[subjectKey]) {
        const slug = slugify(item.chapter);
        chapterMap[subjectKey][slug] = item.chapter;
      }
    }

    const subjects = await readdir(SEEDS_DIR);

    for (const subject of subjects) {
      if (subject.startsWith(".")) continue;

      // Map folder subject name to blueprint subject name (handle 'botony')
      const blueprintSubjectKey = subject === "botony" ? "botany" : subject;
      const subjectPath = join(SEEDS_DIR, subject);
      const chapters = await readdir(subjectPath);

      for (const chapterSlug of chapters) {
        if (chapterSlug.startsWith(".")) continue;

        // Get original chapter name from map, fallback to slug if not found
        const originalChapterName =
          chapterMap[blueprintSubjectKey]?.[chapterSlug] || chapterSlug;

        const chapterPath = join(subjectPath, chapterSlug);
        const subTopicFiles = await readdir(chapterPath);

        for (const file of subTopicFiles) {
          if (!file.endsWith(".json")) continue;

          const filePath = join(chapterPath, file);
          const fileContent = await readFile(filePath, "utf-8");

          try {
            const data = JSON.parse(fileContent);

            await db.execute({
              sql: `INSERT INTO concepts (subject, chapter, sub_topic, core_principles, key_formulas, neet_traps, distractor_concepts) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(subject, chapter, sub_topic) 
                    DO UPDATE SET 
                      core_principles=excluded.core_principles,
                      key_formulas=excluded.key_formulas,
                      neet_traps=excluded.neet_traps,
                      distractor_concepts=excluded.distractor_concepts;`,
              args: [
                blueprintSubjectKey,
                originalChapterName,
                data.sub_topic,
                data.core_principles,
                JSON.stringify(data.key_formulas || []),
                JSON.stringify(data.neet_traps || []),
                JSON.stringify(data.distractor_concepts || []),
              ],
            });

            console.log(
              `inserted: [${blueprintSubjectKey}] ${originalChapterName} -> ${data.sub_topic}`
            );
          } catch (parseError) {
            console.error(`Error parsing or inserting ${filePath}:`, parseError);
          }
        }
      }
    }
    console.log("Seeding complete!");
  } catch (error) {
    console.error("Critical Error during seeding:", error);
  }
}

seedDatabase();

