import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const srcDir = path.join(root, 'NCE1');
const outDir = path.join(srcDir, 'html');
const translationCacheFile = path.join(outDir, '.translation-cache.json');

const startLesson = Number(process.argv[2] ?? 1);
const endLesson = Number(process.argv[3] ?? 20);

const targetFiles = fs.readdirSync(srcDir)
  .filter((name) => name.endsWith('.lrc'))
  .filter((name) => {
    const match = name.match(/^(\d{3})&(\d{3})/);
    if (!match) return false;
    const first = Number(match[1]);
    const second = Number(match[2]);
    return first >= startLesson && second <= endLesson;
  })
  .sort();

if (targetFiles.length === 0) {
  throw new Error(`No NCE1 .lrc files found for lessons ${startLesson}-${endLesson}`);
}

fs.mkdirSync(outDir, { recursive: true });

const translationCache = fs.existsSync(translationCacheFile)
  ? JSON.parse(fs.readFileSync(translationCacheFile, 'utf8'))
  : {};

const ipaWords = new Map(Object.entries({
  a: 'ə',
  all: 'ɔl',
  am: 'əm',
  an: 'ən',
  and: 'ən',
  are: 'ɑr',
  "aren't": 'ɑrnt',
  assistant: 'əˈsɪstənt',
  back: 'bæk',
  baker: 'ˈbeɪkɚ',
  blake: 'bleɪk',
  blue: 'blu',
  brown: 'braʊn',
  busy: 'ˈbɪzi',
  cases: 'ˈkeɪsɪz',
  catch: 'kætʃ',
  chang: 'tʃæŋ',
  changwoo: 'tʃæŋˈwu',
  children: 'ˈtʃɪldrən',
  chinese: 'tʃaɪˈniz',
  claire: 'klɛr',
  coat: 'koʊt',
  colour: 'ˈkʌlɚ',
  color: 'ˈkʌlɚ',
  come: 'kʌm',
  cream: 'krim',
  creams: 'krimz',
  customs: 'ˈkʌstəmz',
  danish: 'ˈdeɪnɪʃ',
  dave: 'deɪv',
  do: 'du',
  down: 'daʊn',
  dress: 'drɛs',
  dupont: 'duˈpɑnt',
  emma: 'ˈɛmə',
  employees: 'ɛmˈplɔɪiz',
  engineer: 'ˌɛndʒəˈnɪr',
  excuse: 'ɪkˈskjuz',
  fine: 'faɪn',
  five: 'faɪv',
  french: 'frɛntʃ',
  friends: 'frɛndz',
  german: 'ˈdʒɝmən',
  good: 'ɡʊd',
  goodbye: 'ɡʊdˈbaɪ',
  green: 'ɡrin',
  grey: 'ɡreɪ',
  handbag: 'ˈhændˌbæɡ',
  hans: 'hɑnz',
  hardworking: 'ˌhɑrdˈwɝkɪŋ',
  hat: 'hæt',
  he: 'hi',
  hello: 'həˈloʊ',
  helen: 'ˈhɛlən',
  here: 'hɪr',
  "he's": 'hiz',
  hi: 'haɪ',
  how: 'haʊ',
  ice: 'aɪs',
  i: 'aɪ',
  "i'm": 'aɪm',
  is: 'ɪz',
  "isn't": 'ˈɪzənt',
  it: 'ɪt',
  "it's": 'ɪts',
  italian: 'ɪˈtæljən',
  jackson: 'ˈdʒæksən',
  japanese: 'ˌdʒæpəˈniz',
  jeremy: 'ˈdʒɛrəmi',
  jim: 'dʒɪm',
  job: 'dʒɑb',
  keyboard: 'ˈkiˌbɔrd',
  korean: 'kəˈriən',
  lazy: 'ˈleɪzi',
  look: 'lʊk',
  lovely: 'ˈlʌvli',
  luming: 'luˈmɪŋ',
  man: 'mæn',
  matter: 'ˈmætɚ',
  meet: 'mit',
  me: 'mi',
  michael: 'ˈmaɪkəl',
  miss: 'mɪs',
  morning: 'ˈmɔrnɪŋ',
  mr: 'ˈmɪstɚ',
  mum: 'mʌm',
  my: 'maɪ',
  "name's": 'neɪmz',
  naoko: 'naɪˈoʊkoʊ',
  nationality: 'ˌnæʃəˈnælədi',
  new: 'nu',
  nice: 'naɪs',
  nicola: 'ˈnɪkələ',
  no: 'noʊ',
  norwegian: 'nɔrˈwidʒən',
  not: 'nɑt',
  now: 'naʊ',
  number: 'ˈnʌmbɚ',
  office: 'ˈɔfəs',
  officer: 'ˈɔfəsɚ',
  operator: 'ˈɑpəˌreɪɾɚ',
  our: 'aʊɚ',
  pardon: 'ˈpɑrdən',
  passports: 'ˈpæspɔrts',
  perhaps: 'pɚˈhæps',
  please: 'pliz',
  problem: 'ˈprɑbləm',
  reps: 'rɛps',
  richards: 'ˈrɪtʃɚdz',
  right: 'raɪt',
  robert: 'ˈrɑbɚt',
  sales: 'seɪlz',
  same: 'seɪm',
  see: 'si',
  she: 'ʃi',
  "she's": 'ʃiz',
  shirt: 'ʃɝt',
  "shirt's": 'ʃɝts',
  short: 'ʃɔrt',
  sir: 'sɝ',
  sit: 'sɪt',
  smart: 'smɑrt',
  sophie: 'ˈsoʊfi',
  sorry: 'ˈsɑri',
  steven: 'ˈstivən',
  student: 'ˈstudənt',
  swedish: 'ˈswidɪʃ',
  taylor: 'ˈteɪlɚ',
  teacher: 'ˈtitʃɚ',
  thank: 'θæŋk',
  thanks: 'θæŋks',
  that: 'ðæt',
  "that's": 'ðæts',
  the: 'ðə',
  their: 'ðɛr',
  there: 'ðɛr',
  "there's": 'ðɛrz',
  they: 'ðeɪ',
  "they're": 'ðɛr',
  these: 'ðiz',
  thirsty: 'ˈθɝsti',
  this: 'ðɪs',
  those: 'ðoʊz',
  ticket: 'ˈtɪkət',
  tim: 'tɪm',
  "tim's": 'tɪmz',
  tired: 'ˈtaɪɚd',
  to: 'tə',
  today: 'təˈdeɪ',
  tony: 'ˈtoʊni',
  too: 'tu',
  tourists: 'ˈtʊrəsts',
  two: 'tu',
  umbrella: 'ʌmˈbrɛlə',
  upstairs: 'ˌʌpˈstɛrz',
  very: 'ˈvɛri',
  we: 'wi',
  "we're": 'wɪr',
  well: 'wɛl',
  what: 'wʌt',
  "what's": 'wʌts',
  white: 'waɪt',
  who: 'hu',
  whose: 'huz',
  women: 'ˈwɪmən',
  xiaohui: 'ˌʃaʊˈhweɪ',
  yes: 'jɛs',
  you: 'ju',
  young: 'jʌŋ',
  your: 'jɚ',
}));

for (const [word, ipa] of Object.entries({
  about: 'əˈbaʊt',
  across: 'əˈkrɔs',
  aeroplane: 'ˈɛrəˌpleɪn',
  after: 'ˈæftɚ',
  afternoon: 'ˌæftɚˈnun',
  ah: 'ɑ',
  air: 'ɛr',
  along: 'əˈlɔŋ',
  always: 'ˈɔlweɪz',
  amy: 'ˈeɪmi',
  ann: 'æn',
  another: 'əˈnʌðɚ',
  any: 'ˈɛni',
  april: 'ˈeɪprəl',
  armchairs: 'ˈɑrmˌtʃɛrz',
  arrive: 'əˈraɪv',
  arrives: 'əˈraɪvz',
  ask: 'æsk',
  at: 'ət',
  august: 'ˈɔɡəst',
  autumn: 'ˈɔɾəm',
  bag: 'bæɡ',
  banks: 'bæŋks',
  bar: 'bɑr',
  be: 'bi',
  bedroom: 'ˈbɛdˌrum',
  "bedroom's": 'ˈbɛdˌrumz',
  beef: 'bif',
  beg: 'bɛɡ',
  behind: 'bɪˈhaɪnd',
  beside: 'bɪˈsaɪd',
  best: 'bɛst',
  between: 'bɪˈtwin',
  big: 'bɪɡ',
  bird: 'bɝd',
  biscuits: 'ˈbɪskəts',
  black: 'blæk',
  boats: 'boʊts',
  bob: 'bɑb',
  boiling: 'ˈbɔɪlɪŋ',
  book: 'bʊk',
  bookcase: 'ˈbʊkˌkeɪs',
  books: 'bʊks',
  boss: 'bɑs',
  "boss's": 'ˈbɑsɪz',
  bottle: 'ˈbɑɾəl',
  box: 'bɑks',
  boxes: 'ˈbɑksɪz',
  boy: 'bɔɪ',
  bread: 'brɛd',
  bridge: 'brɪdʒ',
  building: 'ˈbɪldɪŋ',
  but: 'bət',
  by: 'baɪ',
  can: 'kæn',
  "can't": 'kænt',
  car: 'kɑr',
  careful: 'ˈkɛrfəl',
  cat: 'kæt',
  certainly: 'ˈsɝtənli',
  chair: 'tʃɛr',
  chalk: 'tʃɔk',
  change: 'tʃeɪndʒ',
  cheese: 'tʃiz',
  chicken: 'ˈtʃɪkən',
  chocolate: 'ˈtʃɑklət',
  christine: 'krɪsˈtin',
  clean: 'klin',
  climate: 'ˈklaɪmət',
  climbing: 'ˈklaɪmɪŋ',
  clothes: 'kloʊðz',
  clouds: 'klaʊdz',
  coffee: 'ˈkɔfi',
  cold: 'koʊld',
  comes: 'kʌmz',
  coming: 'ˈkʌmɪŋ',
  conversation: 'ˌkɑnvɚˈseɪʃən',
  cooker: 'ˈkʊkɚ',
  country: 'ˈkʌntri',
  course: 'kɔrs',
  cup: 'kʌp',
  cupboard: 'ˈkʌbɚd',
  cups: 'kʌps',
  dan: 'dæn',
  daughter: 'ˈdɔtɚ',
  day: 'deɪ',
  days: 'deɪz',
  december: 'dɪˈsɛmbɚ',
  does: 'dʌz',
  "doesn't": 'ˈdʌzənt',
  dog: 'dɔɡ',
  "dog's": 'dɔɡz',
  doing: 'ˈduɪŋ',
  "don't": 'doʊnt',
  door: 'dɔr',
  dressing: 'ˈdrɛsɪŋ',
  drink: 'drɪŋk',
  drinking: 'ˈdrɪŋkɪŋ',
  drinks: 'drɪŋks',
  drop: 'drɑp',
  dust: 'dʌst',
  early: 'ˈɝli',
  east: 'ist',
  eats: 'its',
  eight: 'eɪt',
  either: 'ˈiðɚ',
  electric: 'ɪˈlɛktrɪk',
  else: 'ɛls',
  empty: 'ˈɛmpti',
  england: 'ˈɪŋɡlənd',
  envelopes: 'ˈɛnvəˌloʊps',
  evening: 'ˈivnɪŋ',
  every: 'ˈɛvri',
  family: 'ˈfæməli',
  father: 'ˈfɑðɚ',
  favourite: 'ˈfeɪvərət',
  favorite: 'ˈfeɪvərət',
  february: 'ˈfɛbjuˌɛri',
  find: 'faɪnd',
  floor: 'flɔr',
  flowers: 'ˈflaʊɚz',
  flying: 'ˈflaɪɪŋ',
  foot: 'fʊt',
  for: 'fɚ',
  four: 'fɔr',
  from: 'frəm',
  front: 'frʌnt',
  garden: 'ˈɡɑrdən',
  george: 'dʒɔrdʒ',
  give: 'ɡɪv',
  glasses: 'ˈɡlæsɪz',
  glue: 'ɡlu',
  go: 'ɡoʊ',
  goes: 'ɡoʊz',
  going: 'ˈɡoʊɪŋ',
  grass: 'ɡræs',
  greece: 'ɡris',
  half: 'hæf',
  hammer: 'ˈhæmɚ',
  handwriting: 'ˈhændˌraɪɾɪŋ',
  hard: 'hɑrd',
  have: 'hæv',
  heavy: 'ˈhɛvi',
  her: 'hɚ',
  hills: 'hɪlz',
  his: 'hɪz',
  home: 'hoʊm',
  homework: 'ˈhoʊmˌwɝk',
  hot: 'hɑt',
  housework: 'ˈhaʊsˌwɝk',
  hurry: 'ˈhɝi',
  husband: 'ˈhʌzbənd',
  interesting: 'ˈɪntrəstɪŋ',
  into: 'ˈɪntu',
  jack: 'dʒæk',
  jane: 'dʒeɪn',
  january: 'ˈdʒænjuˌɛri',
  jean: 'dʒin',
  jones: 'dʒoʊnz',
  july: 'dʒuˈlaɪ',
  june: 'dʒun',
  kettle: 'ˈkɛɾəl',
  "kettle's": 'ˈkɛɾəlz',
  king: 'kɪŋ',
  kitchen: 'ˈkɪtʃən',
  lamb: 'læm',
  "lamb's": 'læmz',
  large: 'lɑrdʒ',
  late: 'leɪt',
  left: 'lɛft',
  letter: 'ˈlɛɾɚ',
  like: 'laɪk',
  likes: 'laɪks',
  live: 'lɪv',
  living: 'ˈlɪvɪŋ',
  loaf: 'loʊf',
  long: 'lɔŋ',
  looking: 'ˈlʊkɪŋ',
  lunch: 'lʌntʃ',
  magazines: 'ˈmæɡəˌzinz',
  make: 'meɪk',
  making: 'ˈmeɪkɪŋ',
  march: 'mɑrtʃ',
  may: 'meɪ',
  meat: 'mit',
  middle: 'ˈmɪdəl',
  mild: 'maɪld',
  milk: 'mɪlk',
  mince: 'mɪns',
  minute: 'ˈmɪnət',
  moment: 'ˈmoʊmənt',
  mrs: 'ˈmɪsɪz',
  must: 'mʌst',
  near: 'nɪr',
  newspaper: 'ˈnuzˌpeɪpɚ',
  newspapers: 'ˈnuzˌpeɪpɚz',
  next: 'nɛkst',
  night: 'naɪt',
  nights: 'naɪts',
  nine: 'naɪn',
  noon: 'nun',
  north: 'nɔrθ',
  november: 'noʊˈvɛmbɚ',
  "o'clock": 'əˈklɑk',
  october: 'ɑkˈtoʊbɚ',
  of: 'əv',
  often: 'ˈɔfən',
  on: 'ɑn',
  one: 'wʌn',
  ones: 'wʌnz',
  only: 'ˈoʊnli',
  open: 'ˈoʊpən',
  or: 'ɔr',
  out: 'aʊt',
  over: 'ˈoʊvɚ',
  pad: 'pæd',
  pads: 'pædz',
  paint: 'peɪnt',
  pamela: 'ˈpæmələ',
  paper: 'ˈpeɪpɚ',
  park: 'pɑrk',
  penny: 'ˈpɛni',
  photograph: 'ˈfoʊdəˌɡræf',
  pictures: 'ˈpɪktʃɚz',
  piece: 'pis',
  pink: 'pɪŋk',
  "pink's": 'pɪŋks',
  playing: 'ˈpleɪɪŋ',
  pleasant: 'ˈplɛzənt',
  pound: 'paʊnd',
  put: 'pʊt',
  quarter: 'ˈkwɔrtɚ',
  rains: 'reɪnz',
  read: 'rid',
  reading: 'ˈridɪŋ',
  reads: 'ridz',
  red: 'rɛd',
  refrigerator: 'rɪˈfrɪdʒəˌreɪɾɚ',
  rises: 'ˈraɪzɪz',
  river: 'ˈrɪvɚ',
  room: 'rum',
  running: 'ˈrʌnɪŋ',
  sally: 'ˈsæli',
  sam: 'sæm',
  sawyer: 'ˈsɔjɚ',
  sawyers: 'ˈsɔjɚz',
  school: 'skul',
  seasons: 'ˈsizənz',
  sees: 'siz',
  september: 'sɛpˈtɛmbɚ',
  sets: 'sɛts',
  shelf: 'ʃɛlf',
  shines: 'ʃaɪnz',
  shining: 'ˈʃaɪnɪŋ',
  ship: 'ʃɪp',
  shops: 'ʃɑps',
  shut: 'ʃʌt',
  sitting: 'ˈsɪɾɪŋ',
  six: 'sɪks',
  size: 'saɪz',
  sky: 'skaɪ',
  small: 'smɔl',
  "smith's": 'smɪθs',
  snows: 'snoʊz',
  soap: 'soʊp',
  some: 'sʌm',
  sometimes: 'ˈsʌmˌtaɪmz',
  south: 'saʊθ',
  spring: 'sprɪŋ',
  stays: 'steɪz',
  steak: 'steɪk',
  stereo: 'ˈstɛriˌoʊ',
  street: 'strit',
  subject: 'ˈsʌbdʒɪkt',
  sugar: 'ˈʃʊɡɚ',
  summer: 'ˈsʌmɚ',
  sun: 'sʌn',
  susan: 'ˈsuzən',
  sweep: 'swip',
  swimming: 'ˈswɪmɪŋ',
  table: 'ˈteɪbəl',
  takes: 'teɪks',
  tea: 'ti',
  teapot: 'ˈtiˌpɑt',
  television: 'ˈtɛləˌvɪʒən',
  tell: 'tɛl',
  ten: 'tɛn',
  terrible: 'ˈtɛrəbəl',
  them: 'ðəm',
  then: 'ðɛn',
  tin: 'tɪn',
  tobacco: 'təˈbækoʊ',
  together: 'təˈɡɛðɚ',
  tonight: 'təˈnaɪt',
  tree: 'tri',
  truth: 'truθ',
  type: 'taɪp',
  under: 'ˈʌndɚ',
  untidy: 'ənˈtaɪdi',
  up: 'ʌp',
  usually: 'ˈjuʒuəli',
  valley: 'ˈvæli',
  vase: 'veɪs',
  village: 'ˈvɪlɪdʒ',
  walking: 'ˈwɔkɪŋ',
  wall: 'wɔl',
  want: 'wɑnt',
  wardrobe: 'ˈwɔrˌdroʊb',
  warm: 'wɔrm',
  watch: 'wɑtʃ',
  water: 'ˈwɔɾɚ',
  weather: 'ˈwɛðɚ',
  "weather's": 'ˈwɛðɚz',
  west: 'wɛst',
  wet: 'wɛt',
  where: 'wɛr',
  "where's": 'wɛrz',
  which: 'wɪtʃ',
  "who's": 'huz',
  wife: 'waɪf',
  window: 'ˈwɪndoʊ',
  windy: 'ˈwɪndi',
  winter: 'ˈwɪntɚ',
  with: 'wɪð',
  work: 'wɝk',
  working: 'ˈwɝkɪŋ',
  writing: 'ˈraɪɾɪŋ',
  "you're": 'jʊr',
})) {
  ipaWords.set(word, ipa);
}

const translations = new Map(Object.entries({
  'Excuse me!': '打扰一下！/劳驾！',
  'Yes?': '什么事？',
  'Is this your handbag?': '这是你的手提包吗？',
  'Pardon?': '请再说一遍？',
  'Yes it is.': '是的，是我的。',
  'Thank you very much.': '非常感谢。',
  'Sorry sir.': '对不起，先生。',
  'My coat and my umbrella please.': '请把我的外套和雨伞给我。',
  'Here is my ticket.': '这是我的票。',
  'Thank you sir.': '谢谢您，先生。',
  'Number five.': '五号。',
  "Here's your umbrella and your coat.": '这是您的雨伞和外套。',
  'This is not my umbrella.': '这不是我的雨伞。',
  'Is this your umbrella?': '这是您的雨伞吗？',
  "No it isn't.": '不，不是。',
  'Is this it?': '是这个吗？',
  'Nice to meet you.': '很高兴见到你。',
  'Good morning.': '早上好。',
  'Good morning Mr. Blake.': '早上好，布莱克先生。',
  'This is Miss Sophie Dupont.': '这是索菲・杜邦小姐。',
  'Sophie is a new student.': '索菲是一名新学生。',
  'She is French.': '她是法国人。',
  'Sophie this is Hans.': '索菲，这是汉斯。',
  'He is German.': '他是德国人。',
  'And this is Naoko.': '这位是直子。',
  "She's Japanese.": '她是日本人。',
  'And this is Chang-woo.': '这位是昌宇。',
  "He's Korean.": '他是韩国人。',
  'And this is Luming.': '这位是鲁明。',
  "He's Chinese.": '他是中国人。',
  'And this is Xiaohui.': '这位是小慧。',
  'She is Chinese too.': '她也是中国人。',
  'I am a new student.': '我是一名新学生。',
  "My name's Robert.": '我的名字叫罗伯特。',
  "My name's Sophie.": '我的名字叫索菲。',
  'Are you French?': '你是法国人吗？',
  'Yes I am.': '是的，我是。',
  'Are you French too?': '你也是法国人吗？',
  'No I am not.': '不，我不是。',
  'What nationality are you?': '你是哪国人？',
  "I'm Italian.": '我是意大利人。',
  'Are you a teacher?': '你是老师吗？',
  "No I'm not.": '不，我不是。',
  "What's your job?": '你是做什么工作的？',
  "I'm a keyboard operator.": '我是电脑录入员。',
  "I'm an engineer.": '我是工程师。',
  'Hello Helen.': '你好，海伦。',
  'Hi Steven.': '你好，史蒂文。',
  'How are you today?': '你今天好吗？',
  "I'm very well thank you.": '我很好，谢谢。',
  'And you?': '你呢？',
  "I'm fine thanks.": '我很好，谢谢。',
  'How is Tony?': '托尼好吗？',
  "He's fine thanks.": '他很好，谢谢。',
  "How's Emma?": '艾玛好吗？',
  "She's very well too Helen.": '她也很好，海伦。',
  'Goodbye Helen.': '再见，海伦。',
  'Nice to see you.': '见到你很高兴。',
  'Nice to see you too Steven.': '见到你也很高兴，史蒂文。',
  'Goodbye.': '再见。',
  'Whose shirt is that?': '那是谁的衬衫？',
  'Is this your shirt Dave?': '戴夫，这是你的衬衫吗？',
  'No. Sir.': '不，先生。',
  "It's not my shirt.": '这不是我的衬衫。',
  'This is my shirt.': '这是我的衬衫。',
  "My shirt's blue.": '我的衬衫是蓝色的。',
  "Is this shirt Tim's?": '这件衬衫是蒂姆的吗？',
  'Perhaps it is sir.': '也许是，先生。',
  "Tim's shirt's white.": '蒂姆的衬衫是白色的。',
  'Tim!': '蒂姆！',
  'Yes sir?': '什么事，先生？',
  'Is this your shirt?': '这是你的衬衫吗？',
  'Yes sir.': '是的，先生。',
  'Here you are.': '给你。',
  'Catch!': '接住！',
  "What colour's your new dress?": '你的新连衣裙是什么颜色的？',
  "It's green.": '是绿色的。',
  'Come upstairs and see it.': '上楼来看看吧。',
  'Thank you.': '谢谢。',
  'Look!': '看！',
  'Here it is!': '在这儿！',
  "That's a nice dress.": '那是一件漂亮的连衣裙。',
  "It's very smart.": '它很漂亮/很时髦。',
  "My hat's new too.": '我的帽子也是新的。',
  'What colour is it?': '它是什么颜色的？',
  "It's the same colour.": '它是同样的颜色。',
  "It's green  too.": '它也是绿色的。',
  'That is a lovely hat!': '那是一顶可爱的帽子！',
  'Are you Swedish?': '你们是瑞典人吗？',
  'No we are not.': '不，我们不是。',
  'We are Danish.': '我们是丹麦人。',
  'Are your friends Danish too?': '你们的朋友也是丹麦人吗？',
  "No  they aren't.": '不，他们不是。',
  'They are Norwegian.': '他们是挪威人。',
  'Your passports please.': '请出示你们的护照。',
  'Here they are.': '给您。',
  'Are these your cases?': '这些是你们的箱子吗？',
  "No they aren't.": '不，不是。',
  'Our cases are brown.': '我们的箱子是棕色的。',
  'Are you tourists?': '你们是游客吗？',
  'Yes we are.': '是的，我们是。',
  'Are your friends tourists too?': '你们的朋友也是游客吗？',
  'Yes they are.': '是的，他们是。',
  "That's fine.": '可以了/很好。',
  'How do you do?': '您好。',
  'Come and meet our employees Mr.Richards.': '来见见我们的雇员吧，理查兹先生。',
  'Thank you Mr. Jackson.': '谢谢你，杰克逊先生。',
  'This is Nicola Grey': '这是尼古拉・格雷',
  'and this is Claire Taylor.': '这是克莱尔・泰勒。',
  'Those women are very hard-working.': '那些女士工作很努力。',
  'What are their jobs?': '她们/他们是做什么工作的？',
  "They're keyboard operators.": '她们是电脑录入员。',
  'This is Michael Baker': '这是迈克尔・贝克',
  'and this is Jeremy Short.': '这是杰里米・肖特。',
  "They aren't very busy!": '他们不是很忙！',
  "They're sales reps.": '他们是销售代表。',
  "They're very lazy.": '他们很懒。',
  'Who is this young man?': '这个年轻人是谁？',
  'This is Jim.': '这是吉姆。',
  "He's our office assistant.": '他是我们的办公室助理。',
  "What's the matter children?": '孩子们，怎么了？',
  "We're tired ...": '我们累了……',
  '... and thirsty  Mum.': '……而且口渴，妈妈。',
  'Sit down here.': '坐在这里。',
  'Are you all right now?': '你们现在好了吗？',
  "No we aren't.": '不，还没有。',
  "There's an ice cream man.": '那儿有一个卖冰激凌的人。',
  'Two ice cream please.': '请来两个冰激凌。',
  'Here you are children.': '给你们，孩子们。',
  'Thanks Mum.': '谢谢，妈妈。',
  'These ice creams are nice.': '这些冰激凌很好吃。',
  'Yes we are thank you!': '是的，我们好了，谢谢！',
}));

const vocabCn = new Map(Object.entries({
  handbag: '手提包',
  pardon: '请再说一遍',
  coat: '外套',
  umbrella: '雨伞',
  ticket: '票',
  student: '学生',
  french: '法国人/法国的',
  german: '德国人/德国的',
  japanese: '日本人/日本的',
  korean: '韩国人/韩国的',
  chinese: '中国人/中国的',
  nationality: '国籍',
  italian: '意大利人/意大利的',
  teacher: '老师',
  keyboard: '键盘',
  operator: '操作员',
  engineer: '工程师',
  shirt: '衬衫',
  perhaps: '也许',
  colour: '颜色',
  dress: '连衣裙',
  upstairs: '楼上',
  smart: '漂亮的/时髦的',
  lovely: '可爱的',
  passports: '护照',
  swedish: '瑞典人/瑞典的',
  danish: '丹麦人/丹麦的',
  norwegian: '挪威人/挪威的',
  cases: '箱子',
  tourists: '游客',
  employees: '雇员',
  hardworking: '努力工作的',
  jobs: '工作',
  sales: '销售',
  reps: '代表',
  lazy: '懒惰的',
  assistant: '助理',
  matter: '问题/事情',
  tired: '累的',
  thirsty: '口渴的',
  children: '孩子们',
  ice: '冰',
  cream: '奶油/冰激凌',
}));

const weakForms = new Set(['a', 'an', 'and', 'are', 'am', 'is', 'it', 'to', 'the', 'you', 'your', 'we', 'they', 'he', 'she', 'our', 'my', 'their']);

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeLine(line) {
  return line
    .replace(/\s+/g, ' ')
    .replace(/Mr\./g, 'Mr.')
    .trim();
}

function tokenize(line) {
  return line
    .replace(/[’]/g, "'")
    .replace(/\.\.\./g, ' ')
    .replace(/[?!.,!]/g, ' ')
    .replace(/-/g, '')
    .split(/\s+/)
    .filter(Boolean);
}

function lexicalWords(line) {
  return Array.from(
    line.replace(/[’]/g, "'").matchAll(/[A-Za-z]+(?:[-'][A-Za-z]+)*/g),
    (match) => match[0],
  );
}

function wordKey(word) {
  return word.toLowerCase().replace(/[^a-z']/g, '');
}

const dictCache = new Map();

function dictionaryIpa(key) {
  if (!key || key.includes("'")) return null;
  if (process.env.NCE1_LOOKUP_DICTIONARY !== '1') return null;
  if (dictCache.has(key)) return dictCache.get(key);
  let value = null;
  try {
    const output = execFileSync('swift', ['tools/macos_dictionary_pron.swift', key], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const match = output.match(/\tAmE ([^\t\n]+)/);
    if (match) value = match[1].replace(/\([^)]*\)/g, '').replace(/\s+/g, '');
  } catch {
    value = null;
  }
  dictCache.set(key, value);
  return value;
}

function startsWithVowelSound(ipa) {
  return /^[ˈˌ]?[ɑɔɛɪiæʌəɚɝuʊo]/.test(ipa);
}

function endsWithLinkableSound(ipa) {
  return /[bcdfghjklmnprstvwzðθʃʒŋɡɚɝrlmn]$/.test(ipa);
}

function applyConnectedSpeech(words, ipas) {
  const next = [...ipas];
  for (let index = 0; index < words.length; index += 1) {
    const key = words[index];
    if (key === 'and') next[index] = 'ən';
    if (key === 'a') next[index] = 'ə';
    if (key === 'an') next[index] = 'ən';
    if (key === 'to') next[index] = 'tə';
    if (key === 'the') next[index] = startsWithVowelSound(next[index + 1] ?? '') ? 'ði' : 'ðə';
    if (key === 'you' && ['do', 'can', 'could', 'would', 'will'].includes(words[index - 1])) next[index] = 'jə';
    if (key === 'are' && index > 0) next[index] = 'ɑr';
    if (key === 'of') next[index] = 'əv';
  }

  let ipa = '';
  for (let index = 0; index < next.length; index += 1) {
    if (index === 0) {
      ipa = next[index];
      continue;
    }
    const previous = next[index - 1];
    const current = next[index];
    const previousWord = words[index - 1];
    const currentWord = words[index];
    const shouldLink =
      startsWithVowelSound(current) &&
      (endsWithLinkableSound(previous) || ['i', 'aɪ', 'ði', 'ə', 'ən', 'əv', 'ɑr'].includes(previous) || /^[ɑɔɛɪiæʌəuʊo]/.test(previous));
    const commonPhrase =
      (previousWord === 'that' && currentWord === 'is') ||
      (previousWord === 'it' && currentWord === 'is') ||
      (previousWord === 'there' && currentWord === 'is') ||
      (previousWord === 'here' && currentWord === 'is') ||
      (previousWord === 'come' && currentWord === 'and') ||
      (previousWord === 'look' && currentWord === 'at') ||
      (previousWord === 'want' && currentWord === 'a') ||
      (previousWord === 'have' && currentWord === 'a') ||
      (previousWord === 'must' && currentWord === 'be') ||
      (previousWord === 'can' && currentWord === 'you') ||
      (previousWord === 'do' && currentWord === 'you');
    ipa += shouldLink || commonPhrase ? `‿${current}` : ` ${current}`;
  }

  ipa = ipa
    .replace(/\bɪt‿ɪz\b/g, 'ɪɾ‿ɪz')
    .replace(/\bðæt‿ɪz\b/g, 'ðæɾ‿ɪz')
    .replace(/\bwʌt‿ɪz\b/g, 'wʌɾ‿ɪz')
    .replace(/\bɡɛt‿/g, 'ɡɛɾ‿')
    .replace(/\bæt‿/g, 'æɾ‿');
  return ipa;
}

function ipaForLine(line) {
  const clean = normalizeLine(line);
  const lower = clean.toLowerCase();
  const special = new Map(Object.entries({
    'excuse me!': 'ɪkˈskjuz mi',
    'thank you very much.': 'θæŋk ju ˈvɛri mʌtʃ',
    'nice to meet you.': 'naɪs tə mit ju',
    'nice to see you.': 'naɪs tə si ju',
    'how do you do?': 'haʊ də jə du',
    'how are you today?': 'haʊ ɑr ju təˈdeɪ',
    'here you are.': 'hɪr ju ɑr',
    'here they are.': 'hɪr ðeɪ ɑr',
  }));
  if (special.has(lower)) return special.get(lower);

  const words = tokenize(clean).map(wordKey);
  const parts = words.map((key) => {
    if (key === 'colour') return ipaWords.get('colour');
    if (key === 'hardworking') return ipaWords.get('hardworking');
    return ipaWords.get(key) ?? dictionaryIpa(key) ?? key;
  });

  return applyConnectedSpeech(words, parts);
}

function highlightIpa(ipa) {
  let next = escapeHtml(`/${ipa}/`);
  next = next.replace(/‿/g, '<span class="linking">‿</span>');
  for (const weak of ['ə', 'ən', 'əm', 'tə', 'ðə', 'ɑr', 'jə']) {
    next = next.replace(new RegExp(`(?<![A-Za-zɚɝɑɔɛɪʊə])${weak}(?![A-Za-zɚɝɑɔɛɪʊə])`, 'g'), `<span class="weak">${weak}</span>`);
  }
  return next;
}

function highlightEnglish(line) {
  const tokens = tokenize(normalizeLine(line));
  const linkIndexes = new Set();
  for (let index = 0; index < tokens.length - 1; index += 1) {
    const left = wordKey(tokens[index]);
    const right = wordKey(tokens[index + 1]);
    if (!left || !right) continue;
    const leftIpa = ipaWords.get(left) ?? dictionaryIpa(left) ?? left;
    const rightIpa = ipaWords.get(right) ?? dictionaryIpa(right) ?? right;
    const reducedRight = {
      a: 'ə',
      an: 'ən',
      and: 'ən',
      are: 'ɑr',
      is: 'ɪz',
      of: 'əv',
      the: 'ðə',
      to: 'tə',
      in: 'ɪn',
    }[right] ?? rightIpa;
    const shouldMark =
      startsWithVowelSound(reducedRight) &&
      (endsWithLinkableSound(leftIpa) || weakForms.has(right) || ['and', 'are', 'is', 'it'].includes(right));
    if (shouldMark) {
      linkIndexes.add(index);
      linkIndexes.add(index + 1);
    }
  }

  let wordIndex = 0;
  return normalizeLine(line).split(/(\s+)/).map((part) => {
    if (/^\s+$/.test(part)) return part;
    const key = wordKey(part);
    const escaped = escapeHtml(part);
    const currentIndex = wordIndex;
    wordIndex += key ? 1 : 0;
    const classes = [];
    if (weakForms.has(key)) classes.push('weak');
    if (linkIndexes.has(currentIndex) || /^[aeiou]/i.test(key)) classes.push('linking');
    if (classes.length > 0) return `<span class="${classes.join(' ')}">${escaped}</span>`;
    return escaped;
  }).join('');
}

function linkedIpaChunks(ipa) {
  return [...ipa.matchAll(/[^\s]+‿[^\s]+/g)]
    .map((match) => match[0].replace(/[/?.,;:!()"']/g, ''))
    .filter(Boolean)
    .slice(0, 5);
}

function weakIpaForms(ipa) {
  const forms = [];
  for (const weak of ['ðə', 'ði', 'ə', 'ən', 'əm', 'tə', 'tʊ', 'əv', 'ɑr', 'ɪz', 'wəz', 'wɚ', 'fɚ', 'frəm', 'həd', 'həv', 'jə']) {
    const pattern = new RegExp(`(^|[\\s‿])${weak}(?=$|[\\s‿])`);
    if (pattern.test(ipa) && !forms.includes(weak)) forms.push(weak);
  }
  return forms.slice(0, 6);
}

function flapChunks(ipa) {
  return ipa.split(/\s+/)
    .map((part) => part.replace(/[/?.,;:!()"']/g, ''))
    .filter((part) => part.includes('ɾ'))
    .slice(0, 3);
}

function liaisonFor(line, ipa) {
  const points = [];
  const links = linkedIpaChunks(ipa);
  const weak = weakIpaForms(ipa);
  const flaps = flapChunks(ipa);
  if (links.length > 0) points.push(`${links.join('、')} 连读`);
  if (weak.length > 0) points.push(`${weak.join('、')} 弱读/弱化`);
  if (flaps.length > 0) points.push(`${flaps.join('、')} 中 /ɾ/ 为美式闪音`);
  if (points.length === 0) {
    const focus = contentWords(line).slice(0, 3).join(' / ');
    points.push(focus ? `本句没有明显跨词连读；按意群朗读，重读 ${focus}` : '本句按完整意群朗读，保持清晰语调');
  }
  return `${points.join('；')}。`;
}

const linkingVerbForms = new Set([
  'am', 'are', 'is', 'was', 'were', 'be', 'been', "'m", "'re", "'s",
  "i'm", "you're", "he's", "she's", "it's", "that's", "there's", "here's", "what's", "where's", "who's",
]);

const imperativeStarts = new Set([
  'be', 'bring', 'catch', 'climb', 'come', 'do', 'drink', 'drop', 'empty', 'find',
  'excuse', 'give', 'go', 'have', 'help', 'hurry', 'jump', 'let', 'listen', 'look', 'make',
  'open', 'paint', 'put', 'read', 'send', 'show', 'shut', 'sit', 'take', 'tell',
  'thank', 'turn', 'type', 'wait', 'walk', 'wash',
]);

const transitiveVerbs = new Set([
  'answer', 'answers', 'buy', 'bought', 'call', 'called', 'can', 'catch', 'clean',
  'count', 'counted',
  'cook', 'cut', 'do', 'does', 'drink', 'drinks', 'drop', 'eat', 'eats', 'empty',
  'excuse', 'find', 'found', 'get', 'give', 'guess', 'have', 'has', 'hear', 'help', 'keep',
  'know', 'like', 'likes', 'look', 'love', 'make', 'makes', 'meet', 'need', 'open',
  'made', 'paint', 'put', 'read', 'recognize', 'remember', 'saw', 'see', 'send', 'show', 'take',
  'tell', 'thank', 'think', 'throw', 'type', 'want', 'wants', 'wash', 'watch',
]);

const intransitiveVerbs = new Set([
  'arrive', 'arrives', 'came', 'come', 'comes', 'cry', 'die', 'do', 'does', 'fall', 'falls',
  'go', 'goes', 'happen', 'happened', 'live', 'lives', 'rain', 'rains', 'rise',
  'rises', 'run', 'runs', 'shine', 'shines', 'sit', 'sits', 'sleep', 'snows',
  'stand', 'stay', 'stays', 'swim', 'walk', 'went', 'work', 'works',
]);

const objectComplementPatterns = [
  /\b(?:make|makes|made)\s+(?:it|them|him|her|me|you)\s+\w+/i,
  /\bfind(?:s)?\s+(?:it|them|him|her|me|you)\s+\w+/i,
  /\bkeep(?:s)?\s+(?:it|them|him|her|me|you)\s+\w+/i,
];

const doubleObjectPatterns = [
  /\bgive\s+(?:me|him|her|us|them|you)\s+/i,
  /\bsend\s+(?:me|him|her|us|them|you)\s+/i,
  /\bshow\s+(?:me|him|her|us|them|you)\s+/i,
  /\btell\s+(?:me|him|her|us|them|you)\s+/i,
];

function compactClause(value) {
  return value
    .replace(/\b(please|sir|madam|mum|mom|dad)\b/gi, '')
    .replace(/\s+([?!.,])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[?!.,]+$/g, '');
}

function firstVerbIndex(words) {
  return words.findIndex((word) => {
    const key = wordKey(word);
    return linkingVerbForms.has(key) || transitiveVerbs.has(key) || intransitiveVerbs.has(key)
      || /(?:ing|ed)$/.test(key);
  });
}

function splitLeadingAdverbial(clean) {
  const commaMatch = clean.match(/^([^,]+),\s*(.+)$/);
  if (commaMatch) return { adverbial: compactClause(commaMatch[1]), main: compactClause(commaMatch[2]) };
  return { adverbial: '', main: clean };
}

function sentenceKind(line) {
  const clean = normalizeLine(line);
  if (/\b(must|may|might|can|can't|could|will|would|should|have to|has to|had to)\b/i.test(clean)) return '情态动词结构；情态动词后接动词原形，表达推测、能力、义务或将来。';
  if (/\b(who|which|that)\b.+\b(is|are|was|were|bought|served|met|told|offered|leaves)\b/i.test(clean)) return '含定语从句；who/which/that 引导从句修饰前面的名词。';
  if (/\b(said|told|asked|wonder|think|thought|know|remember|recognize)\b/i.test(clean)) return '含宾语从句或引语；动词后面说明说话、想法、记忆或判断的内容。';
  if (/^if\b|\b if \b/i.test(clean)) return '条件句；if 引导条件，从句和主句说明条件与结果。';
  if (/\b(has|have|had) been\b|\b(was|were) invited\b|\b(is|are|was|were) covered\b/i.test(clean)) return '被动语态；be/have been + 过去分词，强调动作承受者。';
  if (/\btag-question-marker\b/i.test(clean)) return '反意疑问句；前面陈述，后面用简短问句确认。';
  if (/^(are|is|does|do|what|whose|how|who)\b/i.test(clean)) return '疑问句；助动词/be 动词或疑问词置于句首。';
  if (/^(come|look|sit|catch|thank|excuse|pardon|sorry|goodbye|hello|hi)\b/i.test(clean)) return '日常交际/祈使或省略句；省略主语或用于固定寒暄。';
  if (/^(this|that|these|those|here|there)\b/i.test(clean)) return '指示/存在句；this/that/these/those/here/there 引出人或物。';
  if (/\b(am|is|are|isn't|aren't|'m|'s|'re)\b/i.test(clean)) return '主系表结构；be 动词连接主语和身份、状态或性质。';
  return '简单句；适合按意群直接理解。';
}

function beQuestionAnalysis(clean) {
  let match = clean.match(/^(is|are|am|was|were)\s+(.+?)\s+(.+)$/i);
  if (match) {
    return {
      pattern: '五大句型之一: 主系表(SVC)。疑问句把系动词提前。',
      components: `系=${match[1]}；主=${compactClause(match[2])}；表=${compactClause(match[3])}`,
    };
  }

  match = clean.match(/^(what|whose|which)\s+(.+?)\s+(is|are|am|was|were)\s+(.+)$/i);
  if (match) {
    return {
      pattern: '五大句型之一: 主系表(SVC)。特殊疑问词提到句首。',
      components: `表=${compactClause(`${match[1]} ${match[2]}`)}；系=${match[3]}；主=${compactClause(match[4])}`,
    };
  }

  match = clean.match(/^how\s+(is|are|am|was|were)\s+(.+)$/i);
  if (match) {
    return {
      pattern: '五大句型之一: 主系表(SVC)。how 作表语，询问状态。',
      components: `表=how；系=${match[1]}；主=${compactClause(match[2])}`,
    };
  }

  return null;
}

function linkingAnalysis(clean) {
  let match = clean.match(/^(?:yes|no)\s+(.+?)\s+(am|are|is|was|were)$/i);
  if (match) {
    return {
      pattern: '五大句型之一: 主系表(SVC)。短答保留主语和系动词，表语承接上文省略。',
      components: `主=${compactClause(match[1])}；系=${match[2]}；表=(承接上文省略)`,
    };
  }

  match = clean.match(/^(.+?)\s+(am|are|is|was|were)$/i);
  if (match) {
    return {
      pattern: '五大句型之一: 主系表(SVC)。表语承接上文省略。',
      components: `主=${compactClause(match[1])}；系=${match[2]}；表=(承接上文省略)`,
    };
  }

  match = clean.match(/^(.+?)\s+(am|are|is|was|were)\s+(.+)$/i);
  if (match) {
    return {
      pattern: '五大句型之一: 主系表(SVC)。',
      components: `主=${compactClause(match[1])}；系=${match[2]}；表=${compactClause(match[3])}`,
    };
  }

  match = clean.match(/^(.+?)('m|'re|'s)\s+(.+)$/i);
  if (match) {
    return {
      pattern: '五大句型之一: 主系表(SVC)。缩写中含系动词 be。',
      components: `主=${compactClause(match[1])}；系=${match[2]} (= be)；表=${compactClause(match[3])}`,
    };
  }

  return null;
}

function questionActionAnalysis(clean) {
  let match = clean.match(/^(do|does|did)\s+(.+?)\s+([a-z']+)\s*(.*)$/i);
  if (match) {
    const object = compactClause(match[4]);
    return {
      pattern: object ? '五大句型之一: 主谓宾(SVO)。一般疑问句把助动词提前。' : '五大句型之一: 主谓(SV)。一般疑问句把助动词提前。',
      components: `助=${match[1]}；主=${compactClause(match[2])}；谓=${match[3]}${object ? `；宾=${object}` : ''}`,
    };
  }

  match = clean.match(/^(can|could|will|would|may|must|should)\s+(.+?)\s+([a-z']+)\s*(.*)$/i);
  if (match) {
    const object = compactClause(match[4]);
    return {
      pattern: object ? '五大句型之一: 主谓宾(SVO)。情态疑问句把情态动词提前。' : '五大句型之一: 主谓(SV)。情态疑问句把情态动词提前。',
      components: `情态=${match[1]}；主=${compactClause(match[2])}；谓=${match[3]}${object ? `；宾=${object}` : ''}`,
    };
  }

  return null;
}

function imperativeAnalysis(clean) {
  const words = lexicalWords(clean);
  const first = wordKey(words[0] ?? '');
  if (!imperativeStarts.has(first)) return null;

  const rest = compactClause(clean.replace(new RegExp(`^${words[0]}\\b`, 'i'), ''));
  if (doubleObjectPatterns.some((pattern) => pattern.test(clean))) {
    const parts = rest.split(/\s+/);
    return {
      pattern: '五大句型之一: 主谓双宾(SVOO)。祈使句省略主语 you。',
      components: `主=(you 省略)；谓=${words[0]}；间宾=${parts[0] ?? ''}；直宾=${parts.slice(1).join(' ')}`,
    };
  }
  return {
    pattern: rest ? '五大句型之一: 主谓宾(SVO)。祈使句省略主语 you。' : '五大句型之一: 主谓(SV)。祈使句省略主语 you。',
    components: `主=(you 省略)；谓=${words[0]}${rest ? `；宾=${rest}` : ''}`,
  };
}

function actionAnalysis(clean) {
  const { adverbial, main } = splitLeadingAdverbial(clean);
  const words = lexicalWords(main);
  const verbIndex = firstVerbIndex(words);
  if (verbIndex < 0) {
    const first = words[0] ?? clean;
    return {
      pattern: '五大句型参考: 省略句/交际短句；结合上下文还原主谓结构。',
      components: `主/谓省略；核心词=${first}`,
    };
  }

  const subject = compactClause(words.slice(0, verbIndex).join(' '));
  const verb = words[verbIndex];
  const rest = compactClause(words.slice(verbIndex + 1).join(' '));
  const lower = main.toLowerCase();

  const passiveMatch = main.match(/^(.+?)\s+((?:has|have|had|is|are|was|were)\s+been\s+\w+ed)\s*(.*)$/i)
    ?? main.match(/^(.+?)\s+((?:is|are|was|were)\s+\w+ed)\s*(.*)$/i);
  if (passiveMatch) {
    return {
      pattern: '五大句型之一: 主谓(SV)的被动结构；过去分词构成谓语核心。',
      components: `${adverbial ? `状=${adverbial}；` : ''}主=${compactClause(passiveMatch[1])}；谓=${compactClause(passiveMatch[2])}${passiveMatch[3] ? `；补/状=${compactClause(passiveMatch[3])}` : ''}`,
    };
  }

  if (objectComplementPatterns.some((pattern) => pattern.test(clean))) {
    const parts = rest.split(/\s+/);
    return {
      pattern: '五大句型之一: 主谓宾补(SVOC)。',
      components: `${adverbial ? `状=${adverbial}；` : ''}主=${subject || '(省略)'}；谓=${verb}；宾=${parts[0] ?? ''}；宾补=${parts.slice(1).join(' ')}`,
    };
  }

  if (doubleObjectPatterns.some((pattern) => pattern.test(clean))) {
    const parts = rest.split(/\s+/);
    return {
      pattern: '五大句型之一: 主谓双宾(SVOO)。',
      components: `${adverbial ? `状=${adverbial}；` : ''}主=${subject || '(省略)'}；谓=${verb}；间宾=${parts[0] ?? ''}；直宾=${parts.slice(1).join(' ')}`,
    };
  }

  if (linkingVerbForms.has(wordKey(verb))) {
    return {
      pattern: '五大句型之一: 主系表(SVC)。',
      components: `${adverbial ? `状=${adverbial}；` : ''}主=${subject || '(省略)'}；系=${verb}；表=${rest || '(省略)'}`,
    };
  }

  const hasObject = transitiveVerbs.has(wordKey(verb)) && rest && !/^(to|from|at|in|on|under|over|behind|beside|across|along|upstairs|downstairs|away|back|home)\b/i.test(rest);
  if (hasObject || /\b(have|has|want|wants|like|likes|see|sees|read|reads|make|makes|take|takes|put|puts|buy|bought)\b/i.test(lower)) {
    return {
      pattern: '五大句型之一: 主谓宾(SVO)。',
      components: `${adverbial ? `状=${adverbial}；` : ''}主=${subject || '(省略)'}；谓=${verb}；宾=${rest || '(省略)'}`,
    };
  }

  return {
    pattern: '五大句型之一: 主谓(SV)。后续信息多作宾语、补语或状语，按动词性质判断。',
    components: `${adverbial ? `状=${adverbial}；` : ''}主=${subject || '(省略)'}；谓=${verb}${rest ? `；状=${rest}` : ''}`,
  };
}

function nominalSubjectComplementAnalysis(clean) {
  const match = clean.match(/^(what\s+.+?)\s+(made|make|makes)\s+(me|him|her|us|them|you|it)\s+(.+)$/i);
  if (!match) return null;
  return {
    pattern: '五大句型之一: 主谓宾补(SVOC)。what 引导的名词性从句作主语。',
    components: `主=${compactClause(match[1])}；谓=${match[2]}；宾=${match[3]}；宾补=${compactClause(match[4])}`,
  };
}

function grammarAnalysisFor(line) {
  const clean = compactClause(normalizeLine(line));
  const lower = clean.toLowerCase();

  let base = null;
  const butParts = clean.split(/\s*,?\s+but\s+/i);
  if (butParts.length === 2 && butParts.every(Boolean)) {
    const first = grammarAnalysisFor(butParts[0]);
    const second = grammarAnalysisFor(butParts[1]);
    base = {
      pattern: `五大句型组合: 并列句；前句${first.pattern}；后句${second.pattern}`,
      components: `前句(${first.components})；连词=but；后句(${second.components})`,
    };
  } else if (/^there(?:'s| is| are| was| were)\b/i.test(clean)) {
    base = {
      pattern: '五大句型参考: there be 存现句；可看作主系表(SVC)的特殊变体。',
      components: clean.replace(/^there(?:'s| is| are| was| were)\s*/i, (match) => `引导词=there；系=${match.trim().replace(/^there/i, '').trim() || "'s"}；主=`),
    };
  } else if (/^(is|are|am|was|were|what|whose|which|how)\b/i.test(clean)) {
    base = beQuestionAnalysis(clean);
  } else if (/^(do|does|did|can|could|will|would|may|must|should)\b/i.test(clean)) {
    base = questionActionAnalysis(clean);
  } else if (imperativeStarts.has(wordKey(lexicalWords(clean)[0] ?? ''))) {
    base = imperativeAnalysis(clean);
  } else if (/\b(am|are|is|was|were|'m|'re|'s)\b/i.test(clean) || /\w+'(?:m|re|s)\b/i.test(clean)) {
    base = linkingAnalysis(clean);
  } else {
    base = nominalSubjectComplementAnalysis(clean);
  }

  if (!base) base = actionAnalysis(clean);

  const extras = [];
  if (/\b(who|which|that)\b/i.test(lower)) extras.push('含从句/关系词，需看其修饰或连接的对象');
  if (/\b(and|but|or)\b/i.test(lower)) extras.push('含并列连接，连接并列词、短语或分句');
  if (/\b(not|n't)\b/i.test(lower)) extras.push('含否定成分');
  if (/\?$/.test(normalizeLine(line))) extras.push('疑问语序/疑问语气');
  if (/!$/.test(normalizeLine(line))) extras.push('强调或交际语气');

  return {
    pattern: base.pattern,
    components: base.components,
    structure: `句型: ${base.pattern} 成分: ${base.components}${extras.length ? `；补充: ${extras.join('；')}` : ''}。`,
  };
}

function structureFor(line) {
  return grammarAnalysisFor(line).structure;
}

function tenseFor(line) {
  const clean = normalizeLine(line);
  if (/\b(had been|had already|had entered|had left|had never)\b/i.test(clean)) return '过去完成时；表示过去某个时间之前已经发生的动作。';
  if (/\b(has|have) been\b/i.test(clean)) return '现在完成时或现在完成被动；强调动作到现在的结果。';
  if (/\b(was|were) .+?ing\b/i.test(clean)) return '过去进行时；表示过去某一时刻正在发生的动作。';
  if (/\b(will|'ll|won't|going to|would|might|may)\b/i.test(clean)) return '将来/情态表达；will、be going to、may/might/would 表示将来、可能或转述中的将来。';
  if (/\b(must|can't|can|could|should|have to|has to|had to)\b/i.test(clean)) return '情态动词结构；must/can/can’t/have to 后接动词原形。';
  if (/\b(was|were|did|went|came|saw|found|bought|took|told|said|asked|invited|decided|happened|dropped|looked|put|tried|swallowed|phoned|answered|climbed|entered|heard|ran|turned|recognized|grew|shaved|counted)\b/i.test(clean)) return '一般过去时；叙述过去发生的动作或状态。';
  if (/^(are|is|what|whose|how|who)|\b(am|is|are|isn't|aren't|'m|'s|'re)\b/i.test(clean)) return '一般现在时，重点是 be 动词的人称变化。';
  if (/^(come|look|sit|catch|thank|excuse|pardon|sorry)\b/i.test(clean)) return '祈使/交际用语，无明显时态变化。';
  return '一般现在语境或固定口语表达。';
}

function wordsFor(line) {
  const items = [];
  const phraseItems = [];
  const lower = cleanForRules(line).toLowerCase();
  for (const [phrase, cn] of [...phraseCn, ...extraPhraseCn]) {
    if (isPhraseEntry(phrase) && phraseMatchesLine(lower, phrase) && !phraseItems.some((item) => item.startsWith(`${phrase} `))) {
      phraseItems.push(`${phrase} ${cn}`);
    }
  }
  for (const token of lexicalWords(line)) {
    items.push(`${token} ${wordMeaning(token)}`);
  }
  if (items.length === 0) {
    const pattern = patternNoteFor(line);
    return `${pattern}；`;
  }
  return `${items.join('； ')}；${phraseItems.length ? ` 短语: ${phraseItems.join('； ')}；` : ''}`;
}

function isPhraseEntry(phrase) {
  return phrase.trim().split(/\s+/).length > 1;
}

function phraseMatchesLine(lowerLine, phrase) {
  const pattern = phrase
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('\\s+');
  return new RegExp(`(^|[^a-z'])${pattern}([^a-z']|$)`, 'i').test(lowerLine);
}

const commonWordCn = new Map(Object.entries({
  a: '一个/一，用于单数可数名词前',
  about: '关于/大约',
  after: '在之后',
  afraid: '害怕的/担心的',
  ago: '以前',
  again: '再一次',
  all: '全部/都',
  am: '是，be 动词第一人称单数',
  an: '一个/一，用于元音音素前',
  and: '和/并且',
  any: '任何/一些',
  are: '是，be 动词复数/第二人称',
  at: '在/向',
  back: '回来/后面',
  bad: '坏的/严重的',
  be: '是/成为',
  been: 'be 的过去分词',
  but: '但是',
  by: '通过/乘/在旁边',
  buy: '买',
  can: '能够/可以',
  car: '汽车',
  come: '来',
  course: '课程/过程；of course 当然',
  could: '能够/可以，can 的过去式或委婉说法',
  day: '一天/白天',
  did: 'do 的过去式/助动词',
  "didn't": 'did not 的缩写，没有/不',
  do: '做/助动词',
  does: 'do 的第三人称单数/助动词',
  doctor: '医生',
  down: '向下',
  every: '每一个',
  for: '为了/给/持续',
  from: '从/来自',
  get: '得到/变得/到达',
  go: '去',
  got: 'get 的过去式/过去分词，得到/变得',
  ground: '地面',
  had: 'have 的过去式',
  has: '有/助动词，第三人称单数',
  have: '有/助动词',
  he: '他',
  her: '她/她的',
  here: '这里',
  him: '他，宾格',
  his: '他的',
  home: '家/在家',
  house: '房子',
  how: '怎样/多么',
  i: '我',
  if: '如果/是否',
  in: '在里面/在某时',
  into: '进入',
  is: '是，be 动词第三人称单数',
  it: '它/这',
  just: '刚刚/只是',
  know: '知道',
  last: '上一个/最后的',
  let: '让',
  little: '小的',
  look: '看',
  made: 'make 的过去式，使/让',
  make: '做/制作/使',
  man: '男人',
  may: '可以/可能',
  me: '我，宾格',
  meet: '遇见/见面',
  money: '钱',
  more: '更多',
  much: '许多/非常',
  my: '我的',
  near: '在附近',
  new: '新的',
  next: '下一个/接下来的',
  no: '不/没有',
  not: '不',
  now: '现在',
  of: '的/属于',
  on: '在上面/在某天',
  one: '一/一个',
  or: '或者',
  our: '我们的',
  out: '出去/在外',
  people: '人们',
  please: '请',
  put: '放/放置',
  right: '对的/右边',
  saw: 'see 的过去式，看见',
  said: 'say 的过去式，说',
  see: '看见/明白',
  she: '她',
  sir: '先生',
  so: '如此/所以',
  some: '一些',
  sorry: '抱歉的',
  still: '仍然',
  sure: '确信的',
  tell: '告诉',
  than: '比',
  thank: '感谢',
  that: '那/那个',
  the: '这个/那个，定冠词',
  their: '他们的/它们的',
  them: '他们/它们，宾格',
  then: '然后/那时',
  there: '那里/there be 引导词',
  these: '这些',
  they: '他们/它们',
  think: '想/认为',
  this: '这/这个',
  those: '那些',
  through: '穿过/通过',
  time: '时间/次数',
  to: '到/向/不定式标记',
  today: '今天',
  town: '城镇',
  too: '也/太',
  up: '向上',
  very: '非常',
  walk: '散步/走',
  want: '想要',
  was: '是，be 动词过去式单数',
  we: '我们',
  week: '周/星期',
  well: '好/健康的',
  went: 'go 的过去式，去了',
  were: '是，be 动词过去式复数',
  what: '什么',
  when: '什么时候/当时',
  where: '哪里',
  which: '哪一个/哪个',
  who: '谁',
  whose: '谁的',
  why: '为什么',
  will: '将要/愿意',
  with: '和/带有',
  wife: '妻子',
  would: '将会/愿意，委婉或过去将来',
  year: '年',
  yet: '还/已经，用于疑问或否定',
  yes: '是的',
  you: '你/你们',
  your: '你的/你们的',
}));

const contractionCn = new Map(Object.entries({
  "aren't": 'are not 的缩写，不是',
  "can't": 'cannot 的缩写，不能/不可能',
  "doesn't": 'does not 的缩写，不',
  "don't": 'do not 的缩写，不',
  "hadn't": 'had not 的缩写，没有',
  "hasn't": 'has not 的缩写，没有',
  "haven't": 'have not 的缩写，没有',
  "he's": 'he is/has 的缩写，他是/他已经',
  "here's": 'here is 的缩写，这是/这里有',
  "how's": 'how is 的缩写，怎么样',
  "i'm": 'I am 的缩写，我是',
  "isn't": 'is not 的缩写，不是',
  "it's": 'it is/has 的缩写，它是/这就是',
  "let's": 'let us 的缩写，让我们',
  "she's": 'she is/has 的缩写，她是/她已经',
  "that's": 'that is 的缩写，那是/就是说',
  "there's": 'there is 的缩写，有',
  "they're": 'they are 的缩写，他们/它们是',
  "we're": 'we are 的缩写，我们是',
  "what's": 'what is 的缩写，是什么',
  "where's": 'where is 的缩写，在哪里',
  "who's": 'who is 的缩写，谁是',
  "won't": 'will not 的缩写，将不',
  "you're": 'you are 的缩写，你/你们是',
}));

function possessiveBase(key) {
  if (!key.endsWith("'s")) return null;
  return key.slice(0, -2);
}

function wordMeaning(token) {
  const key = wordKey(token);
  const lowerToken = token.toLowerCase();
  const maps = [commonWordCn, contractionCn, vocabCn, adjectiveCn, extraWordCn, nce1WordCn, phraseCn];
  for (const map of maps) {
    if (map.has(key)) return map.get(key);
    if (map.has(lowerToken)) return map.get(lowerToken);
  }
  const base = possessiveBase(key);
  if (base) {
    const baseMeaning = wordMeaning(base);
    return `${baseMeaning}的/所有格`;
  }
  const inflectedMeaning = meaningForInflectedWord(key);
  if (inflectedMeaning) return inflectedMeaning;
  if (/^[A-Z]/.test(token)) return '专有名词/人名或地名';
  throw new Error(`Missing concrete word meaning for "${token}"`);
}

function lookupBaseMeaning(key) {
  const maps = [commonWordCn, contractionCn, vocabCn, adjectiveCn, extraWordCn, nce1WordCn, phraseCn];
  for (const map of maps) {
    if (map.has(key)) return map.get(key);
  }
  return null;
}

function meaningForInflectedWord(key) {
  const candidates = [];
  if (/ies$/.test(key)) candidates.push([key.replace(/ies$/, 'y'), '复数/第三人称单数']);
  if (/ing$/.test(key)) {
    candidates.push([key.replace(/ing$/, ''), '-ing 形式']);
    candidates.push([key.replace(/ing$/, 'e'), '-ing 形式']);
    if (/([a-z])\1ing$/.test(key)) candidates.push([key.replace(/([a-z])\1ing$/, '$1'), '-ing 形式']);
  }
  if (/ied$/.test(key)) candidates.push([key.replace(/ied$/, 'y'), '过去式/过去分词']);
  if (/ed$/.test(key)) {
    candidates.push([key.replace(/ed$/, ''), '过去式/过去分词']);
    candidates.push([key.replace(/d$/, ''), '过去式/过去分词']);
    if (/([a-z])\1ed$/.test(key)) candidates.push([key.replace(/([a-z])\1ed$/, '$1'), '过去式/过去分词']);
  }
  if (/er$/.test(key)) {
    candidates.push([key.replace(/er$/, ''), '比较级']);
    candidates.push([key.replace(/r$/, ''), '比较级']);
  }
  if (/est$/.test(key)) {
    candidates.push([key.replace(/est$/, ''), '最高级']);
    candidates.push([key.replace(/st$/, ''), '最高级']);
  }
  if (/s$/.test(key)) {
    candidates.push([key.replace(/s$/, ''), '复数/第三人称单数']);
    candidates.push([key.replace(/es$/, ''), '复数/第三人称单数']);
  }
  for (const [base, form] of candidates) {
    if (!base) continue;
    const meaning = lookupBaseMeaning(base);
    if (meaning) return `${base} 的${form}，${meaning}`;
  }
  if (/ing$/.test(key)) return '动词 -ing 形式/现在分词或动名词';
  if (/ed$/.test(key)) return '动词过去式/过去分词';
  if (/s$/.test(key)) return '名词复数或动词第三人称单数';
  return null;
}

const phraseCn = new Map(Object.entries({
  'aeroplane': '飞机',
  'armchairs': '扶手椅',
  'banks': '河岸',
  'bar': '条',
  'bed': '床',
  'bedroom': '卧室',
  'beef': '牛肉',
  'behind': '在后面',
  'beside': '在旁边',
  'biscuits': '饼干',
  'black coffee': '不加奶的咖啡',
  'bookcase': '书橱',
  'bottle': '瓶子',
  'box': '盒子',
  'bread': '面包',
  'bridge': '桥',
  'building': '建筑物',
  'chalk': '粉笔',
  'cheese': '奶酪',
  'chicken': '鸡肉/鸡',
  'climate': '气候',
  'clothes': '衣服',
  'coffee': '咖啡',
  'every day': '每天',
  'cooker': '炉子',
  'cupboard': '碗橱',
  'dressing table': '梳妆台',
  'electric cooker': '电炉',
  'envelopes': '信封',
  'flowers': '花',
  'glasses': '玻璃杯',
  'glue': '胶水',
  'hammer': '锤子',
  'handwriting': '笔迹',
  'homework': '作业',
  'housework': '家务',
  'kettle': '水壶',
  'kitchen': '厨房',
  'lamb': '羊肉',
  'letter': '信',
  'lunch': '午饭',
  'living room': '客厅',
  'magazines': '杂志',
  'milk': '牛奶',
  'mince': '肉馅',
  'newspaper': '报纸',
  'newspapers': '报纸',
  'pad': '便笺簿',
  'paint': '油漆/刷漆',
  'park': '公园',
  'photograph': '照片',
  'pictures': '图画',
  'pink': '粉色',
  'refrigerator': '冰箱',
  'river': '河',
  'school': '学校',
  'shelf': '架子',
  'stereo': '立体声音响',
  'sugar': '糖',
  'table': '桌子',
  'tea': '茶',
  'teapot': '茶壶',
  'television': '电视',
  'tobacco': '烟草',
  'vase': '花瓶',
  'village': '村庄',
  'wardrobe': '衣柜',
  'weather': '天气',
  'window': '窗户',
  'writing paper': '信纸',
  'work': '工作',
}));

const adjectiveCn = new Map(Object.entries({
  big: '大的',
  black: '黑色的',
  blue: '蓝色的',
  clean: '干净的',
  cold: '冷的',
  empty: '空的',
  fine: '晴朗的',
  good: '好的',
  heavy: '重的',
  hot: '热的',
  interesting: '有趣的',
  large: '大的',
  late: '晚的',
  lazy: '懒的',
  left: '左边的',
  long: '长的',
  lovely: '可爱的',
  mild: '温和的',
  nice: '好的/漂亮的',
  pleasant: '宜人的',
  red: '红色的',
  short: '短的',
  small: '小的',
  terrible: '糟糕的',
  untidy: '不整洁的',
  warm: '暖和的',
  wet: '潮湿的',
  white: '白色的',
  windy: '有风的',
}));

const extraWordCn = new Map(Object.entries({
  abroad: '到国外',
  actor: '男演员',
  actress: '女演员',
  advice: '建议',
  afford: '买得起',
  airport: '机场',
  already: '已经',
  amused: '觉得好笑的',
  anyone: '任何人',
  anything: '任何事物',
  Australia: '澳大利亚',
  beard: '胡子',
  beautiful: '漂亮的',
  beer: '啤酒',
  believe: '相信',
  beside: '在旁边',
  better: '更好',
  bought: '买了',
  called: '喊/打电话',
  careful: '小心的',
  certainly: '当然',
  change: '零钱/找开',
  charge: '罚款/收费',
  city: '城市',
  compact: '粉盒',
  Conrad: '康拉德',
  counter: '柜台',
  counted: '数了',
  curiously: '好奇地',
  daughter: '女儿',
  decided: '决定了',
  deposit: '订金',
  dictionaries: '词典',
  driving: '驾驶',
  dry: '干的',
  Egypt: '埃及',
  embarrassed: '尴尬的',
  engineer: '工程师',
  everywhere: '到处',
  excited: '兴奋的',
  expensive: '昂贵的',
  famous: '著名的',
  fares: '车费',
  fifth: '第五',
  film: '电影',
  finished: '完成了',
  football: '足球',
  fourth: '第四',
  future: '未来的',
  garden: '花园',
  gentleman: '先生',
  guess: '猜',
  holidays: '假期',
  hotel: '旅馆',
  husband: '丈夫',
  invited: '邀请了',
  Karen: '卡伦',
  licence: '执照',
  litter: '垃圾',
  London: '伦敦',
  Marsh: '马什',
  millionaire: '百万富翁',
  mink: '貂皮',
  nuisance: '讨厌的事',
  officer: '警官',
  opposite: '在对面',
  overseas: '海外的',
  parrot: '鹦鹉',
  passengers: '乘客',
  pleasant: '令人愉快的',
  policeman: '警察',
  prosecuted: '被起诉',
  quick: '快的',
  race: '比赛',
  recognize: '认出',
  Reeves: '里夫斯',
  refrigerators: '冰箱',
  reporter: '记者',
  reporters: '记者们',
  rubbish: '垃圾',
  sensational: '轰动的',
  sign: '牌子',
  slowly: '慢慢地',
  speed: '速度',
  station: '车站',
  surprise: '惊喜',
  swallowed: '吞下',
  thieves: '小偷',
  torch: '手电筒',
  tyres: '轮胎',
  ugly: '难看的',
  visitors: '游客',
  waving: '挥手',
  woods: '树林',
  world: '世界',
}));

const nce1WordCn = new Map(Object.entries({
  absent: '缺席的/不在的',
  afternoon: '下午',
  air: '空气/空中',
  along: '沿着',
  another: '另一个/再一个',
  answer: '回答/答案',
  answered: '回答了',
  anywhere: '任何地方',
  appointment: '约会/预约',
  arrive: '到达',
  ask: '问/请求',
  autumn: '秋天',
  away: '离开/在远处',
  awful: '糟糕的/可怕的',
  baby: '婴儿',
  badly: '严重地/糟糕地',
  bag: '包/袋子',
  bath: '洗澡/浴缸',
  beauty: '美人/美丽',
  because: '因为',
  before: '在之前',
  beg: '请求/乞求',
  began: 'begin 的过去式，开始',
  belong: '属于',
  best: '最好的',
  between: '在两者之间',
  biscuit: '饼干',
  book: '书',
  both: '两者都',
  boy: '男孩',
  breakfast: '早餐',
  brought: 'bring 的过去式，带来',
  brown: '棕色的',
  busy: '忙的',
  "butcher's": '肉店',
  call: '打电话/叫',
  came: 'come 的过去式，来了',
  card: '卡片/明信片',
  case: '箱子/情况',
  cat: '猫',
  catch: '接住/赶上',
  chair: '椅子',
  cheaper: '更便宜的',
  cheer: '欢呼/振作',
  chocolate: '巧克力',
  cigarette: '香烟',
  cinema: '电影院',
  "clock's": 'clock is 的缩写，钟表是',
  conversation: '谈话',
  cost: '花费/价钱为',
  "couldn't": 'could not 的缩写，不能/不会',
  country: '国家/乡下',
  crash: '碰撞/撞车',
  crowd: '人群',
  cup: '杯子',
  dark: '黑暗的',
  dear: '亲爱的/昂贵的',
  decide: '决定',
  dentist: '牙医',
  describe: '描述',
  dictionary: '词典',
  difficult: '困难的',
  dinner: '晚餐',
  dinnner: '晚餐',
  dog: '狗',
  door: '门',
  dream: '梦/做梦',
  drink: '喝/饮料',
  drive: '驾驶/开车',
  drop: '掉下/落下',
  drove: 'drive 的过去式，驾驶',
  each: '每个',
  early: '早的/早地',
  easy: '容易的',
  eat: '吃',
  eh: '啊/嗯，表示疑问或确认',
  eight: '八',
  eighteen: '十八',
  eighty: '八十',
  either: '也，用于否定句/二者之一',
  electric: '电的',
  eleven: '十一',
  else: '别的/其他的',
  end: '结尾/结束',
  enjoy: '享受/喜欢',
  enough: '足够的/足够地',
  ever: '曾经',
  "everyone's": 'everyone is 的缩写，大家都',
  exam: '考试',
  extra: '额外的',
  face: '脸/面对',
  family: '家庭',
  fashion: '时尚/流行',
  father: '父亲',
  favourite: '最喜欢的',
  feel: '感觉',
  fell: 'fall 的过去式，落下/摔倒',
  felt: 'feel 的过去式，感觉',
  few: '少数几个',
  fifteen: '十五',
  fifty: '五十',
  find: '找到',
  finish: '完成/结束',
  first: '第一的/首先',
  five: '五',
  flew: 'fly 的过去式，飞',
  floor: '地板/楼层',
  fly: '飞',
  food: '食物',
  foot: '脚/英尺',
  forgot: 'forget 的过去式，忘记',
  forty: '四十',
  'forty-one': '四十一',
  found: 'find 的过去式，找到',
  four: '四',
  'four-year-old': '四岁的',
  fourteen: '十四',
  friend: '朋友',
  front: '前面',
  full: '满的/饱的',
  funny: '滑稽的/有趣的',
  garage: '车库/修车厂',
  "george's": 'George 的所有格，乔治的',
  girl: '女孩',
  give: '给',
  given: 'give 的过去分词，给了',
  gone: 'go 的过去分词，去了/离开了',
  green: '绿色的',
  "greengroce's": '蔬菜水果店',
  "greengrocer's": '蔬菜水果店',
  grew: 'grow 的过去式，生长/变得',
  "grocer's": '杂货店',
  guy: '家伙/人',
  half: '一半',
  hand: '手',
  handle: '把手/处理',
  hard: '努力的/困难的/硬的',
  hat: '帽子',
  "hat's": 'hat is 的缩写，帽子是',
  hate: '讨厌',
  "he'll": 'he will 的缩写，他将会',
  hear: '听见',
  heard: 'hear 的过去式，听见',
  help: '帮助',
  herself: '她自己',
  holiday: '假期',
  hope: '希望',
  hour: '小时',
  hurt: '受伤/弄疼',
  idea: '主意/想法',
  ill: '生病的',
  impossible: '不可能的',
  instead: '代替/反而',
  intelligent: '聪明的',
  introduce: '介绍',
  "it'll": 'it will 的缩写，它将会',
  jam: '果酱/堵塞',
  "jill's": 'Jill 的所有格，吉尔的',
  "jimmy's": 'Jimmy 的所有格，吉米的',
  job: '工作/职业',
  keep: '保持/保留',
  key: '钥匙/关键',
  kindly: '和蔼地/友好地',
  knock: '敲',
  label: '标签',
  lady: '女士',
  'lamp-post': '路灯柱',
  larger: '更大的',
  largest: '最大的',
  latest: '最新的/最晚的',
  least: '最少的',
  leave: '离开/留下',
  lemonade: '柠檬水',
  light: '灯/光/轻的',
  like: '喜欢/像',
  limit: '限制/限度',
  line: '线路/线',
  list: '清单',
  live: '住/生活',
  loaf: '一条面包',
  lost: 'lose 的过去式/过去分词，丢失',
  lot: '许多/大量',
  low: '低的',
  lucky: '幸运的',
  m: '米/字母 m',
  madam: '夫人/女士',
  many: '许多',
  mark: '分数/标记',
  meat: '肉',
  member: '成员',
  met: 'meet 的过去式，遇见',
  middle: '中间',
  'middle-age': '中年的',
  might: '可能/也许',
  mind: '介意/头脑',
  mine: '我的',
  minute: '分钟/片刻',
  model: '型号/模型',
  "model's": 'model is 的缩写，型号是',
  moment: '片刻',
  month: '月',
  most: '最/大多数',
  mother: '母亲',
  "mother's": 'mother 的所有格，母亲的',
  mouth: '嘴',
  move: '移动/搬家',
  must: '必须/一定',
  "mustn't": 'must not 的缩写，不许',
  myself: '我自己',
  name: '名字',
  "name's": 'name is 的缩写，名字是',
  nearly: '几乎/差不多',
  neighbour: '邻居',
  never: '从不',
  'next-door': '隔壁的',
  night: '夜晚',
  nine: '九',
  nineteen: '十九',
  noise: '噪音',
  none: '没有一个',
  noon: '中午',
  note: '便条/笔记',
  number: '号码/数字',
  nurse: '护士',
  "o'clock": '点钟',
  off: '离开/脱离',
  office: '办公室',
  often: '经常',
  old: '老的/旧的',
  once: '一次/曾经',
  only: '只/仅仅',
  other: '其他的',
  over: '在上方/越过/结束',
  overtook: 'overtake 的过去式，超过',
  p: '便士/字母 p',
  pair: '一双/一对',
  paper: '纸',
  party: '聚会/一行人',
  past: '过了/过去的',
  "pauline's": 'Pauline 的所有格，波琳的',
  pay: '支付',
  pence: '便士，penny 的复数',
  penny: '便士/彭妮',
  person: '人',
  phone: '打电话/电话',
  phrase: '短语',
  phrasebook: '常用语手册',
  piece: '一片/一块',
  pilot: '飞行员',
  pity: '遗憾/可惜',
  platform: '站台/平台',
  pleasantly: '愉快地',
  plenty: '大量/充足',
  pocket: '口袋',
  poor: '可怜的/贫穷的',
  pound: '英镑/磅',
  powder: '粉',
  present: '礼物/现在的/出席的',
  prettier: '更漂亮的',
  price: '价格',
  problem: '问题',
  quarter: '四分之一',
  quickly: '迅速地',
  quiet: '安静的',
  ran: 'run 的过去式，跑',
  read: '读',
  ready: '准备好的',
  really: '真正地/确实',
  remain: '保持/留下',
  remember: '记得',
  repair: '修理',
  report: '报告/报道',
  rest: '休息/其余部分',
  restaurant: '餐馆',
  retire: '退休',
  return: '返回/归还',
  rich: '富有的',
  roast: '烤的/烤',
  room: '房间',
  "room's": 'room is 的缩写，房间是',
  round: '圆的/绕着',
  rusty: '生锈的',
  sad: '伤心的',
  sale: '出售/销售',
  "sam's": 'Sam 的所有格，萨姆的',
  same: '相同的',
  sat: 'sit 的过去式，坐',
  say: '说',
  sea: '海',
  seen: 'see 的过去分词，看见',
  sell: '卖',
  serve: '服务/接待',
  seven: '七',
  seventy: '七十',
  shave: '刮脸/剃',
  ship: '船',
  shop: '商店',
  show: '展示/给……看',
  since: '自从/既然',
  sister: '姐妹',
  six: '六',
  sixteen: '十六',
  sixth: '第六',
  size: '尺码/大小',
  sky: '天空',
  sleep: '睡觉',
  slow: '慢的',
  smaller: '更小的',
  "smith's": 'Smith 的所有格，史密斯的',
  smoke: '抽烟/烟',
  soap: '肥皂',
  sold: 'sell 的过去式/过去分词，卖了',
  someone: '某人',
  soon: '很快',
  speak: '说话/讲',
  spell: '拼写',
  spend: '花费/度过',
  spoke: 'speak 的过去式，说',
  spot: '斑点/地点',
  stand: '站立',
  stay: '停留/待',
  steak: '牛排',
  stop: '停止/车站',
  story: '故事',
  subject: '科目/主题',
  suit: '适合',
  suitcase: '手提箱',
  summer: '夏天',
  sun: '太阳',
  sweep: '扫',
  take: '拿/带走/乘坐',
  telephone: '电话',
  temperature: '温度',
  ten: '十',
  'ten-pound': '十英镑的',
  terribly: '非常/糟糕地',
  th: '序数词后缀',
  "they'll": 'they will 的缩写，他们/它们将会',
  third: '第三',
  thirty: '三十',
  thought: 'think 的过去式，想/认为',
  three: '三',
  throw: '扔',
  tidy: '整洁的/整理',
  till: '直到',
  "tim's": 'Tim 的所有格，蒂姆的',
  tin: '罐头/罐',
  together: '一起',
  toilet: '厕所',
  told: 'tell 的过去式，告诉',
  "tommy's": 'Tommy 的所有格，汤米的',
  tomorrow: '明天',
  tongue: '舌头',
  tonight: '今晚',
  took: 'take 的过去式，拿/带走',
  toothache: '牙痛',
  top: '顶部',
  tourist: '游客',
  track: '跑道/轨道',
  train: '火车',
  travel: '旅行',
  tree: '树',
  trip: '旅行',
  true: '真实的/正确的',
  truth: '事实/真相',
  try: '尝试',
  twelve: '十二',
  twenty: '二十',
  'twenty-nine': '二十九',
  two: '二',
  type: '打字/类型',
  uncomfortable: '不舒服的',
  under: '在下面',
  understand: '理解',
  urgent: '紧急的',
  usually: '通常',
  valley: '山谷',
  voice: '嗓音/声音',
  wait: '等待',
  wall: '墙',
  "wasn't": 'was not 的缩写，不是/没有',
  watch: '看/手表',
  water: '水/浇水',
  way: '路/方式',
  "we'll": 'we will 的缩写，我们将会',
  "we've": 'we have 的缩写，我们已经/我们有',
  wear: '穿/戴',
  weekend: '周末',
  "weren't": 'were not 的缩写，不是/没有',
  whisky: '威士忌',
  win: '赢',
  wine: '葡萄酒',
  winner: '获胜者',
  winter: '冬天',
  woman: '女人',
  women: '女人们',
  wonder: '想知道/感到惊讶',
  word: '单词',
  worth: '值……钱/值得',
  write: '写',
  wrong: '错误的',
  wrote: 'write 的过去式，写',
  yesterday: '昨天',
  "you'd": 'you would/had 的缩写，你会/你已经',
  "you'll": 'you will 的缩写，你将会',
  "you've": 'you have 的缩写，你已经/你有',
  young: '年轻的',
  yourself: '你自己',
  zip: '拉链',
}));

const extraPhraseCn = new Map(Object.entries({
  'a famous actress': '著名女演员',
  'a long time ago': '很久以前',
  'a lot of money': '很多钱',
  'a mink coat': '貂皮大衣',
  'a pleasant surprise': '令人愉快的惊喜',
  'a race track': '赛车场',
  'at least': '至少',
  'at home': '在家',
  'at school': '在上学',
  'be careful': '小心',
  'by air': '乘飞机',
  'by sea': '乘船',
  'by train': '乘火车',
  'can afford': '买得起',
  'can have': '可以喝/可以有',
  'can recognize': '能认出',
  'come in': '进来',
  'depends on': '取决于',
  'do the football pools': '下足球彩票',
  'driving licence': '驾驶执照',
  'for a long time': '很长时间',
  'get married': '结婚',
  'get off': '下车',
  'go abroad': '出国',
  'go back to sleep': '回去睡觉',
  'have a look': '看一看',
  'have tea': '喝茶',
  'have to': '不得不',
  'in the end': '最后',
  'instead of': '代替',
  'look after': '照看',
  'look at': '看',
  'look out of': '向外看',
  'make another film': '再拍一部电影',
  'make up my mind': '拿定主意',
  'make up her face': '化妆',
  'more than': '超过',
  'not more than': '不超过',
  'of course': '当然',
  'on instalments': '分期付款',
  'pay a deposit': '付订金',
  'phone me': '给我打电话',
  'put away': '收起来',
  'right away': '立刻',
  'slow down': '慢下来',
  'speed limit': '限速',
  'take my advice': '听我的建议',
  'tell the truth': '说实话',
  'this time': '这一次',
  'turn on': '打开',
  'water the garden': '给花园浇水',
}));

function cleanForRules(line) {
  return normalizeLine(line)
    .replace(/\s+([?!.,])/g, '$1')
    .replace(/\s+/g, ' ');
}

function contentWords(line) {
  const stop = new Set([
    'a', 'an', 'and', 'are', 'am', 'be', 'been', 'but', 'do', 'does', 'did', 'for',
    'have', 'has', 'had', 'he', 'her', 'him', 'his', 'i', 'in', 'is', 'it', 'me',
    'my', 'of', 'on', 'or', 'our', 'she', 'that', 'the', 'their', 'them', 'they',
    'this', 'to', 'was', 'we', 'were', 'with', 'you', 'your',
  ]);
  return tokenize(line)
    .map((token) => wordKey(token))
    .filter((key) => key && !stop.has(key))
    .slice(0, 5);
}

function patternNoteFor(line) {
  const clean = cleanForRules(line);
  if (/\bmust be\b/i.test(clean)) return 'must be 一定是/表示强推测';
  if (/\bcan't be\b/i.test(clean)) return "can't be 不可能是/表示否定推测";
  if (/\bmust have been\b/i.test(clean)) return 'must have been 一定曾经/对过去的强推测';
  if (/\bcan'?t have been\b/i.test(clean)) return "can't have been 不可能曾经/对过去的否定推测";
  if (/\bwould have to\b/i.test(clean)) return 'would have to 将不得不/转述中的将来义务';
  if (/\bgoing to\b/i.test(clean)) return 'be going to 打算/将要';
  if (/\blook after\b/i.test(clean)) return 'look after 照看';
  if (/\bmake up\b/i.test(clean)) return 'make up 化妆/组成/编造，按语境判断';
  if (/\bwho|which|that\b/i.test(clean)) return 'who/which/that 引导定语从句';
  const focus = contentWords(clean).join('； ');
  return focus ? `${focus} 本句关键词` : '短句/省略句，结合上下文理解';
}

function subjectCn(subject) {
  const key = subject.toLowerCase().replace(/[.?!,]/g, '').trim();
  const map = new Map(Object.entries({
    i: '我',
    "i'm": '我',
    it: '它',
    "it's": '它',
    this: '这',
    that: '那',
    these: '这些',
    those: '那些',
    they: '他们/它们',
    "they're": '他们/它们',
    we: '我们',
    "we're": '我们',
    he: '他',
    "he's": '他',
    she: '她',
    "she's": '她',
    tim: '蒂姆',
    sally: '萨莉',
    sam: '萨姆',
    penny: '彭妮',
    george: '乔治',
    pamela: '帕梅拉',
    bob: '鲍勃',
    'mr jones': '琼斯先生',
    'mrs sawyer': '索耶夫人',
    'mr sawyer': '索耶先生',
    'their father': '他们的父亲',
    'the children': '孩子们',
    'the sun': '太阳',
    'the kettle': '水壶',
    'the boss': '老板',
    'the sawyers': '索耶一家',
    'mrs jones': '琼斯夫人',
    'mrs smith': '史密斯夫人',
    'the refrigerator': '冰箱',
    'the cooker': '炉子',
    'the bottle': '瓶子',
    'the cup': '杯子',
    'the television': '电视机',
    'the armchairs': '扶手椅',
    'the stereo': '立体声音响',
    'the pictures': '图画',
    'the ship': '船',
    'the aeroplane': '飞机',
    'the village': '村庄',
    'the park': '公园',
    'the days': '白天',
    'the nights': '夜晚',
  }));
  return map.get(key) ?? subject.replace(/\.$/, '');
}

function objectCn(text) {
  let value = text.toLowerCase().replace(/[.?!,]/g, '').trim();
  const direct = new Map(Object.entries({
    it: '它',
    them: '他们/它们',
    me: '我',
    you: '你',
    her: '她',
    him: '他',
    'her lunch': '午饭',
    'at noon': '在中午',
    'at night': '在夜里',
    'every day': '每天',
    'on foot': '步行',
    'by car': '乘汽车',
    'to school': '去学校',
    'to work': '去上班',
    'from school': '从学校',
    'from work': '下班',
  }));
  if (direct.has(value)) return direct.get(value);
  value = value.replace(/\bthe\b/g, '').replace(/\ba\b/g, '').replace(/\ban\b/g, '').replace(/\bsome\b/g, '一些').trim();
  if (direct.has(value)) return direct.get(value);
  if (value.includes('her lunch')) return value.includes('noon') ? '在中午吃午饭' : '午饭';
  if (value.includes('home from school')) return '从学校回家';
  if (value.includes('home from work')) return '下班回家';
  if (value.includes('home early')) return '很早到家';
  if (value.includes('home late')) return '很晚到家';
  if (value.includes('at night')) return '在夜里';
  if (value.includes('every day')) return `${objectCn(value.replace('every day', '').trim())}每天`;
  for (const [en, cn] of phraseCn) {
    if (value.includes(en)) return value.includes('一些') ? `一些${cn}` : cn;
  }
  for (const [en, cn] of adjectiveCn) {
    if (value === en) return cn;
  }
  return text.replace(/[.?!,]/g, '').trim();
}

function readableChineseFallback(line) {
  const clean = cleanForRules(line);
  const lower = clean.toLowerCase();
  if (/\?$/.test(clean)) return '这是一个问句，用来询问信息或确认对方的判断。';
  if (/!$/.test(clean)) return '这是一个感叹/强调句，表达惊讶、提醒或强烈语气。';
  if (/\bmust be\b/i.test(clean)) return '这里表示“必定是/一定是”的强推测。';
  if (/\bcan't be\b/i.test(clean)) return '这里表示“不可能是”的否定推测。';
  if (/\b(can|could|may|might|must|should|will|would)\b/i.test(clean)) return '本句用情态动词表达判断、可能、能力、意愿或义务。';
  if (/\b(said|told|asked|thought|wondered|knew|remembered)\b/i.test(clean)) return '本句在转述说话、想法、提问或记忆内容。';
  if (/^if\b|\b if \b/i.test(clean)) return '本句说明条件和结果。';
  if (/\b(who|which|that)\b/i.test(clean)) return '本句含定语从句，用后半部分修饰前面的名词。';
  if (/\b(was|were|did|went|came|saw|found|bought|took|told|said|asked|invited|decided|happened|dropped|looked|put|tried|swallowed|phoned|answered|climbed|entered|heard|ran|turned|recognized|grew|shaved|counted)\b/i.test(clean)) return '本句叙述过去发生的动作或状态。';
  if (lower.length <= 20) return '短句/省略句，需要结合上下文理解。';
  return '本句按主语、动词和补足信息理解。';
}

function translateByRule(line) {
  const clean = cleanForRules(line);
  const lower = clean.toLowerCase();

  const directLate = new Map(Object.entries({
    'That must be Conrad Reeves.': '那一定是康拉德・里夫斯。',
    'Conrad Reeves, the actor?': '康拉德・里夫斯，那个男演员吗？',
    "It can't be.": '不可能是他。',
    'Can you recognize that woman, Liz?': '你能认出那个女人吗，莉兹？',
    'I think I can, Kate.': '我想我能认出来，凯特。',
    'It must be Karen Marsh, the actress.': '那一定是女演员卡伦・马什。',
    'I thought so.': '我也这么想。',
    "Who's that beside her?": '她旁边那个人是谁？',
    'Let me have another look.': '让我再看一眼。',
    "I think you're right!": '我想你是对的！',
    "Isn't he her third husband?": '他不是她的第三任丈夫吗？',
    'He must be her fourth or fifth.': '他一定是她的第四任或第五任丈夫。',
    "Doesn't Karen Marsh look old!": '卡伦・马什看起来真老啊！',
    "She does, doesn't she!": '她确实是，不是吗！',
    "I read she's twenty-nine, but she must be at least forty.": '我看到她说自己二十九岁，但她一定至少四十岁了。',
    "I'm sure she is.": '我肯定她是。',
    'She was a famous actress when I was still at school.': '我还在上学的时候，她就是著名演员了。',
    "That was a long time ago, wasn't it?": '那是很久以前的事了，不是吗？',
    'Not that long ago!': '没那么久！',
    "I'm not more than twenty-nine myself.": '我自己也不过二十九岁。',
    'You must have been driving at seventy miles an hour.': '你刚才一定是以每小时七十英里的速度在开车。',
    "I can't have been.": '我不可能开那么快。',
    "I must have been dreaming.": '我刚才一定是在做梦/走神。',
    "That's why I didn't see the sign.": '所以我才没看见那个标志。',
    "But you'd better not do it again!": '不过你最好别再这样了！',
    'We may go abroad.': '我们可能出国。',
    "I'm not sure.": '我不确定。',
    "I'd like to go there, too.": '我也想去那里。',
    "We can't make up our minds.": '我们拿不定主意。',
    'We may travel by sea.': '我们可能坐船旅行。',
    'We might not go anywhere.': '我们可能哪儿也不去。',
    'In the end, we stay at home and look after everything!': '最后，我们待在家里照看一切！',
    "I'm going to retire.": '我打算退休。',
    'I feel very tired.': '我感到很累。',
    'I wonder why!': '我真想知道为什么！',
    'I may.': '我可能会。',
    "I can't make up my mind.": '我拿不定主意。',
    'I will have to ask my future husband.': '我得问问我未来的丈夫。',
    "We're going to get married next week.": '我们下周要结婚。',
    "That's sensational news, isn't it, Kate?": '这可是轰动的新闻，不是吗，凯特？',
    'It certainly is.': '当然是。',
    "He'll be her sixth husband!": '他将会是她的第六任丈夫！',
    "I'm sure we'll win something this week.": '我肯定我们这周会赢点什么。',
    'I want to see the world.': '我想去看看世界。',
    'All right.': '好吧。',
    "It's a pleasant dream but everything depends on 'if' !": '这是个美好的梦，可一切都取决于“如果”！',
    'Yes, speaking.': '是的，我就是。',
    'I do not know what you are talking about.': '我不知道你在说什么。',
    "I don't know what you're talking about.": '我不知道你在说什么。',
    "That's right.": '没错。',
    "No, I don't.": '不，我不是/不，我没有。',
    'I decided to take her by train.': '我决定带她坐火车去。',
    'Sally did not answer, but looked at her curiously.': '萨莉没有回答，只是好奇地看着她。',
    "'To make myself beautiful,' the lady answered.": '那位女士回答说：“为了把自己打扮漂亮。”',
    "'But you are still ugly,' Sally said.": '萨莉说：“可是你还是很难看。”',
    'Sally was amused, but I was very embarrassed!': '萨莉觉得很好笑，可我却非常尴尬！',
    'It is a famous beauty spot.': '这是一个著名的风景胜地。',
    'Last Wednesday, I went for a walk in the woods.': '上星期三，我去树林里散步。',
    'What I saw made me very sad.': '我看到的东西让我很难过。',
    'I counted seven old cars and three old refrigerators.': '我数了七辆旧汽车和三台旧冰箱。',
  }));
  if (directLate.has(clean)) return directLate.get(clean);

  let match = clean.match(/^She always eats her lunch at noon\.$/i);
  if (match) return '她总是在中午吃午饭。';

  match = clean.match(/^There is (?:a |an )?(.+?) in the (.+)\.$/i);
  if (match) return `${objectCn(match[1])}在${objectCn(match[2])}里。`;

  match = clean.match(/^There is (?:a |an )?(.+?) on the (.+)\.$/i);
  if (match) return `${objectCn(match[1])}在${objectCn(match[2])}上。`;

  match = clean.match(/^There are some (.+?) (?:in|on) the (.+)\.$/i);
  if (match) return `有一些${objectCn(match[1])}在${objectCn(match[2])}${lower.includes(' on ') ? '上' : '里'}。`;

  match = clean.match(/^(.+?) is on the (right|left)\.$/i);
  if (match) return `${subjectCn(match[1])}在${match[2].toLowerCase() === 'right' ? '右边' : '左边'}。`;

  match = clean.match(/^(.+?) is (?:in|on|near|under|behind|beside|between|with) (.+)\.$/i);
  if (match) {
    const prep = lower.match(/\b(in|on|near|under|behind|beside|between|with)\b/)?.[1];
    const prepCn = { in: '在', on: '在', near: '在附近', under: '在下面', behind: '在后面', beside: '在旁边', between: '在之间', with: '和在一起' }[prep] ?? '在';
    return `${subjectCn(match[1])}${prepCn}${objectCn(match[2])}${prep === 'on' ? '上' : ''}。`;
  }

  match = clean.match(/^(.+?) (?:is|are|'s|'re) (.+?)ing (.+)\.$/i);
  if (match) return `${subjectCn(match[1])}正在${objectCn(`${match[2]}ing`)} ${objectCn(match[3])}。`;

  match = clean.match(/^(.+?) (?:is|are|'s|'re) (.+)\.$/i);
  if (match) return `${subjectCn(match[1])}是/很${objectCn(match[2])}。`;

  match = clean.match(/^(.+?) must be (.+)\.$/i);
  if (match) return `${subjectCn(match[1])}一定是${objectCn(match[2])}。`;

  match = clean.match(/^(.+?) can't be (.+)\.$/i);
  if (match) return `${subjectCn(match[1])}不可能是${objectCn(match[2])}。`;

  match = clean.match(/^(.+?) wants? (.+?) to (.+)\.$/i);
  if (match) return `${subjectCn(match[1])}想让${objectCn(match[2])}${objectCn(match[3])}。`;

  match = clean.match(/^(.+?) wants? to (.+)\.$/i);
  if (match) return `${subjectCn(match[1])}想要${objectCn(match[2])}。`;

  match = clean.match(/^(.+?) needs? (.+)\.$/i);
  if (match) return `${subjectCn(match[1])}需要${objectCn(match[2])}。`;

  match = clean.match(/^(.+?) told (.+?) (.+)\.$/i);
  if (match) return `${subjectCn(match[1])}告诉${objectCn(match[2])}：${objectCn(match[3])}。`;

  match = clean.match(/^(.+?) said (.+)\.$/i);
  if (match) return `${subjectCn(match[1])}说${objectCn(match[2])}。`;

  match = clean.match(/^(.+?) asked\.$/i);
  if (match) return `${subjectCn(match[1])}问道。`;

  match = clean.match(/^(.+?) asked (.+)\.$/i);
  if (match) return `${subjectCn(match[1])}问${objectCn(match[2])}。`;

  match = clean.match(/^What are you going to do/i);
  if (match) return '你打算做什么？';

  match = clean.match(/^I(?:'m| am) going to (.+)\.$/i);
  if (match) return `我打算${objectCn(match[1])}。`;

  match = clean.match(/^What colour are you going to paint it\?$/i);
  if (match) return '你打算把它漆成什么颜色？';

  match = clean.match(/^Can you (.+)\?$/i);
  if (match) return `你能${objectCn(match[1])}吗？`;

  match = clean.match(/^Do you (.+)\?$/i);
  if (match) return `你${objectCn(match[1])}吗？`;

  match = clean.match(/^I don't (.+)\.$/i);
  if (match) return `我不${objectCn(match[1])}。`;

  match = clean.match(/^I like (.+)\.$/i);
  if (match) return `我喜欢${objectCn(match[1])}。`;

  match = clean.match(/^I want (.+?)(?:, please)?\.$/i);
  if (match) return `我想要${objectCn(match[1])}。`;

  match = clean.match(/^I only have (.+)\.$/i);
  if (match) return `我只有${objectCn(match[1])}。`;

  match = clean.match(/^(In the morning|In the afternoon|In the evening|At night),? (.+)\.$/i);
  if (match) {
    const time = {
      'in the morning': '早上',
      'in the afternoon': '下午',
      'in the evening': '晚上',
      'at night': '夜里',
    }[match[1].toLowerCase()];
    return `${time}，${translateByRule(`${match[2]}.`).replace(/。$/, '')}。`;
  }

  match = clean.match(/^(.+?) (goes|go) to work and (.+?) (goes|go) to school\.$/i);
  if (match) return `${subjectCn(match[1])}去上班，${subjectCn(match[3])}去上学。`;

  match = clean.match(/^(.+?) (?:is|are|'s|'re) (.+?)ing (.+?) and (.+?)ing (.+)\.$/i);
  if (match) return `${subjectCn(match[1])}正在${objectCn(`${match[2]}ing`)} ${objectCn(match[3])}，并且正在${objectCn(`${match[4]}ing`)} ${objectCn(match[5])}。`;

  match = clean.match(/^(.+?) (live|lives) at (.+)\.$/i);
  if (match) return `${subjectCn(match[1])}住在${match[3]}。`;

  match = clean.match(/^(.+?) (go|goes) to (.+?)(?: by (.+)| on (.+))? every day[,.]?$/i);
  if (match) {
    const by = match[4] ? `，每天乘${objectCn(match[4])}` : match[5] ? `，每天${objectCn(`on ${match[5]}`)}` : '，每天';
    return `${subjectCn(match[1])}${by}去${objectCn(match[3])}。`;
  }

  match = clean.match(/^(.+?) (?:is|are|'s|'re) going to (.+?)(?: on (.+)| in (.+))?\.$/i);
  if (match) {
    const place = match[3] ? objectCn(match[3]) : '';
    const extra = match[4] ? `，在${objectCn(match[4])}上/用${objectCn(match[4])}` : match[5] ? `，在${objectCn(match[5])}里` : '';
    return `${subjectCn(match[1])}正要去/打算去${place}${extra}。`;
  }

  match = clean.match(/^(.+?) (?:is|are|'s|'re) not (.+?)ing (.+)\.$/i);
  if (match) return `${subjectCn(match[1])}没有正在${objectCn(`${match[2]}ing`)} ${objectCn(match[3])}。`;

  match = clean.match(/^(.+?) (?:is|are|'s|'re) (.+?)ing (.+)\.$/i);
  if (match) return `${subjectCn(match[1])}正在${objectCn(`${match[2]}ing`)} ${objectCn(match[3])}。`;

  match = clean.match(/^(.+?) (take|takes) (.+?) to (.+?) every day\.$/i);
  if (match) return `${subjectCn(match[1])}每天带${objectCn(match[3])}去${objectCn(match[4])}。`;

  match = clean.match(/^(.+?) (stay|stays) at home(?: (.+))?\.$/i);
  if (match) return `${subjectCn(match[1])}${match[3] ? objectCn(match[3]) : ''}待在家里。`;

  match = clean.match(/^(.+?) (do|does) the (.+)\.$/i);
  if (match) return `${subjectCn(match[1])}做${objectCn(match[3])}。`;

  match = clean.match(/^(.+?) (always|usually|often|sometimes)? ?(eat|eats|drink|drinks|read|reads|watch|watches|see|sees|arrive|arrives|come|comes|go|goes|like|likes) (.+)\.$/i);
  if (match) {
    const freq = { always: '总是', usually: '通常', often: '经常', sometimes: '有时' }[(match[2] ?? '').toLowerCase()] ?? '';
    const verb = {
      eat: '吃', eats: '吃', drink: '喝', drinks: '喝', read: '读', reads: '读', watch: '看',
      watches: '看', see: '见', sees: '见', arrive: '到达', arrives: '到达', come: '回到/来到',
      comes: '回到/来到', go: '去', goes: '去', like: '喜欢', likes: '喜欢',
    }[match[3].toLowerCase()];
    return `${subjectCn(match[1])}${freq}${verb}${objectCn(match[4])}。`;
  }

  match = clean.match(/^The sun (shine|shines|rise|rises|set|sets) (.+)\.$/i);
  if (match) {
    const verb = { shine: '照耀', shines: '照耀', rise: '升起', rises: '升起', set: '落下', sets: '落下' }[match[1].toLowerCase()];
    return `太阳${objectCn(match[2])}${verb}。`;
  }

  match = clean.match(/^It (rain|rains|snow|snows) (.+)\.$/i);
  if (match) {
    const verb = match[1].toLowerCase().startsWith('rain') ? '下雨' : '下雪';
    return `${objectCn(match[2])}${verb}。`;
  }

  match = clean.match(/^Give me (.+?)(?: please)?[,.]?/i);
  if (match) return `请给我${objectCn(match[1])}。`;

  match = clean.match(/^Put (.+?) (.+)\.$/i);
  if (match) return `把${objectCn(match[1])}放${objectCn(match[2])}。`;

  match = clean.match(/^Don't (.+)!?$/i);
  if (match) return `不要${objectCn(match[1])}。`;

  match = clean.match(/^(.+?), isn't it\?$/i);
  if (match) return `${objectCn(match[1])}，不是吗？`;

  match = clean.match(/^(.+?), aren't you\?$/i);
  if (match) return `${objectCn(match[1])}，不是吗？`;

  match = clean.match(/^(.+?), don't you\?$/i);
  if (match) return `${objectCn(match[1])}，不是吗？`;

  if (/^Here/.test(clean)) return '给你/在这里。';
  if (/^Thanks?/.test(clean)) return '谢谢。';
  if (/^Yes/.test(clean)) return '是的。';
  if (/^No/.test(clean)) return '不。';
  if (/^Look/.test(clean)) return '看！';

  return readableChineseFallback(clean);
}

function safeTranslation(line) {
  return translateLine(line);
}

function translateLine(line) {
  const clean = cleanForRules(line);
  if (translationCache[clean]) return translationCache[clean];

  let translated = null;
  try {
    const output = execFileSync('curl', [
      '-sS',
      '--max-time',
      '12',
      '--get',
      'https://translate.googleapis.com/translate_a/single',
      '--data-urlencode',
      'client=gtx',
      '--data-urlencode',
      'sl=en',
      '--data-urlencode',
      'tl=zh-CN',
      '--data-urlencode',
      'dt=t',
      '--data-urlencode',
      `q=${clean}`,
    ], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const data = JSON.parse(output);
    translated = data?.[0]?.map((part) => part?.[0] ?? '').join('').trim();
  } catch {
    translated = null;
  }

  if (!translated) translated = translations.get(clean) ?? translateByRule(clean);
  translationCache[clean] = translated;
  fs.writeFileSync(translationCacheFile, JSON.stringify(translationCache, null, 2));
  return translated;
}

function preloadTranslations(lessons) {
  const lines = [...new Set(lessons.flatMap((lesson) => lesson.lines).map(cleanForRules))]
    .filter((line) => line && !translationCache[line]);
  if (lines.length === 0) return;

  console.log(`translating ${lines.length} uncached NCE1 lines`);
  lines.forEach((line, index) => {
    translateLine(line);
    if ((index + 1) % 25 === 0 || index + 1 === lines.length) {
      console.log(`translated ${index + 1}/${lines.length}`);
    }
  });
}

function parseLrc(file) {
  const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
  const title = content.match(/^\[ti:(.+?)\]/m)?.[1] ?? file.replace(/\.lrc$/, '');
  const timedLines = content
    .split(/\r?\n/)
    .map((raw) => {
      const match = raw.match(/^\[(\d{2}):(\d{2})\.(\d{2})\](.*)$/);
      if (!match) return null;
      return {
        time: Number(match[1]) * 60 + Number(match[2]) + Number(match[3]) / 100,
        text: normalizeLine(match[4]),
      };
    })
    .filter((entry) => entry && entry.text && !entry.text.startsWith('['));
  const lines = timedLines.map((entry) => entry.text);
  const promptIndex = lines.findIndex((line) => /^Listen to the tape/i.test(line));
  const lessonLine = lines.find((line) => /^Lesson \d+/i.test(line)) ?? file.match(/^\d+/)?.[0] ?? '';
  const lessonNumbers = file.match(/^(\d{3})&(\d{3})/)?.slice(1).map(Number) ?? [];
  const textEntries = promptIndex >= 0
    ? timedLines.slice(promptIndex + 2)
    : timedLines.filter((entry) => !/^Lesson \d+/i.test(entry.text) && entry.text !== title);
  return {
    file,
    title,
    lessonLine,
    lessonNumbers,
    audioFile: file.replace(/\.lrc$/, '.mp3'),
    lines: textEntries.map((entry) => entry.text),
    subtitles: textEntries.map((entry, index) => ({
      index: index + 1,
      start: entry.time,
      end: textEntries[index + 1]?.time ?? entry.time + 4,
      text: entry.text,
    })),
  };
}

function renderHtml(lesson) {
  const title = `NCE1 Lessons ${lesson.lessonNumbers.join('-')} - ${lesson.title}`;
  const cards = lesson.lines.map((line, index) => {
    const ipa = ipaForLine(line);
    const cn = safeTranslation(line);
    return `    <article class="sentence-card" id="sentence-${index + 1}">
      <div class="sentence-head"><button class="sentence-play" type="button" data-sentence="${index + 1}" aria-label="Play sentence ${index + 1}">▶</button><button class="sentence-toggle" type="button" data-sentence="${index + 1}" aria-label="Pause or resume sentence ${index + 1}">Ⅱ</button><span class="sentence-num">${index + 1}</span><p class="en-text">${highlightEnglish(line)}</p></div>
      <div class="field ipa"><span>美音发音</span><p>${highlightIpa(ipa)}</p></div>
      <div class="field liaison"><span>连读分析</span><p>${escapeHtml(liaisonFor(line, ipa)).replace(/`([^`]+)`/g, '<code>$1</code>')}</p></div>
      <div class="field structure"><span>结构</span><p>${escapeHtml(structureFor(line))}</p></div>
      <div class="field tense"><span>时态</span><p>${escapeHtml(tenseFor(line))}</p></div>
      <div class="field cn"><span>中</span><p>${escapeHtml(cn)}</p></div>
      <div class="field words"><span>词</span><p>${escapeHtml(wordsFor(line))}</p></div>
    </article>`;
  }).join('\n');

  const toc = lesson.lines.map((_, index) => `      <a href="#sentence-${index + 1}">${index + 1}</a>`).join('\n');
  const subtitleJson = JSON.stringify(lesson.subtitles);
  const audioSrc = `../${lesson.audioFile}`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { margin: 0; padding-bottom: 116px; font-family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif; color: #1f2937; background: #f3f4f6; line-height: 1.65; }
    .page-header { background: #111827; color: #fff; padding: 28px 18px 24px; border-bottom: 4px solid #2563eb; }
    .page-header .inner, main { width: min(1080px, calc(100% - 32px)); margin: 0 auto; }
    .eyebrow { margin: 0 0 6px; color: #93c5fd; font-size: 13px; letter-spacing: 0; text-transform: uppercase; font-weight: 700; }
    h1 { margin: 0; font-size: clamp(26px, 4vw, 42px); line-height: 1.18; letter-spacing: 0; }
    .meta { margin: 10px 0 0; color: #d1d5db; font-size: 14px; }
    main { padding: 22px 0 40px; }
    .pron-note { margin: 0 0 18px; padding: 12px 14px; background: #f8fafc; border: 1px solid #dbeafe; border-left: 4px solid #0f766e; border-radius: 8px; color: #334155; font-size: 14px; }
    .pron-note strong { color: #0f766e; }
    .toc { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 18px; padding: 14px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05); }
    .toc a { color: #1d4ed8; text-decoration: none; font-size: 13px; padding: 4px 8px; border: 1px solid #bfdbfe; border-radius: 6px; background: #eff6ff; }
    .sentence-card { background: #fff; border: 1px solid #e5e7eb; border-left: 5px solid #2563eb; border-radius: 8px; padding: 16px 18px; margin: 14px 0; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08); }
    .sentence-head { display: grid; grid-template-columns: 34px 34px 38px 1fr; gap: 12px; align-items: start; margin-bottom: 12px; }
    .sentence-play, .sentence-toggle { display: inline-flex; width: 34px; height: 34px; align-items: center; justify-content: center; border: 0; border-radius: 50%; color: #fff; background: #0f766e; font-weight: 800; font-size: 13px; line-height: 1; cursor: pointer; box-shadow: 0 2px 8px rgba(15, 118, 110, 0.28); }
    .sentence-play:hover, .sentence-play:focus-visible { background: #115e59; outline: 3px solid rgba(15, 118, 110, 0.2); }
    .sentence-toggle { background: #2563eb; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.24); }
    .sentence-toggle:hover, .sentence-toggle:focus-visible { background: #1d4ed8; outline: 3px solid rgba(37, 99, 235, 0.2); }
    .sentence-card.is-active { border-left-color: #0f766e; background: #f0fdfa; }
    .sentence-num { display: inline-flex; width: 34px; height: 34px; align-items: center; justify-content: center; border-radius: 50%; color: #fff; background: #2563eb; font-weight: 700; font-size: 14px; line-height: 1; flex: 0 0 auto; }
    .en-text { margin: 0; color: #111827; font-size: 18px; font-weight: 700; line-height: 1.45; }
    .field { display: grid; grid-template-columns: 76px 1fr; gap: 10px; padding: 9px 0; border-top: 1px solid #f1f5f9; }
    .field span { color: #4b5563; font-size: 13px; font-weight: 700; white-space: nowrap; }
    .field p { margin: 0; color: #374151; font-size: 15px; }
    .ipa p { color: #0f766e; font-family: "Charis SIL", "Doulos SIL", "Times New Roman", serif; font-size: 16px; }
    .linking { color: #15803d; font-weight: 700; }
    .weak { color: #92400e; font-weight: 700; }
    .weak.linking { color: #92400e; text-decoration: underline; text-decoration-color: #15803d; text-decoration-thickness: 2px; text-underline-offset: 3px; }
    .structure p { color: #1e3a8a; }
    .cn p { color: #7c2d12; font-weight: 600; }
    .words p { color: #581c87; }
    .summary-section { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 18px; margin: 16px 0; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08); }
    .summary-section h2 { margin: 0 0 10px; color: #111827; font-size: 21px; line-height: 1.3; }
    .summary-section p { margin: 8px 0; color: #374151; }
    code { color: #0f766e; background: #ecfdf5; border: 1px solid #ccfbf1; border-radius: 4px; padding: 1px 4px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.92em; }
    .back-top, .back-prev { position: fixed; right: 16px; bottom: 132px; z-index: 30; color: #fff; background: #111827; text-decoration: none; border-radius: 8px; padding: 8px 10px; font-size: 13px; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.2); }
    .back-prev { bottom: 178px; }
    .audio-dock { position: fixed; left: 0; right: 0; bottom: 0; z-index: 20; border-top: 1px solid #1f2937; background: rgba(17, 24, 39, 0.96); color: #fff; box-shadow: 0 -10px 30px rgba(15, 23, 42, 0.25); backdrop-filter: blur(10px); }
    .audio-dock .inner { width: min(1080px, calc(100% - 24px)); margin: 0 auto; padding: 10px 0 12px; }
    .player-row { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; }
    .player-btn { display: inline-flex; width: 40px; height: 40px; align-items: center; justify-content: center; border: 0; border-radius: 50%; color: #111827; background: #93c5fd; font-size: 15px; font-weight: 800; cursor: pointer; }
    .player-btn:hover, .player-btn:focus-visible { background: #bfdbfe; outline: 3px solid rgba(147, 197, 253, 0.28); }
    .progress-wrap { display: grid; gap: 5px; min-width: 0; }
    .subtitle-line { min-height: 22px; color: #f8fafc; font-size: 15px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .progress-line { display: grid; grid-template-columns: auto 1fr auto; gap: 8px; align-items: center; color: #cbd5e1; font-size: 12px; }
    .progress-track { position: relative; height: 8px; overflow: hidden; border-radius: 999px; background: #334155; cursor: pointer; }
    .progress-fill { position: absolute; inset: 0 auto 0 0; width: 0%; border-radius: inherit; background: #22c55e; }
    .dock-title { color: #cbd5e1; font-size: 12px; white-space: nowrap; }
    @media (max-width: 640px) { body { padding-bottom: 132px; } .page-header .inner, main { width: min(100% - 20px, 1080px); } .sentence-card, .summary-section { padding: 14px; } .sentence-head { grid-template-columns: 30px 30px 30px 1fr; gap: 8px; } .sentence-play, .sentence-toggle, .sentence-num { width: 30px; height: 30px; } .en-text { font-size: 16px; } .field { grid-template-columns: 1fr; gap: 2px; } .back-top, .back-prev { right: 10px; bottom: 140px; min-width: 40px; min-height: 40px; display: inline-flex; align-items: center; justify-content: center; padding: 8px; } .back-prev { bottom: 186px; } .player-row { grid-template-columns: auto 1fr; } .dock-title { display: none; } .subtitle-line { white-space: normal; line-height: 1.3; } }
  </style>
</head>
<body id="top">
  <header class="page-header">
    <div class="inner">
      <p class="eyebrow">New Concept English 1</p>
      <h1>${escapeHtml(title)}</h1>
      <p class="meta">Generated from ${escapeHtml(lesson.file)}</p>
    </div>
  </header>
  <main>
    <p class="pron-note"><strong>发音说明:</strong> 美音发音以 macOS Dictionary 的 AmE 单词读音为基础，并保留句子里的 connected speech：连读、弱读和美式闪音。</p>
    <nav class="toc" aria-label="Sentence navigation">
${toc}
    </nav>
${cards}
    <section class="summary-section">
      <h2>词汇总结</h2>
      <p>本页重点是 NCE1 初级口语：问候、介绍、身份、物品归属、国籍、职业和状态表达。</p>
      <p>高频词包括 this/that/these、my/your/our/their、am/is/are、not、too、please、thank you。</p>
    </section>
    <section class="summary-section">
      <h2>句型总结</h2>
      <p>每句已标明五大句型归类：主谓(SV)、主谓宾(SVO)、主系表(SVC)、主谓双宾(SVOO)、主谓宾补(SVOC)；省略句和 there be 句单独说明。</p>
      <p><code>This is...</code>、<code>Are you...?</code>、<code>What are/is...?</code> 是本册初段最常见的主系表句型；祈使句通常省略主语 <code>you</code>。</p>
    </section>
    <section class="summary-section">
      <h2>时态总结</h2>
      <p>主要使用一般现在时，重点不是复杂时态，而是 be 动词 am/is/are 与主语的一致。</p>
    </section>
    <section class="summary-section">
      <h2>本课连读注意点</h2>
      <p>短句也要弱读功能词：<code>to</code> /tə/、<code>and</code> /ən/、<code>a/an</code> /ə, ən/、<code>are</code> /ɑr/。</p>
      <p>遇到 <code>it is</code>、<code>that is</code>、<code>here is</code> 这类组合时，可以自然连起来读。</p>
    </section>
  </main>
  <a class="back-prev" href="index.html" onclick="goPreviousPage(event)" aria-label="Return to previous page">Back</a>
  <a class="back-top" href="#top">Top</a>
  <div class="audio-dock" role="region" aria-label="Lesson audio player">
    <div class="inner">
      <div class="player-row">
        <button class="player-btn" type="button" id="dock-play" aria-label="Play or pause">▶</button>
        <div class="progress-wrap">
          <div class="subtitle-line" id="dock-subtitle">点击句子开头的播放按钮，从当前句开始播放。</div>
          <div class="progress-line">
            <span id="dock-current">0:00</span>
            <div class="progress-track" id="dock-track"><div class="progress-fill" id="dock-fill"></div></div>
            <span id="dock-duration">0:00</span>
          </div>
        </div>
        <div class="dock-title">${escapeHtml(lesson.title)}</div>
      </div>
      <audio id="lesson-audio" preload="auto" src="${escapeHtml(audioSrc)}"></audio>
    </div>
  </div>
  <script>
    const RETURN_KEY = "nceReturnTarget";

    function safeSessionGet(key) {
      try {
        return window.sessionStorage.getItem(key);
      } catch {
        return null;
      }
    }

    function safeSessionRemove(key) {
      try {
        window.sessionStorage.removeItem(key);
      } catch {}
    }

    function goPreviousPage(event) {
      const target = safeSessionGet(RETURN_KEY);
      if (target) {
        event.preventDefault();
        safeSessionRemove(RETURN_KEY);
        window.location.href = target;
        return;
      }
      if (document.referrer && new URL(document.referrer).origin === window.location.origin) {
        event.preventDefault();
        window.history.back();
      }
    }

    const subtitles = ${subtitleJson};
    const audio = document.getElementById("lesson-audio");
    const dockPlay = document.getElementById("dock-play");
    const subtitleEl = document.getElementById("dock-subtitle");
    const currentEl = document.getElementById("dock-current");
    const durationEl = document.getElementById("dock-duration");
    const trackEl = document.getElementById("dock-track");
    const fillEl = document.getElementById("dock-fill");
    const sentenceCards = Array.from(document.querySelectorAll(".sentence-card"));
    const sentenceToggleButtons = Array.from(document.querySelectorAll(".sentence-toggle"));

    function formatTime(value) {
      if (!Number.isFinite(value)) return "0:00";
      const minutes = Math.floor(value / 60);
      const seconds = Math.floor(value % 60).toString().padStart(2, "0");
      return minutes + ":" + seconds;
    }

    function activeSubtitle(time) {
      return subtitles.find((item) => time >= item.start && time < item.end) ?? subtitles[subtitles.length - 1];
    }

    function setActiveSentence(item) {
      sentenceCards.forEach((card) => card.classList.toggle("is-active", card.id === "sentence-" + item?.index));
      if (item) subtitleEl.textContent = item.text;
    }

    function updateProgress(time) {
      const duration = audio.duration || subtitles[subtitles.length - 1]?.end || 0;
      currentEl.textContent = formatTime(time);
      durationEl.textContent = formatTime(duration);
      fillEl.style.width = duration ? Math.min(100, (time / duration) * 100) + "%" : "0%";
      const item = activeSubtitle(time);
      if (item) setActiveSentence(item);
    }

    function seekTo(time) {
      audio.currentTime = time;
      updateProgress(time);
    }

    function whenAudioReady(callback) {
      if (audio.readyState >= 2) {
        callback();
        return;
      }
      let done = false;
      const runOnce = () => {
        if (done) return;
        done = true;
        callback();
      };
      audio.addEventListener("canplay", runOnce, { once: true });
      audio.addEventListener("loadedmetadata", runOnce, { once: true });
    }

    function playFrom(index) {
      const item = subtitles.find((entry) => entry.index === index);
      if (!item) return;
      setActiveSentence(item);
      whenAudioReady(() => {
        seekTo(item.start);
        audio.play().catch(() => {});
      });
    }

    function isTimeInSentence(item) {
      const time = audio.currentTime;
      return item && time >= item.start && time < item.end;
    }

    function refreshSentenceToggleButtons() {
      const current = activeSubtitle(audio.currentTime);
      sentenceToggleButtons.forEach((button) => {
        const isCurrent = current && Number(button.dataset.sentence) === current.index;
        const isPause = isCurrent && !audio.paused;
        button.textContent = isPause ? "Ⅱ" : "▶";
        button.setAttribute("aria-label", (isPause ? "Pause" : "Resume") + " sentence " + button.dataset.sentence);
      });
    }

    function toggleSentence(index) {
      const item = subtitles.find((entry) => entry.index === index);
      if (!item) return;
      if (!audio.paused && isTimeInSentence(item)) {
        audio.pause();
        refreshSentenceToggleButtons();
        return;
      }
      if (audio.paused && isTimeInSentence(item)) {
        setActiveSentence(item);
        audio.play().catch(() => {});
        return;
      }
      setActiveSentence(item);
      whenAudioReady(() => {
        seekTo(item.start);
        audio.play().catch(() => {});
      });
    }

    document.querySelectorAll(".sentence-play").forEach((button) => {
      button.addEventListener("click", () => playFrom(Number(button.dataset.sentence)));
    });

    sentenceToggleButtons.forEach((button) => {
      button.addEventListener("click", () => toggleSentence(Number(button.dataset.sentence)));
    });

    dockPlay.addEventListener("click", () => {
      if (audio.paused) audio.play();
      else audio.pause();
    });

    audio.addEventListener("play", () => {
      dockPlay.textContent = "Ⅱ";
      refreshSentenceToggleButtons();
    });

    audio.addEventListener("pause", () => {
      dockPlay.textContent = "▶";
      refreshSentenceToggleButtons();
    });

    audio.addEventListener("loadedmetadata", () => {
      durationEl.textContent = formatTime(audio.duration);
    });

    audio.addEventListener("timeupdate", () => {
      updateProgress(audio.currentTime);
      refreshSentenceToggleButtons();
    });

    trackEl.addEventListener("click", (event) => {
      const rect = trackEl.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      const duration = audio.duration || subtitles[subtitles.length - 1]?.end || 0;
      audio.currentTime = ratio * duration;
      updateProgress(audio.currentTime);
    });

  </script>
</body>
</html>
`;
}

const lessons = targetFiles.map(parseLrc);
preloadTranslations(lessons);

let written = 0;
for (const lesson of lessons) {
  const outName = lesson.file.replace(/\.lrc$/, '.analysis.html');
  fs.writeFileSync(path.join(outDir, outName), renderHtml(lesson));
  written += 1;
}

console.log(`generated ${written} NCE1 HTML files in ${path.relative(root, outDir)}`);
