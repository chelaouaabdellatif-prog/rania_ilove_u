export const BAC = new Date(2027, 5, 13); // تاريخ تقديري
export const YEAR_START = new Date(2026, 8, 21);

export const SUBJ = {
  de: { n: 'الألمانية', coef: 6 },
  en: { n: 'الإنجليزية', coef: 4 },
  fr: { n: 'الفرنسية', coef: 4 },
  ar: { n: 'العربية', coef: 2 },
  hg: { n: 'تاريخ وجغرافيا', coef: 2 },
  is: { n: 'التربية الإسلامية', coef: 2 },
  bac: { n: 'موضوع بكالوريا' },
  rev: { n: 'تقييم الأسبوع' },
};

export const BAC_ROT = ['de', 'en', 'fr', 'hg', 'ar', 'is'];

// index 0 = الأحد ... 6 = السبت (نفس ترتيب Date.getDay)
// [من, إلى, المادة, العمل المطلوب, درس خصوصي؟]
export const WEEK = [
  { n: 'الأحد', work: true, s: [
    ['17:30', '18:30', 'en', 'مفردات وقواعد الوحدة الحالية'],
    ['20:00', '21:00', 'de', 'Wortschatz: 20 كلمة جديدة + جمل'],
  ] },
  { n: 'الاثنين', work: true, s: [
    ['17:30', '18:30', 'de', 'Grammatik: قاعدة + تمارين'],
    ['20:00', '21:00', 'hg', 'درس تاريخ + بطاقة تلخيص (تواريخ، شخصيات، مصطلحات)'],
  ] },
  { n: 'الثلاثاء', s: [
    ['09:00', '10:30', 'de', 'Leseverstehen: فهم نص + أسئلة'],
    ['10:45', '12:00', 'fr', 'Projet en cours: lecture + outils de langue'],
    ['14:00', '15:00', 'ar', 'نص أدبي + بلاغة'],
    ['15:15', '16:15', 'hg', 'جغرافيا: درس + خريطة/مخطط'],
    ['20:00', '21:00', 'en', 'Writing: فقرة أو مقال قصير'],
  ] },
  { n: 'الأربعاء', s: [
    ['09:00', '10:30', 'en', 'Reading comprehension + grammar'],
    ['10:45', '12:00', 'de', 'Schreiben: تعبير كتابي'],
    ['14:00', '15:00', 'is', 'درس جديد + تلخيص'],
    ['15:15', '16:00', 'is', 'حفظ الآيات والأحاديث المقررة'],
    ['20:00', '21:00', 'fr', 'Expression écrite / compte rendu'],
  ] },
  { n: 'الخميس', work: true, s: [
    ['17:30', '18:30', 'de', 'مراجعة الأسبوع + دفتر الأخطاء'],
    ['20:00', '20:45', 'ar', 'نحو + عروض'],
  ] },
  { n: 'الجمعة', rest: 'المساء', s: [
    ['09:30', '10:30', 'is', 'مراجعة وحفظ'],
    ['14:00', '15:30', 'fr', 'درس خصوصي في الفرنسية', true],
    ['17:00', '18:00', 'fr', 'حل واجب الدرس الخصوصي'],
  ] },
  { n: 'السبت', rest: 'المساء', s: [
    ['09:00', '10:30', 'de', 'درس خصوصي في الألمانية', true],
    ['11:00', '12:00', 'de', 'حل الواجب + مراجعة الدرس'],
    ['15:00', '16:30', 'bac', 'موضوع بكالوريا سابق'],
    ['17:00', '17:30', 'rev', 'تقييم الأسبوع وتحضير الأسبوع القادم'],
  ] },
];

export const UNITS = {
  de: ['Grammatik: Passiv (Präsens / Präteritum / Perfekt)', 'Grammatik: Konjunktiv II', 'Grammatik: Relativsätze', 'Grammatik: Nebensätze (weil, dass, obwohl, wenn, als)', 'Grammatik: Präteritum der starken Verben', 'Thema: Umwelt und Natur', 'Thema: Medien und Technik', 'Thema: Arbeit, Beruf und Zukunft', 'Thema: Familie und Gesellschaft', 'Thema: Reisen und Kulturen', 'Schreiben: Brief / E-Mail / Stellungnahme', 'مواضيع بكالوريا ألمانية (10 مواضيع)'],
  en: ['Unit 1: Exploring the Past', 'Unit 2: Ill-gotten Gains Never Prosper', 'Unit 3: Schools: Different and Alike', 'Unit 4: Safety First', 'Unit 5: It’s a Giant Leap for Mankind', 'Unit 6: We Are a Family', 'Grammar: tenses, passive, reported speech, conditionals', 'Writing: essay / letter', 'مواضيع بكالوريا إنجليزية (10 مواضيع)'],
  fr: ['Projet 1: Textes et documents d’histoire', 'Projet 2: Le débat d’idées', 'Projet 3: L’appel', 'Projet 4: La nouvelle fantastique', 'Outils: compte rendu objectif / critique', 'Outils: discours rapporté, connecteurs, modalisation', 'مواضيع بكالوريا فرنسية (10 مواضيع)'],
  ar: ['عصر الضعف (المماليك والعثمانيون)', 'شعر الإحياء والنهضة', 'الشعر الرومانسي وأدب المهجر', 'الشعر الحر (فلسطين والثورة الجزائرية)', 'القصة والمسرحية', 'النحو والصرف', 'البلاغة', 'العروض', 'مواضيع بكالوريا عربية (8 مواضيع)'],
  hg: ['تاريخ: الحرب الباردة وتطورها', 'تاريخ: من الثنائية إلى الأحادية القطبية', 'تاريخ: العالم الثالث بين الاستقلال والتنمية', 'تاريخ: الثورة الجزائرية 1954–1962', 'تاريخ: بناء الدولة الجزائرية', 'جغرافيا: الاقتصاد العالمي ومظاهر التباين', 'جغرافيا: الولايات المتحدة الأمريكية', 'جغرافيا: الاتحاد الأوروبي', 'جغرافيا: شرق وجنوب شرق آسيا', 'جغرافيا: الاقتصاد الجزائري', 'مواضيع بكالوريا تاريخ وجغرافيا (8 مواضيع)'],
  is: ['وسائل القرآن في تثبيت العقيدة', 'العقل في القرآن الكريم', 'الحرية الشخصية ومدى ارتباطها بحقوق الإنسان', 'الصحة النفسية والجسمية', 'من المعاملات المالية (الربا، الوقف)', 'العلاقات الاجتماعية والأسرة', 'الميراث', 'مقاصد الشريعة الإسلامية', 'مواضيع بكالوريا تربية إسلامية (8 مواضيع)'],
};

export const PHASES = [
  { a: new Date(2026, 9, 1), b: new Date(2026, 11, 31), t: 'الفصل الأول: بناء الأساس', m: 'أكتوبر – ديسمبر 2026',
    l: ['إنهاء الوحدات الأولى في كل مادة بالتوازي مع الدروس الخصوصية', 'بطاقات مفردات للألمانية والإنجليزية والفرنسية منذ الأسبوع الأول', 'بطاقات تلخيص للتاريخ والتربية الإسلامية', 'في آخر ديسمبر: موضوع بكالوريا في الألمانية والإنجليزية لقياس المستوى'] },
  { a: new Date(2027, 0, 1), b: new Date(2027, 2, 31), t: 'الفصل الثاني: إكمال البرنامج', m: 'جانفي – مارس 2027',
    l: ['إكمال باقي الوحدات والمحاور', 'موضوع بكالوريا كامل كل سبت بالتوقيت (بالتناوب بين المواد)', 'الجغرافيا: رسم الخرائط والمخططات من الذاكرة', 'مراجعة دفتر الأخطاء كل خميس'] },
  { a: new Date(2027, 3, 1), b: new Date(2027, 4, 31), t: 'الفصل الثالث: المراجعة الشاملة', m: 'أفريل – ماي 2027',
    l: ['مواضيع بكالوريا 2015–2026 لكل مادة، مع التصحيح بالسلم الرسمي', 'أولوية للمواد ذات المعامل الكبير: الألمانية ثم الإنجليزية والفرنسية', 'تحفيظ نهائي للتواريخ والآيات والمصطلحات', 'امتحان تجريبي كامل في آخر ماي'] },
  { a: new Date(2027, 5, 1), b: BAC, t: 'الأسابيع الأخيرة', m: 'جوان 2027',
    l: ['مراجعة خفيفة من البطاقات ودفتر الأخطاء فقط', 'لا دروس جديدة', 'النوم الكافي والتحضير للوثائق والطريق إلى مركز الامتحان'] },
];

export const MONTHS = [['أكتوبر', 2026, 9], ['نوفمبر', 2026, 10], ['ديسمبر', 2026, 11], ['جانفي', 2027, 0], ['فيفري', 2027, 1], ['مارس', 2027, 2], ['أفريل', 2027, 3], ['ماي', 2027, 4], ['جوان', 2027, 5]];

// ---------- dates ----------
export function sundayOf(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - x.getDay());
  return x;
}
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const fmt = (d) => `${d.getDate()}/${d.getMonth() + 1}`;
export const daysLeft = () => Math.max(0, Math.ceil((BAC - new Date()) / 864e5));
export const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

export function bacSubjectFor(sunday) {
  const w = Math.floor((sunday - sundayOf(YEAR_START)) / (7 * 864e5));
  return BAC_ROT[((w % BAC_ROT.length) + BAC_ROT.length) % BAC_ROT.length];
}

export function unitsProgress(units) {
  let total = 0, done = 0;
  for (const k in UNITS) UNITS[k].forEach((_, i) => { total += SUBJ[k].coef; if (units[`${k}-${i}`]) done += SUBJ[k].coef; });
  return Math.round((done / total) * 100);
}
export const totalSessions = WEEK.reduce((a, d) => a + d.s.length, 0);
