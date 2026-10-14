import React from 'react';
import { TestResult, AiReviewResponse } from '../types';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Lock,
  Sparkles,
  Check,
  AlertCircle,
  Lightbulb,
  HeartHandshake,
  Award,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface TestResultsTableProps {
  results: TestResult[];
  score: number;
  passedTests: number;
  totalTests: number;
  aiReview?: AiReviewResponse | null;
  isLoadingAiReview?: boolean;
  onRequestAiReview?: () => void;
}

export const TestResultsTable: React.FC<TestResultsTableProps> = ({
  results,
  score,
  passedTests,
  totalTests,
  aiReview,
  isLoadingAiReview,
  onRequestAiReview,
}) => {
  const failedCount = results.filter((r) => r.status === 'FAILED').length;
  const errorCount = results.filter((r) => r.status === 'ERROR').length;
  const timeoutCount = results.filter((r) => r.status === 'TIMEOUT').length;

  const scorePercentage = Math.round((passedTests / Math.max(totalTests, 1)) * 100);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đúng (Passed)
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-700 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Sai kết quả (Failed)
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Lỗi chạy (Error)
          </span>
        );
      case 'TIMEOUT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-700 border border-purple-500/30">
            <Clock className="w-3.5 h-3.5 text-purple-600" /> Quá thời gian (TLE &gt; 2s)
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Premium Scoreboard Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 text-white shadow-xl border border-blue-900/50">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Score dial & Summary */}
          <div className="flex items-center gap-5">
            {/* Visual Score Ring */}
            <div className="relative w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md flex flex-col items-center justify-center border border-white/20 shadow-inner shrink-0">
              <span className="text-3xl font-black font-mono tracking-tight text-white">
                {score.toFixed(2).replace(/\.00$/, '.0')}
              </span>
              <span className="text-[10px] uppercase font-semibold text-blue-200">/ 10 điểm</span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {score >= 8 ? 'Kết quả Xuất sắc' : score >= 5 ? 'Đạt yêu cầu' : 'Cần cố gắng thêm'}
                </span>
                <span className="text-xs text-slate-400">· Làm tròn 0,25</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-white">
                Đúng {passedTests}/{totalTests} bộ test case ({scorePercentage}%)
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                  ✓ {passedTests} Đúng
                </span>
                {failedCount > 0 && (
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
                    ✕ {failedCount} Sai
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                    ! {errorCount} Lỗi
                  </span>
                )}
                {timeoutCount > 0 && (
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                    ⏱ {timeoutCount} TLE
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Action or Praise */}
          <div className="w-full md:w-auto flex flex-col items-stretch md:items-end gap-2">
            {score === 10 ? (
              <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-300 text-sm font-semibold flex items-center justify-center gap-2">
                <Award className="w-5 h-5 text-amber-300" />
                <span>Hoàn thành 100% test case! Tuyệt vời!</span>
              </div>
            ) : (
              onRequestAiReview && (
                <button
                  type="button"
                  onClick={onRequestAiReview}
                  disabled={isLoadingAiReview}
                  className="px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2.5 transition text-sm cursor-pointer border border-blue-400/30"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  {isLoadingAiReview ? (
                    <span>Gemini đang đọc code và phân tích...</span>
                  ) : (
                    <span>Nhận xét gợi ý từ Giáo viên AI</span>
                  )}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Gemini AI Teacher Pedagogical Card */}
      {aiReview && (
        <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800">
                  Nhận xét sư phạm từ Giáo viên AI (Gemini)
                </h4>
                <p className="text-xs text-slate-500">
                  Phân tích logic, tìm nguyên nhân lỗi và gợi ý tư duy tự khắc phục
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              Không giải hộ • Hướng dẫn tư duy
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider mb-2">
                <Check className="w-4 h-4 text-emerald-600" /> Điểm sáng trong bài làm:
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                {aiReview.strengths && aiReview.strengths.length > 0 ? (
                  aiReview.strengths.map((str, idx) => <li key={idx}>{str}</li>)
                ) : (
                  <li>Đã hoàn thành cấu trúc chương trình cơ bản.</li>
                )}
              </ul>
            </div>

            {/* Issues */}
            <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wider mb-2">
                <AlertCircle className="w-4 h-4 text-rose-600" /> Vấn đề cần khắc phục:
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                {aiReview.issues && aiReview.issues.length > 0 ? (
                  aiReview.issues.map((iss, idx) => <li key={idx}>{iss}</li>)
                ) : (
                  <li>Không phát hiện lỗi thuật toán nghiêm trọng.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Suggestions */}
          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200">
            <div className="flex items-center gap-2 text-amber-950 font-bold text-xs uppercase tracking-wider mb-2">
              <Lightbulb className="w-4 h-4 text-amber-600" /> Gợi ý định hướng sửa (Học sinh tự sửa):
            </div>
            <ul className="text-xs text-amber-950 space-y-1.5 list-disc list-inside">
              {aiReview.suggestions && aiReview.suggestions.length > 0 ? (
                aiReview.suggestions.map((sug, idx) => <li key={idx}>{sug}</li>)
              ) : (
                <li>Hãy kiểm tra kỹ các trường hợp biên như số âm, số 0 hoặc phần tử trùng lặp.</li>
              )}
            </ul>
          </div>

          {/* Teacher encouragement */}
          {aiReview.generalFeedback && (
            <div className="flex items-start gap-3 bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 text-xs text-blue-950 font-medium">
              <HeartHandshake className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <span>{aiReview.generalFeedback}</span>
            </div>
          )}
        </div>
      )}

      {/* 8 Bộ Test Breakdown Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-slate-800">
              Chi tiết kết quả 8 bộ test case
            </h4>
            <span className="text-xs text-slate-500 font-medium">
              (2 test công khai · 6 test ẩn)
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Giới hạn: 2.0s / test</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {results.map((res, index) => {
            const isVisible = !res.isHidden;

            return (
              <div
                key={res.testId || index}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-blue-300 transition"
              >
                {/* Test Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-slate-800 text-sm">
                      Test #{res.testId}
                    </span>
                    {isVisible ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        Test công khai
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-slate-500" />
                        Test ẩn: {res.description || 'Trường hợp biên'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400">
                      ⏱ {res.executionTimeMs}ms
                    </span>
                    {getStatusBadge(res.status)}
                  </div>
                </div>

                {/* Visible Test Details (Test 1 & Test 2) */}
                {isVisible ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono mt-3">
                    {/* Input */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="text-[11px] font-sans font-semibold text-slate-500 mb-1">
                        Đầu vào (Input):
                      </div>
                      <pre className="text-slate-800 whitespace-pre-wrap overflow-x-auto max-h-24">
                        {res.input || '(Trống)'}
                      </pre>
                    </div>

                    {/* Expected */}
                    <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200">
                      <div className="text-[11px] font-sans font-semibold text-emerald-800 mb-1">
                        Đầu ra mong đợi (Expected):
                      </div>
                      <pre className="text-emerald-950 font-bold whitespace-pre-wrap overflow-x-auto max-h-24">
                        {res.expectedOutput || '(Trống)'}
                      </pre>
                    </div>

                    {/* Actual */}
                    <div
                      className={`p-3 rounded-lg border ${
                        res.status === 'PASSED'
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950 font-bold'
                          : 'bg-rose-50 border-rose-200 text-rose-950 font-bold'
                      }`}
                    >
                      <div
                        className={`text-[11px] font-sans font-semibold mb-1 ${
                          res.status === 'PASSED' ? 'text-emerald-800' : 'text-rose-800'
                        }`}
                      >
                        Đầu ra thực tế (Output của bạn):
                      </div>
                      <pre className="whitespace-pre-wrap overflow-x-auto max-h-24">
                        {res.actualOutput || (res.errorMessage ? `[Lỗi] ${res.errorMessage}` : '(Không in ra gì)')}
                      </pre>
                    </div>
                  </div>
                ) : (
                  /* Hidden Test representation */
                  <div className="mt-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Dữ liệu đầu vào và kết quả của test này được ẩn để đánh giá tính tổng quát và khả năng xử lý trường hợp đặc biệt.
                      </span>
                    </div>
                    <span className="font-semibold text-slate-700 shrink-0 ml-2">
                      {res.status === 'PASSED'
                        ? 'Khớp 100%'
                        : res.status === 'TIMEOUT'
                        ? 'Vượt 2.0s'
                        : res.status === 'ERROR'
                        ? 'Ngoại lệ'
                        : 'Sai đáp án'}
                    </span>
                  </div>
                )}

                {/* Error message detail if any */}
                {res.errorMessage && isVisible && (
                  <div className="mt-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                    {res.errorMessage}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
