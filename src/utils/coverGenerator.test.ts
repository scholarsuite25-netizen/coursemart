import test from 'node:test';
import assert from 'node:assert/strict';
import { SEED_PRODUCTS } from '../data/seedData.ts';
import {
  generateProductCoverDataUri,
  generateProductCoverSvg,
} from './coverGenerator.ts';
import {
  CERTIFICATE_PASS_MARK,
  MIN_COURSE_SECTIONS,
  MIN_SECTION_QUIZ_QUESTIONS,
  canIssueCourseCertificate,
  gradeModuleQuiz,
  isLectureUnlocked,
  isModuleUnlocked,
  shuffleQuestionOptionIndices,
  validateCourseCurriculum,
} from './commerce.ts';

test('generateProductCoverSvg creates distinct labelled covers for ebooks, courses, and software', () => {
  const ebookSvg = generateProductCoverSvg({
    title: 'Nigerian SME Tax & Finance Guide',
    subtitle: 'Practical Compliance Playbook',
    type: 'ebook',
    category: 'Finance',
    authorName: 'S. B. Omotoso',
  });
  assert.ok(ebookSvg.includes('OFFICIAL EBOOK'));
  assert.ok(ebookSvg.includes('Nigerian SME Tax &amp;'));
  assert.ok(ebookSvg.includes('Finance Guide'));

  const courseUri = generateProductCoverDataUri({
    title: 'AI Automation Bootcamp',
    type: 'course',
    category: 'AI Engineering',
  });
  assert.ok(courseUri.startsWith('data:image/svg+xml;utf8,'));
  assert.notEqual(
    generateProductCoverDataUri({ title: 'Book A', type: 'ebook' }),
    generateProductCoverDataUri({ title: 'Book B', type: 'ebook' })
  );
});

test('SEED_PRODUCTS has zero duplicate product cover thumbnails', () => {
  const seen = new Map<string, string>();
  for (const p of SEED_PRODUCTS) {
    assert.ok(p.thumbnail && p.thumbnail.trim().length > 0, `Product ${p.id} must have a cover`);
    const existing = seen.get(p.thumbnail);
    assert.equal(
      existing,
      undefined,
      `Duplicate cover found for ${p.id} (${p.title}) and ${existing}: ${p.thumbnail}`
    );
    seen.set(p.thumbnail, `${p.id} (${p.title})`);
  }
});

test('Sequential course locking & 80% passmark govern certificate issuance', () => {
  assert.equal(CERTIFICATE_PASS_MARK, 80);

  const modules = [
    {
      id: 'm1',
      title: 'Section 1',
      lectures: [
        { id: 'l1', title: '1.1 Intro', durationMinutes: 10, isPreview: true, summary: '', keyTakeaways: [] },
        { id: 'l2', title: '1.2 Deep Dive', durationMinutes: 12, isPreview: false, summary: '', keyTakeaways: [] },
      ],
      quiz: {
        id: 'q-m1',
        title: 'Section 1 Quiz',
        passingScore: 70, // even if legacy quiz says 70, minimum 80% is enforced
        questions: [
          { id: 'q1', prompt: 'Q1', options: ['A', 'B', 'C', 'D'], correctIndex: 0, explanation: '' },
          { id: 'q2', prompt: 'Q2', options: ['A', 'B', 'C', 'D'], correctIndex: 1, explanation: '' },
          { id: 'q3', prompt: 'Q3', options: ['A', 'B', 'C', 'D'], correctIndex: 2, explanation: '' },
          { id: 'q4', prompt: 'Q4', options: ['A', 'B', 'C', 'D'], correctIndex: 3, explanation: '' },
          { id: 'q5', prompt: 'Q5', options: ['A', 'B', 'C', 'D'], correctIndex: 0, explanation: '' },
        ],
      },
    },
    {
      id: 'm2',
      title: 'Section 2',
      lectures: [
        { id: 'l3', title: '2.1 Next', durationMinutes: 15, isPreview: false, summary: '', keyTakeaways: [] },
      ],
    },
  ];

  // Initially only m1 and l1 are unlocked
  assert.equal(isModuleUnlocked(modules, 0, []), true);
  assert.equal(isModuleUnlocked(modules, 1, []), false);
  assert.equal(isLectureUnlocked(modules, 'l1', []), true);
  assert.equal(isLectureUnlocked(modules, 'l2', []), false);
  assert.equal(isLectureUnlocked(modules, 'l3', ['l1', 'l2']), false);

  // Scoring 60% (3/5) fails the 80% passmark and keeps Section 2 locked
  const failQuiz = gradeModuleQuiz(modules[0].quiz!.questions, { q1: 0, q2: 1, q3: 2, q4: 0, q5: 1 }, 70);
  assert.equal(failQuiz.scorePercent, 60);
  assert.equal(failQuiz.passed, false);
  assert.equal(isModuleUnlocked(modules, 1, ['l1', 'l2'], { m1: failQuiz }), false);

  // Scoring 80% (4/5) passes and unlocks Section 2
  const passQuiz = gradeModuleQuiz(modules[0].quiz!.questions, { q1: 0, q2: 1, q3: 2, q4: 3, q5: 1 }, 70);
  assert.equal(passQuiz.scorePercent, 80);
  assert.equal(passQuiz.passed, true);
  assert.equal(isModuleUnlocked(modules, 1, ['l1', 'l2'], { m1: passQuiz }), true);
  assert.equal(isLectureUnlocked(modules, 'l3', ['l1', 'l2'], { m1: passQuiz }), true);

  // Certificate only eligible when ALL lectures AND 80%+ quizzes are passed
  const product = {
    id: 'test-course',
    type: 'course',
    courseData: { totalHours: 1, modules },
  } as any;

  assert.equal(canIssueCourseCertificate(product, ['l1', 'l2', 'l3'], { m1: failQuiz }).eligible, false);
  assert.equal(canIssueCourseCertificate(product, ['l1', 'l2'], { m1: passQuiz }).eligible, false);
  assert.equal(canIssueCourseCertificate(product, ['l1', 'l2', 'l3'], { m1: passQuiz }).eligible, true);
});

test('shuffleQuestionOptionIndices returns a valid permutation of option indices', () => {
  const perm = shuffleQuestionOptionIndices(4);
  assert.equal(perm.length, 4);
  assert.deepEqual([...perm].sort((a, b) => a - b), [0, 1, 2, 3]);
});

test('Every course in SEED_PRODUCTS has at least 7 full sections and 3+ quiz questions (80% passmark) per section', () => {
  const courses = SEED_PRODUCTS.filter((p) => p.type === 'course');
  assert.ok(courses.length >= 12);
  for (const course of courses) {
    const modules = course.courseData?.modules ?? [];
    assert.ok(
      modules.length >= MIN_COURSE_SECTIONS,
      `${course.id} has ${modules.length} sections (< ${MIN_COURSE_SECTIONS})`
    );
    const validation = validateCourseCurriculum(modules);
    assert.equal(
      validation.valid,
      true,
      `Course ${course.id} failed curriculum validation: ${validation.errors.join('; ')}`
    );
    for (const mod of modules) {
      assert.ok(
        (mod.quiz?.questions.length ?? 0) >= MIN_SECTION_QUIZ_QUESTIONS,
        `${course.id} / ${mod.id} has fewer than ${MIN_SECTION_QUIZ_QUESTIONS} quiz questions`
      );
      assert.ok(
        (mod.quiz?.passingScore ?? 0) >= 80,
        `${course.id} / ${mod.id} has passmark < 80%`
      );
    }
  }
});
