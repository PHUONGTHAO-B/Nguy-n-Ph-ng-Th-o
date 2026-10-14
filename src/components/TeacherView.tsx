import React, { useState } from 'react';
import { Exercise, TestCase, Submission } from '../types';
import { PythonEditor } from './PythonEditor';
import { pyodideManager } from '../services/pyodideRunner';
import {
  Sparkles,
  Play,
  Send,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  Award,
  Users,
  Eye,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';

interface TeacherViewProps {
  onAssignExercise: (exercise: Exercise) => void;
  savedExercises: Exercise[];
  onSelectExercise: (exercise: Exercise) => void;
  submissions: Submission[];
}

const TOPIC_SUGGESTIONS_10 = [
  'Câu lệnh if-else và rẽ nhánh',
  'Vòng lặp for và hàm range()',
  'Vòng lặp while',
  'Xâu ký tự (String) và các phương thức',
  'Danh sách (List) cơ bản',
  'Hàm (def) và tái sử dụng mã',
  'Toán tử số học, chia lấy dư và làm tròn',
  'Đếm số và tính tổng các ước số'
];

const TOPIC_SUGGESTIONS_11 = [
  'Thuật toán sắp xếp và tìm kiếm cơ bản',
  'Kỹ thuật duyệt mảng một chiều',
  'Mảng hai chiều / Ma trận số',
  'Đọc và ghi tệp văn bản trong Python',
  'Cấu trúc dữ liệu Dictionary (Từ điển)',
  'Đệ quy và bài toán kinh điển',
  'Hàm nâng cao và truyền tham số',
  'Bài toán đếm và tối ưu hóa đơn giản'
];

export const TeacherView: React.FC<TeacherViewProps> = ({
  onAssignExercise,
  savedExercises,
  onSelectExercise,
  submissions,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'submissions'>('create');

  // Generator form state
  const [grade, setGrade] = useState<'10' | '11'>('10');
  const [topic, setTopic] = useState('Câu lệnh if-else');
  const [difficulty, setDifficulty] = useState<'Dễ' | 'Trung bình' | 'Khó'>('Trung bình');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Editable Exercise draft
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [assignSuccessModal, setAssignSuccessModal] = useState<Exercise | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Solution tester state
  const [isTestingSolution, setIsTestingSolution] = useState(false);
  const [solutionTestResults, setSolutionTestResults] = useState<{
    passCount: number;
    total: number;
    details: string;
  } | null>(null);

  // Submissions filter
  const [selectedSubExerciseCode, setSelectedSubExerciseCode] = useState<string>('ALL');
  const [viewingStudentSub, setViewingStudentSub] = useState<Submission | null>(null);

  // Generate Exercise via Gemini API
  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenError(null);
    setSolutionTestResults(null);

    try {
      const res = await fetch('/api/generate-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade,
          topic,
          difficulty,
          customRequirements: customPrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi khi gọi API tạo bài tập');
      }

      setCurrentExercise(data.exercise);
    } catch (err: any) {
      console.error(err);
      setGenError(err.message || 'Không thể tạo bài tập bằng Gemini. Hãy kiểm tra kết nối.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Test teacher's solution against all test cases
  const handleTestSolution = async () => {
    if (!currentExercise || !currentExercise.solutionCode) return;
    setIsTestingSolution(true);
    setSolutionTestResults(null);

    try {
      const res = await pyodideManager.evaluateAllTests(
        currentExercise.solutionCode,
        currentExercise.testCases
      );
      setSolutionTestResults({
        passCount: res.passedTests,
        total: res.totalTests,
        details:
          res.passedTests === res.totalTests
            ? 'Lời giải mẫu hoàn hảo! Đã vượt qua 100% test case.'
            : `Đạt ${res.passedTests}/${res.totalTests} test. Hãy kiểm tra lại output của các test chưa đạt.`,
      });
    } catch (err: any) {
      setSolutionTestResults({
        passCount: 0,
        total: currentExercise.testCases.length,
        details: 'Lỗi chạy thử: ' + err.message,
      });
    } finally {
      setIsTestingSolution(false);
    }
  };

  // Update test case in draft
  const handleTestCaseChange = (index: number, field: keyof TestCase, val: any) => {
    if (!currentExercise) return;
    const updated = [...currentExercise.testCases];
    updated[index] = { ...updated[index], [field]: val };
    setCurrentExercise({ ...currentExercise, testCases: updated });
  };

  const handleAddTestCase = () => {
    if (!currentExercise) return;
    const newId = currentExercise.testCases.length + 1;
    const newCase: TestCase = {
      id: newId,
      input: '',
      expectedOutput: '',
      isHidden: newId > 2,
      description: `Bộ test #${newId}`,
    };
    setCurrentExercise({
      ...currentExercise,
      testCases: [...currentExercise.testCases, newCase],
    });
  };

  const handleDeleteTestCase = (index: number) => {
    if (!currentExercise) return;
    const updated = currentExercise.testCases
      .filter((_, i) => i !== index)
      .map((tc, idx) => ({ ...tc, id: idx + 1 }));
    setCurrentExercise({ ...currentExercise, testCases: updated });
  };

  // Finalize & Assign
  const handleAssign = () => {
    if (!currentExercise) return;
    onAssignExercise(currentExercise);
    setAssignSuccessModal(currentExercise);
  };

  const getShareUrl = (code: string) => {
    return `${window.location.origin}${window.location.pathname}?code=${code}&role=student`;
  };

  const copyToClipboard = (text: string, type: 'link' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const filteredSubmissions =
    selectedSubExerciseCode === 'ALL'
      ? submissions
      : submissions.filter((s) => s.exerciseCode === selectedSubExerciseCode);

  return (
    <div className="space-y-6">
      {/* Teacher Top Navigation Tabs */}
      <div className="bg-white rounded-2xl p-1.5 shadow-xs border border-slate-200/80 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'create'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" /> Soạn bài với Gemini AI
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'list'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Kho bài tập đã giao ({savedExercises.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('submissions')}
          className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'submissions'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" /> Theo dõi nộp bài ({submissions.length})
        </button>
      </div>

      {/* TAB 1: SOẠN BÀI TẬP BẰNG GEMINI */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          {/* Generator Controls Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Trợ lý Gemini soạn bài tập Python chuẩn THPT
                  </h2>
                  <p className="text-xs text-slate-500">
                    Sinh đề bài sư phạm, ví dụ mẫu, lời giải chuẩn và 8 bộ test case gồm test biên
                  </p>
                </div>
              </div>
            </div>

            {/* Input Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Grade */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Khối Lớp
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setGrade('10');
                      setTopic('Câu lệnh if-else');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition cursor-pointer ${
                      grade === '10'
                        ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    Tin học 10
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGrade('11');
                      setTopic('Danh sách và Thuật toán');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition cursor-pointer ${
                      grade === '11'
                        ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    Tin học 11
                  </button>
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Mức Độ
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Dễ', 'Trung bình', 'Khó'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDifficulty(lvl)}
                      className={`py-2 px-2 rounded-xl border text-xs sm:text-sm font-semibold transition cursor-pointer text-center ${
                        difficulty === lvl
                          ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Chủ Đề Bài Tập
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ví dụ: Câu lệnh if, Vòng lặp for, Danh sách..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-600 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Quick Topic Suggestions */}
            <div>
              <span className="text-xs text-slate-500 font-semibold mr-2">Gợi ý chủ đề nhanh:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {(grade === '10' ? TOPIC_SUGGESTIONS_10 : TOPIC_SUGGESTIONS_11).map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setTopic(sug)}
                    className="text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 px-3 py-1 rounded-lg transition cursor-pointer font-medium"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Prompt */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Yêu cầu bổ sung (Tùy chọn)
              </label>
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ví dụ: Bài toán tính tiền taxi, xử lý số lớn 10^9, hoặc chuỗi ngày tháng..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-600 focus:outline-none transition"
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Sử dụng mô hình <strong className="text-slate-800">Gemini 3.8 Flash</strong>
              </span>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim()}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2.5 text-sm transition cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Gemini đang soạn bài & tạo 8 bộ test...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Tạo bài tập bằng Gemini</span>
                  </>
                )}
              </button>
            </div>

            {genError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{genError}</span>
              </div>
            )}
          </div>

          {/* Current / Generated Exercise Preview & Editor */}
          {currentExercise && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
              {/* Header with Title and Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                    <span className="font-bold text-blue-700">Lớp {currentExercise.grade}</span>
                    <span>·</span>
                    <span className="text-amber-700">{currentExercise.difficulty}</span>
                    <span>·</span>
                    <span className="font-mono font-bold text-purple-700">Mã: {currentExercise.code}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {currentExercise.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleTestSolution}
                    disabled={isTestingSolution}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                    {isTestingSolution ? 'Đang chấm thử...' : 'Chạy thử bài giải'}
                  </button>

                  <button
                    type="button"
                    onClick={handleAssign}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                    Giao bài cho học sinh
                  </button>
                </div>
              </div>

              {/* Solution Test Result Banner */}
              {solutionTestResults && (
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between text-xs sm:text-sm ${
                    solutionTestResults.passCount === solutionTestResults.total
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-amber-50 border-amber-300 text-amber-800'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    {solutionTestResults.passCount === solutionTestResults.total ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    )}
                    <span>
                      Chạy thử Lời giải: {solutionTestResults.passCount}/{solutionTestResults.total} test case ĐÚNG
                    </span>
                  </div>
                  <span className="text-xs opacity-90">{solutionTestResults.details}</span>
                </div>
              )}

              {/* Title & Constraints */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tiêu đề bài toán:
                  </label>
                  <input
                    type="text"
                    value={currentExercise.title}
                    onChange={(e) =>
                      setCurrentExercise({ ...currentExercise, title: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Ràng buộc dữ liệu (Constraints):
                  </label>
                  <input
                    type="text"
                    value={currentExercise.constraints}
                    onChange={(e) =>
                      setCurrentExercise({ ...currentExercise, constraints: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mô tả đề bài chi tiết:
                </label>
                <textarea
                  rows={4}
                  value={currentExercise.description}
                  onChange={(e) =>
                    setCurrentExercise({ ...currentExercise, description: e.target.value })
                  }
                  className="w-full p-3.5 border border-slate-200 rounded-xl text-sm leading-relaxed focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Input / Output Format */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Quy cách Đầu vào (Input):
                  </label>
                  <textarea
                    rows={2}
                    value={currentExercise.inputFormat}
                    onChange={(e) =>
                      setCurrentExercise({ ...currentExercise, inputFormat: e.target.value })
                    }
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Quy cách Đầu ra (Output):
                  </label>
                  <textarea
                    rows={2}
                    value={currentExercise.outputFormat}
                    onChange={(e) =>
                      setCurrentExercise({ ...currentExercise, outputFormat: e.target.value })
                    }
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Sample test */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ví dụ mẫu - Input:
                  </label>
                  <textarea
                    rows={2}
                    value={currentExercise.sampleInput}
                    onChange={(e) =>
                      setCurrentExercise({ ...currentExercise, sampleInput: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ví dụ mẫu - Output:
                  </label>
                  <textarea
                    rows={2}
                    value={currentExercise.sampleOutput}
                    onChange={(e) =>
                      setCurrentExercise({ ...currentExercise, sampleOutput: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giải thích ví dụ:
                  </label>
                  <textarea
                    rows={2}
                    value={currentExercise.sampleExplanation}
                    onChange={(e) =>
                      setCurrentExercise({ ...currentExercise, sampleExplanation: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Solution Code */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Lời giải Python chuẩn của giáo viên (Học sinh KHÔNG thấy phần này):
                  </span>
                  <span className="text-xs text-slate-500">
                    Dùng để đối chiếu và kiểm tra tính hợp lệ của 8 bộ test
                  </span>
                </div>
                <PythonEditor
                  value={currentExercise.solutionCode}
                  onChange={(val) =>
                    setCurrentExercise({ ...currentExercise, solutionCode: val })
                  }
                  title="Lời giải mẫu giáo viên"
                />
              </div>

              {/* 8 Bộ Test Cases List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <span>Bộ test chấm điểm ({currentExercise.testCases.length} bộ test)</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        2 công khai · 6 ẩn
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Giáo viên có thể sửa đổi dữ liệu input, expected output hoặc thêm/xóa test
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTestCase}
                    className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm bộ test
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {currentExercise.testCases.map((tc, idx) => (
                    <div
                      key={tc.id || idx}
                      className={`p-4 rounded-xl border ${
                        tc.isHidden ? 'bg-slate-50/80 border-slate-200' : 'bg-blue-50/40 border-blue-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-slate-800 text-sm">
                            Bộ Test #{tc.id}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleTestCaseChange(idx, 'isHidden', !tc.isHidden)}
                            className={`text-xs px-2.5 py-0.5 rounded-md flex items-center gap-1 font-semibold transition cursor-pointer ${
                              tc.isHidden
                                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            }`}
                          >
                            {tc.isHidden ? (
                              <>
                                <Lock className="w-3 h-3 text-slate-600" /> Test ẩn đối với học sinh
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3 h-3 text-blue-600" /> Test công khai (học sinh thấy)
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={tc.description || ''}
                            onChange={(e) => handleTestCaseChange(idx, 'description', e.target.value)}
                            placeholder="Mục đích test (vd: số âm, biên 0...)"
                            className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-md w-52 hidden sm:block"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteTestCase(idx)}
                            disabled={currentExercise.testCases.length <= 1}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition disabled:opacity-30 cursor-pointer"
                            title="Xóa test này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                        <div>
                          <span className="text-slate-600 font-sans text-xs font-semibold block mb-1">
                            Input (Đầu vào):
                          </span>
                          <textarea
                            rows={2}
                            value={tc.input}
                            onChange={(e) => handleTestCaseChange(idx, 'input', e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <span className="text-emerald-800 font-sans text-xs font-semibold block mb-1">
                            Expected Output (Đầu ra mong đợi):
                          </span>
                          <textarea
                            rows={2}
                            value={tc.expectedOutput}
                            onChange={(e) =>
                              handleTestCaseChange(idx, 'expectedOutput', e.target.value)
                            }
                            className="w-full p-2.5 bg-white border border-emerald-300 rounded-lg focus:outline-none focus:border-emerald-500 font-bold text-emerald-950"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: KHO BÀI TẬP ĐÃ GIAO */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Kho bài tập Python đã giao cho học sinh
              </h2>
              <p className="text-xs text-slate-500">
                Nhấp vào bài tập để xem lại, lấy link hoặc sao chép mã bài cho học sinh
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedExercises.map((ex) => (
              <div
                key={ex.id || ex.code}
                className="p-5 rounded-2xl border border-slate-200 hover:border-blue-300 bg-white hover:bg-slate-50/50 transition flex flex-col justify-between shadow-2xs space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Tin học {ex.grade} · {ex.difficulty}
                    </span>
                    <span className="text-sm font-black font-mono tracking-wider bg-purple-50 text-purple-900 px-3 py-1 rounded-lg border border-purple-200">
                      Mã: {ex.code}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 line-clamp-1">{ex.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {ex.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono">{ex.testCases?.length || 8} bộ test</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(ex.code, 'code')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition cursor-pointer"
                    >
                      Chép mã: {ex.code}
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectExercise(ex)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Xem đề & Sửa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: THEO DÕI HỌC SINH NỘP BÀI */}
      {activeTab === 'submissions' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Bảng theo dõi học sinh nộp bài
              </h2>
              <p className="text-xs text-slate-500">
                Cập nhật điểm số tự động từ Pyodide chấm trên máy học sinh
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600">Lọc theo bài:</label>
              <select
                value={selectedSubExerciseCode}
                onChange={(e) => setSelectedSubExerciseCode(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
              >
                <option value="ALL">Tất cả bài tập</option>
                {savedExercises.map((ex) => (
                  <option key={ex.code} value={ex.code}>
                    {ex.code} - {ex.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold text-slate-600">
                Chưa có lượt nộp bài nào cho bài tập này.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Khi học sinh làm bài và bấm "Nộp bài", kết quả sẽ xuất hiện tại đây theo thời gian thực.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Học sinh</th>
                    <th className="py-3 px-4">Lớp</th>
                    <th className="py-3 px-4">Mã bài</th>
                    <th className="py-3 px-4 text-center">Test đúng</th>
                    <th className="py-3 px-4 text-center">Điểm số</th>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {sub.studentName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {sub.studentClass}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                        {sub.exerciseCode}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                        {sub.passedTests} / {sub.totalTests}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-lg font-black font-mono text-xs ${
                            sub.score >= 8
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : sub.score >= 5
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {sub.score.toFixed(2).replace(/\.00$/, '.0')} / 10
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {new Date(sub.submittedAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        {new Date(sub.submittedAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setViewingStudentSub(sub)}
                          className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition cursor-pointer"
                        >
                          Xem code
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* POPUP MODAL: GIAO BÀI THÀNH CÔNG */}
      {assignSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Giao bài thành công!</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Gửi mã bài tập hoặc liên kết trực tiếp cho học sinh để bắt đầu làm bài.
              </p>
            </div>

            {/* Big 6-character Code Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-6 text-center shadow-lg">
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                MÃ BÀI TẬP (6 KÝ TỰ)
              </div>
              <div className="text-4xl font-black tracking-widest my-2 font-mono">
                {assignSuccessModal.code}
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(assignSuccessModal.code, 'code')}
                className="mt-1 px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Đã sao chép mã!' : 'Sao chép mã bài'}
              </button>
            </div>

            {/* Direct Link */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Đường dẫn trực tiếp cho học sinh:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={getShareUrl(assignSuccessModal.code)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(getShareUrl(assignSuccessModal.code), 'link')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedLink ? 'Đã chép link' : 'Chép link'}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setAssignSuccessModal(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: XEM CODE CỦA HỌC SINH */}
      {viewingStudentSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Bài làm của: {viewingStudentSub.studentName} (Lớp {viewingStudentSub.studentClass})
                </h3>
                <p className="text-xs text-slate-500">
                  Mã bài: {viewingStudentSub.exerciseCode} • Điểm: {viewingStudentSub.score}/10 ({viewingStudentSub.passedTests}/{viewingStudentSub.totalTests} test đúng)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingStudentSub(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                Mã nguồn học sinh nộp:
              </label>
              <PythonEditor
                value={viewingStudentSub.code}
                readOnly
                title={`Bài của ${viewingStudentSub.studentName}`}
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingStudentSub(null)}
                className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
