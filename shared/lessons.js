// Lessons with spaced revision. Source: "Cours_3AS_Lit_06-10_Octobre.pdf"
// (3AS Literary streams — Unit 1: Ancient Civilizations — Sequence I).
// Each lesson: study day (J0), reviews at J+1, J+2, J+4, J+6, final quiz on J+6.

export const REVIEW_OFFSETS = [1, 2, 4, 6];
export const REVIEW_TASKS = [
  'أعيدي قراءة الملخص + بطاقات الكلمات (إنجليزي → عربي)',
  'أعيدي حل التمارين دون النظر إلى الأجوبة، ثم صححي',
  'بطاقات الكلمات (عربي → إنجليزي) + اكتبي 3 جمل بكلمات الدرس',
  'الاختبار النهائي للدرس + مراجعة الأخطاء',
];
// Reviews: 21:15 on weekdays, 18:30 on Friday/Saturday (evenings are rest).
export const reviewTime = (date) => ([5, 6].includes(new Date(`${date}T12:00:00Z`).getUTCDay()) ? '18:30' : '21:15');
export const addDays = (date, n) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
// [{ n: 0 (study) | 1..4 (review), date, time }]
export const lessonSteps = (l) => [
  { n: 0, date: l.date, time: l.time },
  ...REVIEW_OFFSETS.map((o, i) => ({ n: i + 1, date: addDays(l.date, o), time: reviewTime(addDays(l.date, o)) })),
];

const UNIT = 'Unit 1: Ancient Civilizations — Exploring the past';

export const LESSONS = [
  {
    id: 'en-u1-l1', subject: 'en', unit: UNIT, date: '2026-11-18', time: '16:15', duration: 45,
    title: 'Unit Introduction', titleAr: 'مقدمة الوحدة: الحضارات القديمة',
    objective: 'Name some ancient civilizations, locate them on a map, define the word “civilization” and know the unit project.',
    objectiveAr: 'تسمية بعض الحضارات القديمة، تحديد مواقعها على الخريطة، تعريف كلمة «حضارة»، ومعرفة مشروع الوحدة.',
    sections: [
      { h: 'Ancient civilizations: region and achievement', type: 'table',
        head: ['Civilization', 'Region', 'Achievement'],
        rows: [
          ['Sumerians · السومريون', 'Mesopotamia (Iraq)', 'cuneiform writing · الكتابة المسمارية'],
          ['Egyptians · المصريون', 'The Nile Valley', 'pyramids, hieroglyphs · الأهرامات والهيروغليفية'],
          ['Phoenicians · الفينيقيون', 'Coast of Lebanon', 'the first alphabet · أول أبجدية'],
          ['Romans · الرومان', 'Italy', 'roads, aqueducts, Timgad · الطرق والقنوات المائية وتيمقاد'],
          ['Greeks · الإغريق', 'Greece', 'democracy, philosophy · الديمقراطية والفلسفة'],
          ['Incas · الإنكا', 'Peru (the Andes)', 'Machu Picchu · ماتشو بيتشو'],
        ] },
      { h: 'Definition', type: 'p',
        text: 'A civilization is an advanced society with cities, a system of government, writing, laws, arts and sciences.',
        ar: 'الحضارة مجتمع متطور فيه مدن ونظام حكم وكتابة وقوانين وفنون وعلوم.' },
      { h: 'Word map: CIVILIZATION', type: 'list',
        items: ['writing · الكتابة', 'cities · المدن', 'laws · القوانين', 'religion · الدين', 'art · الفن', 'trade · التجارة', 'government · الحكم', 'science · العلم'] },
      { h: 'Unit project', type: 'p',
        text: 'Making a profile of an ancient civilization (groups of 4): location, dates, rise, achievements, decline, pictures.',
        ar: 'مشروع الوحدة: إعداد بطاقة تعريفية لحضارة قديمة (الموقع، التواريخ، النشأة، الإنجازات، الانهيار، صور).' },
      { h: 'Target situation', type: 'p',
        text: 'By the end of the unit: write an expository / narrative text of about 20 lines about an ancient civilization (its rise, achievements and decline).',
        ar: 'في نهاية الوحدة: كتابة نص تفسيري/سردي من حوالي 20 سطرا عن حضارة قديمة (نشأتها، إنجازاتها، انهيارها).' },
    ],
    vocab: [
      ['civilization', 'حضارة'], ['ancient', 'قديم'], ['to explore', 'يستكشف'], ['the past', 'الماضي'],
      ['to locate', 'يحدد موقع'], ['region', 'منطقة'], ['achievement', 'إنجاز'], ['society', 'مجتمع'],
      ['advanced', 'متطور'], ['government', 'حكم / حكومة'], ['law', 'قانون'], ['trade', 'تجارة'],
      ['cuneiform writing', 'الكتابة المسمارية'], ['hieroglyphs', 'الكتابة الهيروغليفية'], ['alphabet', 'الأبجدية'],
      ['aqueduct', 'قناة مائية (جسر لنقل الماء)'], ['pyramid', 'هرم'], ['Mesopotamia', 'بلاد ما بين النهرين'],
      ['Pharaohs', 'الفراعنة'], ['rise', 'نشأة / صعود'], ['decline', 'انحطاط / تراجع'], ['profile', 'بطاقة تعريفية'],
    ],
    exercises: [
      { q: 'Task 2. Match: 1. Sumerians 2. Egyptians 3. Phoenicians 4. Romans 5. Greeks 6. Incas — with region (a. Peru b. Greece c. Mesopotamia d. Nile Valley e. Lebanon f. Italy) and achievement (A. first alphabet B. cuneiform C. roads, Timgad D. Machu Picchu E. pyramids F. democracy).',
        a: '1-c-B · 2-d-E · 3-e-A · 4-f-C · 5-b-F · 6-a-D' },
      { q: 'Task 3. Complete: A civilization is …', a: 'A civilization is an advanced society with cities, a system of government, writing, laws, arts and sciences.' },
      { q: 'Task 4. Which ancient civilization would you like to explore? Why? (2–3 sentences)', a: 'Example: I would like to explore the Numidian civilization because it is part of Algeria’s history. Its kings, like Massinissa, built a strong kingdom.' },
    ],
    quizDate: '2026-11-24',
    quiz: { title: 'Unit Introduction', questions: [
      { q: 'Cuneiform writing was invented by the…', options: ['Sumerians', 'Egyptians', 'Romans', 'Incas'], answer: 0 },
      { q: 'The pyramids and hieroglyphs are achievements of the…', options: ['Greeks', 'Egyptians', 'Phoenicians'], answer: 1 },
      { q: 'The first alphabet was invented by the…', options: ['Romans', 'Sumerians', 'Phoenicians'], answer: 2 },
      { q: 'Timgad was built by the…', options: ['Romans', 'Greeks', 'Incas'], answer: 0 },
      { q: 'Democracy and philosophy come from ancient…', options: ['Egypt', 'Greece', 'Peru'], answer: 1 },
      { q: 'Machu Picchu is in…', options: ['Mesopotamia', 'Italy', 'the Andes (Peru)'], answer: 2 },
      { q: '«حضارة» in English is…', options: ['empire', 'civilization', 'achievement'], answer: 1 },
      { q: 'A civilization is an advanced society with…', options: ['cities, government, writing and laws', 'only farms and animals', 'no laws and no cities'], answer: 0 },
    ] },
  },

  {
    id: 'en-u1-l2', subject: 'en', unit: UNIT, date: '2026-11-19', time: '18:45', duration: 45,
    title: 'Listening + Grammar Explorer I: articles (a / an / the / Ø)', titleAr: 'الاستماع + أدوات التعريف والتنكير',
    objective: 'Listen for gist and specific information about the rise and fall of civilizations, and use the definite, indefinite and zero articles correctly.',
    objectiveAr: 'فهم نص مسموع عن نشأة الحضارات وانهيارها، واستعمال أدوات التعريف والتنكير و«بدون أداة» استعمالا صحيحا.',
    sections: [
      { h: 'Listening: “History Today” (key ideas)', type: 'list', items: [
        'A civilization is a society that has built cities, invented writing and created laws.',
        'The first civilizations appeared about 5,000 years ago along great rivers: the Tigris and the Euphrates (Mesopotamia), the Nile (Egypt), the Indus (Asia).',
        'Why near rivers? People needed water for agriculture.',
        'Why did they decline? Wars, invasions, droughts and bad government. Rome collapsed in 476 AD after barbarian tribes had invaded the empire.',
        'What did they leave us? The alphabet, the calendar, mathematics, medicine and architecture. In Algeria: the ruins of Timgad and Tipaza.',
      ] },
      { h: 'Grammar Explorer I — Articles', type: 'table', head: ['Article', 'Use', 'Example'], rows: [
        ['a / an', 'singular countable noun, mentioned for the first time / one of many; an before a vowel sound · اسم مفرد معدود يُذكر لأول مرة', 'Dr. Benali is an archaeologist. Rome was a great empire.'],
        ['the', 'something already known or unique; rivers, seas, oceans; superlatives; names with “of” · شيء معروف أو وحيد، الأنهار والبحار، صيغة التفضيل', 'The Nile, the Roman Empire, the oldest city'],
        ['Ø (zero)', 'plural or uncountable nouns in a general sense; names of countries, cities, continents (most) · الجمع وغير المعدود بمعنى عام، أسماء الدول والمدن والقارات', 'Ø People needed Ø water. Ø Egypt, Ø Rome, Ø Africa'],
      ] },
    ],
    vocab: [
      ['archaeologist', 'عالم آثار'], ['to rise', 'ينشأ / يصعد'], ['to flourish', 'يزدهر'], ['to decline', 'يتراجع / ينحط'],
      ['to collapse', 'ينهار'], ['to invade', 'يغزو'], ['invasion', 'غزو'], ['empire', 'إمبراطورية'],
      ['agriculture', 'الزراعة'], ['craftsman', 'حِرفي'], ['trader', 'تاجر'], ['priest', 'كاهن'], ['scribe', 'كاتب / ناسخ'],
      ['drought', 'جفاف'], ['barbarian tribes', 'القبائل الهمجية الغازية'], ['ruins', 'أطلال / آثار'],
      ['calendar', 'التقويم'], ['medicine', 'الطب'], ['architecture', 'فن العمارة'],
      ['definite article (the)', 'أداة التعريف'], ['indefinite article (a/an)', 'أداة التنكير'], ['zero article (Ø)', 'بدون أداة'],
      ['countable / uncountable', 'معدود / غير معدود'], ['vowel sound', 'صوت صائت (حرف علة)'],
    ],
    exercises: [
      { q: 'Task 2. True or false? 1. The first civilizations appeared about 5,000 years ago. 2. They developed far from rivers. 3. Rome collapsed in 476 AD. 4. Timgad and Tipaza are in Egypt.', a: '1 T · 2 F · 3 T · 4 F' },
      { q: 'Task 3. a) Why did early civilizations appear near rivers? b) Two reasons for decline? c) What did they leave us?', a: 'a) They needed water for agriculture. b) Wars, invasions, droughts, bad government. c) The alphabet, the calendar, mathematics, medicine, architecture.' },
      { q: 'Task 4. Fill in with a, an, the or Ø: 1. ___ Egyptians built ___ pyramids along ___ Nile. 2. Timgad is ___ ancient Roman city in ___ Algeria. 3. ___ Phoenicians invented ___ alphabet. ___ alphabet had 22 letters. 4. ___ agriculture was ___ basis of ___ early civilizations. 5. ___ Sahara is ___ largest hot desert in ___ world.',
        a: '1. The / the (or Ø) / the — 2. an / Ø — 3. The / the / The — 4. Ø / the / Ø — 5. The / the / the' },
      { q: 'Task 5. Correct the mistakes: 1. The Rome was the capital of an empire. 2. He is a historian of a ancient world. 3. The water is necessary for the life.',
        a: '1. Rome was the capital of an empire. 2. …of the ancient world. 3. Water is necessary for life.' },
    ],
    quizDate: '2026-11-25',
    quiz: { title: 'Listening + Articles', questions: [
      { q: 'The first civilizations appeared about ___ years ago.', options: ['500', '5,000', '50,000'], answer: 1 },
      { q: 'Early civilizations appeared near rivers because people needed water for…', options: ['agriculture', 'war', 'sport'], answer: 0 },
      { q: 'Rome collapsed in…', options: ['5000 BC', '1830', '476 AD'], answer: 2 },
      { q: 'Dr. Benali is ___ archaeologist.', options: ['a', 'an', 'the'], answer: 1 },
      { q: '___ Nile is a great river in Egypt.', options: ['The', 'A', 'Ø (no article)'], answer: 0 },
      { q: 'People needed ___ water.', options: ['the', 'a', 'Ø (no article)'], answer: 2 },
      { q: 'Choose the correct sentence:', options: ['The Rome was the capital of an empire.', 'Rome was the capital of an empire.', 'Rome was the capital of a empire.'], answer: 1 },
      { q: '«drought» means…', options: ['فيضان', 'غزو', 'جفاف'], answer: 2 },
      { q: '«to collapse» means…', options: ['ينهار', 'يزدهر', 'يغزو'], answer: 0 },
    ] },
  },

  {
    id: 'en-u1-l3', subject: 'en', unit: UNIT, date: '2026-11-20', time: '10:45', duration: 45,
    title: 'Grammar Explorer II: past perfect vs past simple', titleAr: 'الماضي التام والماضي البسيط',
    objective: 'Express the order of past events using the past perfect and the past simple with after, before, when, as soon as, by the time, until.',
    objectiveAr: 'التعبير عن ترتيب الأحداث في الماضي بالماضي التام والماضي البسيط مع أدوات الربط الزمنية.',
    sections: [
      { h: 'Rule', type: 'table', head: ['Tense', 'Form', 'Use'], rows: [
        ['Past perfect · الماضي التام', 'had + past participle (had built, had invaded)', 'the first (earlier) action in the past · الحدث الأول (الأسبق)'],
        ['Past simple · الماضي البسيط', 'verb + -ed / irregular (built, collapsed)', 'the second (later) action in the past · الحدث الثاني (اللاحق)'],
      ] },
      { h: 'Time connectors · أدوات الربط الزمنية', type: 'list', items: [
        'after + past perfect · بعد أن',
        'before + past simple · قبل أن',
        'when / as soon as + past perfect (first action) · عندما / بمجرد أن',
        'by the time + past simple, main clause in past perfect · بحلول الوقت الذي',
      ] },
      { h: 'Examples', type: 'list', items: [
        'Rome collapsed after barbarian tribes had invaded the empire.',
        'After the Romans had conquered Numidia, they built Timgad.',
        'By the time the Arabs arrived, the Roman Empire had already collapsed.',
      ] },
      { h: 'Timeline · خط زمني', type: 'p',
        text: '1st action (had + p.p.)  ──►  2nd action (past simple)  ──►  now',
        ar: 'الحدث الأول بالماضي التام، ثم الحدث الثاني بالماضي البسيط.' },
    ],
    vocab: [
      ['past perfect', 'الماضي التام'], ['past simple', 'الماضي البسيط'], ['past participle', 'التصريف الثالث (اسم المفعول)'],
      ['earlier', 'أسبق'], ['later', 'لاحق'], ['timeline', 'خط زمني'], ['connector', 'أداة ربط'],
      ['as soon as', 'بمجرد أن'], ['by the time', 'بحلول الوقت الذي'], ['until', 'حتى'],
      ['to conquer', 'يفتح / يغزو'], ['to found', 'يؤسس'], ['flood', 'فيضان'], ['to observe', 'يلاحظ / يراقب'],
      ['to adopt', 'يتبنى'], ['ash', 'رماد'], ['century', 'قرن'], ['to record', 'يدوّن / يسجل'],
      ['seed', 'بذرة'], ['wall', 'سور'],
    ],
    exercises: [
      { q: 'Task 1. 1. The Egyptians (develop) a calendar after they (observe) the floods of the Nile. 2. When the Phoenicians (found) Carthage, they (already/trade) all over the Mediterranean. 3. Before the Greeks (adopt) the alphabet, the Phoenicians (invent) it. 4. By the time archaeologists (discover) Pompeii, it (be) under ash for centuries.',
        a: '1. developed / had observed — 2. founded / had already traded — 3. adopted / had invented — 4. discovered / had been' },
      { q: 'Task 2. Join: 1. The Sumerians invented writing. Then they recorded laws. (after) 2. The Nile flooded. Then farmers planted their seeds. (as soon as) 3. Invaders attacked the city. The people had built strong walls before that. (when)',
        a: '1. After the Sumerians had invented writing, they recorded laws. 2. As soon as the Nile had flooded, farmers planted their seeds. 3. When invaders attacked the city, the people had already built strong walls.' },
      { q: 'Task 3. Write a short paragraph (5–6 lines) about the history of Timgad using the past simple and the past perfect.',
        a: 'Example: After the Romans had conquered Numidia, they built Timgad in 100 AD. The city grew quickly because they had planned it well. When the Vandals arrived, Timgad had already lost its power. By the time archaeologists discovered it, sand had covered the ruins for centuries.' },
    ],
    quizDate: '2026-11-26',
    quiz: { title: 'Past perfect / Past simple', questions: [
      { q: 'The past perfect is formed with…', options: ['had + past participle', 'have + past participle', 'was + verb-ing'], answer: 0 },
      { q: 'The Egyptians developed a calendar after they ___ the floods of the Nile.', options: ['observe', 'had observed', 'have observed'], answer: 1 },
      { q: 'When the Phoenicians founded Carthage, they ___ all over the Mediterranean.', options: ['had already traded', 'already trade', 'have already traded'], answer: 0 },
      { q: 'Before the Greeks ___ the alphabet, the Phoenicians had invented it.', options: ['had adopted', 'adopt', 'adopted'], answer: 2 },
      { q: 'By the time archaeologists discovered Pompeii, it ___ under ash for centuries.', options: ['was', 'had been', 'has been'], answer: 1 },
      { q: '“After the Romans had conquered Numidia, they built Timgad.” Which action happened first?', options: ['conquering Numidia', 'building Timgad'], answer: 0 },
      { q: 'After “after”, we usually use the…', options: ['past simple', 'present perfect', 'past perfect'], answer: 2 },
      { q: '«as soon as» means…', options: ['قبل أن', 'بمجرد أن', 'حتى'], answer: 1 },
    ] },
  },

  {
    id: 'en-u1-l4', subject: 'en', unit: UNIT, date: '2026-11-21', time: '13:30', duration: 45,
    title: 'Vocabulary Explorer: forming nouns', titleAr: 'المفردات: تكوين الأسماء باللواحق',
    objective: 'Form nouns from verbs and adjectives using suffixes and use the key vocabulary of the unit (rise, decline, achievement…).',
    objectiveAr: 'تكوين الأسماء من الأفعال والصفات باستعمال اللواحق، واستعمال مفردات الوحدة (نشأة، انحطاط، إنجاز…).',
    sections: [
      { h: 'Suffixes that form nouns · اللواحق', type: 'table', head: ['Suffix', 'From', 'Examples'], rows: [
        ['-ment', 'verb', 'achieve → achievement; govern → government; settle → settlement'],
        ['-ion / -tion / -sion', 'verb', 'civilize → civilization; invade → invasion; invent → invention; conquer → conquest*'],
        ['-ance / -ence', 'verb / adjective', 'appear → appearance; exist → existence; important → importance'],
        ['-ity', 'adjective', 'prosperous → prosperity; able → ability; creative → creativity'],
        ['-ness', 'adjective', 'weak → weakness; great → greatness; rich → richness'],
        ['-ure / -age', 'verb', 'fail → failure; architect → architecture; pass → passage'],
      ] },
      { h: 'Note', type: 'p', text: '* conquest is irregular.', ar: 'كلمة conquest شاذة (لا تتبع القاعدة).' },
      { h: 'Rise and fall vocabulary', type: 'list', items: [
        'rise — the beginning and growth · النشأة والنمو',
        'flourish — to develop successfully · يزدهر',
        'decline — a gradual loss of power · تراجع تدريجي للقوة',
        'collapse — a sudden and complete fall · انهيار مفاجئ وكامل',
        'empire — a group of countries ruled by one leader · إمبراطورية',
      ] },
    ],
    vocab: [
      ['suffix', 'لاحقة'], ['noun', 'اسم'], ['verb', 'فعل'], ['adjective', 'صفة'],
      ['settlement', 'مستوطنة / استقرار'], ['conquest', 'فتح / غزو'], ['appearance', 'ظهور'], ['existence', 'وجود'],
      ['importance', 'أهمية'], ['prosperity', 'ازدهار'], ['ability', 'قدرة'], ['creativity', 'إبداع'],
      ['weakness', 'ضعف'], ['greatness', 'عظمة'], ['richness', 'ثراء'], ['failure', 'فشل'], ['passage', 'ممر / مرور'],
      ['development', 'تطور'], ['discovery', 'اكتشاف'], ['destruction', 'دمار'], ['survival', 'بقاء'],
      ['independence', 'استقلال'], ['power', 'قوة / سلطة'], ['humanity', 'الإنسانية'], ['gradual', 'تدريجي'], ['sudden', 'مفاجئ'],
      ['to rule', 'يحكم'],
    ],
    exercises: [
      { q: 'Task 1. Give the noun: develop, discover, destroy, prosperous, decline, powerful, survive, independent.',
        a: 'development, discovery, destruction, prosperity, decline, power, survival, independence' },
      { q: 'Task 2. 1. The (invade) of Rome by barbarian tribes caused its fall. 2. The pyramids are a great (achieve) of the Egyptians. 3. The (weak) of the government led to the (decline) of the empire. 4. The (invent) of writing changed the history of humanity.',
        a: '1. invasion — 2. achievement — 3. weakness / decline — 4. invention' },
      { q: 'Task 3. Match: 1. rise 2. flourish 3. decline 4. collapse 5. empire — a. to develop successfully b. a group of countries ruled by one leader c. a sudden and complete fall d. the beginning and growth e. a gradual loss of power.',
        a: '1-d · 2-a · 3-e · 4-c · 5-b' },
      { q: 'Task 4. Write three sentences about an ancient civilization using four nouns from the lesson.',
        a: 'Example: The prosperity of Egypt came from the Nile. The invention of hieroglyphs was a great achievement. The weakness of its kings led to its decline.' },
    ],
    quizDate: '2026-11-27',
    quiz: { title: 'Forming nouns', questions: [
      { q: 'achieve → ?', options: ['achievation', 'achievement', 'achievity'], answer: 1 },
      { q: 'invade → ?', options: ['invasion', 'invadement', 'invadeness'], answer: 0 },
      { q: 'prosperous → ?', options: ['prosperment', 'prosperness', 'prosperity'], answer: 2 },
      { q: 'weak → ?', options: ['weakness', 'weakity', 'weakment'], answer: 0 },
      { q: 'survive → ?', options: ['survivement', 'survival', 'survivity'], answer: 1 },
      { q: 'The ___ of writing changed the history of humanity.', options: ['invent', 'inventive', 'invention'], answer: 2 },
      { q: '“a sudden and complete fall” =', options: ['collapse', 'decline', 'rise'], answer: 0 },
      { q: '“to develop successfully” =', options: ['decline', 'flourish', 'invade'], answer: 1 },
      { q: '«prosperity» means…', options: ['ضعف', 'دمار', 'ازدهار'], answer: 2 },
    ] },
  },
];
