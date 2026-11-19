(function attachWordData(root, factory) {
  const data = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = data;
  } else {
    root.WORD_DATA = data;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createWordData() {
  const raw = [
    // 通用高频核心词
    ["hello", "你好", "👋", "日常核心", "Hello, my name is Mia.", "你好，我叫米娅。"],
    ["goodbye", "再见", "🙋", "日常核心", "Goodbye, see you tomorrow!", "再见，明天见！"],
    ["please", "请", "🙏", "日常核心", "Please open the window.", "请打开窗户。"],
    ["thanks", "谢谢", "💛", "日常核心", "Thanks for your help.", "谢谢你的帮助。"],
    ["yes", "是；对", "✅", "日常核心", "Yes, I can swim.", "是的，我会游泳。"],
    ["no", "不；不是", "❌", "日常核心", "No, I do not want a snack.", "不，我不想要点心。"],
    ["and", "和；并且", "➕", "日常核心", "I like apples and bananas.", "我喜欢苹果和香蕉。"],
    ["but", "但是", "🔄", "日常核心", "The bag is small but useful.", "这个包很小但很有用。"],
    ["because", "因为", "💡", "日常核心", "I am happy because the sun is out.", "我很开心，因为太阳出来了。"],
    ["where", "哪里", "🧭", "日常核心", "Where is the blue pencil?", "蓝色铅笔在哪里？"],
    ["what", "什么", "❓", "日常核心", "What is in the box?", "盒子里有什么？"],
    ["who", "谁", "👤", "日常核心", "Who is your best friend?", "谁是你最好的朋友？"],
    ["when", "什么时候", "⏰", "日常核心", "When does the movie begin?", "电影什么时候开始？"],
    ["why", "为什么", "🤔", "日常核心", "Why is the baby laughing?", "宝宝为什么在笑？"],
    ["how", "怎样", "🧩", "日常核心", "How do you spell your name?", "你的名字怎么拼？"],
    ["many", "许多", "🔢", "日常核心", "There are many flowers here.", "这里有许多花。"],
    ["some", "一些", "🍬", "日常核心", "Would you like some water?", "你想喝一些水吗？"],
    ["here", "这里", "📍", "日常核心", "Your shoes are here.", "你的鞋在这里。"],
    ["there", "那里", "🗺️", "日常核心", "Look! A bird is over there.", "看！那里有一只鸟。"],
    ["together", "一起", "🤝", "日常核心", "We clean the classroom together.", "我们一起打扫教室。"],

    // 人物与家庭
    ["mother", "妈妈", "👩", "人物与家庭", "My mother reads with me.", "我妈妈陪我读书。"],
    ["father", "爸爸", "👨", "人物与家庭", "My father makes breakfast.", "我爸爸做早餐。"],
    ["sister", "姐妹", "👧", "人物与家庭", "My sister likes to sing.", "我姐姐喜欢唱歌。"],
    ["brother", "兄弟", "👦", "人物与家庭", "My brother plays football.", "我哥哥踢足球。"],
    ["grandmother", "奶奶；外婆", "👵", "人物与家庭", "My grandmother tells funny stories.", "我奶奶讲有趣的故事。"],
    ["grandfather", "爷爷；外公", "👴", "人物与家庭", "My grandfather waters the flowers.", "我爷爷给花浇水。"],
    ["friend", "朋友", "🧑‍🤝‍🧑", "人物与家庭", "My friend sits next to me.", "我的朋友坐在我旁边。"],
    ["teacher", "老师", "🧑‍🏫", "人物与家庭", "Our teacher is kind.", "我们的老师很友善。"],
    ["doctor", "医生", "🧑‍⚕️", "人物与家庭", "The doctor checks my heart.", "医生检查我的心脏。"],
    ["baby", "婴儿", "👶", "人物与家庭", "The baby is sleeping.", "宝宝正在睡觉。"],

    // 身体与健康
    ["head", "头", "🙂", "身体与健康", "Nod your head.", "点点头。"],
    ["eye", "眼睛", "👁️", "身体与健康", "Close your eyes and count to ten.", "闭上眼睛数到十。"],
    ["ear", "耳朵", "👂", "身体与健康", "I hear the bird with my ear.", "我用耳朵听见鸟叫。"],
    ["nose", "鼻子", "👃", "身体与健康", "The dog has a small nose.", "这只狗有一个小鼻子。"],
    ["mouth", "嘴", "👄", "身体与健康", "Open your mouth, please.", "请张开嘴。"],
    ["hand", "手", "✋", "身体与健康", "Wash your hands before lunch.", "午饭前洗手。"],
    ["foot", "脚", "🦶", "身体与健康", "My left foot is cold.", "我的左脚很冷。"],
    ["tooth", "牙齿", "🦷", "身体与健康", "Brush every tooth.", "刷每一颗牙。"],
    ["heart", "心脏", "❤️", "身体与健康", "Exercise makes my heart strong.", "运动让我的心脏更强壮。"],
    ["healthy", "健康的", "🥦", "身体与健康", "Fruit helps us stay healthy.", "水果帮助我们保持健康。"],

    // 食物与饮料
    ["apple", "苹果", "🍎", "食物与饮料", "I eat a red apple.", "我吃一个红苹果。"],
    ["banana", "香蕉", "🍌", "食物与饮料", "The banana is yellow.", "香蕉是黄色的。"],
    ["bread", "面包", "🍞", "食物与饮料", "We need bread for breakfast.", "我们早餐需要面包。"],
    ["milk", "牛奶", "🥛", "食物与饮料", "I drink milk every morning.", "我每天早上喝牛奶。"],
    ["water", "水", "💧", "食物与饮料", "Please drink some water.", "请喝些水。"],
    ["rice", "米饭", "🍚", "食物与饮料", "There is rice in my bowl.", "我的碗里有米饭。"],
    ["egg", "鸡蛋", "🥚", "食物与饮料", "The egg is on the plate.", "鸡蛋在盘子上。"],
    ["fish", "鱼", "🐟", "食物与饮料", "We have fish for dinner.", "我们晚餐吃鱼。"],
    ["carrot", "胡萝卜", "🥕", "食物与饮料", "A rabbit is eating a carrot.", "一只兔子正在吃胡萝卜。"],
    ["breakfast", "早餐", "🥣", "食物与饮料", "Breakfast is ready.", "早餐准备好了。"],

    // 动物与自然
    ["dog", "狗", "🐶", "动物与自然", "The dog runs in the park.", "狗在公园里跑。"],
    ["cat", "猫", "🐱", "动物与自然", "The cat sleeps on the chair.", "猫睡在椅子上。"],
    ["bird", "鸟", "🐦", "动物与自然", "A little bird sings.", "一只小鸟在唱歌。"],
    ["rabbit", "兔子", "🐰", "动物与自然", "The rabbit has long ears.", "兔子有长耳朵。"],
    ["elephant", "大象", "🐘", "动物与自然", "The elephant is very big.", "大象非常大。"],
    ["tiger", "老虎", "🐯", "动物与自然", "The tiger has black stripes.", "老虎有黑色条纹。"],
    ["tree", "树", "🌳", "动物与自然", "We sit under the tree.", "我们坐在树下。"],
    ["flower", "花", "🌸", "动物与自然", "This flower is pink.", "这朵花是粉色的。"],
    ["sun", "太阳", "☀️", "动物与自然", "The sun is bright today.", "今天太阳很明亮。"],
    ["rain", "雨", "🌧️", "动物与自然", "We hear the rain.", "我们听见雨声。"],

    // 家居与物品
    ["home", "家", "🏠", "家居与物品", "I go home after school.", "我放学后回家。"],
    ["door", "门", "🚪", "家居与物品", "Please close the door.", "请关上门。"],
    ["window", "窗户", "🪟", "家居与物品", "Open the window for fresh air.", "打开窗户呼吸新鲜空气。"],
    ["bed", "床", "🛏️", "家居与物品", "My teddy is on the bed.", "我的泰迪熊在床上。"],
    ["chair", "椅子", "🪑", "家居与物品", "Pull the chair closer.", "把椅子拉近一点。"],
    ["table", "桌子", "🛋️", "家居与物品", "The plates are on the table.", "盘子在桌子上。"],
    ["lamp", "灯", "💡", "家居与物品", "Turn on the lamp.", "打开灯。"],
    ["book", "书", "📖", "家居与物品", "This book is about animals.", "这本书讲的是动物。"],
    ["clock", "时钟", "⏰", "家居与物品", "The clock shows seven.", "时钟显示七点。"],
    ["cup", "杯子", "🥤", "家居与物品", "My cup is full of milk.", "我的杯子里装满了牛奶。"],

    // 学校与学习
    ["school", "学校", "🏫", "学校与学习", "We walk to school.", "我们走路去学校。"],
    ["classroom", "教室", "🏫", "学校与学习", "Our classroom is bright.", "我们的教室很明亮。"],
    ["desk", "书桌", "🪑", "学校与学习", "My pencil is on the desk.", "我的铅笔在书桌上。"],
    ["pencil", "铅笔", "✏️", "学校与学习", "I need a sharp pencil.", "我需要一支尖铅笔。"],
    ["paper", "纸", "📄", "学校与学习", "Draw a star on the paper.", "在纸上画一颗星星。"],
    ["homework", "家庭作业", "📝", "学校与学习", "I finish my homework before dinner.", "我在晚饭前完成作业。"],
    ["question", "问题", "❓", "学校与学习", "I have a question.", "我有一个问题。"],
    ["answer", "答案", "💬", "学校与学习", "The answer is on the board.", "答案在黑板上。"],
    ["read", "阅读", "📚", "学校与学习", "I read a story every night.", "我每天晚上读一个故事。"],
    ["write", "写", "✍️", "学校与学习", "Write your name here.", "在这里写下你的名字。"],

    // 衣服与日常
    ["shirt", "衬衫", "👕", "衣服与日常", "My shirt has blue stripes.", "我的衬衫有蓝色条纹。"],
    ["shoes", "鞋", "👟", "衣服与日常", "Put your shoes by the door.", "把鞋放在门边。"],
    ["coat", "外套", "🧥", "衣服与日常", "Wear a coat when it is cold.", "冷的时候穿外套。"],
    ["hat", "帽子", "🧢", "衣服与日常", "The hat keeps my head warm.", "帽子让我的头保持温暖。"],
    ["socks", "袜子", "🧦", "衣服与日常", "Where are my green socks?", "我的绿色袜子在哪里？"],
    ["pajamas", "睡衣", "🩳", "衣服与日常", "I wear pajamas at bedtime.", "我睡觉时穿睡衣。"],
    ["brush", "刷", "🪥", "衣服与日常", "Brush your teeth.", "刷牙。"],
    ["wash", "洗", "🧼", "衣服与日常", "Wash your face.", "洗脸。"],
    ["wake", "醒来", "🌅", "衣服与日常", "I wake up at seven.", "我七点醒来。"],
    ["sleep", "睡觉", "😴", "衣服与日常", "The baby goes to sleep.", "宝宝去睡觉了。"],

    // 动作与运动
    ["run", "跑", "🏃", "动作与运动", "I can run fast.", "我可以跑得很快。"],
    ["walk", "走", "🚶", "动作与运动", "Let us walk to the park.", "我们走路去公园吧。"],
    ["jump", "跳", "🦘", "动作与运动", "The frog can jump.", "青蛙会跳。"],
    ["swim", "游泳", "🏊", "动作与运动", "We swim in the pool.", "我们在游泳池里游泳。"],
    ["climb", "爬", "🧗", "动作与运动", "The cat can climb the tree.", "猫会爬树。"],
    ["dance", "跳舞", "💃", "动作与运动", "We dance to the music.", "我们跟着音乐跳舞。"],
    ["sing", "唱歌", "🎤", "动作与运动", "Birds sing in the morning.", "鸟儿在早晨唱歌。"],
    ["draw", "画", "🎨", "动作与运动", "I draw a little house.", "我画一座小房子。"],
    ["play", "玩", "⚽", "动作与运动", "Can we play outside?", "我们可以去外面玩吗？"],
    ["help", "帮助", "🤝", "动作与运动", "Please help me carry the box.", "请帮我搬这个箱子。"],

    // 情绪与性格
    ["happy", "开心的", "😊", "情绪与性格", "I am happy to see you.", "见到你我很开心。"],
    ["sad", "难过的", "😢", "情绪与性格", "The boy is sad.", "男孩很难过。"],
    ["angry", "生气的", "😠", "情绪与性格", "Do not be angry.", "不要生气。"],
    ["afraid", "害怕的", "😨", "情绪与性格", "The little mouse is afraid.", "小老鼠很害怕。"],
    ["brave", "勇敢的", "🦁", "情绪与性格", "The brave girl speaks up.", "勇敢的女孩大声说出来。"],
    ["kind", "友善的", "😊", "情绪与性格", "Give a kind smile.", "给别人一个友善的微笑。"],
    ["shy", "害羞的", "🙈", "情绪与性格", "The shy cat hides.", "害羞的猫躲起来了。"],
    ["excited", "兴奋的", "🤩", "情绪与性格", "I am excited about the trip.", "我对这次旅行很兴奋。"],
    ["tired", "疲倦的", "😴", "情绪与性格", "My legs are tired.", "我的腿很累。"],
    ["proud", "自豪的", "🏅", "情绪与性格", "I feel proud of my picture.", "我为自己的画感到自豪。"],

    // 地点与交通
    ["park", "公园", "🏞️", "地点与交通", "We fly a kite in the park.", "我们在公园放风筝。"],
    ["shop", "商店", "🏪", "地点与交通", "The shop sells fresh fruit.", "这家店卖新鲜水果。"],
    ["hospital", "医院", "🏥", "地点与交通", "The hospital is near the school.", "医院在学校附近。"],
    ["station", "车站", "🚉", "地点与交通", "The train is at the station.", "火车在车站。"],
    ["bus", "公交车", "🚌", "地点与交通", "The bus stops here.", "公交车停在这里。"],
    ["train", "火车", "🚆", "地点与交通", "The train goes very fast.", "火车开得非常快。"],
    ["bike", "自行车", "🚲", "地点与交通", "I ride my bike.", "我骑自行车。"],
    ["car", "汽车", "🚗", "地点与交通", "The red car is small.", "红色的汽车很小。"],
    ["plane", "飞机", "✈️", "地点与交通", "A plane flies in the sky.", "飞机在天空中飞。"],
    ["boat", "船", "⛵", "地点与交通", "The boat floats on the water.", "船漂在水面上。"],

    // 时间、天气、数字与颜色
    ["morning", "早晨", "🌤️", "时间与天气", "The morning is cool.", "早晨很凉爽。"],
    ["evening", "傍晚；晚上", "🌆", "时间与天气", "We read in the evening.", "我们傍晚读书。"],
    ["today", "今天", "📅", "时间与天气", "Today is a sunny day.", "今天是晴朗的一天。"],
    ["tomorrow", "明天", "➡️", "时间与天气", "Tomorrow is Monday.", "明天是星期一。"],
    ["sunny", "晴朗的", "☀️", "时间与天气", "It is sunny.", "天气晴朗。"],
    ["cloudy", "多云的", "☁️", "时间与天气", "The sky is cloudy.", "天空多云。"],
    ["windy", "有风的", "🌬️", "时间与天气", "It is windy near the sea.", "海边风很大。"],
    ["one", "一", "1️⃣", "时间与天气", "I have one blue hat.", "我有一顶蓝色的帽子。"],
    ["two", "二", "2️⃣", "时间与天气", "Two birds sit on the roof.", "两只鸟停在屋顶上。"],
    ["red", "红色", "🔴", "时间与天气", "The apple is red.", "苹果是红色的。"]
  ];

  return raw.map((item, index) => ({
    id: index + 1,
    word: item[0],
    meaning: item[1],
    emoji: item[2],
    category: item[3],
    example: item[4],
    exampleZh: item[5]
  }));
});
