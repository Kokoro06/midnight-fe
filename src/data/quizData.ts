export type OptionBinary = 'A' | 'B'

export type ResultKey =
  | 'solo-emotion-poetic'
  | 'solo-emotion-intense'
  | 'solo-mystery-poetic'
  | 'solo-mystery-intense'
  | 'social-emotion-poetic'
  | 'social-emotion-intense'
  | 'social-mystery-poetic'
  | 'social-mystery-intense'

type QuizAxis = 'solo_social' | 'emotion_mystery' | 'poetic_intense'

export interface QuizOption {
  type: OptionBinary
  text: string
}

export interface QuizQuestion {
  step: number
  text: string
  options: [QuizOption, QuizOption]
  axis: QuizAxis
  footnote?: string
}

export const QUESTIONS: QuizQuestion[] = [
  {
    step: 1,
    text: '深夜十二點，你還醒著。這個時候，你最想做的事是？',
    axis: 'solo_social',
    options: [
      { type: 'A', text: '一個人窩著，把這幾天沒消化完的心情好好想清楚' },
      { type: 'B', text: '有人坐在你旁邊，電影結束後還有人可以說話。' },
    ],
  },
  {
    step: 2,
    text: '週末下午，朋友問你要不要一起去看電影。你心裡第一個念頭是？',
    axis: 'solo_social',
    options: [
      { type: 'A', text: '其實我本來想自己看，一個人才能好好沉進去' },
      { type: 'B', text: '好啊，看完可以一起聊，才有意思' },
    ],
    footnote: '＊直覺選就好，不需要想太久。',
  },
  {
    step: 3,
    text: '你打開串流平台，滑了很久卻選不出來。這時候讓你按下播放的，通常是什麼？',
    axis: 'solo_social',
    options: [
      { type: 'A', text: '封面看起來很有情緒感，或是簡介裡有「失去」「告別」這種字' },
      { type: 'B', text: '評論說「結局很燒腦」，或是有人說看完整個人都不對勁了' },
    ],
  },
  {
    step: 4,
    text: '通勤途中，你在聽歌。突然一首曲子讓你眼眶有點熱，你會怎麼做？',
    axis: 'poetic_intense',
    options: [
      { type: 'A', text: '單曲循環，讓自己繼續待在那個感覺裡' },
      { type: 'B', text: '去查這首歌的歌詞在說什麼、為什麼這麼寫' },
    ],
  },
  {
    step: 5,
    text: '看完一部電影，你覺得「這部真的不錯」。你說的「不錯」，通常是指？',
    axis: 'emotion_mystery',
    options: [
      { type: 'A', text: '有一個畫面或台詞卡在心裡，說不清楚但就是很有感覺' },
      { type: 'B', text: '前面埋的線索最後全部接起來了，越想越有意思' },
    ],
  },
  {
    step: 6,
    text: '一部電影讓你很不舒服，看完久久沒辦法說話。你之後回想起這部片的感覺是？',
    axis: 'emotion_mystery',
    options: [
      { type: 'A', text: '慶幸自己看了，這種「被戳到」的感覺很難得' },
      { type: 'B', text: '有點後悔，下次不想再這麼沉重了' },
    ],
  },
  {
    step: 7,
    text: '朋友問你「想看什麼感覺的片」，你最常回的是？',
    axis: 'emotion_mystery',
    options: [
      { type: 'A', text: '「有點淡淡的就好，像散文那種，不用太戲劇化' },
      { type: 'B', text: '我想要那種看完會喘不過氣的，越緊張越好' },
    ],
    footnote: '＊最後兩題，快到了。',
  },
  {
    step: 8,
    text: '你最近的狀態，比較接近哪一句？',
    axis: 'poetic_intense',
    options: [
      { type: 'A', text: '想安靜地跟自己在一起，不需要太多刺激' },
      { type: 'B', text: '有點悶，想被什麼東西用力撞一下，感覺自己還活著' },
    ],
  },
]

// Q1–3 → axis1, Q4–6 → axis2, Q7–8 → axis3
// axis3 tiebreak (1A/1B) defaults to 'poetic'
export function computeResult(answers: OptionBinary[]): ResultKey {
  const a1 = answers.slice(0, 3).filter((a) => a === 'A').length
  const a2 = answers.slice(3, 6).filter((a) => a === 'A').length
  const a3 = answers.slice(6, 8).filter((a) => a === 'A').length

  const axis1 = a1 >= 2 ? 'solo' : 'social'
  const axis2 = a2 >= 2 ? 'emotion' : 'mystery'
  const axis3 = a3 >= 1 ? 'poetic' : 'intense'

  return `${axis1}-${axis2}-${axis3}` as ResultKey
}

export interface Companion {
  key: ResultKey
  name: string
  reason: string
}

export interface CharacterData {
  title: string
  sub: string
  text: string
  analysis: string
  tags: string[]
  desc: string
  compatible: [Companion, Companion]
  regular: [Companion, Companion]
}

export const CHARACTERS: Record<ResultKey, CharacterData> = {
  'solo-emotion-poetic': {
    title: '深夜燈塔者',
    sub: '你在最安靜的角落，替那些無法言說的情感，找到形狀。',
    text: '你習慣獨自進入一部電影，把觀影當成一種私密的儀式。你在意角色的情緒有沒有被好好說完，喜歡那種輕聲細語卻讓你鼻酸的故事。你的節奏是緩慢的，但你從電影裡帶走的東西，往往比任何人都要重。',
    analysis: '你的觀影人格裡有一種罕見的專注力——你願意在一個鏡頭裡停留夠久，讓它對你說話。你不需要別人告訴你這部片好不好，你自己知道什麼擊中了你。獨自觀影對你來說不是孤獨，而是一種自由。',
    tags: ['有點寂寞', '需要被療癒', '文藝', '想念那時候'],
    desc: '適合你的是那種溫柔卻不幼稚的文藝片，從「有點寂寞／需要被療癒／想念那時候」這幾個標籤開始逛，很快就會找到今晚想要的氛圍。',
    compatible: [
      { key: 'social-emotion-poetic', name: '療癒放映師', reason: '你們都活在情緒和詩意裡，她只是喜歡有人陪著一起感受。' },
      { key: 'solo-mystery-poetic', name: '廢墟考古家', reason: '你們都習慣獨自沉入電影，步調一致，只是方向不同。' },
    ],
    regular: [
      { key: 'social-emotion-intense', name: '情緒縱火犯', reason: '她和你一樣在意情緒，但她的強度和音量可能讓你有點吃不消。' },
      { key: 'social-mystery-poetic', name: '線索共謀者', reason: '她想拉你一起追線索，但你更想靜靜感受。' },
    ],
  },

  'solo-emotion-intense': {
    title: '暗室捕夢人',
    sub: '你用最私密的眼睛，獵捕那些只有獨自觀看才能看見的瞬間。',
    text: '你喜歡一個人看，因為你不想在情緒爆發的那一刻被人看見。你被強烈的故事吸引，不怕被影像衝擊，反而享受那種被情緒撞到的感覺。你的觀影體驗是私密而激烈的——一個人，扛著很多。',
    analysis: '你有一種吸收強度的能力，別人覺得太重、太難受的電影，你往往能把它轉化成養分。你是那種看完一部沉重的片，腦海裡還會反覆重播的人。你的感受很深，只是你選擇一個人消化。',
    tags: ['好想哭', '很有壓迫感', '世界毀了也無所謂'],
    desc: '找一部別人看了說「太沉重了」的電影，然後一個人扛著走出來。從「好想哭／很有壓迫感／世界毀了也無所謂」開始找，你不會失望。',
    compatible: [
      { key: 'social-emotion-intense', name: '情緒縱火犯', reason: '你們都被強烈情緒驅動，她只是更想把這份燃燒分給別人。' },
      { key: 'solo-mystery-intense', name: '燒腦追光者', reason: '你們都愛獨自扛高強度的東西，她只是更執著於解謎那條線。' },
    ],
    regular: [
      { key: 'social-emotion-poetic', name: '療癒放映師', reason: '你們都在意情緒，但她的溫柔節奏可能讓你有點坐不住。' },
      { key: 'solo-mystery-poetic', name: '廢墟考古家', reason: '你們都喜歡獨自深潛，但她的步調讓你覺得太慢、太輕。' },
    ],
  },

  'solo-mystery-poetic': {
    title: '廢墟考古家',
    sub: '你在廢棄的線索堆裡，慢慢拼出一幅連導演都沒說清楚的地圖。',
    text: '你喜歡一個人看、然後一個人思考。你被那些需要慢慢解開的謎題吸引，喜歡鏡頭語言、細節、符號，甚至道具的擺放都不放過。你不急，因為你知道答案藏在最慢的那一格畫面裡。',
    analysis: '你有一種偵探式的觀看方式，但包裝在非常安靜的外殼裡。你不是那種緊張追劇的人，你是在一片霧裡慢慢辨認形狀的人。看完一部好片，你可能還要想三天。',
    tags: ['懸疑', '文藝', '越燒越好', '經典'],
    desc: '找一部需要你慢慢消化、看完要再想幾天的電影。從「懸疑／文藝／越燒越好／經典」開始，那裡有很多值得你細細翻找的寶藏。',
    compatible: [
      { key: 'social-mystery-poetic', name: '線索共謀者', reason: '你們都在追謎題，她只是更喜歡拉個人一起解。' },
      { key: 'solo-emotion-poetic', name: '深夜燈塔者', reason: '你們都享受緩慢、獨自的觀影節奏，她追的是情緒，你追的是謎題。' },
    ],
    regular: [
      { key: 'social-emotion-poetic', name: '療癒放映師', reason: '你們步調相近，但她要聊情緒，你要繼續在腦子裡拼圖。' },
      { key: 'social-mystery-intense', name: '邪典探險家', reason: '她也愛追謎，但她那種爆炸節奏讓你有點亂。' },
    ],
  },

  'solo-mystery-intense': {
    title: '燒腦追光者',
    sub: '你習慣在故事深處，追那一道最後才出現的光。',
    text: '你喜歡一個人看，因為你不想被人打斷那條你正在追的線索。你享受反轉、伏筆與細節，節奏要快，讓你沒空分心。你是那種看完電影還要去找結局解析的人——不是因為看不懂，而是因為想看更多。',
    analysis: '你的觀影方式像一個獨自作業的偵探，你在追那條線，而且你一定要追到底。你有很強的注意力和解讀能力，可以在第一個小時就察覺到後半段的走向，但你還是願意被結局顛覆。那種「被反將一軍」的感覺，才是你愛電影的原因。',
    tags: ['懸疑', '科幻', '犯罪', '越燒越好'],
    desc: '找一部需要你全程專心的電影，然後帶著一點後勁回到現實。從「懸疑／科幻／犯罪／越燒越好」開始，很難踩到雷。',
    compatible: [
      { key: 'social-mystery-intense', name: '邪典探險家', reason: '你們都追謎、都愛高強度，她只是更喜歡多拉一個人一起瘋。' },
      { key: 'solo-emotion-intense', name: '暗室捕夢人', reason: '你們都愛獨自扛強烈的東西，她只是更在意情緒那條線。' },
    ],
    regular: [
      { key: 'social-mystery-poetic', name: '線索共謀者', reason: '你們都在追謎，但她需要討論，你只想一個人燒。' },
      { key: 'social-emotion-intense', name: '情緒縱火犯', reason: '她的強度和你差不多，但你追的是謎，她追的是感受。' },
    ],
  },

  'social-emotion-poetic': {
    title: '療癒放映師',
    sub: '你擅長在黑暗裡，替別人開一盞小燈。',
    text: '你看電影最喜歡和人一起，因為你想分享那份被觸動的感受。你在意角色的情緒有沒有說完，故事有沒有好好收尾。你喜歡那種不急著說完、卻在心裡慢慢發酵的故事。看完電影，你總是有很多話想說。',
    analysis: '你的觀影超能力是共感——你能在別人還沒哭的時候就先濕了眼眶，而且你很想幫身邊的人解讀那個情緒。你是片單推薦力最強的那種朋友，因為你知道對的電影能替別人說出他們說不出口的話。',
    tags: ['暖暖的就好', '需要被療癒', '想談戀愛', '心動的感覺'],
    desc: '找一部可以和重要的人一起看、看完還要聊很久的電影。從「暖暖的就好／需要被療癒／想談戀愛」這幾個標籤開始，很容易挖到今晚你想要的那種溫柔。',
    compatible: [
      { key: 'solo-emotion-poetic', name: '深夜燈塔者', reason: '你們都愛情緒和詩意，她只是更喜歡一個人靜靜感受。' },
      { key: 'social-mystery-poetic', name: '線索共謀者', reason: '你們都習慣找人一起看，她追線索你追情緒，意外合拍。' },
    ],
    regular: [
      { key: 'social-mystery-intense', name: '邪典探險家', reason: '她和你一樣熱愛找人一起看，但她的片單可能讓你有點招架不住。' },
      { key: 'solo-mystery-poetic', name: '廢墟考古家', reason: '你們步調相近，但你想聊情緒，她只想繼續在腦子裡拼圖。' },
    ],
  },

  'social-emotion-intense': {
    title: '情緒縱火犯',
    sub: '你把電影當成情緒的點火裝置，然後把火分給身邊的人。',
    text: '你喜歡和人一起看、一起被撞擊。你被強烈的情感故事吸引，喜歡那種快到讓你來不及呼吸、卻又全部都是人性的劇情。你看電影的方式像在坐雲霄飛車——不是你一個人坐，是把整個包廂的人一起拉進去。',
    analysis: '你是那種看到精彩場面會立刻抓住旁邊的人說「你有沒有看到！」的人。你的情緒反應很直接，你不掩飾被電影燃燒的感覺，而且你享受讓別人也一起燃燒。你是電影院裡感染力最強的那個人。',
    tags: ['想哭一場', '想愛又怕受傷', '社會', '驚悚'],
    desc: '找一部讓你整個人都燃起來的電影，然後拉著最能接受你情緒強度的人一起看。從「想哭一場／想愛又怕受傷／社會」開始挑，你不會找不到。',
    compatible: [
      { key: 'social-mystery-intense', name: '邪典探險家', reason: '你們都愛一起看強烈的東西，你追感受她追怪謎，火力相當。' },
      { key: 'solo-emotion-intense', name: '暗室捕夢人', reason: '她和你一樣被強烈情緒驅動，只是她選擇一個人消化。' },
    ],
    regular: [
      { key: 'social-mystery-poetic', name: '線索共謀者', reason: '你們都愛找人一起看，但她太冷靜分析，你太燃，節奏對不上。' },
      { key: 'solo-emotion-poetic', name: '深夜燈塔者', reason: '她也在意情緒，但她需要安靜，而你很難不出聲。' },
    ],
  },

  'social-mystery-poetic': {
    title: '線索共謀者',
    sub: '你喜歡和別人一起挖掘，因為謎題解開的那一刻，你想有人分享。',
    text: '你喜歡和人一起看懸疑片，然後在電影進行中就開始小聲交換線索。你不是那種追求刺激的觀眾，你更享受那種慢慢拼圖、彼此對比直覺的過程。你看電影像在做小組推理——答對了一起得意，答錯了一起懊惱。',
    analysis: '你有很強的協作式觀影本能，你喜歡別人的解讀，因為它讓你看見你沒看見的角度。你不是那種「我早就猜到了」的人，你更愛「等等，你說的這個讓我重新想一遍」。你讓一起看電影這件事變得更有趣。',
    tags: ['懸疑', '越燒越好', '犯罪', '文藝'],
    desc: '找一部可以和朋友一起追線索的電影，然後規定自己不能滑手機。從「懸疑／越燒越好／犯罪」這幾個標籤開始，很容易找到適合你們今晚的謎題。',
    compatible: [
      { key: 'social-mystery-intense', name: '邪典探險家', reason: '你們都愛一起追謎，她的節奏更爆炸，剛好補足你的冷靜。' },
      { key: 'social-emotion-poetic', name: '療癒放映師', reason: '你們都習慣找人一起看，她追情緒你追線索，反而互相激發。' },
    ],
    regular: [
      { key: 'solo-emotion-poetic', name: '深夜燈塔者', reason: '你們步調都慢，但她更喜歡獨自感受，少了你想要的討論伴。' },
      { key: 'solo-mystery-intense', name: '燒腦追光者', reason: '你們都在追謎，但她太習慣自己消化，你有話想說沒人接。' },
    ],
  },

  'social-mystery-intense': {
    title: '邪典探險家',
    sub: '你喜歡在銀幕邊緣，發現別人不敢看的風景，然後拉著朋友一起看。',
    text: '你被大膽又有點怪的作品吸引，享受和導演一起「瘋」的感覺。你不怕尷尬、不怕獵奇，反而期待被作品狠狠驚嚇或逗笑。而且你要有人陪——你想在那個最荒謬的瞬間，確認旁邊有人和你一起瞪大眼睛。',
    analysis: '你是電影圈最珍貴的邊緣引路人。你記得的不是爛番茄幾分，而是哪部片有一幕讓你笑到噴出來或驚到跳起來。你的推薦清單很長、很雜、很難預測，但接受過你推薦的人，幾乎都會謝謝你。',
    tags: ['想看點怪的', '這世界很荒謬', '驚悚', '經典'],
    desc: '今晚不如選一部你朋友可能會看不下去、但你會愛到不行的怪片。從「想看點怪的／這世界很荒謬／經典」標籤點進去，很容易挖到你喜歡的寶。',
    compatible: [
      { key: 'social-emotion-intense', name: '情緒縱火犯', reason: '你們都愛一起看強烈的東西，她追感受你追怪謎，彼此點火。' },
      { key: 'solo-mystery-intense', name: '燒腦追光者', reason: '你們都追謎、都愛高強度，她只是更喜歡自己一個人燒。' },
    ],
    regular: [
      { key: 'social-emotion-poetic', name: '療癒放映師', reason: '她和你一樣愛找人一起看，但你的片單可能讓她有點吃不消。' },
      { key: 'solo-mystery-poetic', name: '廢墟考古家', reason: '你們都在追謎，但她的節奏讓你覺得太慢，你想快點看到爆炸。' },
    ],
  },
}
