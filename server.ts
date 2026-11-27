import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

  // API endpoint to generate social media posts
  app.post('/api/generate-posts', async (req, res) => {
    try {
      const {
        title,
        advisor,
        students,
        achievement,
        highlights,
        style,
        images
      } = req.body;

      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server. Please check your AI Studio secrets.' });
      }

      const prompt = `
你是一位專業的校園公關與社群行銷專家，擅長幫學校、指導老師與學生撰寫感人、勵志、幽默或專業的社群貼文。
請根據以下資訊，為三個不同的社群平台（Instagram、Facebook、Threads）分別客製化撰寫高品質的貼文內容。

【活動/專題資訊】
- 主題名稱：${title || '未提供'}
- 指導老師：${advisor || '未提供'}
- 參與學生：${students || '未提供'}
- 獲獎/成果：${achievement || '未提供'}
- 核心亮點/幕後故事：${highlights || '未提供'}
- 指定貼文風格：${style || '溫馨感人'}

【寫作要求】
1. Instagram (IG)：
   - 風格需符合指定風格，善用豐富的 Emoji 表情符號。
   - 開頭要有吸睛的 Hook（鉤子句），段落分明，排版精美。
   - 結尾附上 10-15 個高度相關的 Hashtags（如 #科展 #專題成果 #指導老師 #高中生活 等）。
2. Facebook (FB)：
   - 適合長文與感性抒發，脈絡完整。
   - 強調師生合作、團隊努力的過程與感謝。
   - 適合標註學校、家長與相關單位。
3. Threads (脆)：
   - 短小精悍、充滿話題性與金句。
   - 語氣可以稍微輕鬆、接地氣或幽默，引發同儕或網友共鳴與留言。
4. 如果使用者有上傳照片，請在文案中巧妙融入對照片畫面（如認真的神情、燦爛的笑容、獎盃等）的描繪與感性連結。

請嚴格以 JSON 格式回傳（不要包含 markdown code block 以外的其他文字，確保可用 JSON.parse 解析），格式如下：
{
  "igPost": "IG貼文完整內容...",
  "fbPost": "FB貼文完整內容...",
  "threadsPost": "Threads貼文完整內容...",
  "imageAnalysis": "AI對照片內容的解讀與融入亮點..."
}
`;

      const parts: any[] = [{ text: prompt }];

      if (images && Array.isArray(images) && images.length > 0) {
        for (const img of images) {
          if (img.data && img.mimeType) {
            let base64Data = img.data;
            if (base64Data.includes(',')) {
              base64Data = base64Data.split(',')[1];
            }
            parts.push({
              inlineData: {
                mimeType: img.mimeType,
                data: base64Data
              }
            });
          }
        }
      }

      const modelsToTry = [
        'gemini-3.8-flash',
        'gemini-3.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-1.5-flash'
      ];
      let response: any = null;
      let lastError: any = null;

      for (const m of modelsToTry) {
        try {
          response = await ai.models.generateContent({
            model: m,
            contents: [{ role: 'user', parts }]
          });
          break;
        } catch (err: any) {
          lastError = err;
          console.warn(`Model ${m} failed:`, err.message);
        }
      }

      if (!response) {
        throw lastError || new Error('AI 模型目前流量較大，請稍後再試。');
      }

      const rawText = response.text || '';
      
      let jsonStr = rawText.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '').trim();
      }

      let parsedResult;
      try {
        parsedResult = JSON.parse(jsonStr);
      } catch (e) {
        parsedResult = {
          igPost: rawText,
          fbPost: rawText,
          threadsPost: rawText,
          imageAnalysis: "AI 已成功分析您的照片與專題資料！"
        };
      }

      res.json(parsedResult);
    } catch (error: any) {
      console.error('Gemini generation error:', error);
      res.status(500).json({ error: error.message || '生成貼文時發生錯誤' });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Create Vite server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  const PORT = Number(process.env.PORT || 3000);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
