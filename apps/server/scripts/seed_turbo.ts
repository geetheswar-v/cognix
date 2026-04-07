import { createClient } from "@libsql/client";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

// Initialize Turso Client
const db = createClient({
  url: process.env.TURSO_DATABASE_URL as string,
  authToken: process.env.TURSO_AUTH_TOKEN as string,
});

const SEEDS_DIR = join(import.meta.dir, "../../../dataset/concept_seeds");

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
    const subjects = await readdir(SEEDS_DIR);

    for (const subject of subjects) {
      if (subject.startsWith(".")) continue; // Skip hidden files like .DS_Store

      const subjectPath = join(SEEDS_DIR, subject);
      const chapters = await readdir(subjectPath);

      for (const chapter of chapters) {
        if (chapter.startsWith(".")) continue;

        const chapterPath = join(subjectPath, chapter);
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
                subject,
                chapter,
                data.sub_topic,
                data.core_principles,
                JSON.stringify(data.key_formulas || []),
                JSON.stringify(data.neet_traps || []),
                JSON.stringify(data.distractor_concepts || []),
              ],
            });

            console.log(`inserted: [${subject}] ${chapter} -> ${data.sub_topic}`);
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
