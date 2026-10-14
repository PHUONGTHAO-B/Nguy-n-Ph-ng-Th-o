/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Exercise, Submission } from './types';
import { DEFAULT_EXERCISES } from './data/defaultExercises';
import { TeacherView } from './components/TeacherView';
import { StudentView } from './components/StudentView';
import { pyodideManager } from './services/pyodideRunner';
import {
  Code2,
  GraduationCap,
  Sparkles,
  BookOpen,
  Info,
  Laptop,
  CheckCircle,
  HelpCircle,
  Terminal,
  Cpu
} from 'lucide-react';

export default function App() {
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [exercises, setExercises] = useState<Exercise[]>(() => {
    const saved = localStorage.getItem('thpt_exercises_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (_) {}
    }
    return DEFAULT_EXERCISES;
  });

  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem('thpt_submissions_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return [];
  });

  const [pyodideReady, setPyodideReady] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Background preload Pyodide WebAssembly on mount
  useEffect(() => {
    pyodideManager.preload().then((ok) => {
      setPyodideReady(ok);
    });
  }, []);

  // Parse URL query parameters (?role=teacher|student & ?code=XXXXXX)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    const codeParam = params.get('code');

    if (roleParam === 'teacher' || roleParam === 'student') {
      setRole(roleParam);
    }

    if (codeParam) {
      const found = exercises.find((ex) => ex.code.toUpperCase() === codeParam.trim().toUpperCase());
      if (found) {
        setCurrentExercise(found);
      }
    } else if (!currentExercise && exercises.length > 0) {
      setCurrentExercise(exercises[0]);
    }
  }, []);

  // Sync exercises with backend
  useEffect(() => {
    const fetchBackendExercises = async () => {
      try {
        const res = await fetch('/api/exercises');
        if (res.ok) {
          const data = await res.json();
          if (data.exercises && data.exercises.length > 0) {
            setExercises((prev) => {
              const map = new Map<string, Exercise>();
              DEFAULT_EXERCISES.forEach((e) => map.set(e.code, e));
              prev.forEach((e) => map.set(e.code, e));
              data.exercises.forEach((e: Exercise) => map.set(e.code, e));
              const merged = Array.from(map.values());
              localStorage.setItem('thpt_exercises_v1', JSON.stringify(merged));
              return merged;
            });
          }
        }
      } catch (err) {
        // graceful offline fallback
      }
    };
    fetchBackendExercises();
  }, []);

  // Save submissions locally and to backend
  const handleSubmitResult = async (submission: Submission) => {
    const updated = [submission, ...submissions];
    setSubmissions(updated);
    localStorage.setItem('thpt_submissions_v1', JSON.stringify(updated));

    try {
      await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });
    } catch (_) {}
  };

  // Add newly assigned exercise from teacher
  const handleAssignExercise = async (newEx: Exercise) => {
    const updated = [newEx, ...exercises.filter((e) => e.code !== newEx.code)];
    setExercises(updated);
    localStorage.setItem('thpt_exercises_v1', JSON.stringify(updated));
    setCurrentExercise(newEx);

    try {
      await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEx),
      });
    } catch (_) {}
  };

  const handleSelectExerciseByCode = (code: string): boolean => {
    const target = exercises.find((e) => e.code.toUpperCase() === code.trim().toUpperCase());
    if (target) {
      setCurrentExercise(target);
      return true;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-blue-600/20 selection:text-blue-900">
      {/* Top Bar Contract: 3 Zones */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Code2 className="w-5 h-5" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight whitespace-nowrap">
                Luyện Lập Trình Python
              </span>
              <span className="hidden md:inline-block text-xs font-semibold text-slate-500">
                · Tin học THPT
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation & Mode Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                role === 'student'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Laptop className="w-4 h-4 text-blue-600" />
              <span>Học sinh làm bài</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('teacher')}
              className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                role === 'teacher'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>Giáo viên soạn đề</span>
            </button>
          </div>

          {/* Zone 3: 1 Primary status / Guide action */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Pyodide state */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span
                className={`w-2 h-2 rounded-full ${
                  pyodideReady ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
                }`}
              ></span>
              <span className="font-mono text-[11px]">
                {pyodideReady ? 'Python 3.11 WASM Sẵn sàng' : 'Nạp Pyodide...'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition cursor-pointer"
              title="Hướng dẫn sử dụng"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {role === 'teacher' ? (
          <TeacherView
            onAssignExercise={handleAssignExercise}
            savedExercises={exercises}
            onSelectExercise={(ex) => {
              setCurrentExercise(ex);
              setRole('student');
            }}
            submissions={submissions}
          />
        ) : (
          <StudentView
            currentExercise={currentExercise}
            savedExercises={exercises}
            onSelectExerciseByCode={handleSelectExerciseByCode}
            onSubmitResult={handleSubmitResult}
          />
        )}
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Tin học THPT</span>
            <span>·</span>
            <span>Luyện tập ngôn ngữ lập trình Python 3 cho học sinh lớp 10 & 11</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>Pyodide WebAssembly (Sandbox 2.0s)</span>
            <span>·</span>
            <span>Gemini 3.8 Flash AI</span>
          </div>
        </div>
      </footer>

      {/* GUIDE MODAL */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-lg">
                <Info className="w-5 h-5 text-blue-600" />
                <span>Hướng dẫn sử dụng nền tảng</span>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200/80">
                <h4 className="font-bold text-blue-900 mb-1.5 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-blue-600" /> Dành cho Giáo viên:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Chọn khối lớp (10 hoặc 11), chủ đề bài học và mức độ.</li>
                  <li>Bấm "Tạo bài tập bằng Gemini": AI tự động soạn đề bài sư phạm, giải thích mẫu, lời giải chuẩn và 8 bộ test case gồm test biên.</li>
                  <li>Giáo viên xem, chỉnh sửa nội dung đề bài và các bộ test nếu cần. Bấm "Chạy thử bài giải" để kiểm tra.</li>
                  <li>Bấm "Giao bài cho học sinh" để lấy mã 6 ký tự hoặc đường dẫn trực tiếp.</li>
                  <li>Theo dõi kết quả điểm số và code nộp của từng học sinh ở tab "Theo dõi nộp bài".</li>
                </ul>
              </div>

              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80">
                <h4 className="font-bold text-emerald-900 mb-1.5 flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-emerald-600" /> Dành cho Học sinh:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Nhập Họ tên, Lớp và Mã bài tập (6 ký tự) do giáo viên cung cấp.</li>
                  <li>Đọc kỹ đề bài, ràng buộc và ví dụ mẫu (lời giải và các test ẩn được giữ kín).</li>
                  <li>Viết code trong khung soạn thảo Python (hỗ trợ Tab 4 dấu cách, phóng to chữ cho máy phòng máy).</li>
                  <li>Dùng nút "Chạy thử" với input tự chọn để kiểm tra thuật toán.</li>
                  <li>Bấm "Nộp bài": Hệ thống Pyodide tự động chạy 8 bộ test (giới hạn 2 giây/test) và tính điểm chính xác làm tròn 0,25.</li>
                  <li>Bấm "Nhận xét từ Giáo viên AI" để nhận gợi ý tư duy sửa lỗi mà không lo bị lộ đáp án!</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer shadow-xs"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
