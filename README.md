# Life Coach AI 助手

## 项目简介
这是一个基于火山方舟 DeepSeek R1 API 的 Life Coach 网页应用。通过与 AI 对话，用户可以获得生活建议和个人成长指导。

## 技术架构
- **前端**: HTML5 + CSS3 + JavaScript (原生)
- **后端**: Node.js + Express (处理 API 请求，解决 CORS 问题)
- **AI API**: 火山方舟 DeepSeek R1

## 项目结构
```
life_coach/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式文件
├── js/
│   └── app.js          # 前端逻辑
├── server.js           # Node.js 后端服务器
├── package.json        # 项目依赖配置
└── README.md           # 项目说明文档
```

## 页面说明

### 主页面 (index.html)
- **头部区域**: 显示应用标题和简介
- **对话区域**: 显示用户与 AI 的对话历史
- **输入区域**: 用户输入消息的文本框和发送按钮

### 样式设计
- 采用响应式设计，适配不同设备
- 使用 Flexbox 布局
- 现代简洁的 UI 风格
- 用户消息和 AI 回复有不同的视觉区分

## API 配置
- API 端点: `https://ark.cn-beijing.volces.com/api/v3/chat/completions`
- 模型: `deepseek-r1-250528`
- 请求超时: 60秒
- 流式输出: 开启
- 温度: 0.6

## 启动方式
1. 安装依赖: `npm install`
2. 启动服务器: `node server.js`
3. 访问: `http://localhost:3000`

## 注意事项
- API Key 存储在服务器端，不会暴露给前端
- 支持流式输出，实时显示 AI 回复
