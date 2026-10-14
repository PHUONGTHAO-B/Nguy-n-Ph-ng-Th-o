import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Exercise, Submission } from './src/types';
import { DEFAULT_EXERCISES } from './src/data/defaultExercises';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// Server-side Gemini AI setup
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-memory persistent storage (synced across users)
const exercisesStore = new Map<string, Exercise>();
DEFAULT_EXERCISES.forEach((ex) => exercisesStore.set(ex.code, ex));

const submissionsStore = new Map<string, Submission[]>();

// Helper to generate a 6-character code
function generateExerciseCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// API Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', hasApiKey: !!process.env.GEMINI_API_KEY });
});

// Get all exercises
app.get('/api/exercises', (req: Request, res: Response) => {
  const exercises = Array.from(exercisesStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ exercises });
});

// Get exercise by 6-char code
app.get('/api/exercises/:code', (req: Request, res: Response) => {
  const code = req.params.code.trim().toUpperCase();
  const exercise = exercisesStore.get(code);
  if (!exercise) {
    return res.status(404).json({ error: 'Không tìm thấy bài tập với mã ' + code });
  }
  res.json({ exercise });
});

// Save / update exercise
app.post('/api/exercises', (req: Request, res: Response) => {
  const exerciseData = req.body as Exercise;
  if (!exerciseData.code) {
    exerciseData.code = generateExerciseCode();
  } else {
    exerciseData.code = exerciseData.code.trim().toUpperCase();
  }

  if (!exerciseData.id) {
    exerciseData.id = 'ex-' + Date.now();
  }
  if (!exerciseData.createdAt) {
    exerciseData.createdAt = new Date().toISOString();
  }

  exercisesStore.set(exerciseData.code, exerciseData);
  res.json({ success: true, exercise: exerciseData });
});

// Get submissions for an exercise
app.get('/api/submissions/:code', (req: Request, res: Response) => {
  const code = req.params.code.trim().toUpperCase();
  const list = submissionsStore.get(code) || [];
  res.json({ submissions: list });
});

// Submit a student solution
app.post('/api/submissions', (req: Request, res: Response) => {
  const sub = req.body as Submission;
  if (!sub.id) {
    sub.id = 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  }
  if (!sub.submittedAt) {
    sub.submittedAt = new Date().toISOString();
  }
  const code = sub.exerciseCode.trim().toUpperCase();
  const existing = submissionsStore.get(code) || [];
  existing.unshift(sub);
  submissionsStore.set(code, existing);

  res.json({ success: true, submission: sub });
});

// Generate Exercise using Gemini
app.post('/api/generate-exercise', async (req: Request, res: Response) => {
  try {
    const { grade, topic, difficulty, customRequirements } = req.body;

    const prompt = `
Bạn là một chuyên gia sư phạm Tin học THPT hàng đầu tại Việt Nam, am hiểu sâu sắc chương trình GDPT Tin học 10 và 11 (Python).
Hãy soạn một bài tập lập trình Python chuẩn mực theo yêu cầu sau:
- Khối lớp: Lớp ${grade || '10'} THPT
- Chủ đề: ${topic || 'Cấu trúc rẽ nhánh if-else'}
- Mức độ: ${difficulty || 'Trung bình'}
${customRequirements ? `- Yêu cầu bổ sung của giáo viên: ${customRequirements}` : ''}

Quy chuẩn yêu cầu:
1. Đề bài (description): Viết bằng tiếng Việt sư phạm, dễ hiểu cho học sinh THPT, có bối cảnh bài toán thực tế hoặc toán học rõ ràng.
2. Mô tả cụ thể định dạng Input và Output.
3. Ràng buộc (constraints): rõ ràng về phạm vi dữ liệu (ví dụ 1 <= N <= 10^5, -10^9 <= a[i] <= 10^9).
4. Ví dụ mẫu (Sample Input, Sample Output, giải thích rõ).
5. Lời giải mẫu Python (solutionCode): Viết code Python 3 chuẩn, tối ưu, sử dụng cách đọc dữ liệu chuẩn (sys.stdin.read hoặc input), xử lý được cả khi dữ liệu cách nhau bằng dấu cách hoặc xuống dòng.
6. Starter code cho học sinh: khung sườn có chú thích gợi ý để học sinh dễ bắt đầu.
7. ĐÚNG 8 BỘ TEST CASE (testCases):
   - Test 1: Giống hệt Ví dụ mẫu (isHidden: false)
   - Test 2: Trường hợp cơ bản khác (isHidden: false)
   - Test 3 đến 8: Các trường hợp đặc biệt & test biên (isHidden: true) như: số 0, số âm, số lớn nhất/nhỏ nhất theo ràng buộc, các phần tử trùng lặp, trường hợp danh sách rỗng hoặc 1 phần tử nếu áp dụng.
   - Mỗi test case phải có input, expectedOutput tương ứng chính xác 100% với đề bài và lời giải, cùng mô tả ngắn gọn mục đích test.
   - Expected Output phải sạch sẽ, không thừa khoảng trắng lạ.

Hãy trả về kết quả định dạng JSON chuẩn.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Tiêu đề bài toán' },
            description: { type: Type.STRING, description: 'Nội dung chi tiết đề bài' },
            inputFormat: { type: Type.STRING, description: 'Quy cách đầu vào input' },
            outputFormat: { type: Type.STRING, description: 'Quy cách đầu ra output' },
            constraints: { type: Type.STRING, description: 'Ràng buộc của bài toán' },
            sampleInput: { type: Type.STRING, description: 'Input mẫu' },
            sampleOutput: { type: Type.STRING, description: 'Output mẫu' },
            sampleExplanation: { type: Type.STRING, description: 'Giải thích test mẫu' },
            starterCode: { type: Type.STRING, description: 'Code sườn mẫu ban đầu cho học sinh' },
            solutionCode: { type: Type.STRING, description: 'Lời giải mẫu hoàn chỉnh bằng Python 3' },
            testCases: {
              type: Type.ARRAY,
              description: 'Danh sách đúng 8 bộ test case',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  input: { type: Type.STRING },
                  expectedOutput: { type: Type.STRING },
                  isHidden: { type: Type.BOOLEAN },
                  description: { type: Type.STRING },
                },
                required: ['id', 'input', 'expectedOutput', 'isHidden'],
              },
            },
          },
          required: [
            'title',
            'description',
            'inputFormat',
            'outputFormat',
            'constraints',
            'sampleInput',
            'sampleOutput',
            'solutionCode',
            'testCases',
          ],
        },
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    // Ensure 8 test cases and id formatting
    if (parsed.testCases && Array.isArray(parsed.testCases)) {
      parsed.testCases = parsed.testCases.map((tc: any, idx: number) => ({
        id: idx + 1,
        input: String(tc.input ?? ''),
        expectedOutput: String(tc.expectedOutput ?? '').trim(),
        isHidden: idx >= 2 ? true : false,
        description: tc.description || (idx < 2 ? 'Test công khai' : 'Test ẩn kiểm tra biên'),
      }));
    }

    const code = generateExerciseCode();
    const finalExercise: Exercise = {
      id: 'ex-' + Date.now(),
      code,
      grade: (grade as '10' | '11') || '10',
      topic: topic || 'Lập trình Python cơ bản',
      difficulty: (difficulty as 'Dễ' | 'Trung bình' | 'Khó') || 'Trung bình',
      title: parsed.title || 'Bài tập Python Tin học',
      description: parsed.description || '',
      inputFormat: parsed.inputFormat || 'Các số nguyên trên từng dòng hoặc cách nhau bởi dấu cách.',
      outputFormat: parsed.outputFormat || 'In kết quả ra màn hình.',
      constraints: parsed.constraints || 'Theo chuẩn THPT.',
      sampleInput: parsed.sampleInput || '',
      sampleOutput: parsed.sampleOutput || '',
      sampleExplanation: parsed.sampleExplanation || '',
      starterCode: parsed.starterCode || '# Viết code giải bài toán tại đây\n',
      solutionCode: parsed.solutionCode || '',
      testCases: parsed.testCases || [],
      createdAt: new Date().toISOString(),
    };

    // Store in backend memory
    exercisesStore.set(finalExercise.code, finalExercise);

    res.json({ success: true, exercise: finalExercise });
  } catch (error: any) {
    console.error('Error generating exercise:', error);
    res.status(500).json({
      error: 'Không thể tạo bài tập bằng Gemini. Chi tiết: ' + (error?.message || String(error)),
    });
  }
});

// Review student code using Gemini
app.post('/api/review-code', async (req: Request, res: Response) => {
  try {
    const { problemTitle, problemDescription, studentCode, testResults, score } = req.body;

    const summaryResults = (testResults || []).map((t: any) => ({
      testId: t.testId,
      status: t.status,
      executionTimeMs: t.executionTimeMs,
      error: t.errorMessage,
    }));

    const prompt = `
Bạn là giáo viên Tin học THPT tận tâm và nhiệt huyết.
Dưới đây là thông tin bài tập và bài làm của học sinh:
- Tên bài: ${problemTitle}
- Đề bài tóm tắt: ${problemDescription}
- Điểm số học sinh đạt được: ${score}/10
- Kết quả chạy test: ${JSON.stringify(summaryResults)}

Code học sinh đã viết:
\`\`\`python
${studentCode}
\`\`\`

NHIỆM VỤ:
Đọc kỹ code của học sinh và đưa ra nhận xét sư phạm ngắn gọn, truyền cảm hứng bằng tiếng Việt:
1. Điểm tốt / ưu điểm (strengths): Nêu 1-2 điểm học sinh đã làm tốt (cú pháp, cách tiếp cận, sử dụng hàm/vòng lặp, đặt tên biến...).
2. Vấn đề / lỗi còn tồn tại (issues): Nêu rõ tại sao các test bị sai hoặc bị lỗi/quá thời gian (ví dụ: chưa ép kiểu int/float, sai chỉ số mảng, chưa xử lý trường hợp số âm, quên chia lấy dư, in thừa chữ...).
3. Gợi ý sửa cụ thể (suggestions): Hướng dẫn phương pháp tư duy, câu lệnh cần kiểm tra, gợi ý bước logic cần thêm.
4. Lời nhắn động viên (generalFeedback): 1 câu khích lệ tinh thần học tập.

QUY TẮC BẮT BUỘC:
TUYỆT ĐỐI KHÔNG đưa ra code giải hoàn chỉnh (không giải hộ toàn bộ bài)! Chỉ đưa ra gợi ý/chỉ dẫn để học sinh tự mình tư duy và sửa lại.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Các điểm làm tốt',
            },
            issues: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Các lỗi hoặc hạn chế còn tồn tại',
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Gợi ý cách tư duy và sửa lỗi cụ thể (không lộ code)',
            },
            generalFeedback: {
              type: Type.STRING,
              description: 'Lời nhận xét tổng kết và khích lệ ngắn gọn',
            },
          },
          required: ['strengths', 'issues', 'suggestions', 'generalFeedback'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, review: parsed });
  } catch (error: any) {
    console.error('Error reviewing code:', error);
    res.status(500).json({
      error: 'Không thể nhận xét code lúc này. Chi tiết: ' + (error?.message || String(error)),
    });
  }
});

// Setup Vite middlewares for development or serve dist in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const PORT = 3000;

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TinHocTHPT] Server đang chạy tại http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
