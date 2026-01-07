/**
 * 提问挑战游戏 API
 * 用户编写 Prompt，AI 执行后与正确答案对齐
 */

import { NextRequest, NextResponse } from 'next/server';
import { aihubmixClient } from '@/lib/api/aihubmix/client';
import { DEFAULT_MODEL_ID } from '@/lib/api/aihubmix/models';

// 主题类型
type Topic = 'person' | 'movie' | 'occupation' | 'animal' | 'city' | 'history' | 'sports' | 'anime' | 'tech';

// 谜题数据（简化：只保留答案和关键信息点）
interface QuizItem {
  answer: string;
  keyPoints: string[]; // 用于对齐度计算的关键信息
}

// 预设谜题库
const QUIZ_DATA: Record<Topic, QuizItem[]> = {
  person: [
    { answer: '迈克尔·乔丹', keyPoints: ['篮球', 'NBA', '公牛', '23号', '得分王', '6次总冠军'] },
    { answer: '爱因斯坦', keyPoints: ['物理', '相对论', '诺贝尔奖', '德国', '科学家'] },
    { answer: '埃隆·马斯克', keyPoints: ['特斯拉', 'SpaceX', 'CEO', '企业家', '太空探索'] },
    { answer: '周杰伦', keyPoints: ['音乐', '歌手', '中国风', '台湾', '青花瓷'] },
    { answer: '秦始皇', keyPoints: ['皇帝', '中国', '秦朝', '长城', '统一', '统一六国'] },
    { answer: '马云', keyPoints: ['阿里巴巴', '淘宝', '电商', '企业家', '中国'] },
    { answer: '居里夫人', keyPoints: ['物理', '化学', '诺贝尔奖', '镭', '女性', '波兰'] },
    { answer: '乔布斯', keyPoints: ['苹果', 'iPhone', 'CEO', '科技', '创新'] },
    { answer: '成龙', keyPoints: ['功夫', '电影', '演员', '香港', '动作片'] },
    { answer: '鲁迅', keyPoints: ['文学', '作家', '中国', '周树人', '呐喊'] },
  ],
  movie: [
    { answer: '她 (Her)', keyPoints: ['科幻', '爱情', 'AI', '斯嘉丽·约翰逊', '孤独'] },
    { answer: '盗梦空间', keyPoints: ['科幻', '诺兰', '梦境', '陀螺', '悬疑'] },
    { answer: '泰坦尼克号', keyPoints: ['爱情', '沉船', '灾难', '经典', '卡梅隆'] },
    { answer: '阿甘正传', keyPoints: ['励志', '奔跑', '经典', '汤姆·汉克斯', '美国'] },
    { answer: '霸王别姬', keyPoints: ['中国', '京剧', '陈凯歌', '张国荣', '经典'] },
    { answer: '千与千寻', keyPoints: ['动画', '宫崎骏', '日本', '神灵', '成长'] },
    { answer: '肖申克的救赎', keyPoints: ['监狱', '希望', '经典', '越狱', '自由'] },
    { answer: '楚门的世界', keyPoints: ['真人秀', '金·凯瑞', '喜剧', '讽刺', '自由'] },
    { answer: '机器人总动员', keyPoints: ['动画', '皮克斯', '爱情', '机器人', '太空'] },
    { answer: '星际穿越', keyPoints: ['科幻', '诺兰', '太空', '虫洞', '马修·麦康纳'] },
  ],
  occupation: [
    { answer: '程序员', keyPoints: ['程序员', '代码', '电脑', '编程', '互联网'] },
    { answer: '医生', keyPoints: ['医生', '医院', '医疗', '手术', '治病'] },
    { answer: '教师', keyPoints: ['教师', '学校', '教育', '学生', '上课'] },
    { answer: '厨师', keyPoints: ['厨师', '美食', '厨房', '烹饪', '餐厅'] },
    { answer: '律师', keyPoints: ['律师', '法律', '法庭', '辩护', '正义'] },
    { answer: '护士', keyPoints: ['护士', '医院', '护理', '打针', '照顾'] },
    { answer: '记者', keyPoints: ['记者', '新闻', '采访', '媒体', '报道'] },
    { answer: '会计', keyPoints: ['会计', '数字', '财务', '账目', '税务'] },
    { answer: '设计师', keyPoints: ['设计师', '设计', '创意', '视觉', '美术'] },
    { answer: '快递员', keyPoints: ['快递员', '快递', '送货', '包裹', '物流'] },
  ],
  animal: [
    { answer: '蓝鲸', keyPoints: ['海洋', '巨大', '哺乳动物', '地球最大', '须鲸'] },
    { answer: '大熊猫', keyPoints: ['中国', '国宝', '竹子', '黑白', '濒危'] },
    { answer: '老虎', keyPoints: ['猫科', '森林', '王', '濒危', '条纹'] },
    { answer: '大象', keyPoints: ['陆地最大', '长鼻子', '象牙', '聪明', '群居'] },
    { answer: '海豚', keyPoints: ['海洋', '聪明', '哺乳动物', '群居', '友好'] },
    { answer: '企鹅', keyPoints: ['南极', '鸟类', '不会飞', '游泳', '黑白'] },
    { answer: '长颈鹿', keyPoints: ['最高', '脖子长', '非洲', '斑点', '草食'] },
    { answer: '北极熊', keyPoints: ['北极', '白色', '肉食', '最大', '冰'] },
    { answer: '鹦鹉', keyPoints: ['鸟类', '会说话', '彩色', '宠物', '模仿'] },
    { answer: '蛇', keyPoints: ['爬行动物', '无脚', '有毒', '冬眠', '蜕皮'] },
  ],
  city: [
    { answer: '巴黎', keyPoints: ['法国', '浪漫', '铁塔', '时尚', '艺术', '光之城'] },
    { answer: '东京', keyPoints: ['日本', '霓虹灯', '现代', '动漫', '购物'] },
    { answer: '纽约', keyPoints: ['美国', '自由女神', '时代广场', '金融', '不夜城'] },
    { answer: '伦敦', keyPoints: ['英国', '大本钟', '雾都', '王室', '泰晤士河'] },
    { answer: '北京', keyPoints: ['中国', '故宫', '长城', '首都', '胡同'] },
    { answer: '悉尼', keyPoints: ['澳大利亚', '歌剧院', '海港', '袋鼠', '海滩'] },
    { answer: '威尼斯', keyPoints: ['意大利', '水城', '贡多拉', '运河', '浪漫'] },
    { answer: '迪拜', keyPoints: ['阿联酋', '奢华', '帆船酒店', '哈利法塔', '石油'] },
    { answer: '罗马', keyPoints: ['意大利', '斗兽场', '历史', '古罗马', '文化'] },
    { answer: '上海', keyPoints: ['中国', '外滩', '东方明珠', '金融', '现代'] },
  ],
  history: [
    { answer: '赤壁之战', keyPoints: ['三国', '曹操', '周瑜', '火攻', '以少胜多'] },
    { answer: '丝绸之路', keyPoints: ['贸易', '张骞', '东西方', '驼队', '古代'] },
    { answer: '文艺复兴', keyPoints: ['欧洲', '艺术', '达芬奇', '文化', '14-17世纪'] },
    { answer: '长征', keyPoints: ['中国', '红军', '毛泽东', '二万五千里', '革命'] },
    { answer: '工业革命', keyPoints: ['英国', '蒸汽机', '机器', '18世纪', '生产力'] },
    { answer: '郑和下西洋', keyPoints: ['明朝', '航海', '郑和', '宝船', '东南亚'] },
    { answer: '美国独立战争', keyPoints: ['美国', '独立', '华盛顿', '自由', '殖民地'] },
    { answer: '二战', keyPoints: ['1939-1945', '希特勒', '盟军', '核武器', '世界战争'] },
    { answer: '焚书坑儒', keyPoints: ['秦始皇', '焚书', '坑儒', '统一思想', '秦朝'] },
    { answer: '甲午战争', keyPoints: ['清朝', '日本', '海军', '马关条约', '1894年'] },
  ],
  sports: [
    { answer: '足球', keyPoints: ['足球', '世界杯', '11人', '草坪', '运动'] },
    { answer: '篮球', keyPoints: ['篮球', 'NBA', '乔丹', '篮筐', '5人'] },
    { answer: '网球', keyPoints: ['网球', '温网', '球拍', '草地', '四大满贯'] },
    { answer: '游泳', keyPoints: ['游泳', '奥运', '自由泳', '蛙泳', '水中'] },
    { answer: '马拉松', keyPoints: ['马拉松', '跑步', '长跑', '42公里', '耐力'] },
    { answer: '拳击', keyPoints: ['拳击', 'KO', '拳套', '格斗', '回合制'] },
    { answer: '羽毛球', keyPoints: ['羽毛球', '林丹', '球拍', '亚洲', '单打'] },
    { answer: '乒乓球', keyPoints: ['乒乓球', '中国', '国球', '小球', '桌'] },
    { answer: '滑雪', keyPoints: ['滑雪', '冬季', '雪山', '冬奥', '单板'] },
    { answer: 'F1赛车', keyPoints: ['F1', '赛车', '舒马赫', '速度', '法拉利'] },
  ],
  anime: [
    { answer: '海贼王', keyPoints: ['航海', '路飞', '伟大航路', '冒险', '热血'] },
    { answer: '火影忍者', keyPoints: ['忍者', '火影', '忍者村', '查克拉', '热血'] },
    { answer: '龙珠', keyPoints: ['孙悟空', '赛亚人', '战斗力', '龟仙人', '热血'] },
    { answer: '名侦探柯南', keyPoints: ['侦探', '柯南', '黑衣组织', '真相', '悬疑'] },
    { answer: '进击的巨人', keyPoints: ['巨人', '艾伦', '墙壁', '调查兵团', '热血'] },
    { answer: '鬼灭之刃', keyPoints: ['炭治郎', '鬼', '呼吸法', '斩鬼', '热血'] },
    { answer: '灌篮高手', keyPoints: ['篮球', '樱木花道', '湘北', '全国大赛', '热血'] },
    { answer: '蜡笔小新', keyPoints: ['野原新之助', '家庭', '搞笑', '日本', '童言无忌'] },
    { answer: '哆啦A梦', keyPoints: ['机器猫', '野比大雄', '任意门', '铜锣烧', '科幻'] },
    { answer: '新世纪福音战士', keyPoints: ['EVA', '机甲', '碇真嗣', '使徒', '经典'] },
  ],
  tech: [
    { answer: 'iPhone', keyPoints: ['iPhone', '苹果', '手机', '触摸屏', '智能'] },
    { answer: 'ChatGPT', keyPoints: ['ChatGPT', 'AI', 'OpenAI', '大语言模型', '聊天'] },
    { answer: '特斯拉', keyPoints: ['特斯拉', '电动汽车', 'Model S', '马斯克', '自动驾驶'] },
    { answer: 'Windows', keyPoints: ['Windows', '微软', '操作系统', 'PC', '软件'] },
    { answer: 'SpaceX', keyPoints: ['SpaceX', '火箭', '可回收', '马斯克', '太空'] },
    { answer: '抖音/TikTok', keyPoints: ['抖音', 'TikTok', '短视频', '字节跳动', '推荐算法'] },
    { answer: 'AlphaGo', keyPoints: ['AlphaGo', '围棋', 'AI', 'DeepMind', '里程碑'] },
    { answer: '5G', keyPoints: ['5G', '移动通信', '华为', '网速', '高速'] },
    { answer: '云计算', keyPoints: ['云计算', 'AWS', '阿里云', '服务器', '弹性计算'] },
    { answer: '区块链', keyPoints: ['区块链', '比特币', '去中心化', '加密货币', '分布式'] },
  ],
};

// 计算对齐度 - 1:1 精确匹配
function calculateAlignment(
  aiOutput: string,
  correctAnswer: string
): {
  score: number;
  matchedPoints: string[];
  unmatchedPoints: string[];
} {
  // 精确匹配（去除首尾空格后比较）
  const normalizedOutput = aiOutput.trim();
  const normalizedAnswer = correctAnswer.trim();

  const isExactMatch = normalizedOutput === normalizedAnswer;

  // 如果完全匹配，得 100%
  if (isExactMatch) {
    return {
      score: 100,
      matchedPoints: [correctAnswer],
      unmatchedPoints: [],
    };
  }

  // 如果不匹配，得 0%
  return {
    score: 0,
    matchedPoints: [],
    unmatchedPoints: [correctAnswer],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, topic, userPrompt } = body;
    const model = body.modelId || DEFAULT_MODEL_ID;

    // 验证主题
    if (!QUIZ_DATA[topic as Topic]) {
      return NextResponse.json({ error: 'Invalid topic' }, { status: 400 });
    }

    // 从会话中获取当前谜题（简化：基于 topic 的哈希选择）
    const quizList = QUIZ_DATA[topic as Topic];
    const quizIndex = topic.length % quizList.length;
    const currentQuiz = quizList[quizIndex];

    switch (action) {
      case 'start': {
        // 开始新游戏，返回正确答案
        return NextResponse.json({
          answer: currentQuiz.answer,
          keyPoints: currentQuiz.keyPoints,
          topic,
        });
      }

      case 'generate': {
        // 执行用户 prompt
        if (!userPrompt || userPrompt.trim().length === 0) {
          return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // 调用 AI 执行用户的 prompt
        const aiResponse = await aihubmixClient.chat({
          model,
          messages: [{ role: 'user', content: userPrompt }],
          temperature: 0.2,  // 低温度，减少随机性
        });

        // 获取完整输出
        const aiOutput = aiResponse.choices?.[0]?.message?.content || '';

        // 计算对齐度（1:1 精确匹配）
        const alignment = calculateAlignment(
          aiOutput,
          currentQuiz.answer
        );

        return NextResponse.json({
          aiOutput,
          alignment,
          correctAnswer: currentQuiz.answer,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[PromptQuiz] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Operation failed' },
      { status: 500 }
    );
  }
}

// GET 方法返回 API 信息
export async function GET() {
  return NextResponse.json({
    name: 'Prompt Quiz API',
    description: 'AI-powered prompt training game',
    endpoint: '/api/tools/prompt-quiz',
    method: 'POST',
    actions: {
      'start': '开始新游戏，返回正确答案',
      'generate': '执行用户 prompt，返回 AI 输出和对齐分析',
    },
    topics: Object.keys(QUIZ_DATA),
  });
}
