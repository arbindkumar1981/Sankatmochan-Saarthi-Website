import { SubjectMeta, StreamType, ClassGrade } from '../types';

const makeSubject = (
  id: string, name: string, hindiName: string, code: string, stream: StreamType,
  grade: ClassGrade, chapters: string[], icon = 'BookOpen'
): SubjectMeta => ({
  id, name, hindiName, officialCode: code, stream, classes: [grade], icon,
  chapters: chapters.map((title, i) => ({
    id: `${id}-ch${i + 1}`, title, hindiTitle: title, chapterNumber: i + 1, topics: []
  }))
});

// CBSE/NCERT 2026-27 catalogue. Topics remain admin/free-text by design.
const CORE_CBSE_NCERT_SUBJECTS: SubjectMeta[] = [
  makeSubject('c9-math-2026','Mathematics — Ganita Manjari','गणित — गणित मंजरी','041','General','Class 9',[
    'Orienting Yourself: The Use of Coordinates','Introduction to Linear Polynomials','The World of Numbers','Exploring Algebraic Identities',"I'm Up and Down, and Round and Round",'Measuring Space: Perimeter and Area','The Mathematics of Maybe: Introduction to Probability','Predicting What Comes Next: Exploring Sequences and Progressions'
  ],'Calculator'),
  makeSubject('c9-math-adv-2026','Mathematics Advanced','गणित — उन्नत स्तर','041-A','General','Class 9',[
    'Advanced Number Sense and Reasoning','Algebraic Reasoning and Polynomials','Coordinate and Spatial Reasoning','Geometry and Proof','Mensuration and Modelling','Probability and Data Reasoning','Sequences, Patterns and Algorithms'
  ],'Calculator'),
  makeSubject('c9-science-2026','Science — Exploration','विज्ञान — एक्सप्लोरेशन','086','General','Class 9',[
    'Exploration: Entering the World of Secondary Science','Cell: The Building Block of Life','Tissues in Action','Describing Motion Around Us','Exploring Mixtures and their Separation','How Forces Affect Motion','Work, Energy, and Simple Machines','Journey Inside the Atom','Atomic Foundations of Matter','Sound Waves: Characteristics and Applications','Reproduction: How Life Continues','Patterns in Life: Diversity and Classification','Earth as a System: Energy, Matter, and Life'
  ],'Atom'),
  makeSubject('c9-science-adv-2026','Science Advanced','विज्ञान — उन्नत स्तर','086-A','General','Class 9',[
    'Scientific Inquiry and Advanced Applications','Life Processes and Biological Systems','Matter and Atomic Systems','Motion, Force, Work and Energy','Sound and Wave Applications','Earth Systems and Sustainability'
  ],'Atom'),
  makeSubject('c9-social-2026','Social Science — Understanding Society: India and Beyond','सामाजिक विज्ञान — अंडरस्टैंडिंग सोसाइटी: इंडिया एंड बियॉन्ड','087','General','Class 9',[
    'Understanding Society: India and Beyond — Part 1','Understanding Society: India and Beyond — Part 2'
  ],'Globe'),
  makeSubject('c9-english-2026','English — Kaveri','अंग्रेजी — कावेरी','184','General','Class 9',['Kaveri — Grade 9 English: Current NCERT Textbook'],'BookOpen'),
  makeSubject('c9-hindi-2026','Hindi (R1/R2)','हिन्दी (R1/R2)','002/085','General','Class 9',['Current NCERT Grade 9 Hindi — 2026-27'],'BookOpen'),
  makeSubject('c9-sanskrit-2026','Sanskrit','संस्कृत','122','General','Class 9',['Current NCERT Grade 9 Sanskrit — 2026-27'],'Sparkles'),
  makeSubject('c9-vocational-2026','Vocational Education (Kaushal Vikas)','व्यावसायिक शिक्षा (कौशल विकास)','444','General','Class 9',['Kaushal Vikas — Grade 9'],'Briefcase'),
  makeSubject('c9-ctai-2026','Computational Thinking & AI','कम्प्यूटेशनल थिंकिंग एवं एआई','417','General','Class 9',['Computational Thinking','Artificial Intelligence Foundations','Data and Algorithms','Responsible AI'],'Cpu'),
  makeSubject('c9-it-2026','Information Technology','सूचना प्रौद्योगिकी','402','General','Class 9',['Employability Skills','Digital Documentation','Electronic Spreadsheet','Digital Presentation','Database Management System'],'Cpu'),

  makeSubject('c10-math-std-2026','Mathematics Standard','गणित (स्टैंडर्ड)','041','General','Class 10',[
    'Real Numbers','Polynomials','Pair of Linear Equations in Two Variables','Quadratic Equations','Arithmetic Progressions','Triangles','Coordinate Geometry','Introduction to Trigonometry','Some Applications of Trigonometry','Circles','Areas Related to Circles','Surface Areas and Volumes','Statistics','Probability'
  ],'Calculator'),
  makeSubject('c10-math-basic-2026','Mathematics Basic','गणित (बेसिक)','241','General','Class 10',[
    'Real Numbers','Polynomials','Pair of Linear Equations in Two Variables','Quadratic Equations','Arithmetic Progressions','Triangles','Coordinate Geometry','Introduction to Trigonometry','Some Applications of Trigonometry','Circles','Areas Related to Circles','Surface Areas and Volumes','Statistics','Probability'
  ],'Calculator'),
  makeSubject('c10-science-2026','Science','विज्ञान','086','General','Class 10',[
    'Chemical Reactions and Equations','Acids, Bases and Salts','Metals and Non-metals','Carbon and its Compounds','Life Processes','Control and Coordination','How do Organisms Reproduce?','Heredity','Light — Reflection and Refraction','The Human Eye and the Colourful World','Electricity','Magnetic Effects of Electric Current','Our Environment'
  ],'Atom'),
  makeSubject('c10-social-2026','Social Science','सामाजिक विज्ञान','087','General','Class 10',[
    'History: The Rise of Nationalism in Europe','History: Nationalism in India','History: The Making of a Global World','History: The Age of Industrialisation','History: Print Culture and the Modern World','Geography: Resources and Development','Geography: Forest and Wildlife Resources','Geography: Water Resources','Geography: Agriculture','Geography: Minerals and Energy Resources','Geography: Manufacturing Industries','Geography: Lifelines of National Economy','Political Science: Power Sharing','Political Science: Federalism','Political Science: Gender, Religion and Caste','Political Science: Political Parties','Political Science: Outcomes of Democracy','Economics: Development','Economics: Sectors of the Indian Economy','Economics: Money and Credit','Economics: Globalisation and the Indian Economy'
  ],'Globe'),
  makeSubject('c10-eng-ll-2026','English Language & Literature','अंग्रेजी भाषा एवं साहित्य','184','General','Class 10',[
    'First Flight: A Letter to God','First Flight: Nelson Mandela — Long Walk to Freedom','First Flight: Two Stories about Flying','First Flight: From the Diary of Anne Frank','First Flight: Glimpses of India','First Flight: Mijbil the Otter','First Flight: Madam Rides the Bus','First Flight: The Sermon at Benares','First Flight: The Proposal','Footprints without Feet: A Triumph of Surgery','Footprints without Feet: The Thief’s Story','Footprints without Feet: The Midnight Visitor','Footprints without Feet: A Question of Trust','Footprints without Feet: Footprints without Feet','Footprints without Feet: The Making of a Scientist','Footprints without Feet: The Necklace','Footprints without Feet: Bholi','Footprints without Feet: The Book That Saved the Earth'
  ],'BookOpen'),
  makeSubject('c10-eng-comm-2026','English Communicative','अंग्रेजी कम्युनिकेटिव','101','General','Class 10',['Reading','Writing Skills','Grammar','Literature Reader'],'BookOpen'),
  makeSubject('c10-hindi-a-2026','Hindi Course A','हिन्दी कोर्स A','002','General','Class 10',[
    'क्षितिज: सूरदास के पद','क्षितिज: राम-लक्ष्मण-परशुराम संवाद','क्षितिज: आत्मकथ्य','क्षितिज: उत्साह और अट नहीं रही है','क्षितिज: यह दंतुरित मुस्कान और फसल','क्षितिज: संगतकार','क्षितिज: नेताजी का चश्मा','क्षितिज: बालगोबिन भगत','क्षितिज: लखनवी अंदाज़','क्षितिज: एक कहानी यह भी','क्षितिज: नौबतखाने में इबादत','क्षितिज: संस्कृति','कृतिका: माता का अँचल','कृतिका: साना-साना हाथ जोड़ि','कृतिका: मैं क्यों लिखता हूँ'
  ],'BookOpen'),
  makeSubject('c10-hindi-b-2026','Hindi Course B','हिन्दी कोर्स B','085','General','Class 10',[
    'स्पर्श: कबीर की साखियाँ','स्पर्श: मनुष्यता','स्पर्श: पर्वत प्रदेश में पावस','स्पर्श: कर चले हम फ़िदा','स्पर्श: आत्मत्राण','स्पर्श: बड़े भाई साहब','स्पर्श: डायरी का एक पन्ना','स्पर्श: तताँरा-वामीरो कथा','स्पर्श: तीसरी कसम के शिल्पकार शैलेंद्र','स्पर्श: कारतूस','संचयन: हरिहर काका','संचयन: टोपी शुक्ला','संचयन: सपनों के-से दिन'
  ],'BookOpen'),
  makeSubject('c10-sanskrit-2026','Sanskrit','संस्कृत','122','General','Class 10',['शुचिपर्यावरणम्','बुद्धिर्बलवती सदा','व्यायामः सर्वदा पथ्यः','शिशुलालनम्','जननी तुल्यवत्सला','सुभाषितानि','सौहार्दं प्रकृतेः शोभा','विचित्रः साक्षी','सूक्तयः','भूकंपविभीषिका','प्राणेभ्योऽपि प्रियः सुहृद्','अन्योक्तयः'],'Sparkles'),
  makeSubject('c10-it-2026','Information Technology','सूचना प्रौद्योगिकी','402','General','Class 10',['Employability Skills','Digital Documentation (Advanced)','Electronic Spreadsheet (Advanced)','Database Management System','Maintain Healthy, Safe and Secure Working Environment'],'Cpu'),

  makeSubject('c11-phy-2026','Physics','भौतिक विज्ञान','042','Science','Class 11',['Units and Measurements','Motion in a Straight Line','Motion in a Plane','Laws of Motion','Work, Energy and Power','System of Particles and Rotational Motion','Gravitation','Mechanical Properties of Solids','Mechanical Properties of Fluids','Thermal Properties of Matter','Thermodynamics','Kinetic Theory','Oscillations','Waves'],'Zap'),
  makeSubject('c11-chem-2026','Chemistry','रसायन विज्ञान','043','Science','Class 11',['Some Basic Concepts of Chemistry','Structure of Atom','Classification of Elements and Periodicity in Properties','Chemical Bonding and Molecular Structure','Thermodynamics','Equilibrium','Redox Reactions','Organic Chemistry — Some Basic Principles and Techniques','Hydrocarbons'],'FlaskConical'),
  makeSubject('c11-bio-2026','Biology','जीव विज्ञान','044','Science','Class 11',['The Living World','Biological Classification','Plant Kingdom','Animal Kingdom','Morphology of Flowering Plants','Anatomy of Flowering Plants','Structural Organisation in Animals','Cell: The Unit of Life','Biomolecules','Cell Cycle and Cell Division','Photosynthesis in Higher Plants','Respiration in Plants','Plant Growth and Development','Breathing and Exchange of Gases','Body Fluids and Circulation','Excretory Products and their Elimination','Locomotion and Movement','Neural Control and Coordination','Chemical Coordination and Integration'],'Dna'),
  makeSubject('c11-math-2026','Mathematics','गणित','041','Science','Class 11',['Sets','Relations and Functions','Trigonometric Functions','Complex Numbers and Quadratic Equations','Linear Inequalities','Permutations and Combinations','Binomial Theorem','Sequences and Series','Straight Lines','Conic Sections','Introduction to Three-dimensional Geometry','Limits and Derivatives','Statistics','Probability'],'Calculator'),

  makeSubject('c11-acc-2026','Accountancy','लेखाशास्त्र','055','Commerce','Class 11',['Introduction to Accounting','Theory Base of Accounting','Recording of Transactions — I','Recording of Transactions — II','Bank Reconciliation Statement','Trial Balance and Rectification of Errors','Depreciation, Provisions and Reserves','Financial Statements — I','Financial Statements — II','Accounts from Incomplete Records'],'Layers'),
  makeSubject('c11-bst-2026','Business Studies','व्यावसायिक अध्ययन','054','Commerce','Class 11',['Business, Trade and Commerce','Forms of Business Organisation','Private, Public and Global Enterprises','Business Services','Emerging Modes of Business','Social Responsibilities of Business and Business Ethics','Sources of Business Finance','Small Business and Enterprises','Internal Trade','International Business'],'Briefcase'),
  makeSubject('c11-eco-2026','Economics','अर्थशास्त्र','030','Commerce','Class 11',['Statistics: Introduction','Collection of Data','Organisation of Data','Presentation of Data','Measures of Central Tendency','Correlation','Index Numbers','Microeconomics: Introduction','Consumer’s Equilibrium and Demand','Producer Behaviour and Supply','Forms of Market and Price Determination'],'TrendingUp'),

  makeSubject('c11-hist-2026','History','इतिहास','027','Humanities','Class 11',['Writing and City Life','An Empire Across Three Continents','Nomadic Empires','The Three Orders','Changing Cultural Traditions','Displacing Indigenous Peoples','Paths to Modernisation'],'Compass'),
  makeSubject('c11-pol-2026','Political Science','राजनीति विज्ञान','028','Humanities','Class 11',['Constitution: Why and How?','Rights in the Indian Constitution','Election and Representation','Executive','Legislature','Judiciary','Federalism','Local Governments','Constitution as a Living Document','The Philosophy of the Constitution','Political Theory: An Introduction','Freedom','Equality','Social Justice','Rights','Citizenship','Nationalism','Secularism'],'BookOpen'),
  makeSubject('c11-geo-2026','Geography','भूगोल','029','Humanities','Class 11',['Geography as a Discipline','The Origin and Evolution of the Earth','Interior of the Earth','Distribution of Oceans and Continents','Geomorphic Processes','Landforms and their Evolution','Composition and Structure of Atmosphere','Solar Radiation, Heat Balance and Temperature','Atmospheric Circulation and Weather Systems','Water in the Atmosphere','World Climate and Climate Change','Water (Oceans)','Movements of Ocean Water','Biodiversity and Conservation','India — Location','Structure and Physiography','Drainage System','Climate','Natural Vegetation','Natural Hazards and Disasters'],'Globe'),
  makeSubject('c11-eng-core-2026','English Core','अंग्रेजी कोर','301','General','Class 11',['Hornbill: The Portrait of a Lady','Hornbill: We’re Not Afraid to Die…','Hornbill: Discovering Tut','Hornbill: The Adventure','Hornbill: Silk Road','Snapshots: The Summer of the Beautiful White Horse','Snapshots: The Address','Snapshots: Mother’s Day','Snapshots: Birth','Snapshots: The Tale of Melon City'],'BookOpen'),

  makeSubject('c12-phy-2026','Physics','भौतिक विज्ञान','042','Science','Class 12',['Electric Charges and Fields','Electrostatic Potential and Capacitance','Current Electricity','Moving Charges and Magnetism','Magnetism and Matter','Electromagnetic Induction','Alternating Current','Electromagnetic Waves','Ray Optics and Optical Instruments','Wave Optics','Dual Nature of Radiation and Matter','Atoms','Nuclei','Semiconductor Electronics: Materials, Devices and Simple Circuits'],'Zap'),
  makeSubject('c12-chem-2026','Chemistry','रसायन विज्ञान','043','Science','Class 12',['Solutions','Electrochemistry','Chemical Kinetics','The d- and f-Block Elements','Coordination Compounds','Haloalkanes and Haloarenes','Alcohols, Phenols and Ethers','Aldehydes, Ketones and Carboxylic Acids','Amines','Biomolecules'],'FlaskConical'),
  makeSubject('c12-bio-2026','Biology','जीव विज्ञान','044','Science','Class 12',['Sexual Reproduction in Flowering Plants','Human Reproduction','Reproductive Health','Principles of Inheritance and Variation','Molecular Basis of Inheritance','Evolution','Human Health and Disease','Microbes in Human Welfare','Biotechnology — Principles and Processes','Biotechnology and its Applications','Organisms and Populations','Ecosystem','Biodiversity and Conservation'],'Dna'),
  makeSubject('c12-math-2026','Mathematics','गणित','041','Science','Class 12',['Relations and Functions','Inverse Trigonometric Functions','Matrices','Determinants','Continuity and Differentiability','Application of Derivatives','Integrals','Application of Integrals','Differential Equations','Vector Algebra','Three Dimensional Geometry','Linear Programming','Probability'],'Calculator'),

  makeSubject('c12-acc-2026','Accountancy','लेखाशास्त्र','055','Commerce','Class 12',['Accounting for Partnership Firms — Fundamentals','Change in Profit-Sharing Ratio','Admission of a Partner','Retirement/Death of a Partner','Dissolution of Partnership Firm','Accounting for Share Capital','Issue and Redemption of Debentures','Financial Statements of a Company','Analysis of Financial Statements','Accounting Ratios','Cash Flow Statement'],'Layers'),
  makeSubject('c12-bst-2026','Business Studies','व्यावसायिक अध्ययन','054','Commerce','Class 12',['Nature and Significance of Management','Principles of Management','Business Environment','Planning','Organising','Staffing','Directing','Controlling','Financial Management','Financial Markets','Marketing Management','Consumer Protection'],'Briefcase'),
  makeSubject('c12-eco-2026','Economics','अर्थशास्त्र','030','Commerce','Class 12',['National Income and Related Aggregates','Money and Banking','Determination of Income and Employment','Government Budget and the Economy','Balance of Payments','Indian Economy on the Eve of Independence','Indian Economy (1950–1990)','Liberalisation, Privatisation and Globalisation','Human Capital Formation in India','Rural Development','Employment','Environment and Sustainable Development','Comparative Development Experiences of India and its Neighbours'],'TrendingUp'),

  makeSubject('c12-hist-2026','History','इतिहास','027','Humanities','Class 12',['Bricks, Beads and Bones','Kings, Farmers and Towns','Kinship, Caste and Class','Thinkers, Beliefs and Buildings','Through the Eyes of Travellers','Bhakti-Sufi Traditions','An Imperial Capital: Vijayanagara','Peasants, Zamindars and the State','Colonialism and the Countryside','Rebels and the Raj','Mahatma Gandhi and the Nationalist Movement','Framing the Constitution'],'Compass'),
  makeSubject('c12-pol-2026','Political Science','राजनीति विज्ञान','028','Humanities','Class 12',['The End of Bipolarity','Contemporary Centres of Power','Contemporary South Asia','International Organizations','Security in the Contemporary World','Environment and Natural Resources','Challenges of Nation-Building','Era of One-Party Dominance','Politics of Planned Development','India’s External Relations','Challenges to and Restoration of the Congress System','The Crisis of Democratic Order','Regional Aspirations','Recent Developments in Indian Politics'],'BookOpen'),
  makeSubject('c12-geo-2026','Geography','भूगोल','029','Humanities','Class 12',['Human Geography: Nature and Scope','The World Population','Human Development','Primary Activities','Secondary Activities','Tertiary and Quaternary Activities','Transport, Communication and Trade','International Trade','Population: Distribution, Density, Growth and Composition','Human Settlements','Land Resources and Agriculture','Water Resources','Mineral and Energy Resources','Planning and Sustainable Development','Transport and Communication','International Trade','Geographical Perspective on Selected Issues and Problems'],'Globe'),
  makeSubject('c12-psych-2026','Psychology','मनोविज्ञान','037','Humanities','Class 12',['Variations in Psychological Attributes','Self and Personality','Meeting Life Challenges','Psychological Disorders','Therapeutic Approaches','Attitude and Social Cognition','Social Influence and Group Processes'],'BrainCircuit'),
  makeSubject('c12-socio-2026','Sociology','समाजशास्त्र','039','Humanities','Class 12',['The Demographic Structure of Indian Society','Social Institutions: Continuity and Change','Patterns of Social Inequality and Exclusion','The Challenges of Cultural Diversity','Structural Change','Cultural Change','Change and Development in Rural Society','Change and Development in Industrial Society','Social Movements'],'Users'),
  makeSubject('c12-eng-core-2026','English Core','अंग्रेजी कोर','301','General','Class 12',['Flamingo: The Last Lesson','Flamingo: Lost Spring','Flamingo: Deep Water','Flamingo: The Rattrap','Flamingo: Indigo','Flamingo: Poets and Pancakes','Flamingo: The Interview','Flamingo: Going Places','Vistas: The Third Level','Vistas: The Tiger King','Vistas: Journey to the End of the Earth','Vistas: The Enemy','Vistas: On the Face of It','Vistas: Memories of Childhood'],'BookOpen'),
  makeSubject('c12-cs-2026','Computer Science','कंप्यूटर साइंस','083','Science','Class 12',['Python Revision and Functions','Exception Handling','File Handling','Data Structures — Stack','Computer Networks','Database Concepts','SQL','Python–SQL Connectivity'],'Cpu'),
  makeSubject('c12-ip-2026','Informatics Practices','इन्फॉर्मेटिक्स प्रैक्टिसेज','065','Commerce','Class 12',['Pandas and Data Handling','Data Visualization','Database Query using SQL','Introduction to Computer Networks','Societal Impacts'],'Cpu'),
  makeSubject('c12-pe-2026','Physical Education','शारीरिक शिक्षा','048','General','Class 12',['Management of Sporting Events','Children and Women in Sports','Yoga as Preventive Measure for Lifestyle Disease','Physical Education and Sports for CWSN','Sports and Nutrition','Test and Measurement in Sports','Physiology and Injuries in Sports','Biomechanics and Sports','Psychology and Sports','Training in Sports'],'Activity')
];


const catalogueSubject = (grade: ClassGrade, name: string, code = '', stream: StreamType = 'General'): SubjectMeta => ({
  id: `cbse-${grade.replace(/\\s+/g, '-').toLowerCase()}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
  name, hindiName: name, officialCode: code, stream, classes: [grade], icon: 'BookOpen', chapters: []
});

const IX_LANGUAGES = ['Arabic','Assamese','Bahasa Melayu','Bengali','Bhoti','Bhutia','Bodo','Dogri','English','French','German','Gujarati','Gurung','Hindi','Japanese','Kannada','Kashmiri','Kokborok','Konkani','Lepcha','Limboo','Malayalam','Manipuri','Marathi','Maithili','Mizo','Nepali','Odia','Persian','Punjabi','Rai','Russian','Sanskrit','Santhali','Sindhi','Spanish','Sherpa','Tamang','Tamil','Tangkhul','Telugu AP','Telugu Telangana','Tibetan','Thai','Urdu'];
const IX_MAIN_OPTIONAL = ['Mathematics','Mathematics at Advanced Level','Science','Science at Advanced Level','Social Science','Interdisciplinary Area','Vocational Education (Kaushal Vikas)','Computational Thinking & AI','Physical Education & Well Being','Art Education','Home Science','Painting','National Cadet Corps (NCC)','Computer Applications','Elements of Business','Elements of Book Keeping & Accountancy','Retail','Information Technology','Introduction to Financial Markets','Introduction to Tourism','Beauty & Wellness','Front Office Operations','Marketing and Sales','Artificial Intelligence'];

const X_LANGUAGES = ['Arabic','Assamese','Bahasa Melayu','Bengali','Bhoti','Bhutia','Bodo','English Language & Literature','English Communicative','French','German','Gujarati','Gurung','Hindi Course A','Hindi Course B','Japanese','Kannada','Kashmiri','Kokborok','Lepcha','Limboo','Malayalam','Manipuri','Marathi','Mizo','Nepali','Odia','Persian','Punjabi','Rai','Russian','Sanskrit','Sanskrit Communicative','Sindhi','Spanish','Sherpa','Tamang','Tamil','Tangkhul','Telugu AP','Telugu Telangana','Tibetan','Thai','Urdu Course A','Urdu Course B'];
const X_MAIN_ELECTIVES = ['Mathematics Basic','Mathematics Standard','Science','Social Science','Carnatic Music (Vocal)','Carnatic Music (Melodic Instruments)','Carnatic Music (Percussion Instruments)','Hindustani Music (Vocal)','Hindustani Music (Melodic Instruments)','Hindustani Music (Percussion Instruments)','Painting','Home Science','National Cadet Corps (NCC)','Computer Applications','Elements of Business','Elements of Book Keeping and Accountancy','Health and Physical Education','Work Experience','Art Education'];

const SR_LANGUAGES = ['Arabic','Assamese','Bengali','Bhoti','Bhutia','Bodo','French','German','Gujarati','Hindi Core','Hindi Elective','English Core','English Elective','Japanese','Kannada','Kashmiri','Kokborok','Lepcha','Limboo','Malayalam','Manipuri','Marathi','Mizo','Nepali','Odia','Persian','Punjabi','Russian','Sanskrit Core','Sanskrit Elective','Sindhi','Spanish','Tamil','Tangkhul','Telugu AP','Telugu Telangana','Tibetan','Urdu Core','Urdu Elective'];
const SR_ELECTIVES = ['Accountancy','Biology','Biotechnology','Business Studies','Carnatic Melodic','Carnatic Vocal','Carnatic Percussion','Chemistry','Computer Science','Economics','Engineering Graphics','Entrepreneurship','Fine Arts','Dance','Geography','Hindustani Melodic','Hindustani Percussion','Hindustani Vocal','History','Home Science','Informatics Practices','Knowledge Tradition - Practices India','Legal Studies','Mathematics','Applied Mathematics','NCC','Physical Education','Physics','Political Science','Psychology','Sociology','Health and Physical Education','Work Experience','General Studies'];

const OFFICIAL_CATALOGUE_SUBJECTS: SubjectMeta[] = [
  ...[...IX_LANGUAGES, ...IX_MAIN_OPTIONAL].map(name => catalogueSubject('Class 9', name)),
  ...[...X_LANGUAGES, ...X_MAIN_ELECTIVES].map(name => catalogueSubject('Class 10', name)),
  ...[...SR_LANGUAGES, ...SR_ELECTIVES].flatMap(name => [
    catalogueSubject('Class 11', name),
    catalogueSubject('Class 12', name)
  ])
];

// Keep rich NCERT chapter data where Saarthi already has it, and fill every missing
// official CBSE 2026-27 subject into the selector catalogue.
const subjectKey = (s: SubjectMeta) => `${s.classes[0]}::${s.name.trim().toLowerCase()}`;
const richKeys = new Set(CORE_CBSE_NCERT_SUBJECTS.map(subjectKey));
export const CURRENT_CBSE_NCERT_SUBJECTS: SubjectMeta[] = [
  ...CORE_CBSE_NCERT_SUBJECTS,
  ...OFFICIAL_CATALOGUE_SUBJECTS.filter(s => !richKeys.has(subjectKey(s)))
];
