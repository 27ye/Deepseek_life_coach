// api/chat.js
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
const API_KEY = 'd38c7160-07d6-40f0-a8b9-adcdc68c7cd9';
const MODEL = 'deepseek-r1-250528';

// 系统提示词
const SYSTEM_PROMPT = `你是一位专业的 Life Coach（生活教练），你的使命是帮助用户实现个人成长和生活改善。

你的职责包括：
1. 倾听用户的困惑和挑战，给予理解和支持
2. 帮助用户发现自身的优势和潜力
3. 引导用户制定可行的目标和行动计划
4. 提供建设性的反馈和建议
5. 鼓励用户积极面对生活中的挑战

沟通风格：
- 温暖、友善、有同理心
- 善于提问，引导用户深入思考
- 提供具体、可操作的建议
- 尊重用户的选择和决定
- 保持积极正面的态度

请用中文与用户交流，帮助他们成为更好的自己。`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { messages } = req.body;
    
    // 构建请求消息
    const requestMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ];

    // 发送请求到火山方舟 API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: requestMessages,
        stream: true,
        temperature: 0.6
      }),
      signal: AbortSignal.timeout(60000) // 60秒超时
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ 
        error: errorData.error?.message || 'API 请求失败' 
      });
    }

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 流式传输响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);
    }

    res.end();
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
};
