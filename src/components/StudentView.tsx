import React, { useState, useEffect } from 'react';
import { Exercise, TestResult, AiReviewResponse, Submission } from '../types';
import { PythonEditor } from './PythonEditor';
import { TestResultsTable } from './TestResultsTable';
import { pyodideManager } from '../services/pyodideRunner';
import {
  Play,
  Send,
  Sparkles,
  BookOpen,
  User,
  GraduationCap,
  KeyRound,
  FileText,
  Terminal,
  RotateCcw,
  AlertCircle,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  ArrowRight,
  HelpCircle,
  ArrowDownToLine
} from 'lucide-react';

interface StudentViewProps {
  currentExercise: Exercise | null;
  savedExercises: Exercise[];
  onSelectExerciseByCode: (code: string) => boolean;
  onSubmitResult: (submission: Submission) => void;
  initialCode?: string;
}

export const StudentView: React.FC<StudentViewProps> = ({
  currentExercise,
  savedExercises,
  onSelectExerciseByCode,
  onSubmitResult,
  initialCode,
}) => {
  // Student identification info
  const [studentName, setStudentName] = useState(() => localStorage.getItem('thpt_student_name') || '');
  const [studentClass, setStudentClass] = useState(() => localStorage.getItem('thpt_student_class') || '');
  const [inputCode, setInputCode] = useState(initialCode || '');
  const [codeNotFound, setCodeNotFound] = useState(false);

  // Python Code state
  const [code, setCode] = useState<string>('');

  // Custom input for "Chạy thử"
  const [customInput, setCustomInput] = useState<string>('');
  const [customOutput, setCustomOutput] = useState<string>('');
  const [customError, setCustomError] = useState<string | null>(null);
  const [isRunningCustom, setIsRunningCustom] = useState(false);
  const [customRunTime, setCustomRunTime] = useState<number | null>(null);

  // Grading state
  const [isGrading, setIsGrading] = useState(false);
  const [gradingProgress, setGradingProgress] = useState<{ current: number; total: number } | null>(null);
  const [gradingResults, setGradingResults] = useState<TestResult[] | null>(null);
  const [score, setScore] = useState<number>(0);
  const [passedTests, setPassedTests] = useState<number>(0);
  const [totalTests, setTotalTests] = useState<number>(0);

  // Gemini AI Review state
  const [aiReview, setAiReview] = useState<AiReviewResponse | null>(null);
  const [isLoadingAiReview, setIsLoadingAiReview] = useState(false);

  // UI state
  const [copiedSample, setCopiedSample] = useState(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'custom' | 'results'>('custom');

  // Load starter or draft code
  useEffect(() => {
    if (currentExercise) {
      const savedDraft = localStorage.getItem(`thpt_draft_${currentExercise.code}`);
      if (savedDraft) {
        setCode(savedDraft);
      } else {
        setCode(
          currentExercise.starterCode ||
            `# Bài toán: ${currentExercise.title}\nimport sys\n\n# Nhập dữ liệu và xử lý thuật toán\n`
        );
      }
      setCustomInput(currentExercise.sampleInput || '');
      setCustomOutput('');
      setCustomError(null);
      setGradingResults(null);
      setAiReview(null);
      setActiveConsoleTab('custom');
    }
  }, [currentExercise?.code]);

  // Persist code draft
  useEffect(() => {
    if (currentExercise && code) {
      localStorage.setItem(`thpt_draft_${currentExercise.code}`, code);
    }
  }, [code, currentExercise?.code]);

  // Persist student profile
  useEffect(() => {
    if (studentName) localStorage.setItem('thpt_student_name', studentName);
    if (studentClass) localStorage.setItem('thpt_student_class', studentClass);
  }, [studentName, studentClass]);

  const handleApplyCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputCode.trim()) return;
    const ok = onSelectExerciseByCode(inputCode.trim().toUpperCase());
    if (!ok) {
      setCodeNotFound(true);
      setTimeout(() => setCodeNotFound(false), 3000);
    }
  };

  const handleResetCode = () => {
    if (!currentExercise) return;
    if (window.confirm('Bạn có chắc chắn muốn đặt lại code về trạng thái ban đầu?')) {
      setCode(currentExercise.starterCode || '# Viết code tại đây\n');
      setGradingResults(null);
    }
  };

  // Run custom test in Pyodide
  const handleRunCustomTest = async () => {
    if (!code.trim()) return;
    setIsRunningCustom(true);
    setCustomError(null);
    setCustomOutput('');
    setActiveConsoleTab('custom');

    try {
      const res = await pyodideManager.runSingle(code, customInput, 2000);
      setCustomRunTime(res.durationMs);

      if (res.isTimeout) {
        setCustomError('Thời gian chạy vượt quá 2.0 giây (Time Limit Exceeded). Có thể gặp vòng lặp vô hạn!');
      } else if (!res.success || res.error) {
        setCustomError(res.error || res.stderr || 'Đã xảy ra lỗi thực thi.');
        setCustomOutput(res.stdout);
      } else {
        setCustomOutput(res.stdout || '(Chương trình thực thi thành công nhưng không in ra kết quả nào)');
      }
    } catch (err: any) {
      setCustomError('Lỗi chạy Python: ' + err.message);
    } finally {
      setIsRunningCustom(false);
    }
  };

  // Submit and grade all 8 test cases
  const handleGradeAll = async () => {
    if (!currentExercise || !code.trim()) return;
    if (!studentName.trim() || !studentClass.trim()) {
      alert('Vui lòng nhập Họ tên và Lớp của bạn ở phía trên trước khi nộp bài!');
      return;
    }

    setIsGrading(true);
    setGradingProgress({ current: 0, total: currentExercise.testCases.length });
    setActiveConsoleTab('results');
    setAiReview(null);

    try {
      const result = await pyodideManager.evaluateAllTests(
        code,
        currentExercise.testCases,
        (completed, total) => {
          setGradingProgress({ current: completed, total });
        }
      );

      setGradingResults(result.results);
      setScore(result.score);
      setPassedTests(result.passedTests);
      setTotalTests(result.totalTests);

      // Save submission
      const newSubmission: Submission = {
        id: 'sub-' + Date.now(),
        exerciseCode: currentExercise.code,
        studentName: studentName.trim(),
        studentClass: studentClass.trim(),
        score: result.score,
        passedTests: result.passedTests,
        totalTests: result.totalTests,
        submittedAt: new Date().toISOString(),
        code: code,
        results: result.results,
      };

      onSubmitResult(newSubmission);
    } catch (err: any) {
      console.error(err);
      alert('Có lỗi trong quá trình chấm điểm: ' + err.message);
    } finally {
      setIsGrading(false);
      setGradingProgress(null);
    }
  };

  // Request pedagogical feedback from Gemini
  const handleRequestAiReview = async () => {
    if (!currentExercise || !gradingResults) return;
    setIsLoadingAiReview(true);

    try {
      const res = await fetch('/api/review-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemTitle: currentExercise.title,
          problemDescription: currentExercise.description,
          studentCode: code,
          testResults: gradingResults,
          score: score,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể lấy nhận xét');
      }

      setAiReview(data.review);
    } catch (err: any) {
      console.error(err);
      alert('Không thể kết nối với Giáo viên AI lúc này: ' + err.message);
    } finally {
      setIsLoadingAiReview(false);
    }
  };

  const handleCopySample = () => {
    if (!currentExercise) return;
    navigator.clipboard.writeText(currentExercise.sampleInput);
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 2000);
  };

  const handleLoadSampleIntoRunner = () => {
    if (!currentExercise) return;
    setCustomInput(currentExercise.sampleInput);
    setActiveConsoleTab('custom');
  };

  return (
    <div className="space-y-6">
      {/* Student Profile & Quick Select Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Student Name */}
          <div className="md:col-span-4">
            <div className="relative">
              <User className="w-4 h-4 text-blue-600 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Họ và tên (vd: Nguyễn Văn An)"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 transition"
              />
            </div>
          </div>

          {/* Student Class */}
          <div className="md:col-span-3">
            <div className="relative">
              <GraduationCap className="w-4 h-4 text-blue-600 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Lớp (vd: 10A1, 11B2)"
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 transition"
              />
            </div>
          </div>

          {/* Exercise Code Lookup */}
          <div className="md:col-span-5">
            <form onSubmit={handleApplyCode} className="flex gap-2">
              <div className="relative flex-1">
                <KeyRound className="w-4 h-4 text-indigo-600 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Mã bài 6 ký tự (vd: TH1001)"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold uppercase tracking-wider text-indigo-950 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shrink-0 transition shadow-xs cursor-pointer"
              >
                Mở bài
              </button>
            </form>
          </div>
        </div>

        {codeNotFound && (
          <div className="text-xs text-rose-600 font-medium flex items-center gap-1.5 p-2 bg-rose-50 rounded-lg border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Không tìm thấy bài tập với mã "{inputCode}". Hãy kiểm tra lại hoặc bấm chọn bài trong danh sách bên dưới.
          </div>
        )}

        {/* Quick Exercise Tabs */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-500 font-semibold shrink-0 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Danh sách bài tập:
          </span>
          <div className="flex gap-1.5 flex-nowrap">
            {savedExercises.map((ex) => (
              <button
                key={ex.code}
                type="button"
                onClick={() => {
                  setInputCode(ex.code);
                  onSelectExerciseByCode(ex.code);
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  currentExercise?.code === ex.code
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span className="font-mono text-[11px] opacity-80">{ex.code}</span>
                <span>{ex.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {currentExercise ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: ĐỀ BÀI SƯ PHẠM */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            {/* Exercise Header */}
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1.5">
                <span className="font-bold text-blue-700">Tin học {currentExercise.grade}</span>
                <span>·</span>
                <span>{currentExercise.topic}</span>
                <span>·</span>
                <span className="font-mono font-semibold text-indigo-700">{currentExercise.code}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 leading-snug">
                {currentExercise.title}
              </h2>
            </div>

            {/* Description */}
            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" /> Đề bài
              </h4>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                {currentExercise.description}
              </p>
            </div>

            {/* Input & Output Format */}
            <div className="space-y-3 pt-2 border-t border-slate-100 text-xs sm:text-sm">
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1">
                  Quy cách Đầu vào (Input):
                </span>
                <div className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed font-sans">
                  {currentExercise.inputFormat}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1">
                  Quy cách Đầu ra (Output):
                </span>
                <div className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed font-sans">
                  {currentExercise.outputFormat}
                </div>
              </div>

              {currentExercise.constraints && (
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1">
                    Ràng buộc dữ liệu (Constraints):
                  </span>
                  <div className="text-amber-900 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80 font-mono text-xs">
                    {currentExercise.constraints}
                  </div>
                </div>
              )}
            </div>

            {/* Sample Test Case with Quick Load */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Ví dụ mẫu (Sample):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadSampleIntoRunner}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                    title="Nạp dữ liệu vào khung Chạy thử"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    Thử test này
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={handleCopySample}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    {copiedSample ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copiedSample ? 'Đã chép' : 'Chép'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[11px] font-sans font-semibold text-slate-500 mb-1">
                    Input:
                  </div>
                  <pre className="text-slate-800 whitespace-pre-wrap">{currentExercise.sampleInput}</pre>
                </div>

                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                  <div className="text-[11px] font-sans font-semibold text-emerald-800 mb-1">
                    Output:
                  </div>
                  <pre className="text-emerald-950 font-bold whitespace-pre-wrap">
                    {currentExercise.sampleOutput}
                  </pre>
                </div>
              </div>

              {currentExercise.sampleExplanation && (
                <div className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 leading-relaxed">
                  <strong className="text-slate-700">Giải thích:</strong> {currentExercise.sampleExplanation}
                </div>
              )}
            </div>

            {/* Rules Reminder Card */}
            <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200/80 text-xs text-blue-950 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-blue-900">
                <Clock className="w-4 h-4 text-blue-600" /> Tiêu chuẩn chấm tự động:
              </div>
              <ul className="text-slate-600 space-y-1 list-disc list-inside">
                <li>Chạy tự động <strong>8 bộ test case</strong> bằng Pyodide.</li>
                <li>Thời gian tối đa <strong>2.0 giây</strong> cho mỗi test.</li>
                <li>Điểm số = (số test đúng / 8) × 10, làm tròn 0,25.</li>
              </ul>
            </div>
          </div>

          {/* RIGHT COLUMN: KHUNG SOẠN CODE PYTHON & RUNNER / CHẤM ĐIỂM */}
          <div className="lg:col-span-7 space-y-4">
            {/* Editor Action Header */}
            <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Trình soạn thảo Python
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleRunCustomTest}
                  disabled={isRunningCustom || isGrading}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  {isRunningCustom ? 'Đang chạy...' : 'Chạy thử'}
                </button>

                <button
                  type="button"
                  onClick={handleGradeAll}
                  disabled={isGrading || isRunningCustom}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <Send className="w-4 h-4" />
                  {isGrading ? 'Đang chấm...' : 'Nộp bài'}
                </button>
              </div>
            </div>

            {/* Python Code Editor */}
            <PythonEditor
              value={code}
              onChange={setCode}
              onReset={handleResetCode}
              onRunShortcut={handleRunCustomTest}
              minHeight="380px"
              title={`${currentExercise.code}_main.py`}
            />

            {/* Progress indicator during grading */}
            {isGrading && gradingProgress && (
              <div className="bg-blue-50 border-2 border-blue-400 p-5 rounded-2xl space-y-3 shadow-md animate-in fade-in">
                <div className="flex items-center justify-between text-sm font-bold text-blue-900">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
                    <span>Pyodide đang thực thi kiểm tra các bộ test...</span>
                  </div>
                  <span className="font-mono text-base">
                    {gradingProgress.current} / {gradingProgress.total} Test
                  </span>
                </div>
                <div className="w-full bg-blue-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{
                      width: `${(gradingProgress.current / gradingProgress.total) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-blue-700">
                  Bảo vệ chống lặp vô hạn với bộ đếm thời gian 2.0 giây cho từng test case...
                </p>
              </div>
            )}

            {/* Deck: Chạy thử VS Bảng chấm điểm */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-3 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveConsoleTab('custom')}
                  className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 ${
                    activeConsoleTab === 'custom'
                      ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  Chạy thử với dữ liệu tự nhập
                </button>

                <button
                  type="button"
                  onClick={() => setActiveConsoleTab('results')}
                  className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 ${
                    activeConsoleTab === 'results'
                      ? 'bg-white text-emerald-700 border-t-2 border-emerald-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Bảng chấm điểm 8 test {gradingResults ? `(${score}đ)` : ''}
                </button>
              </div>

              {/* TAB 1: RUN CUSTOM TEST */}
              {activeConsoleTab === 'custom' && (
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Custom Stdin */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          Đầu vào tự nhập (Stdin):
                        </label>
                        <button
                          type="button"
                          onClick={() => setCustomInput(currentExercise.sampleInput)}
                          className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                        >
                          Dán test mẫu
                        </button>
                      </div>
                      <textarea
                        rows={5}
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="Nhập các dòng input thử nghiệm..."
                        className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white resize-none"
                      />
                    </div>

                    {/* Custom Stdout */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          Kết quả in ra màn hình (Stdout):
                        </label>
                        {customRunTime !== null && (
                          <span className="text-[11px] font-mono text-slate-500">
                            ⏱ {customRunTime}ms
                          </span>
                        )}
                      </div>
                      <div className="w-full min-h-[125px] p-3 font-mono text-xs bg-[#0c121e] text-emerald-300 rounded-xl overflow-x-auto whitespace-pre-wrap border border-slate-800">
                        {customOutput ? (
                          customOutput
                        ) : (
                          <span className="text-slate-500 italic">
                            (Bấm nút "Chạy thử" để xem output của chương trình)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {customError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-mono whitespace-pre-wrap">
                      <div className="font-bold font-sans mb-1 flex items-center gap-1.5 text-rose-900">
                        <AlertCircle className="w-4 h-4 text-rose-600" /> Báo lỗi thực thi:
                      </div>
                      {customError}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: GRADING SCOREBOARD & AI REVIEW */}
              {activeConsoleTab === 'results' && (
                <div className="p-5">
                  {gradingResults ? (
                    <TestResultsTable
                      results={gradingResults}
                      score={score}
                      passedTests={passedTests}
                      totalTests={totalTests}
                      aiReview={aiReview}
                      isLoadingAiReview={isLoadingAiReview}
                      onRequestAiReview={handleRequestAiReview}
                    />
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <Send className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-base font-bold text-slate-700">
                        Chưa có kết quả chấm điểm
                      </p>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                        Sau khi hoàn thiện code, hãy bấm nút <strong className="text-emerald-700">"Nộp bài"</strong> màu xanh lá để hệ thống tự động kiểm tra với 8 bộ test case.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <BookOpen className="w-12 h-12 text-blue-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">Chọn hoặc nhập mã bài tập để bắt đầu</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            Nhập mã 6 ký tự do giáo viên cung cấp vào ô phía trên hoặc chọn một bài tập từ danh sách.
          </p>
        </div>
      )}
    </div>
  );
};
