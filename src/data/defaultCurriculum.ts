import {
  SubjectMeta,
  LearningContent,
  YouTubeVideoItem,
  EvaluationTest,
  NoticeItem
} from '../types';
import { CURRENT_CBSE_NCERT_SUBJECTS } from './currentCurriculum2026';

// Authentic original photograph of Revered Shri Neem Karoli Baba Maharaj-ji (Local & Wikimedia Commons CC0)
export const BABA_IMAGE_URL = '/baba.jpg';
export const BABA_DARSHAN_FALLBACK = 'https://upload.wikimedia.org/wikipedia/commons/6/68/Neem_Karoli_baba.jpg';

export const AUTHENTIC_BABA_PHOTOS = [
  {
    id: 'original-local',
    title: 'श्री नीम करौली बाबा जी - मूल पावन स्वरूप (कंबल वाले बाबा)',
    url: '/baba.jpg'
  },
  {
    id: 'original-wikimedia-portrait',
    title: 'श्री नीम करौली बाबा जी - हाई रेजोल्यूशन पावन चित्र',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/68/Neem_Karoli_baba.jpg'
  },
  {
    id: 'original-darshan-png',
    title: 'श्री नीम करौली बाबा जी - कैंची धाम आश्रम स्वरूप',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Shri_Neem_Karoli_Baba.png'
  },
  {
    id: 'vrindavan-samadhi',
    title: 'बाबा नीम करौली जी महाराज समाधि मंदिर दर्शन (वृन्दावन)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Neem_Karoli_Baba%2C_Samadhi_Mandir%2C_Vrindavan.JPG/640px-Neem_Karoli_Baba%2C_Samadhi_Mandir%2C_Vrindavan.JPG'
  }
];

export const SUPPORTED_BOARDS = [
  { id: 'CBSE', name: 'CBSE (Central Board)', hindiName: 'सीबीएसई (केंद्रीय माध्यमिक शिक्षा बोर्ड)' },
  { id: 'ICSE_ISC', name: 'CISCE (ICSE / ISC)', hindiName: 'आईसीएसई / आईएससी' },
  { id: 'UP_BOARD', name: 'UPMSP (Uttar Pradesh Board)', hindiName: 'उत्तर प्रदेश माध्यमिक शिक्षा परिषद' },
  { id: 'BIHAR_BOARD', name: 'BSEB (Bihar School Examination Board)', hindiName: 'बिहार विद्यालय परीक्षा समिति' },
  { id: 'STATE_BOARD', name: 'Other State Education Boards', hindiName: 'अन्य राज्य शिक्षा बोर्ड' }
];

const LEGACY_SUBJECTS: SubjectMeta[] = [
  // Class 10 Subjects (Strictly conforming to user prompt)
  {
    id: 'c10-hindi-a',
    name: 'Hindi Course A (क्षितिज एवं कृतिका)',
    hindiName: 'हिन्दी कोर्स - "अ" (क्षितिज व कृतिका)',
    officialCode: '002',
    stream: 'General',
    classes: ['Class 10'],
    icon: 'BookOpen',
    chapters: [
      {
        id: 'c10-ha-ch1',
        title: 'Netaji Ka Chashma (नेताजी का चश्मा - स्वयं प्रकाश)',
        hindiTitle: 'नेताजी का चश्मा (स्वयं प्रकाश)',
        chapterNumber: 1,
        topics: [
          { id: 'c10-ha-ch1-t1', title: 'Deshbhakti and Haldaar Saab perspective', hindiTitle: 'देशभक्ति की भावना और हालदार साहब', order: 1 },
          { id: 'c10-ha-ch1-t2', title: 'Captain Chashmewala Character Analysis', hindiTitle: 'कैप्टन चश्मेवाले का चरित्र चित्रण', order: 2 }
        ]
      },
      {
        id: 'c10-ha-ch2',
        title: 'Surdas ke Pad (सूरदास के पद - भ्रमरगीत)',
        hindiTitle: 'सूरदास के पद (भ्रमरगीत सार)',
        chapterNumber: 2,
        topics: [
          { id: 'c10-ha-ch2-t1', title: 'Gopiyon ka Prem evam Uddhav ka Yog-Gyan', hindiTitle: 'गोपियों का अनन्य प्रेम व उद्धव का योग', order: 1 }
        ]
      }
    ]
  },
  {
    id: 'c10-hindi-b',
    name: 'Hindi Course B (स्पर्श एवं संचयन)',
    hindiName: 'हिन्दी कोर्स - "ब" (स्पर्श व संचयन)',
    officialCode: '085',
    stream: 'General',
    classes: ['Class 10'],
    icon: 'BookMarked',
    chapters: [
      {
        id: 'c10-hb-ch1',
        title: 'Bade Bhai Sahab (बड़े भाई साहब - प्रेमचंद)',
        hindiTitle: 'बड़े भाई साहब (मुंशी प्रेमचंद)',
        chapterNumber: 1,
        topics: [
          { id: 'c10-hb-ch1-t1', title: 'Rote Learning vs True Understanding', hindiTitle: 'रटंत विद्या बनाम व्यावहारिक समझ', order: 1 },
          { id: 'c10-hb-ch1-t2', title: 'Elder Brother Responsibility & Emotions', hindiTitle: 'बड़े भाई का बड़प्पन और कर्तव्यबोध', order: 2 }
        ]
      },
      {
        id: 'c10-hb-ch2',
        title: 'Saakhi (साखी - कबीरदास)',
        hindiTitle: 'साखी (कबीरदास जी के दोहे)',
        chapterNumber: 2,
        topics: [
          { id: 'c10-hb-ch2-t1', title: 'Kasturi Kundal Base evam Prem ka Mahatva', hindiTitle: 'कस्तूरी कुंडल बसै व प्रेम का महत्त्व', order: 1 }
        ]
      }
    ]
  },
  {
    id: 'c10-eng-a',
    name: 'English Language & Literature (Course A)',
    hindiName: 'अंग्रेजी भाषा एवं साहित्य (कोर्स ए)',
    officialCode: '184',
    stream: 'General',
    classes: ['Class 10'],
    icon: 'Feather',
    chapters: [
      {
        id: 'c10-eng-ch1',
        title: 'A Letter to God (G.L. Fuentes)',
        hindiTitle: 'अ लेटर टू गॉड (ईश्वर के नाम पत्र)',
        chapterNumber: 1,
        topics: [
          { id: 'c10-eng-ch1-t1', title: 'Faith of Lencho and Irony of Post Office Staff', hindiTitle: 'लेंचो का अटूट विश्वास व व्यंग्य', order: 1 }
        ]
      },
      {
        id: 'c10-eng-ch2',
        title: 'Nelson Mandela: Long Walk to Freedom',
        hindiTitle: 'नेल्सन मंडेला: लॉन्ग वॉक टू फ्रीडम',
        chapterNumber: 2,
        topics: [
          { id: 'c10-eng-ch2-t1', title: 'Concept of Freedom and Apartheid Struggle', hindiTitle: 'स्वतंत्रता की संकल्पना व रंगभेद', order: 1 }
        ]
      }
    ]
  },
  {
    id: 'c10-eng-b',
    name: 'English Communicative (Course B)',
    hindiName: 'अंग्रेजी कम्युनिकेटिव (कोर्स बी)',
    officialCode: '101',
    stream: 'General',
    classes: ['Class 10'],
    icon: 'MessageSquareText',
    chapters: [
      {
        id: 'c10-engb-ch1',
        title: 'Two Gentlemen of Verona (A.J. Cronin)',
        hindiTitle: 'टू जेंटलमैन ऑफ वेरोना',
        chapterNumber: 1,
        topics: [
          { id: 'c10-engb-ch1-t1', title: 'Sacrifice, Brotherhood, and Devotion', hindiTitle: 'त्याग, भ्रातृत्व और सेवाभाव', order: 1 }
        ]
      }
    ]
  },
  {
    id: 'c10-math-std',
    name: 'Mathematics Standard',
    hindiName: 'गणित (मानक / स्टैंडर्ड)',
    officialCode: '041',
    stream: 'General',
    classes: ['Class 10'],
    icon: 'Calculator',
    chapters: [
      {
        id: 'c10-math-ch1',
        title: 'Real Numbers (वास्तविक संख्याएँ)',
        hindiTitle: 'वास्तविक संख्याएँ (Real Numbers)',
        chapterNumber: 1,
        topics: [
          { id: 'c10-math-ch1-t1', title: 'Fundamental Theorem of Arithmetic & HCF/LCM', hindiTitle: 'अंकगणित की आधारभूत प्रमेय', order: 1 },
          { id: 'c10-math-ch1-t2', title: 'Proving Irrationality of √2, √3, √5', hindiTitle: 'अपरिमेय संख्याओं का सत्यापन', order: 2 }
        ]
      },
      {
        id: 'c10-math-ch2',
        title: 'Quadratic Equations & Polynomials',
        hindiTitle: 'द्विघात समीकरण एवं बहुपद',
        chapterNumber: 2,
        topics: [
          { id: 'c10-math-ch2-t1', title: 'Roots of Quadratic Equation & Discriminant', hindiTitle: 'द्विघात समीकरण के मूल व विविक्तकर', order: 1 }
        ]
      },
      {
        id: 'c10-math-ch3',
        title: 'Introduction to Trigonometry',
        hindiTitle: 'त्रिकोणमिति का परिचय',
        chapterNumber: 3,
        topics: [
          { id: 'c10-math-ch3-t1', title: 'Trigonometric Ratios & Standard Angles', hindiTitle: 'त्रिकोणमितीय अनुपात व विशिष्ट कोण', order: 1 },
          { id: 'c10-math-ch3-t2', title: 'Trigonometric Identities (sin²θ + cos²θ = 1)', hindiTitle: 'त्रिकोणमितीय सर्वसमिकाएँ', order: 2 }
        ]
      }
    ]
  },
  {
    id: 'c10-math-basic',
    name: 'Mathematics Basic',
    hindiName: 'गणित (बुनियादी / बेसिक)',
    officialCode: '241',
    stream: 'General',
    classes: ['Class 10'],
    icon: 'Sigma',
    chapters: [
      {
        id: 'c10-mb-ch1',
        title: 'Real Numbers & Polynomials (Basic Application)',
        hindiTitle: 'वास्तविक संख्याएँ एवं बहुपद (बेसिक)',
        chapterNumber: 1,
        topics: [
          { id: 'c10-mb-ch1-t1', title: 'Prime Factorisation and Direct Formula Problems', hindiTitle: 'अभाज्य गुणनखंड व सीधे सूत्र', order: 1 }
        ]
      },
      {
        id: 'c10-mb-ch2',
        title: 'Linear Equations in Two Variables',
        hindiTitle: 'दो चरों वाले रैखिक समीकरण युग्म',
        chapterNumber: 2,
        topics: [
          { id: 'c10-mb-ch2-t1', title: 'Elimination and Substitution Method', hindiTitle: 'विलोपन एवं प्रतिस्थापन विधि', order: 1 }
        ]
      }
    ]
  },
  {
    id: 'c10-science',
    name: 'Science (विज्ञान)',
    hindiName: 'विज्ञान (भौतिकी, रसायन, जीव विज्ञान)',
    officialCode: '086',
    stream: 'General',
    classes: ['Class 10'],
    icon: 'Atom',
    chapters: [
      {
        id: 'c10-sci-ch1',
        title: 'Chemical Reactions and Equations',
        hindiTitle: 'रासायनिक अभिक्रियाएँ एवं समीकरण',
        chapterNumber: 1,
        topics: [
          { id: 'c10-sci-ch1-t1', title: 'Balancing Chemical Equations', hindiTitle: 'रासायनिक समीकरणों को संतुलित करना', order: 1 },
          { id: 'c10-sci-ch1-t2', title: 'Combination, Decomposition, Displacement & Redox', hindiTitle: 'संयोजन, वियोजन, विस्थापन व रेडॉक्स', order: 2 }
        ]
      },
      {
        id: 'c10-sci-ch2',
        title: 'Electricity (विद्युत)',
        hindiTitle: 'विद्युत (Electricity)',
        chapterNumber: 2,
        topics: [
          { id: 'c10-sci-ch2-t1', title: "Ohm's Law, Resistance and Resistivity", hindiTitle: 'ओम का नियम, प्रतिरोध व प्रतिरोधकता', order: 1 },
          { id: 'c10-sci-ch2-t2', title: 'Series and Parallel Resistors & Heating Effect', hindiTitle: 'श्रेणी व पार्श्वक्रम संयोजन व जूल का नियम', order: 2 }
        ]
      },
      {
        id: 'c10-sci-ch3',
        title: 'Life Processes (जैव प्रक्रम)',
        hindiTitle: 'जैव प्रक्रम (Life Processes)',
        chapterNumber: 3,
        topics: [
          { id: 'c10-sci-ch3-t1', title: 'Nutrition, Photosynthesis & Human Digestive System', hindiTitle: 'पोषण, प्रकाश-संश्लेषण व मानव पाचन तंत्र', order: 1 },
          { id: 'c10-sci-ch3-t2', title: 'Respiration and Transportation in Humans', hindiTitle: 'श्वसन तथा मानव में परिसंचरण', order: 2 }
        ]
      }
    ]
  },
  {
    id: 'c10-social',
    name: 'Social Science (सामाजिक विज्ञान)',
    hindiName: 'सामाजिक विज्ञान (इतिहास, भूगोल, राजनीति, अर्थशास्त्र)',
    officialCode: '087',
    stream: 'General',
    classes: ['Class 10'],
    icon: 'Globe',
    chapters: [
      {
        id: 'c10-sst-ch1',
        title: 'The Rise of Nationalism in Europe (इतिहास)',
        hindiTitle: 'यूरोप में राष्ट्रवाद का उदय',
        chapterNumber: 1,
        topics: [
          { id: 'c10-sst-ch1-t1', title: 'French Revolution and the Idea of Nation', hindiTitle: 'फ्रांसीसी क्रांति और राष्ट्र का विचार', order: 1 },
          { id: 'c10-sst-ch1-t2', title: 'Unification of Germany and Italy', hindiTitle: 'जर्मनी और इटली का एकीकरण', order: 2 }
        ]
      },
      {
        id: 'c10-sst-ch2',
        title: 'Power Sharing (लोकतांत्रिक राजनीति)',
        hindiTitle: 'सत्ता की साझेदारी (Civics)',
        chapterNumber: 2,
        topics: [
          { id: 'c10-sst-ch2-t1', title: 'Case Study: Belgium and Sri Lanka', hindiTitle: 'बेल्जियम और श्रीलंका का उदाहरण', order: 1 }
        ]
      },
      {
        id: 'c10-sst-ch3',
        title: 'Development (अर्थशास्त्र)',
        hindiTitle: 'विकास (Understanding Economic Development)',
        chapterNumber: 3,
        topics: [
          { id: 'c10-sst-ch3-t1', title: 'National Income, Per Capita Income & HDI', hindiTitle: 'राष्ट्रीय आय, प्रति व्यक्ति आय व मानव विकास', order: 1 }
        ]
      }
    ]
  },
  {
    id: 'c10-it',
    name: 'Information Technology (IT 402)',
    hindiName: 'सूचना प्रौद्योगिकी (IT कोड 402)',
    officialCode: '402',
    stream: 'General',
    classes: ['Class 10'],
    icon: 'Cpu',
    chapters: [
      {
        id: 'c10-it-ch1',
        title: 'Digital Documentation (Advanced - LibreOffice Writer)',
        hindiTitle: 'डिजिटल दस्तावेज़ीकरण (एडवांस्ड)',
        chapterNumber: 1,
        topics: [
          { id: 'c10-it-ch1-t1', title: 'Applying Styles, Templates and Mail Merge', hindiTitle: 'स्टाइल्स, टेम्पलेट्स और मेल मर्ज का उपयोग', order: 1 }
        ]
      },
      {
        id: 'c10-it-ch2',
        title: 'Electronic Spreadsheet (Advanced)',
        hindiTitle: 'इलेक्ट्रॉनिक स्प्रेडशीट (एडवांस्ड)',
        chapterNumber: 2,
        topics: [
          { id: 'c10-it-ch2-t1', title: 'Goal Seek, Scenarios, and Linking Spreadsheets', hindiTitle: 'गोल सीक, सिनेरियो एवं शीट लिंकिंग', order: 1 }
        ]
      }
    ]
  },
  {
    id: 'c10-sanskrit',
    name: 'Sanskrit (शेमुषी भाग-2)',
    hindiName: 'संस्कृत (शेमुषी भाग-2)',
    officialCode: '122',
    stream: 'General',
    classes: ['Class 10'],
    icon: 'Sparkles',
    chapters: [
      {
        id: 'c10-sk-ch1',
        title: 'Shuchi Paryavaranam (शुचिपर्यावरणम्)',
        hindiTitle: 'शुचिपर्यावरणम् (पर्यावरण संरक्षण)',
        chapterNumber: 1,
        topics: [
          { id: 'c10-sk-ch1-t1', title: 'Paryavaran Shuddhi and Shloka Arth', hindiTitle: 'पर्यावरण शुद्धि एवं श्लोकों का भावार्थ', order: 1 }
        ]
      },
      {
        id: 'c10-sk-ch2',
        title: 'Buddhirbalavati Sada (बुद्धिर्बलवती सदा)',
        hindiTitle: 'बुद्धिर्बलवती सदा (कथा)',
        chapterNumber: 2,
        topics: [
          { id: 'c10-sk-ch2-t1', title: 'Vyaghra-Budhimati Katha and Sandhi Viched', hindiTitle: 'व्याघ्र-बुद्धिमती कथा व सन्धि विच्छेद', order: 1 }
        ]
      }
    ]
  },

  // Class 12 Science Subjects
  {
    id: 'c12-phy',
    name: 'Physics (भौतिक विज्ञान)',
    hindiName: 'भौतिक विज्ञान (कक्षा 12)',
    officialCode: '042',
    stream: 'Science',
    classes: ['Class 12'],
    icon: 'Zap',
    chapters: [
      {
        id: 'c12-phy-ch1',
        title: 'Electric Charges and Fields',
        hindiTitle: 'विद्युत आवेश तथा क्षेत्र',
        chapterNumber: 1,
        topics: [
          { id: 'c12-phy-ch1-t1', title: "Coulomb's Law, Electric Dipole & Gauss Theorem", hindiTitle: 'कूलॉम नियम, विद्युत द्विध्रुव व गॉस प्रमेय', order: 1 }
        ]
      },
      {
        id: 'c12-phy-ch2',
        title: 'Current Electricity',
        hindiTitle: 'विद्युत धारा (Current Electricity)',
        chapterNumber: 2,
        topics: [
          { id: 'c12-phy-ch2-t1', title: "Kirchhoff's Laws & Wheatstone Bridge", hindiTitle: 'किरचॉफ के नियम एवं व्हीटस्टोन सेतु', order: 1 }
        ]
      }
    ]
  },
  {
    id: 'c12-chem',
    name: 'Chemistry (रसायन विज्ञान)',
    hindiName: 'रसायन विज्ञान (कक्षा 12)',
    officialCode: '043',
    stream: 'Science',
    classes: ['Class 12'],
    icon: 'FlaskConical',
    chapters: [
      {
        id: 'c12-chem-ch1',
        title: 'Solutions (विलयन)',
        hindiTitle: 'विलयन (Colligative Properties)',
        chapterNumber: 1,
        topics: [
          { id: 'c12-chem-ch1-t1', title: "Raoult's Law and Colligative Properties", hindiTitle: 'राउल्ट का नियम एवं अणुसंख्य गुणधर्म', order: 1 }
        ]
      },
      {
        id: 'c12-chem-ch2',
        title: 'Electrochemistry (वैद्युतरसायन)',
        hindiTitle: 'वैद्युतरसायन एवं नेर्न्स्ट समीकरण',
        chapterNumber: 2,
        topics: [
          { id: 'c12-chem-ch2-t1', title: 'Nernst Equation and Kohlrausch Law', hindiTitle: 'नेर्न्स्ट समीकरण व कोलराउश का नियम', order: 1 }
        ]
      }
    ]
  },
  {
    id: 'c12-math',
    name: 'Mathematics (गणित)',
    hindiName: 'गणित (कक्षा 12)',
    officialCode: '041',
    stream: 'Science',
    classes: ['Class 12'],
    icon: 'Variable',
    chapters: [
      {
        id: 'c12-math-ch1',
        title: 'Continuity, Differentiability & Derivatives',
        hindiTitle: 'सांतत्य, अवकलनीयता तथा अवकलन',
        chapterNumber: 1,
        topics: [
          { id: 'c12-math-ch1-t1', title: 'Chain Rule, Logarithmic & Parametric Differentiation', hindiTitle: 'शृंखला नियम व प्राचलिक अवकलन', order: 1 }
        ]
      },
      {
        id: 'c12-math-ch2',
        title: 'Integrals (समाकलन)',
        hindiTitle: 'अनिश्चित एवं निश्चित समाकलन',
        chapterNumber: 2,
        topics: [
          { id: 'c12-math-ch2-t1', title: 'Integration by Parts & Definite Integrals Properties', hindiTitle: 'खंडशः समाकलन व निश्चित समाकलन गुणधर्म', order: 1 }
        ]
      }
    ]
  },
  {
    id: 'c12-bio',
    name: 'Biology (जीव विज्ञान)',
    hindiName: 'जीव विज्ञान (कक्षा 12)',
    officialCode: '044',
    stream: 'Science',
    classes: ['Class 12'],
    icon: 'Dna',
    chapters: [
      {
        id: 'c12-bio-ch1',
        title: 'Principles of Inheritance and Variation',
        hindiTitle: 'वंशागति तथा विविधता के सिद्धांत',
        chapterNumber: 1,
        topics: [
          { id: 'c12-bio-ch1-t1', title: "Mendelian Genetics, Monohybrid & Dihybrid Cross", hindiTitle: 'मेंडेलियन आनुवंशिकी व संकरण', order: 1 }
        ]
      }
    ]
  },

  // Class 12 Commerce Subjects
  {
    id: 'c12-acc',
    name: 'Accountancy (लेखाशास्त्र)',
    hindiName: 'लेखाशास्त्र (कक्षा 12)',
    officialCode: '055',
    stream: 'Commerce',
    classes: ['Class 12'],
    icon: 'Layers',
    chapters: [
      {
        id: 'c12-acc-ch1',
        title: 'Accounting for Partnership: Fundamentals',
        hindiTitle: 'साझेदारी फर्मों का लेखांकन: मूलभूत सिद्धांत',
        chapterNumber: 1,
        topics: [
          { id: 'c12-acc-ch1-t1', title: 'Profit & Loss Appropriation and Capital Accounts', hindiTitle: 'लाभ-हानि नियोजन व पूँजी खाते', order: 1 }
        ]
      }
    ]
  },
  {
    id: 'c12-bst',
    name: 'Business Studies (व्यावसायिक अध्ययन)',
    hindiName: 'व्यावसायिक अध्ययन (कक्षा 12)',
    officialCode: '054',
    stream: 'Commerce',
    classes: ['Class 12'],
    icon: 'Briefcase',
    chapters: [
      {
        id: 'c12-bst-ch1',
        title: 'Principles of Management (Fayol & Taylor)',
        hindiTitle: 'प्रबंध के सिद्धांत (फेयोल व टेलर)',
        chapterNumber: 1,
        topics: [
          { id: 'c12-bst-ch1-t1', title: '14 Principles of Henri Fayol with Business Cases', hindiTitle: 'हेनरी फेयोल के 14 सिद्धांत', order: 1 }
        ]
      }
    ]
  },
  {
    id: 'c12-eco',
    name: 'Economics (अर्थशास्त्र)',
    hindiName: 'अर्थशास्त्र (व्यष्टि व समष्टि)',
    officialCode: '030',
    stream: 'Commerce',
    classes: ['Class 12'],
    icon: 'TrendingUp',
    chapters: [
      {
        id: 'c12-eco-ch1',
        title: 'National Income and Related Aggregates',
        hindiTitle: 'राष्ट्रीय आय एवं संबंधित समुच्चय',
        chapterNumber: 1,
        topics: [
          { id: 'c12-eco-ch1-t1', title: 'GDP, NNP, Value Added, Income & Expenditure Methods', hindiTitle: 'सकल घरेलू उत्पाद व आय विधियाँ', order: 1 }
        ]
      }
    ]
  },

  // Class 12 Humanities Subjects
  {
    id: 'c12-hist',
    name: 'History (इतिहास)',
    hindiName: 'इतिहास (भारतीय इतिहास के कुछ विषय)',
    officialCode: '027',
    stream: 'Humanities',
    classes: ['Class 12'],
    icon: 'Compass',
    chapters: [
      {
        id: 'c12-hist-ch1',
        title: 'Bricks, Beads and Bones (Harappan Civilisation)',
        hindiTitle: 'ईंटें, मनके तथा अस्थियाँ (हड़प्पा सभ्यता)',
        chapterNumber: 1,
        topics: [
          { id: 'c12-hist-ch1-t1', title: 'Town Planning, Drainage System and Citadel', hindiTitle: 'हड़प्पा की नगर योजना व दुर्ग व्यवस्था', order: 1 }
        ]
      }
    ]
  },
  {
    id: 'c12-pol',
    name: 'Political Science (राजनीति विज्ञान)',
    hindiName: 'राजनीति विज्ञान (समकालीन विश्व राजनीति)',
    officialCode: '028',
    stream: 'Humanities',
    classes: ['Class 12'],
    icon: 'Shield',
    chapters: [
      {
        id: 'c12-pol-ch1',
        title: 'The End of Bipolarity & Contemporary World',
        hindiTitle: 'दो ध्रुवीयता का अंत व सोवियत विघटन',
        chapterNumber: 1,
        topics: [
          { id: 'c12-pol-ch1-t1', title: 'Disintegration of Soviet Union & Shock Therapy', hindiTitle: 'सोवियत संघ का विघटन व शॉक थेरेपी', order: 1 }
        ]
      }
    ]
  },

  // Class 12 Languages
  {
    id: 'c12-eng-core',
    name: 'English Core',
    hindiName: 'अंग्रेजी कोर (English Core 301)',
    officialCode: '301',
    stream: 'General',
    classes: ['Class 12'],
    icon: 'BookOpenCheck',
    chapters: [
      {
        id: 'c12-eng-ch1',
        title: 'The Last Lesson (Alphonse Daudet)',
        hindiTitle: 'द लास्ट लेसन (अंतिम पाठ)',
        chapterNumber: 1,
        topics: [
          { id: 'c12-eng-ch1-t1', title: 'Linguistic Chauvinism and Patriotism of M. Hamel', hindiTitle: 'मातृभाषा का महत्व व एम. हेमल का त्याग', order: 1 }
        ]
      }
    ]
  },

  // Class 9 Core Subjects
  {
    id: 'c9-math',
    name: 'Mathematics (Class 9)',
    hindiName: 'गणित (कक्षा 9)',
    officialCode: '041',
    stream: 'General',
    classes: ['Class 9'],
    icon: 'Calculator',
    chapters: [
      {
        id: 'c9-math-ch1',
        title: 'Number Systems (संख्या पद्धति)',
        hindiTitle: 'संख्या पद्धति (Number Systems)',
        chapterNumber: 1,
        topics: [
          { id: 'c9-math-ch1-t1', title: 'Rationalisation of Denominator & Laws of Exponents', hindiTitle: 'हर का परिमेयकरण व घातांक नियम', order: 1 }
        ]
      }
    ]
  },
  {
    id: 'c9-sci',
    name: 'Science (Class 9)',
    hindiName: 'विज्ञान (कक्षा 9)',
    officialCode: '086',
    stream: 'General',
    classes: ['Class 9'],
    icon: 'Atom',
    chapters: [
      {
        id: 'c9-sci-ch1',
        title: 'Matter in Our Surroundings',
        hindiTitle: 'हमारे आस-पास के पदार्थ',
        chapterNumber: 1,
        topics: [
          { id: 'c9-sci-ch1-t1', title: 'States of Matter and Latent Heat of Vaporisation', hindiTitle: 'पदार्थ की अवस्थाएँ व गुप्त ऊष्मा', order: 1 }
        ]
      }
    ]
  }
];

const CURRENT_KEYS = new Set(CURRENT_CBSE_NCERT_SUBJECTS.flatMap(s => s.classes.map(c => `${c}|${s.name}`)));
export const ALL_SUBJECTS: SubjectMeta[] = [
  ...CURRENT_CBSE_NCERT_SUBJECTS,
  ...LEGACY_SUBJECTS.filter(s => !s.classes.some(c => CURRENT_KEYS.has(`${c}|${s.name}`)))
];

export const INITIAL_LEARNING_CONTENTS: LearningContent[] = [
  // Class 10 Science Detailed Notes
  {
    id: 'seed-c10-sci-ch1-dn',
    contentType: 'detailed_notes',
    board: 'CBSE',
    classGrade: 'Class 10',
    stream: 'General',
    subjectId: 'c10-science',
    subjectName: 'Science',
    chapterId: 'c10-sci-ch1',
    chapterTitle: 'Chemical Reactions and Equations',
    topicId: 'c10-sci-ch1-t1',
    topicTitle: 'Balancing Chemical Equations',
    title: 'Complete Master Guide: Chemical Reactions & Balancing Equations',
    hindiTitle: 'रासायनिक अभिक्रियाएँ एवं समीकरण संतुलन: सम्पूर्ण मार्गदर्शिका',
    bodyText: `### 1. What is a Chemical Reaction?
A chemical reaction is a process where one or more substances (reactants) transform into new substances (products) with entirely different chemical properties.
Key Observations signaling a chemical change:
- Change in state (e.g., solid + liquid → gas)
- Change in temperature (Exothermic or Endothermic)
- Change in color (e.g., rust, precipitate formation)
- Evolution of gas (e.g., Hydrogen gas pops with sound)

### 2. The Law of Conservation of Mass
According to Antoine Lavoisier: **"Mass can neither be created nor destroyed in a chemical reaction."**
Therefore:
Total mass of Reactants = Total mass of Products
Number of atoms of each element remains identical on both sides.

### 3. Step-by-Step Hit-and-Trial Balancing Method
Let us balance: Fe + H2O → Fe3O4 + H2
1. List element counts:
   - Reactants: Fe = 1, H = 2, O = 1
   - Products: Fe = 3, H = 2, O = 4
2. Balance element with maximum atoms first (Oxygen):
   Fe + 4H2O → Fe3O4 + H2 (Now O = 4, but H = 8 in reactant)
3. Balance Hydrogen atoms:
   Fe + 4H2O → Fe3O4 + 4H2
4. Balance Iron (Fe):
   3Fe + 4H2O(g) → Fe3O4(s) + 4H2(g)
5. Verify: Fe: 3 = 3, H: 8 = 8, O: 4 = 4. Fully balanced!`,
    bodyHindi: `### १. रासायनिक अभिक्रिया क्या है?
जब एक या अधिक पदार्थ आपस में क्रिया करके नए गुणधर्म वाले पदार्थों का निर्माण करते हैं, तो उसे रासायनिक अभिक्रिया कहते हैं।
अभिक्रिया के प्रमुख लक्षण:
- अवस्था में परिवर्तन
- रंग में परिवर्तन
- गैस का निष्कासन
- तापमान में परिवर्तन (ऊष्माक्षेपी या ऊष्माशोषी)

### २. द्रव्यमान संरक्षण का नियम
रासायनिक अभिक्रिया में द्रव्यमान का न तो सृजन हो सकता है और न ही विनाश।
अतः अभिकारकों के कुल परमाणुओं की संख्या = उत्पादों के कुल परमाणुओं की संख्या।`,
    version: 1,
    approved: true,
    published: true,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z'
  },

  // Class 10 Science Formulas
  {
    id: 'seed-c10-sci-ch2-formulas',
    contentType: 'formulae',
    board: 'CBSE',
    classGrade: 'Class 10',
    stream: 'General',
    subjectId: 'c10-science',
    subjectName: 'Science',
    chapterId: 'c10-sci-ch2',
    chapterTitle: 'Electricity',
    title: 'Class X Electricity: All Essential Formulae & Physical Laws',
    hindiTitle: 'विद्युत अध्याय: सभी आवश्यक सूत्र एवं भौतिक नियम',
    bodyText: 'Master compilation of all electrical circuits, resistance laws, and energy power relations.',
    formulaItems: [
      {
        id: 'f1',
        name: "Ohm's Law (ओम का नियम)",
        formula: 'V = I × R',
        definition: 'Potential difference across metallic wire is directly proportional to current, provided temperature remains constant.',
        definitionHindi: 'नियत ताप पर चालक के सिरों के बीच विभवांतर उसमें प्रवाहित विद्युत धारा के समानुपाती होता है।',
        units: 'V (Volts), I (Amperes), R (Ohms Ω)',
        application: 'Used to calculate circuit voltage, current consumption, and resistor sizing.'
      },
      {
        id: 'f2',
        name: 'Resistance & Resistivity (प्रतिरोध एवं प्रतिरोधकता)',
        formula: 'R = ρ × (L / A)',
        definition: 'Resistance is directly proportional to length L and inversely proportional to cross-sectional area A.',
        definitionHindi: 'तार का प्रतिरोध उसकी लंबाई के समानुपाती और अनुप्रस्थ काट के क्षेत्रफल के व्युत्क्रमानुपाती होता है।',
        units: 'ρ (Resistivity in Ohm-meter Ω·m)',
        application: 'Comparing nichrome vs copper wires in heaters and transmission cables.'
      },
      {
        id: 'f3',
        name: "Joule's Law of Heating (जूल का तापन नियम)",
        formula: 'H = I² × R × t',
        definition: 'Heat generated in a resistor is proportional to square of current, resistance, and time duration.',
        definitionHindi: 'उत्पन्न ऊष्मा धारा के वर्ग, प्रतिरोध तथा समय के गुणनफल के समानुपाती होती है।',
        units: 'H (Joules J)',
        application: 'Electric iron, toaster, geyser, and safety fuses.'
      },
      {
        id: 'f4',
        name: 'Electric Power Formulae (विद्युत शक्ति सूत्र)',
        formula: 'P = V × I = I²R = V² / R',
        definition: 'Rate at which electrical energy is consumed or dissipated in a circuit.',
        definitionHindi: 'विद्युत परिपथ में ऊर्जा उपभोग की दर को विद्युत शक्ति कहते हैं।',
        units: 'Watt (W), 1 kWh = 3.6 × 10⁶ Joules',
        application: 'Household electricity meter billing calculations.'
      }
    ],
    version: 1,
    approved: true,
    published: true,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z'
  },

  // Class 10 Maths Standard Flashcards
  {
    id: 'seed-c10-math-ch3-flashcards',
    contentType: 'flashcards',
    board: 'CBSE',
    classGrade: 'Class 10',
    stream: 'General',
    subjectId: 'c10-math-std',
    subjectName: 'Mathematics Standard',
    chapterId: 'c10-math-ch3',
    chapterTitle: 'Introduction to Trigonometry',
    title: 'High-Yield Trigonometry Rapid Recall Flashcards',
    hindiTitle: 'त्रिकोणमिति त्वरित स्मरण फ्लैशकार्ड',
    bodyText: 'Flip cards for instant recall of trigonometric values, inverse relations, and Pythagorean identities.',
    flashcardItems: [
      {
        id: 'fc1',
        question: 'What is the exact value of sin(60°) and cos(30°)?',
        questionHindi: 'sin(60°) और cos(30°) का सटीक मान क्या है?',
        answer: 'Both equal √3 / 2 (approx 0.866). They are co-functions of complementary angles (60° + 30° = 90°).',
        hint: 'Derived from equilateral triangle with bisected angle.'
      },
      {
        id: 'fc2',
        question: 'State the three fundamental Pythagorean trigonometric identities.',
        questionHindi: 'तीनों प्रमुख त्रिकोणमितीय सर्वसमिकाएँ बताइए।',
        answer: '1. sin²θ + cos²θ = 1\n2. 1 + tan²θ = sec²θ\n3. 1 + cot²θ = cosec²θ',
        hint: 'Dividing sin²θ + cos²θ = 1 by cos²θ gives identity 2.'
      },
      {
        id: 'fc3',
        question: 'What is tan(45°) and what does it signify in real coordinates?',
        questionHindi: 'tan(45°) का मान क्या है और यह ढाल (slope) के संदर्भ में क्या दर्शाता है?',
        answer: 'tan(45°) = 1. In geometry, it represents a line with a 45° elevation where Rise equals Run (x = y).',
        hint: 'Equal sides in an isosceles right-angled triangle.'
      },
      {
        id: 'fc4',
        question: 'Why is sec(90°) undefined (not defined)?',
        questionHindi: 'sec(90°) अपरिभाषित क्यों होता है?',
        answer: 'sec(90°) = 1 / cos(90°). Since cos(90°) = 0, division by zero is undefined.',
        hint: 'Check the denominator in 1 / cos θ.'
      }
    ],
    version: 1,
    approved: true,
    published: true,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z'
  },

  // Class 10 Previous Year Questions (PYQs)
  {
    id: 'seed-c10-sci-ch1-pyq',
    contentType: 'pyqs',
    board: 'CBSE',
    classGrade: 'Class 10',
    stream: 'General',
    subjectId: 'c10-science',
    subjectName: 'Science',
    chapterId: 'c10-sci-ch1',
    chapterTitle: 'Chemical Reactions and Equations',
    title: 'Top Board PYQs with Model Marking Answers (2020-2024)',
    hindiTitle: 'बोर्ड के विगत वर्षों के प्रश्न व आदर्श उत्तर (2020-2024)',
    bodyText: 'Verified questions directly from CBSE Class X Board examination papers.',
    pyqItems: [
      {
        id: 'pyq1',
        year: 'CBSE 2024 (Set 31/1/1)',
        marks: 3,
        question: 'Why is respiration considered an exothermic reaction? Explain with a balanced chemical equation.',
        questionHindi: 'श्वसन को ऊष्माक्षेपी अभिक्रिया क्यों माना जाता है? संतुलित समीकरण सहित समझाइए।',
        solution: `Respiration is considered an exothermic reaction because during digestion, carbohydrates are broken down into glucose. This glucose combines with oxygen in the cells of our body and provides energy in the form of ATP.\n\nBalanced Equation:\nC6H12O6(aq) + 6O2(aq) → 6CO2(aq) + 6H2O(l) + Energy (ATP)\n\nMarking Scheme:\n- Mention of breakdown into glucose & release of energy: 1 Mark\n- Complete balanced chemical equation: 1.5 Marks\n- Physical states of reactants and products: 0.5 Mark`,
        repeatedFrequency: 'Asked in 2018, 2020, 2024'
      },
      {
        id: 'pyq2',
        year: 'CBSE 2023 (Set 31/2/2)',
        marks: 2,
        question: 'What is observed when barium chloride solution is added to copper sulphate solution? Name the type of reaction.',
        questionHindi: 'बेरियम क्लोराइड के विलयन में कॉपर सल्फेट मिलाने पर क्या प्रेक्षण होता है? अभिक्रिया का प्रकार बताइए।',
        solution: `Observation: A white precipitate of Barium Sulphate (BaSO4) is immediately formed, and the blue color of copper sulphate turns into a light greenish-blue solution of CuCl2.\nReaction: BaCl2(aq) + CuSO4(aq) → BaSO4(s)↓ + CuCl2(aq)\nType: Double Displacement Reaction and Precipitation Reaction.`,
        repeatedFrequency: 'Asked in 2019, 2023'
      }
    ],
    version: 1,
    approved: true,
    published: true,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z'
  },

  // Class 10 Case-Based Study
  {
    id: 'seed-c10-sci-ch2-case',
    contentType: 'case_studies',
    board: 'CBSE',
    classGrade: 'Class 10',
    stream: 'General',
    subjectId: 'c10-science',
    subjectName: 'Science',
    chapterId: 'c10-sci-ch2',
    chapterTitle: 'Electricity',
    title: 'Competency Case-Based Analysis: Domestic Electrical Installation',
    hindiTitle: 'योग्यता-आधारित केस स्टडी: घरेलू विद्युत परिपथ एवं सुरक्षा',
    bodyText: 'Real-world technical scenario on parallel wiring and short-circuit protection.',
    caseStudyItem: {
      id: 'cs1',
      title: 'Ananya Designs a Modern Home Circuit',
      caseText: `An engineer Ananya was commissioned to design the electrical circuitry for a new eco-friendly classroom at Sankatmochan Vidyapeeth. The room requires four 40W LED tubes, two 75W ceiling fans, and an electric projector rated at 250W. The mains supply voltage is 220V AC.
Ananya decided to wire all electrical appliances in parallel rather than in series. Furthermore, she installed a dedicated miniature circuit breaker (MCB) fuse rated at 5A.`,
      caseHindi: `एक इंजीनियर अनन्या ने संकटमोचन विद्यापीठ की एक स्मार्ट कक्षा का विद्युत परिपथ तैयार किया। परिपथ में 220V की आपूर्ति पर चार 40W के एलईडी, दो 75W के पंखे और एक 250W का प्रोजेक्टर लगाया गया। सभी उपकरणों को समानांतर क्रम में जोड़ा गया और 5A का सुरक्षा फ्यूज लगाया गया।`,
      questions: [
        {
          question: 'What is the primary advantage of connecting appliances in parallel rather than series in domestic circuits?',
          options: [
            'Total resistance becomes very large, saving power',
            'Each appliance receives full 220V mains voltage and can operate independently',
            'If one appliance burns out, all others stop working immediately',
            'Current through all appliances remains strictly identical'
          ],
          correctIndex: 1,
          explanation: 'In parallel connections, voltage across each branch is identical (220V), and switching off one appliance does not disrupt the others.'
        },
        {
          question: 'What is the total power consumption when all devices (4 tubes, 2 fans, 1 projector) operate simultaneously?',
          options: ['365 Watts', '560 Watts', '420 Watts', '610 Watts'],
          correctIndex: 1,
          explanation: 'Total Power = (4 × 40W) + (2 × 75W) + 250W = 160 + 150 + 250 = 560 Watts.'
        },
        {
          question: 'What will be the total current drawn from the 220V mains supply?',
          options: ['2.54 Amperes', '5.10 Amperes', '1.20 Amperes', '3.80 Amperes'],
          correctIndex: 0,
          explanation: 'I = P / V = 560W / 220V ≈ 2.545 Amperes. Since 2.545A < 5A fuse rating, the circuit operates safely.'
        }
      ]
    },
    version: 1,
    approved: true,
    published: true,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z'
  }
];

export const INITIAL_YOUTUBE_VIDEOS: YouTubeVideoItem[] = [
  {
    id: 'yt-c10-sci-ch1-1',
    youtubeId: 'gQ-X9wV8TXQ',
    title: 'Chemical Reactions and Equations in One Shot - Full Chapter CBSE Class 10',
    hindiTitle: 'रासायनिक अभिक्रियाएँ एवं समीकरण - पूरा अध्याय एक शॉट में',
    channelTitle: 'Science and Fun / NCERT Official',
    duration: '45:12',
    views: '1.2M views',
    thumbnail: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=640&auto=format&fit=crop',
    board: 'CBSE',
    classGrade: 'Class 10',
    subjectId: 'c10-science',
    chapterId: 'c10-sci-ch1',
    description: 'Comprehensive line-by-line concept breakdown, NCERT experiments, and live balancing problem practice with board tips.',
    tags: ['Class 10', 'Chemistry', 'NCERT', 'CBSE 2026'],
    approved: true,
    published: true,
    createdAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'yt-c10-sci-ch2-1',
    youtubeId: 'KYotVWOTApM',
    title: 'Electricity Class 10 Science - Full Chapter Detailed Concept & Numericals',
    hindiTitle: 'विद्युत (Electricity) कक्षा 10 - सम्पूर्ण अध्याय एवं आंकिक प्रश्न',
    channelTitle: 'Physics Wallah Foundation',
    duration: '52:10',
    views: '2.5M views',
    thumbnail: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=640&auto=format&fit=crop',
    board: 'CBSE',
    classGrade: 'Class 10',
    subjectId: 'c10-science',
    chapterId: 'c10-sci-ch2',
    description: "Ohm's law, circuit combinations, Joule's law of heating, and previous years board numericals solved step-by-step.",
    tags: ['Class 10', 'Physics', 'Electricity'],
    approved: true,
    published: true,
    createdAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'yt-c10-math-ch1-1',
    youtubeId: 'vRAp1w3-BHg',
    title: 'Real Numbers Class 10 Maths Standard/Basic - Concept + NCERT Solutions',
    hindiTitle: 'वास्तविक संख्याएँ कक्षा 10 - अंकगणित की आधारभूत प्रमेय एवं अपरिमेयता',
    channelTitle: 'Dear Sir / Saarthi Ganit Guru',
    duration: '38:40',
    views: '3.1M views',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=640&auto=format&fit=crop',
    board: 'CBSE',
    classGrade: 'Class 10',
    subjectId: 'c10-math-std',
    chapterId: 'c10-math-ch1',
    description: 'Proof of irrationality of root 5, Fundamental Theorem of Arithmetic, and LCM-HCF word problems with shortcuts.',
    tags: ['Maths Standard', 'Class 10', 'Board Revision'],
    approved: true,
    published: true,
    createdAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'yt-c10-math-ch3-1',
    youtubeId: 'sRZbjNtOflY',
    title: 'Introduction to Trigonometry Class 10 - Formula Trick & All Identities',
    hindiTitle: 'त्रिकोणमिति का परिचय कक्षा 10 - सभी सूत्र व सिद्ध करने वाले प्रश्न',
    channelTitle: 'Magnet Brains Education',
    duration: '48:20',
    views: '1.8M views',
    thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=640&auto=format&fit=crop',
    board: 'CBSE',
    classGrade: 'Class 10',
    subjectId: 'c10-math-std',
    chapterId: 'c10-math-ch3',
    description: 'Master trigonometric ratios, value tables 0-90 degrees, and Pythagorean identities with foolproof methods.',
    tags: ['Trigonometry', 'Class 10', 'Identities'],
    approved: true,
    published: true,
    createdAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'yt-c10-it-ch1-1',
    youtubeId: 'HKqcNPMs-fc',
    title: 'Information Technology Code 402 - Digital Documentation Full Revision',
    hindiTitle: 'सूचना प्रौद्योगिकी 402 - डिजिटल दस्तावेज़ीकरण सम्पूर्ण अध्याय',
    channelTitle: 'Sankatmochan Tech Saarthi',
    duration: '29:15',
    views: '450K views',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=640&auto=format&fit=crop',
    board: 'CBSE',
    classGrade: 'Class 10',
    subjectId: 'c10-it',
    chapterId: 'c10-it-ch1',
    description: 'Practical demonstrations of Styles and Formatting, Mail Merge, Image placement, and Table of Contents.',
    tags: ['IT 402', 'Class 10', 'Computer'],
    approved: true,
    published: true,
    createdAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'yt-c10-hindi-ch1-1',
    youtubeId: 'mSXkroSYN2I',
    title: 'Netaji Ka Chashma (नेताजी का चश्मा) Class 10 Hindi Course A Full Explanation',
    hindiTitle: 'नेताजी का चश्मा - सम्पूर्ण भावार्थ, चरित्र चित्रण व प्रश्न उत्तर',
    channelTitle: 'Hindi Adhyayan Saarthi',
    duration: '22:15',
    views: '890K views',
    thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=640&auto=format&fit=crop',
    board: 'CBSE',
    classGrade: 'Class 10',
    subjectId: 'c10-hindi-a',
    chapterId: 'c10-ha-ch1',
    description: 'Complete explanation of Haldaar Saab, Captain Chashmewala, and the deep patriotic essence.',
    tags: ['Hindi A', 'Class 10', 'Kshitij'],
    approved: true,
    published: true,
    createdAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'yt-c12-phy-ch1-1',
    youtubeId: 'm5VbK66a254',
    title: 'Class 12 Physics: Electrostatics & Gauss Law with Derivations',
    hindiTitle: 'कक्षा 12 भौतिकी: स्थिरवैद्युतिकी एवं गॉस के नियम के अनुप्रयोग',
    channelTitle: 'Sankatmochan Vigyan Kendra',
    duration: '54:30',
    views: '1.4M views',
    thumbnail: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=640&auto=format&fit=crop',
    board: 'CBSE',
    classGrade: 'Class 12',
    subjectId: 'c12-phy',
    chapterId: 'c12-phy-ch1',
    description: 'Derivation of electric field due to infinite line charge and thin spherical shell, numerical problems for JEE/Boards.',
    tags: ['Physics 12', 'Derivations', 'Gauss Law'],
    approved: true,
    published: true,
    createdAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'yt-c12-chem-ch1-1',
    youtubeId: 'nn-1UU_1PX8',
    title: 'Class 12 Chemistry: Solutions (विलयन) Complete Chapter in One Shot',
    hindiTitle: 'विलयन कक्षा 12 रसायन विज्ञान - हेनरी नियम, राउल्ट नियम व अणुसंख्य गुणधर्म',
    channelTitle: 'Rasayan Guru Saarthi',
    duration: '58:45',
    views: '980K views',
    thumbnail: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?q=80&w=640&auto=format&fit=crop',
    board: 'CBSE',
    classGrade: 'Class 12',
    subjectId: 'c12-chem',
    chapterId: 'c12-chem-ch1',
    description: "Raoult's law, Colligative properties, van 't Hoff factor, and previous board questions.",
    tags: ['Chemistry 12', 'Solutions', 'One Shot'],
    approved: true,
    published: true,
    createdAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'yt-c10-sci-light-1',
    youtubeId: '2BxS3lzp8P0',
    title: 'Light - Reflection and Refraction Full Chapter Class 10 Science (Ray Diagrams & Lens/Mirror Formula)',
    hindiTitle: 'प्रकाश - परावर्तन तथा अपवर्तन: किरण आरेख, दर्पण व लेंस सूत्र',
    channelTitle: 'Science and Fun Education',
    duration: '1:12:30',
    views: '2.1M views',
    thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=640&auto=format&fit=crop',
    board: 'CBSE',
    classGrade: 'Class 10',
    subjectId: 'c10-science',
    chapterId: 'c10-sci-ch4',
    description: 'Master convex and concave mirrors, refraction laws, Snell law, refractive index, and power of a lens.',
    tags: ['Light', 'Physics 10', 'Ray Diagrams', 'Science'],
    approved: true,
    published: true,
    createdAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'yt-c10-sci-bio-1',
    youtubeId: 'jSPxGNGUc9g',
    title: 'Life Processes (जैव प्रक्रम) Full Chapter Class 10 Biology One Shot',
    hindiTitle: 'जैव प्रक्रम कक्षा 10 जीव विज्ञान - पोषण, श्वसन, वहन तथा उत्सर्जन',
    channelTitle: 'Magnet Brains Biology',
    duration: '1:05:40',
    views: '1.9M views',
    thumbnail: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?q=80&w=640&auto=format&fit=crop',
    board: 'CBSE',
    classGrade: 'Class 10',
    subjectId: 'c10-science',
    chapterId: 'c10-sci-ch3',
    description: 'Detailed explanation of Nutrition in humans & plants, respiration cycle, human circulatory system and nephron.',
    tags: ['Life Processes', 'Biology 10', 'Nutrition', 'Science'],
    approved: true,
    published: true,
    createdAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'yt-c10-math-poly-1',
    youtubeId: 'sgD5O5iy1Dg',
    title: 'Polynomials (बहुपद) Class 10 Maths Full Chapter Revision & PYQs',
    hindiTitle: 'बहुपद कक्षा 10 गणित - शून्यक, गुणांक संबंध एवं द्विघात बहुपद',
    channelTitle: 'Dear Sir Maths',
    duration: '42:15',
    views: '2.8M views',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=640&auto=format&fit=crop',
    board: 'CBSE',
    classGrade: 'Class 10',
    subjectId: 'c10-math-std',
    chapterId: 'c10-math-ch2',
    description: 'Zeroes of quadratic and cubic polynomials, relation between zeroes and coefficients, and graphical interpretations.',
    tags: ['Polynomials', 'Maths 10', 'Algebra'],
    approved: true,
    published: true,
    createdAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'yt-c10-it-ch2-1',
    youtubeId: 'dGbSJoc4lk0',
    title: 'Electronic Spreadsheet (Advanced) IT 402 Class 10 - Goal Seek, Scenarios, Subtotals',
    hindiTitle: 'इलेक्ट्रॉनिक स्प्रेडशीट उन्नत (IT 402) - गोल सीक, परिदृश्य एवं सबटोटल',
    channelTitle: 'Sankatmochan Tech Saarthi',
    duration: '35:20',
    views: '320K views',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=640&auto=format&fit=crop',
    board: 'CBSE',
    classGrade: 'Class 10',
    subjectId: 'c10-it',
    chapterId: 'c10-it-ch2',
    description: 'Practical demonstrations of consolidating data, creating subtotals, Goal Seek and Solver in Calc/Excel.',
    tags: ['IT 402', 'Spreadsheet', 'Class 10'],
    approved: true,
    published: true,
    createdAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'yt-c10-hindi-balgobin-1',
    youtubeId: 'xOYfQR_hCeE',
    title: 'Balgobin Bhagat (बालगोबिन भगत) Class 10 Hindi Kshitij Chapter 2',
    hindiTitle: 'बालगोबिन भगत - सम्पूर्ण पाठ व्याख्या, भावार्थ एवं चरित्र चित्रण',
    channelTitle: 'Hindi Saarthi Adhyayan',
    duration: '28:10',
    views: '650K views',
    thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=640&auto=format&fit=crop',
    board: 'CBSE',
    classGrade: 'Class 10',
    subjectId: 'c10-hindi-a',
    chapterId: 'c10-ha-ch2',
    description: 'Ramvriksha Benipuri classic story of Balgobin Bhagat, his devotion to Kabir, and social reform message.',
    tags: ['Hindi A', 'Balgobin Bhagat', 'Kshitij'],
    approved: true,
    published: true,
    createdAt: '2026-09-01T00:00:00Z'
  }
];

export const INITIAL_TESTS: EvaluationTest[] = [
  {
    id: 'test-c10-sci-ch1-topic',
    title: 'Topic Test: Chemical Reactions & Types (10 Questions)',
    hindiTitle: 'टॉपिक टेस्ट: रासायनिक अभिक्रियाएँ एवं उनके प्रकार',
    testType: 'topic',
    board: 'CBSE',
    classGrade: 'Class 10',
    stream: 'General',
    subjectId: 'c10-science',
    chapterId: 'c10-sci-ch1',
    durationMinutes: 15,
    totalMarks: 10,
    passingMarks: 6,
    approved: true,
    published: true,
    createdAt: '2026-09-01T00:00:00Z',
    questions: [
      {
        id: 'q1',
        questionText: 'When lead nitrate crystal powder is heated in a dry boiling tube, what gas emission and residue color are observed?',
        questionHindi: 'जब शुष्क क्वथन नली में लेड नाइट्रेट को गर्म किया जाता है, तो कौन सी गैस निकलती है और अवशेष का रंग क्या होता है?',
        options: [
          'Brown fumes of NO2 and yellow residue of PbO',
          'Colorless CO2 gas and white residue',
          'Greenish chlorine gas and black residue',
          'Colorless oxygen gas only with red residue'
        ],
        correctIndex: 0,
        marks: 1,
        explanation: 'Heating 2Pb(NO3)2(s) produces 2PbO(s) [yellow residue] + 4NO2(g) [brown fumes] + O2(g).',
        competencyTag: 'conceptual'
      },
      {
        id: 'q2',
        questionText: 'Which of the following is an example of an Endothermic reaction?',
        questionHindi: 'निम्नलिखित में से कौन सी एक ऊष्माशोषी (Endothermic) अभिक्रिया है?',
        options: [
          'Burning of natural gas (methane)',
          'Decomposition of calcium carbonate (limestone) into quicklime and CO2',
          'Respiration process in human cells',
          'Reaction of quicklime with water'
        ],
        correctIndex: 1,
        marks: 1,
        explanation: 'Decomposition of CaCO3 requires heat absorption (Δ): CaCO3(s) + Heat → CaO(s) + CO2(g).',
        competencyTag: 'analytical'
      },
      {
        id: 'q3',
        questionText: 'In the reaction: CuO + H2 → Cu + H2O, which substance is being oxidized and which is reduced?',
        questionHindi: 'अभिक्रिया CuO + H2 → Cu + H2O में किस पदार्थ का ऑक्सीकरण और किसका अपचयन हो रहा है?',
        options: [
          'CuO is oxidized, H2 is reduced',
          'H2 is oxidized (gains O), CuO is reduced (loses O)',
          'Both CuO and H2 are reduced',
          'Neither is oxidized nor reduced'
        ],
        correctIndex: 1,
        marks: 1,
        explanation: 'H2 gains oxygen to form H2O (Oxidation); CuO loses oxygen to become Cu (Reduction). Hence Redox reaction.',
        competencyTag: 'conceptual'
      },
      {
        id: 'q4',
        questionText: 'Why do chips manufacturers flush bags of potato chips with Nitrogen gas?',
        questionHindi: 'चिप्स निर्माता चिप्स की थैली में नाइट्रोजन गैस क्यों भरते हैं?',
        options: [
          'To increase the crispiness and weight of chips',
          'To prevent chips from getting oxidized (rancidity)',
          'To disinfect chips from moisture bacteria',
          'To cool the chips temperature'
        ],
        correctIndex: 1,
        marks: 1,
        explanation: 'Nitrogen is an unreactive inert gas that displaces oxygen, preventing fats and oils from getting rancid.',
        competencyTag: 'application'
      },
      {
        id: 'q5',
        questionText: 'What is the color change when an iron nail is immersed in copper sulphate solution for 30 minutes?',
        questionHindi: 'जब लोहे की कील को 30 मिनट तक कॉपर सल्फेट के नीले विलयन में डुबोया जाता है, तो क्या रंग परिवर्तन होता है?',
        options: [
          'Blue solution turns light pale green, and brown copper deposits on the iron nail',
          'Solution turns dark yellow with black precipitate',
          'No visible change takes place because copper is more reactive than iron',
          'Solution turns colorless with white bubbles'
        ],
        correctIndex: 0,
        marks: 1,
        explanation: 'Fe is more reactive than Cu: Fe + CuSO4(blue) → FeSO4(light green) + Cu(brown coating on nail). Displacement reaction.',
        competencyTag: 'analytical'
      }
    ]
  },
  {
    id: 'test-c10-math-std-ch1',
    title: 'Chapter Test: Real Numbers & Polynomials (Maths Standard)',
    hindiTitle: 'अध्याय टेस्ट: वास्तविक संख्याएँ एवं बहुपद (स्टैंडर्ड)',
    testType: 'chapter',
    board: 'CBSE',
    classGrade: 'Class 10',
    stream: 'General',
    subjectId: 'c10-math-std',
    chapterId: 'c10-math-ch1',
    durationMinutes: 20,
    totalMarks: 5,
    passingMarks: 3,
    approved: true,
    published: true,
    createdAt: '2026-09-01T00:00:00Z',
    questions: [
      {
        id: 'mq1',
        questionText: 'If two positive integers a and b are written as a = x³y² and b = xy³, where x and y are prime numbers, then HCF(a, b) is:',
        questionHindi: 'यदि दो धनात्मक पूर्णांक a = x³y² तथा b = xy³ हैं जहाँ x व y अभाज्य संख्याएँ हैं, तो HCF(a, b) होगा:',
        options: ['xy', 'xy²', 'x³y³', 'x²y²'],
        correctIndex: 1,
        marks: 1,
        explanation: 'HCF is product of smallest power of each common prime factor: min power of x is 1, min power of y is 2. So HCF = xy².',
        competencyTag: 'numerical'
      },
      {
        id: 'mq2',
        questionText: 'The decimal expansion of 93 / (1500) will terminate after how many decimal places?',
        questionHindi: 'परिमेय संख्या 93 / 1500 का दशमलव प्रसार कितने स्थानों के बाद सांत होगा?',
        options: ['1 place', '2 places', '3 places', '4 places'],
        correctIndex: 2,
        marks: 1,
        explanation: 'Simplify: 93 / 1500 = 31 / 500 = 31 / (2² × 5³). The highest exponent of 2 or 5 is 3, so it terminates after 3 places.',
        competencyTag: 'numerical'
      },
      {
        id: 'mq3',
        questionText: 'If one zero of the quadratic polynomial x² + 3x + k is 2, then the value of k is:',
        questionHindi: 'यदि द्विघात बहुपद x² + 3x + k का एक शून्यक 2 है, तो k का मान ज्ञात कीजिए:',
        options: ['10', '-10', '-7', '-2'],
        correctIndex: 1,
        marks: 1,
        explanation: 'Substitute x = 2 into polynomial: (2)² + 3(2) + k = 0 => 4 + 6 + k = 0 => k = -10.',
        competencyTag: 'numerical'
      }
    ]
  }
];

export const INITIAL_NOTICES: NoticeItem[] = [
  {
    id: 'notice-daily-blessing',
    title: 'Divine Blessing of Baba Neem Karoli Ji & Sankatmochan Hanuman Ji',
    hindiTitle: 'बाबा नीम करौली जी एवं संकटमोचन हनुमान जी का पावन आशीर्वाद',
    message: '"सब सुख लहै तुम्हारी सरना, तुम रक्षक काहू को डरना।" Trust in your inner strength and do your duties with wholehearted devotion. With persistence, even the toughest concepts become clear as crystal.',
    hindiMessage: '"सब सुख लहै तुम्हारी सरना, तुम रक्षक काहू को डरना।" निष्काम भाव और पूर्ण लगन से अध्ययन कीजिए। बाबा जी की कृपा और हनुमान जी की शक्ति से आपकी सभी शंकाएं और भय दूर होंगे।',
    category: 'motivational',
    blessingQuote: 'Love everyone, serve everyone, remember God, tell the truth. — Baba Neem Karoli Ji Maharaj',
    active: true,
    createdAt: '2026-09-29T10:00:00Z',
    createdBy: 'Principal A. Kumar'
  },
  {
    id: 'notice-academic-alert',
    title: 'CBSE Board Examination 2026 Syllabus & Blueprint Announcement',
    hindiTitle: 'सीबीएसई बोर्ड परीक्षा 2026 पाठ्यक्रम एवं ब्लूप्रिंट सूचना',
    message: 'Official reminder: 50% competency-based questions are mandatory for Class X and XII exams. Focus rigorously on the Competency-Based Questions and Case-Based Studies sections in Saarthi.',
    hindiMessage: 'आधिकारिक सूचना: कक्षा 10वीं और 12वीं में 50% योग्यता-आधारित (Competency) प्रश्न पूछे जाएंगे। सारथी के केस स्टडी व सीबीक्यू मॉड्यूल का नियमित अभ्यास करें।',
    category: 'urgent',
    active: true,
    createdAt: '2026-09-28T14:30:00Z',
    createdBy: 'Examination Controller'
  }
];
