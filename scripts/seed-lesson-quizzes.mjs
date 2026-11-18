// Adds each lesson's final quiz to a db.json file (never overwrites an existing quiz on that date).
// Usage: node scripts/seed-lesson-quizzes.mjs <db.json>
import fs from 'node:fs';
import { LESSONS } from '../shared/lessons.js';
import { validateQuiz } from '../shared/quiz.js';

const file = process.argv[2];
const db = JSON.parse(fs.readFileSync(file, 'utf8'));
db.quizzes ||= {};
for (const l of LESSONS) {
  if (db.quizzes[l.quizDate]) { console.log(`${l.quizDate}: يوجد اختبار مسبقا، لم يتغير`); continue; }
  const { quiz, error } = validateQuiz({ ...l.quiz, subject: l.subject, timed: true });
  if (error) throw new Error(`${l.id}: ${error}`);
  db.quizzes[l.quizDate] = quiz;
  console.log(`${l.quizDate}: أضيف «${quiz.title}» (${quiz.questions.length} أسئلة)`);
}
fs.writeFileSync(file, JSON.stringify(db, null, 2));
