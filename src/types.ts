export interface TestCase {
  id: number;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  description?: string;
}

export interface Exercise {
  id: string;
  code: string; // 6 uppercase characters
  title: string;
  grade: '10' | '11';
  topic: string;
  difficulty: 'Dễ' | 'Trung bình' | 'Khó';
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  sampleInput: string;
  sampleOutput: string;
  sampleExplanation: string;
  solutionCode: string;
  starterCode?: string;
  testCases: TestCase[];
  createdAt: string;
}

export type TestStatus = 'PASSED' | 'FAILED' | 'ERROR' | 'TIMEOUT';

export interface TestResult {
  testId: number;
  status: TestStatus;
  input: string;
  actualOutput: string;
  expectedOutput: string;
  executionTimeMs: number;
  errorMessage?: string;
  isHidden: boolean;
  description?: string;
}

export interface Submission {
  id: string;
  exerciseCode: string;
  studentName: string;
  studentClass: string;
  score: number; // Rounded to 0.25: (passedTests / totalTests) * 10
  passedTests: number;
  totalTests: number;
  submittedAt: string;
  code: string;
  aiReview?: string;
  results: TestResult[];
}

export interface AiReviewResponse {
  strengths: string[];
  issues: string[];
  suggestions: string[];
  generalFeedback: string;
}
