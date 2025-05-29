// src/FoodReviewGenerator.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as LucideIcons from 'lucide-react'; // 導入所有 Lucide Icons 以便動態渲染
import html2canvas from 'html2canvas';

// Helper to get nested value or fallback
const getNestedValue = (obj, path, defaultValue) => {
  let current = obj;
  // *** 修正 for 迴圈條件：i < path.length ***
  for (let i = 0; i < path.length; i++) {
    if (current === undefined || current === null) {
      return defaultValue;
    }
    current = current[path[i]];
  }
  return current === undefined ? defaultValue : current;
};

// Helper function to pick a random element from an array (for templates)
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper function to get Lucide Icon component
const getLucideComponent = (iconName) => {
    return LucideIcons[iconName] || null; // Return the actual component if found, otherwise return null
};


// =============================================================
// *** 大幅擴充的 questionSets 資料 (約20回合，每頁6個選項) ***
// 確保 icon 屬性是 Lucide Icon 組件的名稱 (字符串)
// 「overallRating」新增 starCount 屬性，用於控制星星圖示數量
// =============================================================
const questionSets = [
    // --- 餐廳基礎資訊 (第1回合) ---
    {
        id: 0,
        key: 'initialInfo',
        question: '首先，請問這家餐廳的名稱和您的招牌菜？',
        type: 'input'
    },
    // --- 整體滿意度 (第2回合) ---
    {
        id: 1,
        key: 'overallRating',
        question: '您會給這次用餐體驗總體幾顆星？',
        cards: [
            { id: '1star', icon: 'Star', title: '1星', description: '非常糟糕，難以接受', starCount: 1 },
            { id: '2stars', icon: 'Star', title: '2星', description: '不甚滿意，許多地方可改進', starCount: 2 },
            { id: '3stars', icon: 'Star', title: '3星', description: '中規中矩，沒有驚喜也沒有大問題', starCount: 3 },
            { id: '4stars', icon: 'Star', title: '4星', description: '非常不錯，值得推薦', starCount: 4 },
            { id: '5stars', icon: 'Star', title: '5星', description: '極致體驗，無可挑剔', starCount: 5 },
            { id: 'halfstar', icon: 'StarHalf', title: '加半星', description: '難以取捨，多給點肯定', starCount: 3.5 }
        ],
    },
    // --- 餐廳定位與氛圍 (第3-4回合) ---
    {
        id: 2,
        key: 'restaurantStyle',
        question: '這家餐廳的風格和定位屬於？',
        cards: [
            { id: 'fineDining', icon: 'Sparkles', title: '高級餐飲', description: '注重精緻、服務與格調' },
            { id: 'casualEatery', icon: 'UtensilsCrossed', title: '休閒小吃', description: '輕鬆自在，日常用餐' },
            { id: 'bistroCafe', icon: 'Coffee', title: '小酒館/咖啡廳', description: '氣氛舒適，適合小聚' },
            { id: 'themeRestaurant', icon: 'PartyPopper', title: '特色主題店', description: '獨特體驗與氛圍' },
            { id: 'fastFood', icon: 'Burger', title: '速食/簡餐', description: '快速便捷，經濟實惠' },
            { id: 'streetFood', icon: 'ShoppingCart', title: '街頭小吃', description: '道地風味，融入當地生活' }
        ],
    },
    {
        id: 3,
        key: 'ambiance',
        question: '餐廳的氛圍給您什麼感覺？',
        cards: [
            { id: 'cozyQuiet', icon: 'Coffee', title: '溫馨安靜', description: '適合放鬆，小聲交談' },
            { id: 'livelyBustling', icon: 'Feather', title: '熱鬧活潑', description: '充滿活力與歡聲笑語' },
            { id: 'elegantLuxurious', icon: 'Crown', title: '優雅奢華', description: '精緻裝潢與高雅格調' },
            { id: 'modernMinimalist', icon: 'Square', title: '簡約現代', description: '設計感強，注重線條' },
            { id: 'rusticCharming', icon: 'TreeDeciduous', title: '質樸鄉村', description: '自然質樸，溫馨舒適' },
            { id: 'industrialChic', icon: 'Hammer', title: '工業風', description: '獨特粗獷，個性十足' }
        ],
    },
    // --- 服務體驗 (第5-7回合) ---
    {
        id: 4,
        key: 'serviceEfficiency',
        question: '您對服務的效率和速度滿意嗎？',
        cards: [
            { id: 'veryEfficient', icon: 'Gauge', title: '非常迅速', description: '響應快速，無需等待' },
            { id: 'efficient', icon: 'Clock', title: '效率不錯', description: '基本滿足，無明顯延遲' },
            { id: 'averageEfficiency', icon: 'Watch', title: '一般般', description: '偶爾等待，但尚可接受' },
            { id: 'slowInefficient', icon: 'Turtle', title: '緩慢低效', description: '等待時間長，需要催促' },
            { id: 'unacceptableSlow', icon: 'Hourglass', title: '無法接受', description: '過度等待，影響心情' },
            { id: 'beyondExpectation', icon: 'Zap', title: '超乎預期', description: '效率驚人，提前服務' }
        ],
    },
    {
        id: 5,
        key: 'serviceAttitude',
        question: '服務人員的態度如何？',
        cards: [
            { id: 'extremelyPolite', icon: 'Smile', title: '親切有禮', description: '笑容滿面，熱情周到' },
            { id: 'professionalAttitude', icon: 'Briefcase', title: '專業得體', description: '訓練有素，應對恰當' },
            { id: 'averageAttitude', icon: 'Meh', title: '態度一般', description: '中規中矩，缺乏熱情' },
            { id: 'rudeIndifferent', icon: 'Frown', title: '冷漠或無禮', description: '態度不佳，令人不悅' },
            { id: 'overlyEnthusiastic', icon: 'Laugh', title: '過於熱情', description: '熱情但略顯打擾' },
            { id: 'calmComposed', icon: 'Cloud', title: '沉穩內斂', description: '內斂但細心' }
        ],
    },
    {
        id: 6,
        key: 'staffKnowledge',
        question: '服務人員對菜品或酒水的了解程度如何？',
        cards: [
            { id: 'veryKnowledgeable', icon: 'Lightbulb', title: '非常專業', description: '能詳盡介紹，提供建議' },
            { id: 'somewhatKnowledgeable', icon: 'Info', title: '尚可', description: '能回答基本問題' }, // 'Info' 是 Lucide Icons
            { id: 'lacksKnowledge', icon: 'HelpCircle', title: '不夠了解', description: '難以提供有效資訊' },
            { id: 'highlyRecommendExpert', icon: 'BookOpen', title: '專家推薦', description: '提供專業搭配建議' },
            { id: 'justMenuItemReader', icon: 'Clipboard', title: '只會讀菜單', description: '對菜品了解甚少' },
            { id: 'noKnowledgeNeeded', icon: 'ZapOff', title: '無此需求', description: '未咨詢或非重點' }
        ],
    },
    // --- 食物表現：總體與主菜 (第8-10回合) ---
    {
        id: 7,
        key: 'mainDishFlavor',
        question: '招牌菜或主菜的味道如何？',
        cards: [
            { id: 'excellentFlavor', icon: 'Soup', title: '驚為天人', description: '味道層次豐富，非常美味' },
            { id: 'goodFlavor', icon: 'CookingPot', title: '味道不錯', description: '可口，令人滿意' },
            { id: 'averageFlavor', icon: 'Droplets', title: '味道平淡', description: '缺乏特色或驚喜' }, // 'Droplets' for bland/watery
            { id: 'poorFlavor', icon: 'ChefHat', title: '味道不佳', description: '難以入口或有明顯缺陷' },
            { id: 'uniqueFlavor', icon: 'Palette', title: '獨特風味', description: '前所未有，印象深刻' },
            { id: 'classicPerfect', icon: 'PiggyBank', title: '經典完美', description: '傳統口味的極致呈現' }
        ],
    },
    {
        id: 8,
        key: 'mainDishTexture',
        question: '招牌菜或主菜的口感和質地如何？',
        cards: [
            { id: 'perfectTexture', icon: 'Drumstick', title: '完美口感', description: '酥脆、軟嫩或彈牙恰到好處' },
            { id: 'goodTexture', icon: 'Cookie', title: '口感良好', description: '符合預期，沒有不適' }, // 'Cookie' for good texture
            { id: 'averageTexture', icon: 'Pizza', title: '口感一般', description: '沒有突出，或有些微欠缺' },
            { id: 'poorTexture', icon: 'FishOff', title: '口感不佳', description: '過於乾柴、油膩或黏膩' },
            { id: 'unexpectedTexture', icon: 'Shapes', title: '驚喜口感', description: '意想不到的質地，帶來樂趣' },
            { id: 'chewyPerfect', icon: 'Cherry', title: 'Q彈到位', description: '軟糯彈牙，咀嚼感佳' }
        ],
    },
    {
        id: 9,
        key: 'dishPortion',
        question: '主菜的份量感覺如何？',
        cards: [
            { id: 'generousPortion', icon: 'Container', title: '份量十足', description: '飽足感很夠，物超所值' },
            { id: 'justRightPortion', icon: 'ConciergeBell', title: '恰到好處', description: '份量適中，不會浪費' },
            { id: 'smallPortion', icon: 'Minimize2', title: '偏少', description: '感覺不太夠，需要加點' }, // 'Minimize2' for smaller size
            { id: 'overwhelmingPortion', icon: 'BringToFront', title: '份量超大', description: '多到吃不完，可以打包' },
            { id: 'tastingMenuSize', icon: 'CandlestickChart', title: '迷你品嚐', description: '僅供體驗，份量精緻' }, // 從 Candle 修正為 CandlestickChart
            { id: 'familyStyle', icon: 'Users', title: '共享份量', description: '適合多人分享，份量較大' }
        ],
    },
    // --- 食物表現：配菜與細節 (第11-13回合) ---
    {
        id: 10,
        key: 'sideDishQuality',
        question: '配菜或小點的品質如何？',
        cards: [
            { id: 'excellentSides', icon: 'Salad', title: '水準之上', description: '配角也很出色，值得品嚐' },
            { id: 'goodSides', icon: 'SquareKanban', title: '品質不錯', description: '搭配得宜，豐富口感' },
            { id: 'averageSides', icon: 'Leaf', title: '中規中矩', description: '沒有亮點，但也無過失' },
            { id: 'poorSides', icon: 'XSquare', title: '略顯不足', description: '敷衍了事，影響整體' },
            { id: 'creativeSides', icon: 'Lightbulb', title: '創意配菜', description: '打破傳統，帶來新意' },
            { id: 'complementarySides', icon: 'PlusCircle', title: '相得益彰', description: '完美襯托主菜風味' }
        ],
    },
    {
        id: 11,
        key: 'beverageQuality',
        question: '您有點飲品嗎？品質如何？',
        cards: [
            { id: 'excellentBeverage', icon: 'GlassWater', title: '非常出色', description: '特調飲品或咖啡表現驚艷' },
            { id: 'goodBeverage', icon: 'Beer', title: '品質不錯', description: '順口好喝，解渴' },
            { id: 'averageBeverage', icon: 'Milk', title: '一般', description: '無功無過' },
            { id: 'noBeverage', icon: 'CoffeeOff', title: '未點', description: '我沒點飲品' }, // 'CoffeeOff' 是 Lucide Icons
            { id: 'signatureBeverage', icon: 'Wine', title: '招牌飲品', description: '獨家配方，必點體驗' },
            { id: 'disappointingBeverage', icon: 'CircleOff', title: '令人失望', description: '風味不佳或品質問題' }
        ],
    },
    {
        id: 12,
        key: 'dessertQuality',
        question: '有品嚐甜點嗎？表現如何？',
        cards: [
            { id: 'excellentDessert', icon: 'CakeSlice', title: '畫龍點睛', description: '精緻美味，為用餐畫上完美句號' },
            { id: 'goodDessert', icon: 'CandyCane', title: '不錯', description: '甜度適中，口感良好' },
            { id: 'averageDessert', icon: 'Donut', title: '普通', description: '無特別之處' },
            { id: 'noDessert', icon: 'CandyOff', title: '未點', description: '我沒點甜點' }, // 'CandyOff' 是 Lucide Icons
            { id: 'innovativeDessert', icon: 'Lightbulb', title: '創新甜點', description: '設計感強，風味新穎' },
            { id: 'overlySweet', icon: 'Droplets', title: '過於甜膩', description: '甜度過高，容易膩' } // 增加一個負面選項
        ],
    },
    // --- 食材與烹飪 (第14-15回合) ---
    {
        id: 13,
        key: 'ingredientFreshness',
        question: '您覺得食材的新鮮度如何？',
        cards: [
            { id: 'topFresh', icon: 'LeafyGreen', title: '極致新鮮', description: '感受得到食材的原汁原味' },
            { id: 'fresh', icon: 'Wheat', title: '新鮮', description: '食材品質不錯' },
            { id: 'averageFreshness', icon: 'Apple', title: '一般', description: '部分食材可能略有欠缺' },
            { id: 'poorFreshness', icon: 'Flame', title: '不新鮮', description: '食材品質有疑慮' },
            { id: 'localOrganic', icon: 'Plant', title: '在地有機', description: '強調來源，健康安心' },
            { id: 'seasonalHighlight', icon: 'Calendar', title: '季節限定', description: '充分利用時令食材' }
        ],
    },
    {
        id: 14,
        key: 'cookingTechnique',
        question: '烹飪技巧給您的感覺是？',
        cards: [
            { id: 'masterfulTechnique', icon: 'Award', title: '大師級', description: '火候、調味完美無缺' },
            { id: 'skilledTechnique', icon: 'Scale', title: '熟練', description: '烹飪得當，保持食材本味' },
            { id: 'averageTechnique', icon: 'Construction', title: '尚可', description: '有些菜色烹飪火候把握不準' }, // 從 Tools 修正為 Construction (暗示仍在建造/改進)
            { id: 'poorTechnique', icon: 'Bomb', title: '粗糙', description: '過熟、欠熟或調味失衡' },
            { id: 'innovativeTechnique', icon: 'Beaker', title: '創新獨特', description: '採用特殊烹飪手法' },
            { id: 'authenticTraditional', icon: 'LampCeiling', title: '道地傳統', description: '忠於原味，風味純粹' }
        ],
    },
    // --- 用餐體驗細節 (第16-17回合) ---
    {
        id: 15,
        key: 'cleanliness',
        question: '餐廳的衛生與整潔程度如何？',
        cards: [
            { id: 'spotlessClean', icon: 'Sparkle', title: '一塵不染', description: '環境衛生非常令人安心' },
            { id: 'generallyClean', icon: 'Droplets', title: '基本整潔', description: '大部分地方都乾淨' },
            { id: 'averageCleanliness', icon: 'CircleOff', title: '有待加強', description: '部分地方有明顯髒亂' }, // 從 SquareParkingOff 修正為 CircleOff
            { id: 'pristineBathrooms', icon: 'Toilet', title: '廁所潔淨', description: '細節也處理到位' },
            { id: 'tablewareCleanliness', icon: 'Utensils', title: '餐具潔淨', description: '刀叉杯盤光亮無暇' },
            { id: 'stickyTables', icon: 'StickyNote', title: '桌面黏膩', description: '清潔度有待提升' } // Lucide Icons: StickyNote 雖然是便條紙，但也能聯想到黏膩的感覺。
        ],
    },
    {
        id: 16,
        key: 'valueForMoney',
        question: '您覺得這次用餐的性價比 (CP值) 如何？',
        cards: [
            { id: 'excellentValue', icon: 'DollarSign', title: '物超所值', description: '價格合理甚至偏低，但品質驚人' },
            { id: 'goodValue', icon: 'Wallet', title: '性價比高', description: '價格與品質相符，值得消費' },
            { id: 'averageValue', icon: 'CreditCard', title: '中等', description: '價格偏高或品質未達預期' },
            { id: 'poorValue', icon: 'Receipt', title: '不划算', description: '價格過高，與所提供的體驗不符' },
            { id: 'luxuryJustified', icon: 'Diamond', title: '奢華超值', description: '儘管高價，但體驗與品質匹配' },
            { id: 'overpricedExperience', icon: 'Handshake', title: '體驗不符價', description: '性價比不佳，徒有虛名' } // 增加負面選項
        ],
    },
    // --- 總結與推薦 (第18-19回合) ---
    {
        id: 17,
        key: 'wouldRecommend',
        question: '您會向朋友推薦這家餐廳嗎？',
        cards: [
            { id: 'definitelyRecommend', icon: 'ThumbsUp', title: '強烈推薦', description: '非常值得一試，必訪' },
            { id: 'mightRecommend', icon: 'Hand', title: '會推薦', description: '不錯的選擇，可以考慮' },
            { id: 'neutralRecommend', icon: 'Meh', title: '看情況', description: '某些情況下才推薦' },
            { id: 'notRecommend', icon: 'ThumbsDown', title: '不推薦', description: '有更好的替代選擇' },
            { id: 'exclusiveRecommendation', icon: 'Crown', title: '私藏推薦', description: '只會推薦給特定品味的朋友' },
            { id: 'avoidAtAllCosts', icon: 'Skull', title: '建議避雷', description: '請避開這家店' }
        ],
    },
    {
        id: 18,
        key: 'finalThoughts',
        question: '最後，您對這次用餐還有什麼額外感想？',
        cards: [
            { id: 'memorableExperience', icon: 'HeartHandshake', title: '難忘體驗', description: '獨特或讓人回味無窮的經歷' },
            { id: 'standardExperience', icon: 'NotebookPen', title: '常規體驗', description: '符合期望，但沒有特別亮點' },
            { id: 'minorIssue', icon: 'AlertCircle', title: '小問題', description: '有些小瑕疵但可接受' },
            { id: 'majorProblem', icon: 'Ghost', title: '嚴重問題', description: '導致體驗不佳的重大問題' },
            { id: 'noSpecialThoughts', icon: 'SmilePlus', title: '沒有特別感想', description: '一切正常' },
            { id: 'eagerToReturn', icon: 'RefreshCcwDot', title: '迫不及待再訪', description: '意猶未盡，想立刻回去' }
        ],
    },
    // === 最後的圖片上傳步驟 ===
    {
        id: 19, // 這將是 `questionSets.length - 1`
        key: 'imageUploadStep',
        question: '請上傳您用餐的照片 (可選)，即將完成！',
        type: 'upload',
        cards: [] // 沒有卡片選項
    }
];

// =============================================================
// *** 擴充的 reviewTemplates 資料 (針對更多回合設計) ***
// =============================================================
const reviewTemplates = {
    '1star': {
        'fineDining': `【餐廳名稱】真的是味蕾的殿堂！從一踏入店門起，[優雅的裝潢|奢華的佈置|溫馨的氣氛]就讓人感受到不凡。服務人員[專業且細緻|親切且周到]，對[菜品|酒水]的了解程度令人驚嘆，讓用餐過程[無比順暢|備受禮遇]。
        
        招牌菜「【XX餐點】」[味道驚為天人|口感完美無瑕]，[食材的頂級新鮮|烹飪的精湛技藝]展露無遺，每一口都是[藝術品般的享受|味蕾的盛宴]。連[配菜|甜點|飲品]都[水準之上|毫不遜色]，搭配得天衣無縫。

        儘管價格[略高|符合其定位]，但考慮到[無與倫比的品質|難忘的用餐體驗]，絕對是[物超所值|一次極致的享受]。強烈推薦給所有尋求[頂級美食|特殊慶祝]的朋友！`,
        'casualEatery': `天啊！【餐廳名稱】的【XX餐點】簡直是[人間美味|味覺炸彈]！這家小店雖然[裝潢樸實|環境熱鬧]，但[其貌不揚卻美味驚人]的料理讓人[流連忘返|一吃就愛上]。
        
        服務雖然[親切但不過度打擾|忙碌卻依然有禮]，效率[出乎意料地高|始終保持不錯]，在[忙碌的用餐時間|週末]也能[快速享用到美食|得到照顧]。
        
        主菜【XX餐點】[份量十足|給得很大方]，[味道調和得恰到好處|香氣四溢]，[食材新鮮度也很有保證|吃得很安心]。CP值[簡直爆表|高到難以置信]，絕對是[日常用餐|小資族]的首選。強烈推薦！`,
        'bistroCafe': `【餐廳名稱】是個[很有特色|氣氛宜人]的小酒館/咖啡廳。它完美結合了[輕鬆與雅緻|咖啡與美食]，提供一個[理想的休憩空間|聚會好去處]。服務[恰到好處|不會過於打擾]，讓人感到舒適。

        點了【XX餐點】，[味道溫潤|口感紮實]，搭配一杯[香醇的咖啡|特調飲品]，享受一個[悠閒的午後|輕鬆的夜晚]。甜點[表現出色|令人驚喜]，為整個體驗畫上圓滿句號。

        整體性價比[令人滿意|符合預期]，是一個[值得再訪|會向朋友推薦]的好地方。`,
        'themeRestaurant': `走進【餐廳名稱】，立刻被其[獨特的主題|精心佈置的場景]所吸引，感覺像[穿越到另一個世界|進入一場奇幻冒險]！這不僅僅是用餐，更是一場[沉浸式的體驗|視覺與味覺的雙重享受]。
        
        儘管服務[有時會因為忙碌而稍慢|雖然專業但不乏幽默]，但服務人員努力維持[情境感|顧客互動]，整體體驗[非常有趣|令人愉悅]。

        【XX餐點】在視覺上[令人驚艷|極具創意]，味道[也出乎意料地美味|超越預期]，證明主題餐廳也能兼顧品質。[份量適中|造型可愛]，處處充滿巧思。

        儘管價格可能[稍高於一般餐廳|在可接受範圍]，但考量其[獨特的體驗價值|精心設計的細節]，絕對是[物有所值|一次難忘的打卡經歷]。強力推薦給[喜歡嘗鮮|尋找特別體驗]的朋友！`,
        'fastFood': `【餐廳名稱】這家速食店真是[方便快捷|效率極高]的選擇！雖然是快餐，但其【XX餐點】[味道出奇地好|品質穩定]，份量[充足|恰到好處]，是[趕時間時|想輕鬆用餐時]的[絕佳去處|不二之選]。

        店內環境[整潔明亮|簡單舒適]，服務人員[動作麻利|態度友善]，確保用餐體驗[流暢高效|輕鬆愉快]。尤其是他們的[炸雞|漢堡|薯條]，每次來都[必須點|令人回味]。

        性價比[非常高|經濟實惠]，對於追求[速度與實惠|簡潔美味]的食客來說，絕對值得[嘗試|成為常客]。`,
        'streetFood': `這家【餐廳名稱】的街頭小吃攤真是[寶藏般的存在|令人驚艷的發現]！雖然[環境簡陋|沒有華麗裝潢]，但其【XX餐點】的[地道風味|誘人香氣]讓人[一試難忘|回味無窮]，完全展現了[街頭美食的精髓|在地文化的魅力]。

        老闆[熱情招呼|手藝精湛]，烹製過程[乾淨俐落|充滿煙火氣]，讓你在等待的同時也能感受到[美食的魅力|生活的真實]。

        【XX餐點】[現做現賣|熱騰騰上桌]，[口感極佳|味道層次豐富]，[每一口都是享受|份量也實在]，絕對是[真材實料|用心製作]的體現。

        價格[超級親民|便宜大碗]，性價比[無可匹敵|高到破表]，絕對是[路過必買|想感受在地特色]的[最佳選擇|隱藏版美食]。`,
        'default': `這家【餐廳名稱】真的超棒！無論是環境、服務還是最重要的食物，都給了我一個[難忘的體驗|極高的滿足]。特別是【XX餐點】，完全征服了我的味蕾。`
    },
    '2stars': {
        'fineDining': `在【餐廳名稱】的用餐體驗讓我感到有些失望。雖然[環境優雅|裝潢精緻]，但整體服務和菜品質量未達預期。

        首先，服務方面，雖然人員態度[親切|友善]，但在高峰時段顯得有些忙亂，響應速度較慢。

        至於菜品，招牌的「【XX餐點】」雖然擺盤精美，但味道上並沒有特別突出之處，讓人感覺有些平淡。

        整體而言，這次的用餐體驗並不算差，但也沒有特別令人印象深刻的地方。對於追求高品質餐飲的食客來說，可能需要再考慮其他選擇。`,
        'casualEatery': `這家【餐廳名稱】的用餐體驗還算不錯，適合日常聚餐。

        餐廳的環境[舒適|乾淨]，服務人員也都很[友善|有禮貌]。我們點的【XX餐點】上菜速度不算慢，味道對得起這個價格。

        雖然不是特別驚艷，但在這個價位區間內，已經算是相當不錯的選擇了。`,
        'bistroCafe': `【餐廳名稱】是一個不錯的小酒館，適合和朋友小聚。

        這裡的氣氛相當不錯，服務人員也很熱情。點的飲品和小吃都能讓人感到滿意。

        如果你在找尋一個輕鬆的地方來享受美食和美酒，這裡會是一個好選擇。`,
        'themeRestaurant': `這家【餐廳名稱】的主題餐廳讓我感受到不一樣的用餐體驗。

        餐廳的佈置和菜單設計都很有主題性，讓人感受到用心。服務方面也很到位，讓人感到賓至如歸。

        不過，因為過於注重主題，菜品的味道上似乎有所妥協，沒有特別突出。`,
        'fastFood': `【餐廳名稱】的速食選擇對於快速用餐來說是個不錯的選擇。

        雖然是速食，但這裡的食物新鮮度和口味都能讓人滿意。特別是他們的【XX餐點】、快速又美味。`,
        'streetFood': `這家【餐廳名稱】的街頭小吃讓我體驗到了地道的在地風味。

        食物的味道很不錯，特別是他們的招牌小吃【XX餐點】。雖然環境比較簡陋，但絕對不影響美食的享受。`,
        'default': `這家【餐廳名稱】的用餐體驗中規中矩，沒有特別的驚喜也沒有太大的失望。`
    },
    '3stars': {
        'fineDining': `在【餐廳名稱】的用餐體驗還不錯，整體服務和菜品質量都在可接受範圍內。

        雖然沒有特別驚艷的地方，但也沒有明顯的缺陷。適合對餐飲品質有一定要求的食客。`,
        'casualEatery': `這家【餐廳名稱】的用餐體驗相當不錯，特別適合家庭聚餐或朋友小聚。

        餐廳的環境舒適，服務人員態度友善。菜品方面，招牌的「【XX餐點】」味道不錯，讓人感到滿意。`,
        'bistroCafe': `【餐廳名稱】是一個不錯的選擇，特別是對於喜歡輕食和咖啡的人來說。

        這裡的飲品和小吃都很有水準，服務也相當到位。是一個可以放鬆心情，享受美好時光的地方。`,
        'themeRestaurant': `這家【餐廳名稱】的主題餐廳設計相當用心，讓人感受到濃厚的主題氛圍。

        菜品方面也頗具創意，特別是招牌菜「【XX餐點】」，不僅好看，味道也很不錯。`,
        'fastFood': `如果你想快速解決一餐，這家【餐廳名稱】的速食是個不錯的選擇。

        雖然是速食，但這裡的食物新鮮，味道也能讓人滿意。特別適合忙碌的上班族或學生族群。`,
        'streetFood': `這家【餐廳名稱】的街頭小吃讓我體驗到了地道的在地風味。

        食物的味道很不錯，特別是他們的招牌小吃【XX餐點】。雖然環境比較簡陋，但絕對不影響美食的享受。`,
        'default': `這家【餐廳名稱】的用餐體驗中規中矩，沒有特別的驚喜也沒有太大的失望。`
    },
    '4stars': {
        'fineDining': `在【餐廳名稱】享受了一頓[相當愉快的晚餐|令人滿意的午餐]。餐廳[裝潢典雅|環境舒適]，給人[高級感|放鬆的氛圍]。服務人員[專業且效率不錯|態度親切有禮]，對菜品也有[一定的了解|詳細的解說]，雖然有[少許不足|小瑕疵]，但整體表現[相當良好|令人讚賞]。

        主菜「【XX餐點】」[味道十分出色|口感佳]，[食材新鮮|烹飪手法熟練]。[配菜|甜點|飲品]也[表現不錯|有亮點]。份量[恰到好處|偏向精緻]。

        性價比[合理|略高]，是一次[值得的用餐體驗|會再訪的選擇]。推薦給[對美食有要求|想好好享受一餐]的朋友。`,
        'casualEatery': `【餐廳名稱】是個[不錯的選擇|值得一試的地方]。[休閒自在的氛圍|簡潔的環境]讓人感覺輕鬆。服務[效率不錯|態度也還可以]，[上菜速度快|應對自如]。

        主打的「【XX餐點】」[味道可口|風味獨特]，[份量適中|蠻大方]，[食材新鮮度沒問題|烹飪得宜]。[配菜|小吃]也[表現不錯|增添了風味]。

        價格[十分划算|CP值高]，是[家庭聚餐|朋友小聚]的好去處。會推薦給[想找輕鬆美味|經濟實惠]的朋友。`,
        'bistroCafe': `【餐廳名稱】是一個[充滿文藝氣息|適合放鬆]的咖啡館，很適合[度過一個悠閒的午後|和朋友小聚]。氛圍[很棒|燈光溫和]，讓人感覺很舒服。服務[雖然沒有頂級餐廳的規格，但也親切到位|熱情但不打擾]。

        飲品[味道濃郁|口感豐富]，【XX餐點】也[做得也很精緻|不會太甜]，整體餐飲水準[不錯|超出預期]。

        性價比[高|值得一試]，我會推薦給[想找個地方放鬆|喜歡咖啡輕食]的朋友。`,
        'themeRestaurant': `【餐廳名稱】的主題設定[很有趣|充滿創意]，讓用餐體驗[充滿驚喜|與眾不同]。環境[佈置用心|細節豐富]，很有[氣氛感|童趣]，適合[家庭聚餐|情侶約會]。服務人員[積極融入主題|互動有趣]，令人感到[愉悅|輕鬆]。

        餐點雖然[在主題下進行設計|創意十足]，味道上[也還算不錯|有些許亮點]。招牌菜「【XX餐點】」[視覺效果滿分|味道也過關]，[份量適中|可以吃飽]。

        綜合體驗下來，雖然餐點本身並非絕對頂級，但其[獨特的主題氛圍|帶來的歡樂]讓性價比[變得很高|值得花費]。是[會想再訪|值得分享]的餐廳。`,
        'fastFood': `【餐廳名稱】的速食店真是[方便快捷|效率極高]的選擇！雖然是快餐，但其【XX餐點】[味道出奇地好|品質穩定]，份量[充足|恰到好處]，是[趕時間時|想輕鬆用餐時]的[絕佳去處|不二之選]。

        店內環境[整潔明亮|簡單舒適]，服務人員[動作麻利|態度友善]，確保用餐體驗[流暢高效|輕鬆愉快]。尤其是他們的[炸雞|漢堡|薯條]，每次來都[必須點|令人回味]。

        性價比[非常高|經濟實惠]，對於追求[速度與實惠|簡潔美味]的食客來說，絕對值得[嘗試|成為常客]。`,
        'streetFood': `這家【餐廳名稱】的街頭小吃攤真是[寶藏般的存在|令人驚艷的發現]！雖然[環境簡陋|沒有華麗裝潢]，但其【XX餐點】的[地道風味|誘人香氣]讓人[一試難忘|回味無窮]，完全展現了[街頭美食的精髓|在地文化的魅力]。

        老闆[熱情招呼|手藝精湛]，烹製過程[乾淨俐落|充滿煙火氣]，讓你在等待的同時也能感受到[美食的魅力|生活的真實]。

        【XX餐點】[現做現賣|熱騰騰上桌]，[口感極佳|味道層次豐富]，[每一口都是享受|份量也實在]，絕對是[真材實料|用心製作]的體現。

        價格[超級親民|便宜大碗]，性價比[無可匹敵|高到破表]，絕對是[路過必買|想感受在地特色]的[最佳選擇|隱藏版美食]。`,
        'default': `這家【餐廳名稱】真的超棒！無論是環境、服務還是最重要的食物，都給了我一個[難忘的體驗|極高的滿足]。特別是【XX餐點】，完全征服了我的味蕾。`
    },
    '2stars': {
        'fineDining': `在【餐廳名稱】的用餐體驗讓我感到有些失望。雖然[環境優雅|裝潢精緻]，但整體服務和菜品質量未達預期。

        首先，服務方面，雖然人員態度[親切|友善]，但在高峰時段顯得有些忙亂，響應速度較慢。

        至於菜品，招牌的「【XX餐點】」雖然擺盤精美，但味道上並沒有特別突出之處，讓人感覺有些平淡。

        整體而言，這次的用餐體驗並不算差，但也沒有特別令人印象深刻的地方。對於追求高品質餐飲的食客來說，可能需要再考慮其他選擇。`,
        'casualEatery': `這家【餐廳名稱】的用餐體驗還算不錯，適合日常聚餐。

        餐廳的環境[舒適|乾淨]，服務人員也都很[友善|有禮貌]。我們點的【XX餐點】上菜速度不算慢，味道對得起這個價格。

        雖然不是特別驚艷，但在這個價位區間內，已經算是相當不錯的選擇了。`,
        'bistroCafe': `【餐廳名稱】是一個不錯的小酒館，適合和朋友小聚。

        這裡的氣氛相當不錯，服務人員也很熱情。點的飲品和小吃都能讓人感到滿意。

        如果你在找尋一個輕鬆的地方來享受美食和美酒，這裡會是一個好選擇。`,
        'themeRestaurant': `這家【餐廳名稱】的主題餐廳讓我感受到不一樣的用餐體驗。

        餐廳的佈置和菜單設計都很有主題性，讓人感受到用心。服務方面也很到位，讓人感到賓至如歸。

        不過，因為過於注重主題，菜品的味道上似乎有所妥協，沒有特別突出。`,
        'fastFood': `【餐廳名稱】的速食選擇對於快速用餐來說是個不錯的選擇。

        雖然是速食，但這裡的食物新鮮度和口味都能讓人滿意。特別是他們的【XX餐點】、快速又美味。`,
        'streetFood': `這家【餐廳名稱】的街頭小吃讓我體驗到了地道的在地風味。

        食物的味道很不錯，特別是他們的招牌小吃【XX餐點】。雖然環境比較簡陋，但絕對不影響美食的享受。`,
        'default': `這家【餐廳名稱】的用餐體驗中規中矩，沒有特別的驚喜也沒有太大的失望。`
    },
    '3stars': {
        'fineDining': `在【餐廳名稱】的用餐體驗還不錯，整體服務和菜品質量都在可接受範圍內。

        雖然沒有特別驚艷的地方，但也沒有明顯的缺陷。適合對餐飲品質有一定要求的食客。`,
        'casualEatery': `這家【餐廳名稱】的用餐體驗相當不錯，特別適合家庭聚餐或朋友小聚。

        餐廳的環境舒適，服務人員態度友善。菜品方面，招牌的「【XX餐點】」味道不錯，讓人感到滿意。`,
        'bistroCafe': `【餐廳名稱】是一個不錯的選擇，特別是對於喜歡輕食和咖啡的人來說。

        這裡的飲品和小吃都很有水準，服務也相當到位。是一個可以放鬆心情，享受美好時光的地方。`,
        'themeRestaurant': `這家【餐廳名稱】的主題餐廳設計相當用心，讓人感受到濃厚的主題氛圍。

        菜品方面也頗具創意，特別是招牌菜「【XX餐點】」，不僅好看，味道也很不錯。`,
        'fastFood': `如果你想快速解決一餐，這家【餐廳名稱】的速食是個不錯的選擇。

        雖然是速食，但這裡的食物新鮮，味道也能讓人滿意。特別適合忙碌的上班族或學生族群。`,
        'streetFood': `這家【餐廳名稱】的街頭小吃讓我體驗到了地道的在地風味。

        食物的味道很不錯，特別是他們的招牌小吃【XX餐點】。雖然環境比較簡陋，但絕對不影響美食的享受。`,
        'default': `這家【餐廳名稱】的用餐體驗中規中矩，沒有特別的驚喜也沒有太大的失望。`
    },
    '4stars': {
        'fineDining': `在【餐廳名稱】享受了一頓[相當愉快的晚餐|令人滿意的午餐]。餐廳[裝潢典雅|環境舒適]，給人[高級感|放鬆的氛圍]。服務人員[專業且效率不錯|態度親切有禮]，對菜品也有[一定的了解|詳細的解說]，雖然有[少許不足|小瑕疵]，但整體表現[相當良好|令人讚賞]。

        主菜「【XX餐點】」[味道十分出色|口感佳]，[食材新鮮|烹飪手法熟練]。[配菜|甜點|飲品]也[表現不錯|有亮點]。份量[恰到好處|偏向精緻]。

        性價比[合理|略高]，是一次[值得的用餐體驗|會再訪的選擇]。推薦給[對美食有要求|想好好享受一餐]的朋友。`,
        'casualEatery': `【餐廳名稱】是個[不錯的選擇|值得一試的地方]。[休閒自在的氛圍|簡潔的環境]讓人感覺輕鬆。服務[效率不錯|態度也還可以]，[上菜速度快|應對自如]。

        主打的「【XX餐點】」[味道可口|風味獨特]，[份量適中|蠻大方]，[食材新鮮度沒問題|烹飪得宜]。[配菜|小吃]也[表現不錯|增添了風味]。

        價格[十分划算|CP值高]，是[家庭聚餐|朋友小聚]的好去處。會推薦給[想找輕鬆美味|經濟實惠]的朋友。`,
        'bistroCafe': `【餐廳名稱】是一個[充滿文藝氣息|適合放鬆]的咖啡館，很適合[度過一個悠閒的午後|和朋友小聚]。氛圍[很棒|燈光溫和]，讓人感覺很舒服。服務[雖然沒有頂級餐廳的規格，但也親切到位|熱情但不打擾]。

        飲品[味道濃郁|口感豐富]，【XX餐點】也[做得也很精緻|不會太甜]，整體餐飲水準[不錯|超出預期]。

        性價比[高|值得一試]，我會推薦給[想找個地方放鬆|喜歡咖啡輕食]的朋友。`,
        'themeRestaurant': `【餐廳名稱】的主題設定[很有趣|充滿創意]，讓用餐體驗[充滿驚喜|與眾不同]。環境[佈置用心|細節豐富]，很有[氣氛感|童趣]，適合[家庭聚餐|情侶約會]。服務人員[積極融入主題|互動有趣]，令人感到[愉悅|輕鬆]。

        餐點雖然[在主題下進行設計|創意十足]，味道上[也還算不錯|有些許亮點]。招牌菜「【XX餐點】」[視覺效果滿分|味道也過關]，[份量適中|可以吃飽]。

        綜合體驗下來，雖然餐點本身並非絕對頂級，但其[獨特的主題氛圍|帶來的歡樂]讓性價比[變得很高|值得花費]。是[會想再訪|值得分享]的餐廳。`,
        'fastFood': `【餐廳名稱】的速食店真是[方便快捷|效率極高]的選擇！雖然是快餐，但其【XX餐點】[味道出奇地好|品質穩定]，份量[充足|恰到好處]，是[趕時間時|想輕鬆用餐時]的[絕佳去處|不二之選]。

        店內環境[整潔明亮|簡單舒適]，服務人員[動作麻利|態度友善]，確保用餐體驗[流暢高效|輕鬆愉快]。尤其是他們的[炸雞|漢堡|薯條]，每次來都[必須點|令人回味]。

        性價比[非常高|經濟實惠]，對於追求[速度與實惠|簡潔美味]的食客來說，絕對值得[嘗試|成為常客]。`,
        'streetFood': `這家【餐廳名稱】的街頭小吃攤真是[寶藏般的存在|令人驚艷的發現]！雖然[環境簡陋|沒有華麗裝潢]，但其【XX餐點】的[地道風味|誘人香氣]讓人[一試難忘|回味無窮]，完全展現了[街頭美食的精髓|在地文化的魅力]。

        老闆[熱情招呼|手藝精湛]，烹製過程[乾淨俐落|充滿煙火氣]，讓你在等待的同時也能感受到[美食的魅力|生活的真實]。

        【XX餐點】[現做現賣|熱騰騰上桌]，[口感極佳|味道層次豐富]，[每一口都是享受|份量也實在]，絕對是[真材實料|用心製作]的體現。

        價格[超級親民|便宜大碗]，性價比[無可匹敵|高到破表]，絕對是[路過必買|想感受在地特色]的[最佳選擇|隱藏版美食]。`,
        'default': `這家【餐廳名稱】真的超棒！無論是環境、服務還是最重要的食物，都給了我一個[難忘的體驗|極高的滿足]。特別是【XX餐點】，完全征服了我的味蕾。`
    },
    '2stars': {
        'fineDining': `在【餐廳名稱】的用餐體驗讓我感到有些失望。雖然[環境優雅|裝潢精緻]，但整體服務和菜品質量未達預期。

        首先，服務方面，雖然人員態度[親切|友善]，但在高峰時段顯得有些忙亂，響應速度較慢。

        至於菜品，招牌的「【XX餐點】」雖然擺盤精美，但味道上並沒有特別突出之處，讓人感覺有些平淡。

        整體而言，這次的用餐體驗並不算差，但也沒有特別令人印象深刻的地方。對於追求高品質餐飲的食客來說，可能需要再考慮其他選擇。`,
        'casualEatery': `這家【餐廳名稱】的用餐體驗還算不錯，適合日常聚餐。

        餐廳的環境[舒適|乾淨]，服務人員也都很[友善|有禮貌]。我們點的【XX餐點】上菜速度不算慢，味道對得起這個價格。

        雖然不是特別驚艷，但在這個價位區間內，已經算是相當不錯的選擇了。`,
        'bistroCafe': `【餐廳名稱】是一個不錯的小酒館，適合和朋友小聚。

        這裡的氣氛相當不錯，服務人員也很熱情。點的飲品和小吃都能讓人感到滿意。

        如果你在找尋一個輕鬆的地方來享受美食和美酒，這裡會是一個好選擇。`,
        'themeRestaurant': `這家【餐廳名稱】的主題餐廳讓我感受到不一樣的用餐體驗。

        餐廳的佈置和菜單設計都很有主題性，讓人感受到用心。服務方面也很到位，讓人感到賓至如歸。

        不過，因為過於注重主題，菜品的味道上似乎有所妥協，沒有特別突出。`,
        'fastFood': `【餐廳名稱】的速食選擇對於快速用餐來說是個不錯的選擇。

        雖然是速食，但這裡的食物新鮮度和口味都能讓人滿意。特別是他們的【XX餐點】、快速又美味。`,
        'streetFood': `這家【餐廳名稱】的街頭小吃讓我體驗到了地道的在地風味。

        食物的味道很不錯，特別是他們的招牌小吃【XX餐點】。雖然環境比較簡陋，但絕對不影響美食的享受。`,
        'default': `這家【餐廳名稱】的用餐體驗中規中矩，沒有特別的驚喜也沒有太大的失望。`
    },
    '3stars': {
        'fineDining': `在【餐廳名稱】的用餐體驗還不錯，整體服務和菜品質量都在可接受範圍內。

        雖然沒有特別驚艷的地方，但也沒有明顯的缺陷。適合對餐飲品質有一定要求的食客。`,
        'casualEatery': `這家【餐廳名稱】的用餐體驗相當不錯，特別適合家庭聚餐或朋友小聚。

        餐廳的環境舒適，服務人員態度友善。菜品方面，招牌的「【XX餐點】」味道不錯，讓人感到滿意。`,
        'bistroCafe': `【餐廳名稱】是一個不錯的選擇，特別是對於喜歡輕食和咖啡的人來說。

        這裡的飲品和小吃都很有水準，服務也相當到位。是一個可以放鬆心情，享受美好時光的地方。`,
        'themeRestaurant': `這家【餐廳名稱】的主題餐廳設計相當用心，讓人感受到濃厚的主題氛圍。

        菜品方面也頗具創意，特別是招牌菜「【XX餐點】」，不僅好看，味道也很不錯。`,
        'fastFood': `如果你想快速解決一餐，這家【餐廳名稱】的速食是個不錯的選擇。

        雖然是速食，但這裡的食物新鮮，味道也能讓人滿意。特別適合忙碌的上班族或學生族群。`,
        'streetFood': `這家【餐廳名稱】的街頭小吃讓我體驗到了地道的在地風味。

        食物的味道很不錯，特別是他們的招牌小吃【XX餐點】。雖然環境比較簡陋，但絕對不影響美食的享受。`,
        'default': `這家【餐廳名稱】的用餐體驗中規中矩，沒有特別的驚喜也沒有太大的失望。`
    },
    '4stars': {
        'fineDining': `在【餐廳名稱】享受了一頓[相當愉快的晚餐|令人滿意的午餐]。餐廳[裝潢典雅|環境舒適]，給人[高級感|放鬆的氛圍]。服務人員[專業且效率不錯|態度親切有禮]，對菜品也有[一定的了解|詳細的解說]，雖然有[少許不足|小瑕疵]，但整體表現[相當良好|令人讚賞]。

        主菜「【XX餐點】」[味道十分出色|口感佳]，[食材新鮮|烹飪手法熟練]。[配菜|甜點|飲品]也[表現不錯|有亮點]。份量[恰到好處|偏向精緻]。

        性價比[合理|略高]，是一次[值得的用餐體驗|會再訪的選擇]。推薦給[對美食有要求|想好好享受一餐]的朋友。`,
        'casualEatery': `【餐廳名稱】是個[不錯的選擇|值得一試的地方]。[休閒自在的氛圍|簡潔的環境]讓人感覺輕鬆。服務[效率不錯|態度也還可以]，[上菜速度快|應對自如]。

        主打的「【XX餐點】」[味道可口|風味獨特]，[份量適中|蠻大方]，[食材新鮮度沒問題|烹飪得宜]。[配菜|小吃]也[表現不錯|增添了風味]。

        價格[十分划算|CP值高]，是[家庭聚餐|朋友小聚]的好去處。會推薦給[想找輕鬆美味|經濟實惠]的朋友。`,
        'bistroCafe': `【餐廳名稱】是一個[充滿文藝氣息|適合放鬆]的咖啡館，很適合[度過一個悠閒的午後|和朋友小聚]。氛圍[很棒|燈光溫和]，讓人感覺很舒服。服務[雖然沒有頂級餐廳的規格，但也親切到位|熱情但不打擾]。

        飲品[味道濃郁|口感豐富]，【XX餐點】也[做得也很精緻|不會太甜]，整體餐飲水準[不錯|超出預期]。

        性價比[高|值得一試]，我會推薦給[想找個地方放鬆|喜歡咖啡輕食]的朋友。`,
        'themeRestaurant': `【餐廳名稱】的主題設定[很有趣|充滿創意]，讓用餐體驗[充滿驚喜|與眾不同]。環境[佈置用心|細節豐富]，很有[氣氛感|童趣]，適合[家庭聚餐|情侶約會]。服務人員[積極融入主題|互動有趣]，令人感到[愉悅|輕鬆]。

        餐點雖然[在主題下進行設計|創意十足]，味道上[也還算不錯|有些許亮點]。招牌菜「【XX餐點】」[視覺效果滿分|味道也過關]，[份量適中|可以吃飽]。

        綜合體驗下來，雖然餐點本身並非絕對頂級，但其[獨特的主題氛圍|帶來的歡樂]讓性價比[變得很高|值得花費]。是[會想再訪|值得分享]的餐廳。`,
        'fastFood': `【餐廳名稱】的速食店真是[方便快捷|效率極高]的選擇！雖然是快餐，但其【XX餐點】[味道出奇地好|品質穩定]，份量[充足|恰到好處]，是[趕時間時|想輕鬆用餐時]的[絕佳去處|不二之選]。

        店內環境[整潔明亮|簡單舒適]，服務人員[動作麻利|態度友善]，確保用餐體驗[流暢高效|輕鬆愉快]。尤其是他們的[炸雞|漢堡|薯條]，每次來都[必須點|令人回味]。

        性價比[非常高|經濟實惠]，對於追求[速度與實惠|簡潔美味]的食客來說，絕對值得[嘗試|成為常客]。`,
        'streetFood': `這家【餐廳名稱】的街頭小吃攤真是[寶藏般的存在|令人驚艷的發現]！雖然[環境簡陋|沒有華麗裝潢]，但其【XX餐點】的[地道風味|誘人香氣]讓人[一試難忘|回味無窮]，完全展現了[街頭美食的精髓|在地文化的魅力]。

        老闆[熱情招呼|手藝精湛]，烹製過程[乾淨俐落|充滿煙火氣]，讓你在等待的同時也能感受到[美食的魅力|生活的真實]。

        【XX餐點】[現做現賣|熱騰騰上桌]，[口感極佳|味道層次豐富]，[每一口都是享受|份量也實在]，絕對是[真材實料|用心製作]的體現。

        價格[超級親民|便宜大碗]，性價比[無可匹敵|高到破表]，絕對是[路過必買|想感受在地特色]的[最佳選擇|隱藏版美食]。`,
        'default': `這家【餐廳名稱】真的超棒！無論是環境、服務還是最重要的食物，都給了我一個[難忘的體驗|極高的滿足]。特別是【XX餐點】，完全征服了我的味蕾。`
    },
    '2stars': {
        'fineDining': `在【餐廳名稱】的用餐體驗讓我感到有些失望。雖然[環境優雅|裝潢精緻]，但整體服務和菜品質量未達預期。

        首先，服務方面，雖然人員態度[親切|友善]，但在高峰時段顯得有些忙亂，響應速度較慢。

        至於菜品，招牌的「【XX餐點】」雖然擺盤精美，但味道上並沒有特別突出之處，讓人感覺有些平淡。

        整體而言，這次的用餐體驗並不算差，但也沒有特別令人印象深刻的地方。對於追求高品質餐飲的食客來說，可能需要再考慮其他選擇。`,
        'casualEatery': `這家【餐廳名稱】的用餐體驗還算不錯，適合日常聚餐。

        餐廳的環境[舒適|乾淨]，服務人員也都很[友善|有禮貌]。我們點的【XX餐點】上菜速度不算慢，味道對得起這個價格。

        雖然不是特別驚艷，但在這個價位區間內，已經算是相當不錯的選擇了。`,
        'bistroCafe': `【餐廳名稱】是一個不錯的小酒館，適合和朋友小聚。

        這裡的氣氛相當不錯，服務人員也很熱情。點的飲品和小吃都能讓人感到滿意。

        如果你在找尋一個輕鬆的地方來享受美食和美酒，這裡會是一個好選擇。`,
        'themeRestaurant': `這家【餐廳名稱】的主題餐廳讓我感受到不一樣的用餐體驗。

        餐廳的佈置和菜單設計都很有主題性，讓人感受到用心。服務方面也很到位，讓人感到賓至如歸。

        不過，因為過於注重主題，菜品的味道上似乎有所妥協，沒有特別突出。`,
        'fastFood': `【餐廳名稱】的速食選擇對於快速用餐來說是個不錯的選擇。

        雖然是速食，但這裡的食物新鮮度和口味都能讓人滿意。特別是他們的【XX餐點】、快速又美味。`,
        'streetFood': `這家【餐廳名稱】的街頭小吃讓我體驗到了地道的在地風味。

        食物的味道很不錯，特別是他們的招牌小吃【XX餐點】。雖然環境比較簡陋，但絕對不影響美食的享受。`,
        'default': `這家【餐廳名稱】的用餐體驗中規中矩，沒有特別的驚喜也沒有太大的失望。`
    },
    '3stars': {
        'fineDining': `在【餐廳名稱】的用餐體驗還不錯，整體服務和菜品質量都在可接受範圍內。

        雖然沒有特別驚艷的地方，但也沒有明顯的缺陷。適合對餐飲品質有一定要求的食客。`,
        'casualEatery': `這家【餐廳名稱】的用餐體驗相當不錯，特別適合家庭聚餐或朋友小聚。

        餐廳的環境舒適，服務人員態度友善。菜品方面，招牌的「【XX餐點】」味道不錯，讓人感到滿意。`,
        'bistroCafe': `【餐廳名稱】是一個不錯的選擇，特別是對於喜歡輕食和咖啡的人來說。

        這裡的飲品和小吃都很有水準，服務也相當到位。是一個可以放鬆心情，享受美好時光的地方。`,
        'themeRestaurant': `這家【餐廳名稱】的主題餐廳設計相當用心，讓人感受到濃厚的主題氛圍。

        菜品方面也頗具創意，特別是招牌菜「【XX餐點】」，不僅好看，味道也很不錯。`,
        'fastFood': `如果你想快速解決一餐，這家【餐廳名稱】的速食是個不錯的選擇。

        雖然是速食，但這裡的食物新鮮，味道也能讓人滿意。特別適合忙碌的上班族或學生族群。`,
        'streetFood': `這家【餐廳名稱】的街頭小吃讓我體驗到了地道的在地風味。

        食物的味道很不錯，特別是他們的招牌小吃【XX餐點】。雖然環境比較簡陋，但絕對不影響美食的享受。`,
        'default': `這家【餐廳名稱】的用餐體驗中規中矩，沒有特別的驚喜也沒有太大的失望。`
    },
    '4stars': {
        'fineDining': `在【餐廳名稱】享受了一頓[相當愉快的晚餐|令人滿意的午餐]。餐廳[裝潢典雅|環境舒適]，給人[高級感|放鬆的氛圍]。服務人員[專業且效率不錯|態度親切有禮]，對菜品也有[一定的了解|詳細的解說]，雖然有[少許不足|小瑕疵]，但整體表現[相當良好|令人讚賞]。

        主菜「【XX餐點】」[味道十分出色|口感佳]，[食材新鮮|烹飪手法熟練]。[配菜|甜點|飲品]也[表現不錯|有亮點]。份量[恰到好處|偏向精緻]。

        性價比[合理|略高]，是一次[值得的用餐體驗|會再訪的選擇]。推薦給[對美食有要求|想好好享受一餐]的朋友。`,
        'casualEatery': `【餐廳名稱】是個[不錯的選擇|值得一試的地方]。[休閒自在的氛圍|簡潔的環境]讓人感覺輕鬆。服務[效率不錯|態度也還可以]，[上菜速度快|應對自如]。

        主打的「【XX餐點】」[味道可口|風味獨特]，[份量適中|蠻大方]，[食材新鮮度沒問題|烹飪得宜]。[配菜|小吃]也[表現不錯|增添了風味]。

        價格[十分划算|CP值高]，是[家庭聚餐|朋友小聚]的好去處。會推薦給[想找輕鬆美味|經濟實惠]的朋友。`,
        'bistroCafe': `【餐廳名稱】是一個[充滿文藝氣息|適合放鬆]的咖啡館，很適合[度過一個悠閒的午後|和朋友小聚]。氛圍[很棒|燈光溫和]，讓人感覺很舒服。服務[雖然沒有頂級餐廳的規格，但也親切到位|熱情但不打擾]。

        飲品[味道濃郁|口感豐富]，【XX餐點】也[做得也很精緻|不會太甜]，整體餐飲水準[不錯|超出預期]。

        性價比[高|值得一試]，我會推薦給[想找個地方放鬆|喜歡咖啡輕食]的朋友。`,
        'themeRestaurant': `【餐廳名稱】的主題設定[很有趣|充滿創意]，讓用餐體驗[充滿驚喜|與眾不同]。環境[佈置用心|細節豐富]，很有[氣氛感|童趣]，適合[家庭聚餐|情侶約會]。服務人員[積極融入主題|互動有趣]，令人感到[愉悅|輕鬆]。

        餐點雖然[在主題下進行設計|創意十足]，味道上[也還算不錯|有些許亮點]。招牌菜「【XX餐點】」[視覺效果滿分|味道也過關]，[份量適中|可以吃飽]。

        綜合體驗下來，雖然餐點本身並非絕對頂級，但其[獨特的主題氛圍|帶來的歡樂]讓性價比[變得很高|值得花費]。是[會想再訪|值得分享]的餐廳。`,
        'fastFood': `【餐廳名稱】的速食店真是[方便快捷|效率極高]的選擇！雖然是快餐，但其【XX餐點】[味道出奇地好|品質穩定]，份量[充足|恰到好處]，是[趕時間時|想輕鬆用餐時]的[絕佳去處|不二之選]。

        店內環境[整潔明亮|簡單舒適]，服務人員[動作麻利|態度友善]，確保用餐體驗[流暢高效|輕鬆愉快]。尤其是他們的[炸雞|漢堡|薯條]，每次來都[必須點|令人回味]。

        性價比[非常高|經濟實惠]，對於追求[速度與實惠|簡潔美味]的食客來說，絕對值得[嘗試|成為常客]。`,
        'streetFood': `這家【餐廳名稱】的街頭小吃攤真是[寶藏般的存在|令人驚艷的發現]！雖然[環境簡陋|沒有華麗裝潢]，但其【XX餐點】的[地道風味|誘人香氣]讓人[一試難忘|回味無窮]，完全展現了[街頭美食的精髓|在地文化的魅力]。

        老闆[熱情招呼|手藝精湛]，烹製過程[乾淨俐落|充滿煙火氣]，讓你在等待的同時也能感受到[美食的魅力|生活的真實]。

        【XX餐點】[現做現賣|熱騰騰上桌]，[口感極佳|味道層次豐富]，[每一口都是享受|份量也實在]，絕對是[真材實料|用心製作]的體現。

        價格[超級親民|便宜大碗]，性價比[無可匹敵|高到破表]，絕對是[路過必買|想感受在地特色]的[最佳選擇|隱藏版美食]。`,
        'default': `這家【餐廳名稱】真的超棒！無論是環境、服務還是最重要的食物，都給了我一個[難忘的體驗|極高的滿足]。特別是【XX餐點】，完全征服了我的味蕾。`
    },
    '2stars': {
        'fineDining': `在【餐廳名稱】的用餐體驗讓我感到有些失望。雖然[環境優雅|裝潢精緻]，但整體服務和菜品質量未達預期。

        首先，服務方面，雖然人員態度[親切|友善]，但在高峰時段顯得有些忙亂，響應速度較慢。

        至於菜品，招牌的「【XX餐點】」雖然擺盤精美，但味道上並沒有特別突出之處，讓人感覺有些平淡。

        整體而言，這次的用餐體驗並不算差，但也沒有特別令人印象深刻的地方。對於追求高品質餐飲的食客來說，可能需要再考慮其他選擇。`,
        'casualEatery': `這家【餐廳名稱】的用餐體驗還算不錯，適合日常聚餐。

        餐廳的環境[舒適|乾淨]，服務人員也都很[友善|有禮貌]。我們點的【XX餐點】上菜速度不算慢，味道對得起這個價格。

        雖然不是特別驚艷，但在這個價位區間內，已經算是相當不錯的選擇了。`,
        'bistroCafe': `【餐廳名稱】是一個不錯的小酒館，適合和朋友小聚。

        這裡的氣氛相當不錯，服務人員也很熱情。點的飲品和小吃都能讓人感到滿意。

        如果你在找尋一個輕鬆的地方來享受美食和美酒，這裡會是一個好選擇。`,
        'themeRestaurant': `這家【餐廳名稱】的主題餐廳讓我感受到不一樣的用餐體驗。

        餐廳的佈置和菜單設計都很有主題性，讓人感受到用心。服務方面也很到位，讓人感到賓至如歸。

        不過，因為過於注重主題，菜品的味道上似乎有所妥協，沒有特別突出。`,
        'fastFood': `【餐廳名稱】的速食選擇對於快速用餐來說是個不錯的選擇。

        雖然是速食，但這裡的食物新鮮度和口味都能讓人滿意。特別是他們的【XX餐點】、快速又美味。`,
        'streetFood': `這家【餐廳名稱】的街頭小吃讓我體驗到了地道的在地風味。

        食物的味道很不錯，特別是他們的招牌小吃【XX餐點】。雖然環境比較簡陋，但絕對不影響美食的享受。`,
        'default': `這家【餐廳名稱】的用餐體驗中規中矩，沒有特別的驚喜也沒有太大的失望。`
    },
    '3stars': {
        'fineDining': `在【餐廳名稱】的用餐體驗還不錯，整體服務和菜品質量都在可接受範圍內。

        雖然沒有特別驚艷的地方，但也沒有明顯的缺陷。適合對餐飲品質有一定要求的食客。`,
        'casualEatery': `這家【餐廳名稱】的用餐體驗相當不錯，特別適合家庭聚餐或朋友小聚。

        餐廳的環境舒適，服務人員態度友善。菜品方面，招牌的「【XX餐點】」味道不錯，讓人感到滿意。`,
        'bistroCafe': `【餐廳名稱】是一個不錯的選擇，特別是對於喜歡輕食和咖啡的人來說。

        這裡的飲品和小吃都很有水準，服務也相當到位。是一個可以放鬆心情，享受美好時光的地方。`,
        'themeRestaurant': `這家【餐廳名稱】的主題餐廳設計相當用心，讓人感受到濃厚的主題氛圍。

        菜品方面也頗具創意，特別是招牌菜「【XX餐點】」，不僅好看，味道也很不錯。`,
        'fastFood': `如果你想快速解決一餐，這家【餐廳名稱】的速食是個不錯的選擇。

        雖然是速食，但這裡的食物新鮮，味道也能讓人滿意。特別適合忙碌的上班族或學生族群。`,
        'streetFood': `這家【餐廳名稱】的街頭小吃讓我體驗到了地道的在地風味。

        食物的味道很不錯，特別是他們的招牌小吃【XX餐點】。雖然環境比較簡陋，但絕對不影響美食的享受。`,
        'default': `這家【餐廳名稱】的用餐體驗中規中矩，沒有特別的驚喜也沒有太大的失望。`
    },
    '4stars': {
        'fineDining': `在【餐廳名稱】享受了一頓[相當愉快的晚餐|令人滿意的午餐]。餐廳[裝潢典雅|環境舒適]，給人[高級感|放鬆的氛圍]。服務人員[專業且效率不錯|態度親切有禮]，對菜品也有[一定的了解|詳細的解說]，雖然有[少許不足|小瑕疵]，但整體表現[相當良好|令人讚賞]。

        主菜「【XX餐點】」[味道十分出色|口感佳]，[食材新鮮|烹飪手法熟練]。[配菜|甜點|飲品]也[表現不錯|有亮點]。份量[恰到好處|偏向精緻]。

        性價比[合理|略高]，是一次[值得的用餐體驗|會再訪的選擇]。推薦給[對美食有要求|想好好享受一餐]的朋友。`,
        'casualEatery': `【餐廳名稱】是個[不錯的選擇|值得一試的地方]。[休閒自在的氛圍|簡潔的環境]讓人感覺輕鬆。服務[效率不錯|態度也還可以]，[上菜速度快|應對自如]。

        主打的「【XX餐點】」[味道可口|風味獨特]，[份量適中|蠻大方]，[食材新鮮度沒問題|烹飪得宜]。[配菜|小吃]也[表現不錯|增添了風味]。

        價格[十分划算|CP值高]，是[家庭聚餐|朋友小聚]的好去處。會推薦給[想找輕鬆美味|經濟實惠]的朋友。`,
        'bistroCafe': `【餐廳名稱】是一個[充滿文藝氣息|適合放鬆]的咖啡館，很適合[度過一個悠閒的午後|和朋友小聚]。氛圍[很棒|燈光溫和]，讓人感覺很舒服。服務[雖然沒有頂級餐廳的規格，但也親切到位|熱情但不打擾]。

        飲品[味道濃郁|口感豐富]，【XX餐點】也[做得也很精緻|不會太甜]，整體餐飲水準[不錯|超出預期]。

        性價比[高|值得一試]，我會推薦給[想找個地方放鬆|喜歡咖啡輕食]的朋友。`,
        'themeRestaurant': `【餐廳名稱】的主題設定[很有趣|充滿創意]，讓用餐體驗[充滿驚喜|與眾不同]。環境[佈置用心|細節豐富]，很有[氣氛感|童趣]，適合[家庭聚餐|情侶約會]。服務人員[積極融入主題|互動有趣]，令人感到[愉悅|輕鬆]。

        餐點雖然[在主題下進行設計|創意十足]，味道上[也還算不錯|有些許亮點]。招牌菜「【XX餐點】」[視覺效果滿分|味道也過關]，[份量適中|可以吃飽]。

        綜合體驗下來，雖然餐點本身並非絕對頂級，但其[獨特的主題氛圍|帶來的歡樂]讓性價比[變得很高|值得花費]。是[會想再訪|值得分享]的餐廳。`,
        'fastFood': `【餐廳名稱】的速食店真是[方便快捷|效率極高]的選擇！雖然是快餐，但其【XX餐點】[味道出奇地好|品質穩定]，份量[充足|恰到好處]，是[趕時間時|想輕鬆用餐時]的[絕佳去處|不二之選]。

        店內環境[整潔明亮|簡單舒適]，服務人員[動作麻利|態度友善]，確保用餐體驗[流暢高效|輕鬆愉快]。尤其是他們的[炸雞|漢堡|薯條]，每次來都[必須點|令人回味]。

        性價比[非常高|經濟實惠]，對於追求[速度與實惠|簡潔美味]的食客來說，絕對值得[嘗試|成為常客]。`,
        'streetFood': `這家【餐廳名稱】的街頭小吃攤真是[寶藏般的存在|令人驚艷的發現]！雖然[環境簡陋|沒有華麗裝潢]，但其【XX餐點】的[地道風味|誘人香氣]讓人[一試難忘|回味無窮]，完全展現了[街頭美食的精髓|在地文化的魅力]。

        老闆[熱情招呼|手藝精湛]，烹製過程[乾淨俐落|充滿煙火氣]，讓你在等待的同時也能感受到[美食的魅力|生活的真實]。

        【XX餐點】[現做現賣|熱騰騰上桌]，[口感極佳|味道層次豐富]，[每一口都是享受|份量也實在]，絕對是[真材實料|用心製作]的體現。

        價格[超級親民|便宜大碗]，性價比[無可匹敵|高到破表]，絕對是[路過必買|想感受在地特色]的[最佳選擇|隱藏版美食]。`,
        'default': `這家【餐廳名稱】真的超棒！無論是環境、服務還是最重要的食物，都給了我一個[難忘的體驗|極高的滿足]。特別是【XX餐點】，完全征服了我的味蕾。`
    }
};

// 儲存空間顯示元件
const StorageUsageBar = ({ usedBytes, maxBytes }) => {
  const usedKB = Math.round(usedBytes / 1024);
  const maxMB = (maxBytes / (1024 * 1024)).toFixed(1);
  const percent = Math.min(100, Math.round((usedBytes / maxBytes) * 100));
  let color = '#4caf50';
  if (percent > 80) color = '#f44336';
  else if (percent > 60) color = '#ff9800';
  return (
    <div className="storage-bar-container" title={`儲存使用量：${usedKB} KB / ${maxMB} MB`}>
      <div className="storage-bar-fill" style={{ width: `${percent}%`, background: color }}></div>
      <span className="storage-text">{percent}%（{usedKB} KB / {maxMB} MB）</span>
    </div>
  );
};

// Main Component
const FoodReviewGenerator = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({});
  const [uploadedImages, setUploadedImages] = useState([]);
  const [savedReviews, setSavedReviews] = useState([]);
  const [editingReview, setEditingReview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedReview, setGeneratedReview] = useState(null);
  const fileInputRef = useRef(null);
  const previewRef = useRef(null);
  const [showSavedReviews, setShowSavedReviews] = useState(false);
  const [isGuidanceVisible, setIsGuidanceVisible] = useState(false); // 預設為 false，不顯示歡迎畫面
  const [storageUsage, setStorageUsage] = useState(0); // 儲存使用量 (bytes)
  const MAX_STORAGE_BYTES = 5 * 1024 * 1024; // localStorage 限制通常為 5MB (5MB in bytes)

  // 將 getStorageUsage 提升到元件頂部，確保 renderContent 可用
  const getStorageUsage = () => {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += ((localStorage[key]?.length || 0) + key.length) * 2; // 2 bytes per char
      }
    }
    return total;
  };

  // === START: 草稿載入與保存邏輯 ===
  // 載入草稿：只在元件掛載時執行一次
  useEffect(() => {
    const savedDraft = localStorage.getItem('foodReviewDraft');
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      if (Object.keys(draft.selections || {}).length > 0 || (draft.uploadedImages || []).length > 0) {
        if (window.confirm('偵測到未完成的草稿，是否載入？')) {
          setSelections(draft.selections || {});
          setUploadedImages(draft.uploadedImages || []);
          setCurrentStep(draft.currentStep || 0);
        } else {
          localStorage.removeItem('foodReviewDraft');
          console.log('用戶已拒絕載入草稿，草稿已清除');
        }
      }
    }
  }, []);

  // 自動儲存：在依賴項改變時執行
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(selections).length > 0 || uploadedImages.length > 0) {
        localStorage.setItem('foodReviewDraft', JSON.stringify({
          selections,
          uploadedImages,
          currentStep,
        }));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selections, uploadedImages, currentStep]);
  // === END: 草稿載入與保存邏輯 ===

  // 從 localStorage 載入已保存的文章
  useEffect(() => {
    const storedReviews = localStorage.getItem('savedFoodReviews');
    if (storedReviews) {
      setSavedReviews(JSON.parse(storedReviews));
    }
  }, []);

  // 當 savedReviews 改變時，保存到 localStorage
  useEffect(() => {
    localStorage.setItem('savedFoodReviews', JSON.stringify(savedReviews));
    calculateAndSetStorageUsage(); // 當保存文章時更新儲存使用量
  }, [savedReviews]);


  // 計算 localStorage 使用量
  const calculateAndSetStorageUsage = useCallback(() => {
    let totalLength = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        totalLength += (key ? key.length : 0);
        totalLength += (value ? value.length : 0);
    }
    // Convert to bytes (assuming 2 bytes per char for UTF-16)
    // This is an estimation, actual storage can vary based on browser implementation and compression.
    setStorageUsage(totalLength * 2);
  }, []);

  // 組件掛載時和數據相關狀態改變時更新儲存使用量
  useEffect(() => {
    calculateAndSetStorageUsage();
    // Also recalculate when selection or images change to reflect draft size
  }, [calculateAndSetStorageUsage, selections, uploadedImages]); 

  // 獲取儲存使用量圖示和顏色
  const getStorageStatus = () => {
    const percentage = (storageUsage / MAX_STORAGE_BYTES) * 100;
    let icon = <LucideIcons.Server size={18} />; // 預設圖示
    let colorClass = 'storage-normal';

    if (percentage > 80) {
      icon = <LucideIcons.ServerCrash size={18} />; // 超過80%用紅色圖示
      colorClass = 'storage-critical';
    } else if (percentage > 50) {
      icon = <LucideIcons.ServerOff size={18} />; // 超過50%用黃色圖示
      colorClass = 'storage-warning';
    }

    return {
      icon,
      colorClass,
      percentage: Math.round(percentage),
      usedKB: (storageUsage / 1024).toFixed(1)
    }; // 返回所有相關資訊
  };


  // 壓縮圖片功能
  const compressImage = (file, maxWidth = 1000, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    const newImages = [];
    for (const file of files) {
      if (file) {
        const compressedFile = await compressImage(file);
        newImages.push(URL.createObjectURL(compressedFile));
      }
    }
    setUploadedImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (indexToRemove) => {
    if (window.confirm('確定要刪除這張照片嗎？')) {
      setUploadedImages(prev => prev.filter((_, index) => index !== indexToRemove));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelections(prev => ({ ...prev, [name]: value }));
  };

  // 選擇卡片後，直接處理跳轉邏輯
  const selectCard = (cardId) => {
    const newSelections = { ...selections, [questionSets[currentStep].key]: cardId };
    setSelections(newSelections);

    setTimeout(() => {
      // 如果不是最後一個問題步驟（通常最後一個是圖片上傳），則跳到下一步
      // 判斷方式是檢查是否還有下一個問題（排除掉圖片上傳步驟本身在 questionSets 裡的索引）
      if (currentStep < questionSets.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        // 如果已經是最後一個問題（在圖片上傳頁之前），則生成文章
        generateReview(newSelections);
      }
    }, 300);
  };

  // 生成美食文章
  const generateReview = (finalSelections) => {
    console.log('--- generateReview started ---');
    console.log('finalSelections:', finalSelections);
    const {
      overallRating, restaurantStyle, ambiance,
      serviceEfficiency, serviceAttitude, staffKnowledge,
      mainDishFlavor, mainDishTexture, dishPortion,
      sideDishQuality, beverageQuality, dessertQuality,
      ingredientFreshness, cookingTechnique, cleanliness,
      valueForMoney, wouldRecommend, finalThoughts
    } = finalSelections;

    console.log('Destructured selections:', { overallRating, restaurantStyle, ambiance, serviceEfficiency, serviceAttitude, staffKnowledge, mainDishFlavor, mainDishTexture, dishPortion, sideDishQuality, beverageQuality, dessertQuality, ingredientFreshness, cookingTechnique, cleanliness, valueForMoney, wouldRecommend, finalThoughts });

    let reviewText = getNestedValue(
      reviewTemplates,
      [overallRating, restaurantStyle],
      getNestedValue(reviewTemplates, [overallRating, 'default'], reviewTemplates['3stars'].default)
    );
    console.log('Initial reviewText from template:', reviewText);

    if (!reviewText) {
        reviewText = reviewTemplates['3stars'].default; // Final fallback
        console.log('Using fallback reviewText:', reviewText);
    }

    const restaurantName = finalSelections.restaurantName || selections.restaurantName || '這家餐廳';
    const dishName = finalSelections.dishName || selections.dishName || '這道招牌菜';
    const price = finalSelections.price || selections.price || '未說明';

    console.log('Restaurant/Dish/Price:', { restaurantName, dishName, price });

    reviewText = reviewText
      .replace(/【餐廳名稱】/g, restaurantName)
      .replace(/【XX餐點】/g, dishName)
      .replace(/XX元/g, price);

    console.log('reviewText after placeholders:', reviewText);

    reviewText = reviewText.replace(/\\\[([^\]]+?)\\\]/g, (match, options) => {
      const optionArray = options.split('|');
      return getRandomElement(optionArray);
    });
    console.log('reviewText after random options:', reviewText);

    const serviceComments = [];
    const efficiencyTitle = questionSets.find(q => q.key === 'serviceEfficiency')?.cards.find(c => c.id === serviceEfficiency)?.title;
    const attitudeTitle = questionSets.find(q => q.key === 'serviceAttitude')?.cards.find(c => c.id === serviceAttitude)?.title;
    const knowledgeTitle = questionSets.find(q => q.key === 'staffKnowledge')?.cards.find(c => c.id === staffKnowledge)?.title;
    if (efficiencyTitle === '非常迅速') serviceComments.push('服務反應迅速');
    else if (efficiencyTitle === '緩慢低效' || efficiencyTitle === '無法接受') serviceComments.push('效率有些緩慢');
    if (attitudeTitle === '親切有禮' || attitudeTitle === '專業得體') serviceComments.push('服務人員親切有禮');
    else if (attitudeTitle === '冷漠或無禮') serviceComments.push('服務態度冷漠');
    if (knowledgeTitle === '非常專業' || knowledgeTitle === '專家推薦') serviceComments.push('對菜品了解專業');
    else if (knowledgeTitle === '不夠了解' || knowledgeTitle === '只會讀菜單') serviceComments.push('對菜品不甚了解');
    if (serviceComments.length > 0) reviewText += `\\n\\n服務方面，${serviceComments.join('，')}，令人${(efficiencyTitle==='非常迅速' && attitudeTitle==='親切有禮') ? '印象深刻' : '感到……'}${efficiencyTitle==='緩慢低效' ? '有待加強' : ''}。`;
    console.log('reviewText after service comments:', reviewText);

    const foodComments = [];
    const mainFlavorTitle = questionSets.find(q => q.key === 'mainDishFlavor')?.cards.find(c => c.id === mainDishFlavor)?.title;
    const mainTextureTitle = questionSets.find(q => q.key === 'mainDishTexture')?.cards.find(c => c.id === mainDishTexture)?.title;
    const portionTitle = questionSets.find(q => q.key === 'dishPortion')?.cards.find(c => c.id === dishPortion)?.title;
    const sideQualityTitle = questionSets.find(q => q.key === 'sideDishQuality')?.cards.find(c => c.id === sideDishQuality)?.title;
    const beverageQualityTitle = questionSets.find(q => q.key === 'beverageQuality')?.cards.find(c => c.id === beverageQuality)?.title;
    const dessertQualityTitle = questionSets.find(q => q.key === 'dessertQuality')?.cards.find(c => c.id === dessertQuality)?.title;
    const ingredientFreshnessTitle = questionSets.find(q => q.key === 'ingredientFreshness')?.cards.find(c => c.id === ingredientFreshness)?.title;
    const cookingTechniqueTitle = questionSets.find(q => q.key === 'cookingTechnique')?.cards.find(c => c.id === cookingTechnique)?.title;

    if (mainFlavorTitle === '驚為天人' || mainFlavorTitle === '獨特風味' || mainFlavorTitle === '經典完美') foodComments.push(`${dishName}的風味無可挑剔`);
    else if (mainFlavorTitle === '味道平淡' || mainFlavorTitle === '味道不佳') foodComments.push(`${dishName}的味道平淡無奇，有待改進`);

    if (mainTextureTitle === '完美口感' || mainTextureTitle === '口感良好' || mainTextureTitle === '驚喜口感' || mainTextureTitle === 'Q彈到位') foodComments.push(`${dishName}的口感達到了完美`);
    else if (mainTextureTitle === '口感不佳') foodComments.push(`${dishName}的口感不佳`);

    if (portionTitle === '份量十足' || portionTitle === '份量超大' || portionTitle === '共享份量') foodComments.push(`份量非常慷慨`);
    else if (portionTitle === '偏少' || portionTitle === '迷你品嚐') foodComments.push(`份量偏少，可能不太夠吃`);

    if (sideQualityTitle === '水準之上' || sideQualityTitle === '創意配菜' || sideQualityTitle === '相得益彰') foodComments.push(`連配菜都水準之上`);
    else if (sideQualityTitle === '略顯不足') foodComments.push(`配菜略顯不足，還有進步空間`);

    if (beverageQualityTitle && beverageQualityTitle !== '未點') {
      if (beverageQualityTitle === '非常出色' || beverageQualityTitle === '招牌飲品') foodComments.push(`飲品表現驚艷`);
      else if (beverageQualityTitle === '令人失望') foodComments.push(`飲品令人失望`);
      else foodComments.push(`飲品品質${beverageQualityTitle.replace('品質不錯', '不錯').replace('一般', '普通')}`);
    }
    if (dessertQualityTitle && dessertQualityTitle !== '未點') {
        if (dessertQualityTitle === '畫龍點睛' || dessertQualityTitle === '創新甜點') foodComments.push(`甜點畫龍點睛，為用餐畫下完美句號`);
        else if (dessertQualityTitle === '過於甜膩') foodComments.push(`甜點過於甜膩`);
        else foodComments.push(`甜點${dessertQualityTitle}`);
    }

    if (ingredientFreshnessTitle === '極致新鮮' || ingredientFreshnessTitle === '在地有機' || ingredientFreshnessTitle === '季節限定') foodComments.push(`食材新鮮度極高，感受得到原味`);
    else if (ingredientFreshnessTitle === '不新鮮') foodComments.push(`食材似乎不夠新鮮，有些疑慮`);

    if (cookingTechniqueTitle === '大師級' || cookingTechniqueTitle === '創新獨特' || cookingTechniqueTitle === '道地傳統') foodComments.push(`烹飪技巧展現大師水準，令人讚嘆`);
    else if (cookingTechniqueTitle === '粗糙') foodComments.push(`烹飪技巧顯得粗糙，影響口感`);

    if (foodComments.length > 0) {
      reviewText += `\\n\\n食物方面，${foodComments.join('，')}。`;
    }
    console.log('reviewText after food comments:', reviewText);

    const cleanlinessTitle = questionSets.find(q => q.key === 'cleanliness')?.cards.find(c => c.id === cleanliness)?.title;
    if (cleanlinessTitle === '一塵不染' || cleanlinessTitle === '廁所潔淨' || cleanlinessTitle === '餐具潔淨') {
        reviewText += `\\n\\n餐廳環境方面，維持得${cleanlinessTitle}，令人用餐安心。`;
    } else if (cleanlinessTitle === '有待加強' || cleanlinessTitle === '桌面黏膩') {
        reviewText += `\\n\\n然而，餐廳環境${cleanlinessTitle}，這點有待改善。`;
    }
    console.log('reviewText after cleanliness comments:', reviewText);

    const valueForMoneyTitle = questionSets.find(q => q.key === 'valueForMoney')?.cards.find(c => c.id === valueForMoney)?.title;
    const finalThoughtsDescription = questionSets.find(q => q.key === 'finalThoughts')?.cards.find(c => c.id === finalThoughts)?.title;
    const wouldRecommendDescription = questionSets.find(q => q.key === 'wouldRecommend')?.cards.find(c => c.id === wouldRecommend)?.title;

    console.log('Final/Recommend titles:', { valueForMoneyTitle, finalThoughtsDescription, wouldRecommendDescription });

    if (finalThoughtsDescription && finalThoughts !== 'noSpecialThoughts') {
        reviewText += `\\n\\n總體來說，這次用餐是一次${finalThoughtsDescription}的體驗。`;
    }

    if (wouldRecommendDescription) {
        reviewText += `\\n${wouldRecommendDescription}！`;
    }
    console.log('reviewText after final/recommend comments:', reviewText);


    const review = {
      id: editingReview?.id || Date.now(),
      restaurantName: restaurantName,
      reviewText: reviewText,
      selections: finalSelections,
      images: uploadedImages,
      createdAt: editingReview?.createdAt || new Date().toLocaleString(),
    };

    console.log('Generated review object:', review);

    setGeneratedReview(review);
    console.log('setGeneratedReview called');
    setShowPreview(true);
    console.log('setShowPreview(true) called');
    console.log('--- generateReview finished ---');
  };

  const quickRegenerate = () => {
    console.log('quickRegenerate clicked');
    generateReview(selections);
    // setShowPreview(true); // generateReview already calls setShowPreview(true)
  };

  const saveReview = () => {
    console.log('saveReview clicked');
    if (generatedReview) {
      setSavedReviews(prev => {
        if (editingReview) {
          return prev.map(review => review.id === editingReview.id ? generatedReview : review);
        }
        return [...prev, generatedReview];
      });
      setEditingReview(null);
      alert('文章已保存！');
      console.log('Review saved');
    }
  };

  const editReview = (review) => {
    console.log('editReview clicked', review);
    setEditingReview(review);
    setGeneratedReview({ ...review });
    setSelections(review.selections || {});
    setUploadedImages(review.images || []);
    setShowPreview(true);
    setCurrentStep(questionSets.length -1); // 設置為圖片上傳步驟，因為它的下一步就是預覽
    setShowSavedReviews(false);
    console.log('Editing review');
  };

  const deleteReview = (id) => {
    console.log('deleteReview clicked', id);
    if (window.confirm('確定要刪除這篇文章嗎？')) {
      setSavedReviews(prev => prev.filter(review => review.id !== id));
      alert('文章已刪除！');
      console.log('Review deleted');
    }
  };

  const shareReview = (platform) => {
    console.log('shareReview clicked', platform);
    alert(`模擬分享到 ${platform}！`);
  };

  const exportAsImage = useCallback(async () => {
    console.log('exportAsImage clicked');
    if (previewRef.current) {
      console.log('Preview ref available, exporting...');
      const canvas = await html2canvas(previewRef.current, {
        useCORS: true,
        scale: 2,
        windowWidth: previewRef.current.scrollWidth,
        windowHeight: previewRef.current.scrollHeight,
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `${generatedReview.restaurantName}_美食文章.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('Image exported');
    } else {
      console.log('Preview ref not available for export');
    }
  }, [generatedReview]);

  const restart = () => {
    console.log('restart clicked');
    setCurrentStep(0);
    setSelections({});
    setUploadedImages([]);
    setGeneratedReview(null);
    setShowPreview(false);
    setEditingReview(null);
    setShowSavedReviews(false);
    localStorage.removeItem('foodReviewDraft'); // 清除草稿
    calculateAndSetStorageUsage(); // 清除草稿後更新儲存使用量
    console.log('App restarted');
  };

  // *** 簡化並修正 nextStep 的邏輯 ***
  const nextStep = () => {
    console.log('nextStep clicked, currentStep:', currentStep);
    const currentQuestion = questionSets[currentStep];

    if (currentQuestion.type === 'input') {
      if (!selections.restaurantName || !selections.dishName) {
        alert('請填寫餐廳名稱和招牌菜！');
        console.log('Input validation failed');
        return;
      }
    }
    // 注意：對於卡片選擇類型，不再在此處檢查 `selections[currentQuestion.key]`
    // 因為 `selectCard` 函數已經在用戶點擊卡片時處理了自動跳轉。
    // 這個 `nextStep` 按鈕主要用於輸入框和圖片上傳頁面的手動前進。

    // 如果當前是最後一個步驟 (圖片上傳頁)，則生成文章。
    if (currentStep === questionSets.length - 1) {
      console.log('Reached last step (image upload), generating review...');
      generateReview(selections);
      // generateReview now handles setShowPreview(true)
    } else {
      // 否則，只是簡單地推進到下一個步驟。
      console.log('Moving to next step');
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    console.log('prevStep clicked, currentStep:', currentStep);
    setCurrentStep(prev => Math.max(prev - 1, 0));
    console.log('Moved to previous step');
  };

  const renderContent = () => {
    const { icon: storageIcon, colorClass: storageColorClass, percentage: storagePercentage, usedKB: storageUsedKB } = getStorageStatus();
    const currentQuestionSet = questionSets[currentStep];
    const isImageUploadStep = currentQuestionSet.key === 'imageUploadStep';
    
    // 這是一個局部函數，只用於當前渲染，確保它能夠訪問到正確的 LucideIcons
    const getRenderedLucideIcon = (iconName, size = 48) => {
        const IconComponent = getLucideComponent(iconName);
        return IconComponent ? <IconComponent size={size} /> : <span>{iconName}</span>;
    };


    if (showSavedReviews) {
      return (
        <div className="saved-reviews-container">
          {/* Header bar for Saved Reviews page */}
          <div className="header-bar">
            <h1>我的美食收藏</h1>
            <div className="header-actions">
                <StorageUsageBar usedBytes={getStorageUsage()} maxBytes={MAX_STORAGE_BYTES} />
                {/* 切換到主介面（生成器） */}
                <button onClick={() => setShowSavedReviews(false)} className="icon-button"><LucideIcons.BookText size={20} /> 回到生成器</button>
                <button onClick={restart} className="icon-button"><LucideIcons.RotateCcw size={20} /> 重新開始</button>
            </div>
          </div>
          {/* No specific "back-button" below header in this layout as header bar handles navigation */}

          {savedReviews.length === 0 ? (
            <p className="empty-state-message">還沒有保存任何文章。趕快去創建第一篇吧！</p>
          ) : (
            <ul className="saved-reviews-list">
              {savedReviews.map(review => (
                <li key={review.id} className="saved-review-item">
                  <h3>{review.restaurantName}</h3>
                  <p className="review-date">{review.createdAt}</p>
                  <div className="review-actions">
                    <button onClick={() => editReview(review)} className="icon-button"><LucideIcons.Edit3 size={18} /> 編輯</button>
                    <button onClick={() => deleteReview(review.id)} className="icon-button delete-button"><LucideIcons.Trash2 size={18} /> 刪除</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    if (showPreview) {
      return (
        <div className="preview-section">
          {/* Header bar for Preview page */}
          <div className="header-bar">
            <h1>美食文章預覽</h1>
            <div className="header-actions">
                <StorageUsageBar usedBytes={getStorageUsage()} maxBytes={MAX_STORAGE_BYTES} />
                {/* 從預覽頁切換到我的收藏 */}
                <button onClick={() => setShowSavedReviews(true)} className="icon-button"><LucideIcons.Save size={20} /> 我的收藏</button>
                <button onClick={restart} className="icon-button"><LucideIcons.RotateCcw size={20} /> 重新開始</button>
            </div>
          </div>
          
          {/* Back button to return to the last question step (image upload) */}
          <button className="back-button" onClick={() => setShowPreview(false)}>
              <LucideIcons.ArrowLeft size={20} /> 返回
          </button>
          <h2 className="section-title">您的美食文章預覽</h2> {/* 調整標題位置 */}
          <div className="preview-actions">
            <button onClick={quickRegenerate} className="action-button primary"><LucideIcons.RotateCcw size={20} /> 重新生成</button>
            <button onClick={saveReview} className="action-button secondary"><LucideIcons.Save size={20} /> 保存文章</button>
          </div>

          {generatedReview && (
            <div className="generated-review-card" ref={previewRef}>
              <div className="review-images">
                {uploadedImages.length > 0 ? (
                  uploadedImages.map((imgSrc, index) => (
                    <img key={index} src={imgSrc} alt={`Uploaded ${index + 1}`} className="review-image" />
                  ))
                ) : (
                  <div className="no-image-placeholder">
                    <LucideIcons.Camera size={48} />
                    <p>沒有上傳圖片</p>
                  </div>
                )}
              </div>
              <div className="review-info-block">
                <h3 className="review-restaurant-name">{generatedReview.restaurantName}</h3>
                <div className="review-meta">
                  {selections.overallRating && (
                    <p className="star-rating-display">
                      {Array.from({ length: Math.floor(questionSets.find(q => q.key === 'overallRating')?.cards.find(c => c.id === selections.overallRating)?.starCount || 0) }).map((_, i) => (
                        <LucideIcons.Star key={i} size={18} fill="gold" stroke="gold" />
                      ))}
                      {questionSets.find(q => q.key === 'overallRating')?.cards.find(c => c.id === selections.overallRating)?.starCount % 1 !== 0 && (
                        <LucideIcons.StarHalf key="half-preview" size={18} fill="gold" stroke="gold" />
                      )}
                      <span>{questionSets.find(q => q.key === 'overallRating')?.cards.find(c => c.id === selections.overallRating)?.title}</span>
                    </p>
                  )}
                  {selections.restaurantStyle && (() => {
                    const styleCard = questionSets.find(q => q.key === 'restaurantStyle')?.cards.find(c => c.id === selections.restaurantStyle);
                    const IconComponent = getLucideComponent(styleCard?.icon);
                    return IconComponent ? (
                      <p><IconComponent size={16} /> {styleCard.title}</p>
                    ) : null;
                  })()}
                  {selections.ambiance && (() => {
                    const ambianceCard = questionSets.find(q => q.key === 'ambiance')?.cards.find(c => c.id === selections.ambiance);
                    const IconComponent = getLucideComponent(ambianceCard?.icon);
                    return IconComponent ? (
                      <p><IconComponent size={16} /> {ambianceCard.title}</p>
                    ) : null;
                  })()}
                  {selections.valueForMoney && <p><LucideIcons.DollarSign size={16} /> {questionSets.find(q => q.key === 'valueForMoney')?.cards.find(c => c.id === selections.valueForMoney)?.title}</p>}
                </div>
                <div className="review-text-block">
                  {generatedReview.reviewText.split('\\n').map((line, idx) => line.trim() && <p key={idx}>{line}</p>)}
                </div>
              </div>
            </div>
          )}

          <div className="share-export-actions">
            <button onClick={exportAsImage} className="action-button primary"><LucideIcons.Download size={20} /> 匯出為圖片</button>
            <button onClick={() => shareReview('Facebook')} className="action-button secondary"><LucideIcons.Share2 size={20} /> 分享到社群</button>
          </div>
          {/* 最後一頁增加重新開始按鍵 */}
          <div className="final-page-restart">
             <button onClick={restart} className="action-button secondary"><LucideIcons.RotateCcw size={20} /> 重新開始</button>
          </div>
        </div>
      );
    }
    // ==============================================================================

    // 主介面渲染
    return (
      <div className="generator-container">
        {/* Header bar for Main Generator flow */}
        <div className="header-bar">
          <h1>美食文章生成器</h1>
          <div className="header-actions">
            {/* 顯示儲存使用量條 */}
            <StorageUsageBar usedBytes={getStorageUsage()} maxBytes={MAX_STORAGE_BYTES} />
            {/* 收藏按鈕始終顯示 */}
            <button onClick={() => setShowSavedReviews(true)} className="icon-button"><LucideIcons.Save size={20} /> 我的收藏</button>
            {/* 重新開始按鈕始終顯示 */}
            <button onClick={restart} className="icon-button"><LucideIcons.RotateCcw size={20} /> 重新開始</button>
          </div>
        </div>

        <div className="progress-bar">
          {questionSets.map((qSet, index) => {
            const isCurrent = index === currentStep;
            const isCompleted = index < currentStep;
            return (
              <div key={index} className={`progress-step ${isCurrent ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}></div>
            );
          })}
        </div>

        <div className="question-section">
          <h2 className="question-text">{currentQuestionSet.question}</h2>

          {currentQuestionSet.type === 'input' ? (
            <div className="input-group">
              <label htmlFor="restaurantName">餐廳名稱</label>
              <input
                type="text"
                id="restaurantName"
                name="restaurantName"
                placeholder="例如：王家麵館"
                value={selections.restaurantName || ''}
                onChange={handleInputChange}
                className="text-input"
              />
              <label htmlFor="dishName">招牌菜/推薦菜</label>
              <input
                type="text"
                id="dishName"
                name="dishName"
                placeholder="例如：牛肉麵"
                value={selections.dishName || ''}
                onChange={handleInputChange}
                className="text-input"
              />
              <label htmlFor="price">人均消費</label>
              <input
                type="text"
                id="price"
                name="price"
                placeholder="例如：$300"
                value={selections.price || ''}
                onChange={handleInputChange}
                className="text-input"
              />
            </div>
          ) : isImageUploadStep ? ( // 這是圖片上傳步驟
            <div className="image-upload-section">
              <div className="image-preview-container">
                {uploadedImages.map((imgSrc, index) => (
                  <div key={index} className="uploaded-image-wrapper">
                    <img src={imgSrc} alt={`Uploaded ${index + 1}`} className="uploaded-image" />
                    <button onClick={() => removeImage(index)} className="remove-image-button">
                      <LucideIcons.XCircle size={20} />
                    </button>
                  </div>
                ))}
                <div className="upload-box" onClick={() => fileInputRef.current.click()}>
                  <LucideIcons.Camera size={36} />
                  <p>點擊上傳圖片</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    multiple
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </div>
          ) : ( // 正常卡片選擇頁面
            <div className="cards-grid">
              {currentQuestionSet.cards.map(card => (
                <div
                  key={card.id}
                  className={`card ${selections[currentQuestionSet.key] === card.id ? 'selected' : ''}`}
                  onClick={() => selectCard(card.id)}
                >
                  {/* 使用一個新的 class `stars-container` 針對星星圖示的排版 */}
                  <span className={`card-icon ${currentQuestionSet.key === 'overallRating' ? 'stars-container' : ''}`}>
                    {/* 星級評價特殊處理：根據 starCount 渲染整數星星和半星 */}
                    {currentQuestionSet.key === 'overallRating' && card.starCount
                      ? Array.from({ length: Math.floor(card.starCount) }).map((_, i) => (
                          <LucideIcons.Star key={i} size={48} fill="gold" stroke="gold" />
                        ))
                      : getRenderedLucideIcon(card.icon)}
                    {currentQuestionSet.key === 'overallRating' && card.starCount % 1 !== 0 && (
                        <LucideIcons.StarHalf key="half" size={48} fill="gold" stroke="gold" />
                    )}
                  </span>
                  <h3 className="card-title">{card.title}</h3>
                  <p className="card-description">{card.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="navigation-buttons">
          {currentStep > 0 && (
            <button onClick={prevStep} className="nav-button secondary">
              <LucideIcons.ArrowLeft size={20} /> 上一步
            </button>
          )}
          {/* 僅當前步驟為輸入類型或圖片上傳類型才顯示「下一步」或「預覽文章」按鈕 */}
          {(currentQuestionSet.type === 'input' || isImageUploadStep) && (
             <button onClick={nextStep} className="nav-button primary">
               {isImageUploadStep ? <LucideIcons.Eye size={20} /> : null}
               {isImageUploadStep ? '預覽文章' : '下一步'}
             </button>
          )}
          {/* 新增「生成文章」按鈕，任何時候都可手動生成文章並顯示預覽 */}
          <button onClick={() => { generateReview(selections); setShowPreview(true); }} className="nav-button primary">
            <LucideIcons.PenLine size={20} /> 生成文章
          </button>
        </div>

        <footer className="app-footer">
          <p>© 2023 美食文章生成器. All rights reserved.</p>
          <StorageUsageBar usedBytes={getStorageUsage()} maxBytes={MAX_STORAGE_BYTES} />
        </footer>
      </div>
    );
  };

  return <div className="app-wrapper">{renderContent()}</div>;
};

export default FoodReviewGenerator;