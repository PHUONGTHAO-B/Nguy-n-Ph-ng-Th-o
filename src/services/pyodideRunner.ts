import { TestCase, TestResult, TestStatus } from '../types';

export function normalizeOutput(str: string): string {
  if (!str) return '';
  return str
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

const workerCode = `
let pyodide = null;
let initPromise = null;

async function getPyodide() {
  if (pyodide) return pyodide;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");
    const p = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/"
    });
    pyodide = p;
    return p;
  })();
  return initPromise;
}

self.onmessage = async (e) => {
  const { id, type, code, input } = e.data;
  
  if (type === 'PING') {
    self.postMessage({ id, type: 'PONG' });
    return;
  }

  if (type === 'INIT') {
    try {
      await getPyodide();
      self.postMessage({ id, type: 'INIT_DONE', success: true });
    } catch (err) {
      self.postMessage({ id, type: 'INIT_DONE', success: false, error: String(err) });
    }
    return;
  }

  if (type === 'RUN') {
    try {
      const p = await getPyodide();
      
      const harness = \`
import sys
import io

class MockStdin:
    def __init__(self, text):
        self.lines = text.splitlines(True)
        self.idx = 0
    def readline(self):
        if self.idx < len(self.lines):
            l = self.lines[self.idx]
            self.idx += 1
            if not l.endswith('\\n'):
                l += '\\n'
            return l
        return ''
    def read(self, *args):
        remaining = "".join(self.lines[self.idx:])
        self.idx = len(self.lines)
        return remaining

sys.stdin = MockStdin(__RAW_INPUT__)
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()

__RUN_ERROR__ = None
try:
    # Use clean dict so student variables don't bleed across tests
    student_env = {
        '__name__': '__main__',
        'sys': sys,
    }
    exec(__STUDENT_CODE__, student_env)
except Exception as e:
    import traceback
    __RUN_ERROR__ = traceback.format_exc()

__STDOUT__ = sys.stdout.getvalue()
__STDERR__ = sys.stderr.getvalue()
\`;
      p.globals.set('__RAW_INPUT__', input ?? '');
      p.globals.set('__STUDENT_CODE__', code ?? '');

      await p.runPythonAsync(harness);

      const stdout = p.globals.get('__STDOUT__');
      const stderr = p.globals.get('__STDERR__');
      const runError = p.globals.get('__RUN_ERROR__');

      self.postMessage({
        id,
        type: 'RUN_DONE',
        success: !runError,
        stdout: stdout || '',
        stderr: stderr || '',
        error: runError || null,
      });
    } catch (err) {
      self.postMessage({
        id,
        type: 'RUN_DONE',
        success: false,
        stdout: '',
        stderr: '',
        error: String(err && err.message ? err.message : err),
      });
    }
  }
};
`;

class PyodideManager {
  private worker: Worker | null = null;
  private workerUrl: string | null = null;
  private isReady = false;
  private initPromise: Promise<boolean> | null = null;
  private messageCounter = 0;

  private createWorker(): Worker {
    if (!this.workerUrl) {
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.workerUrl = URL.createObjectURL(blob);
    }
    const worker = new Worker(this.workerUrl);
    return worker;
  }

  public async preload(): Promise<boolean> {
    if (this.isReady) return true;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve) => {
      try {
        this.worker = this.createWorker();
        const msgId = ++this.messageCounter;

        const handleMsg = (e: MessageEvent) => {
          if (e.data.id === msgId && e.data.type === 'INIT_DONE') {
            this.worker?.removeEventListener('message', handleMsg);
            if (e.data.success) {
              this.isReady = true;
              resolve(true);
            } else {
              console.warn('Pyodide init warning:', e.data.error);
              resolve(false);
            }
          }
        };

        this.worker.addEventListener('message', handleMsg);
        this.worker.postMessage({ id: msgId, type: 'INIT' });

        // Safeguard timeout for CDN load
        setTimeout(() => {
          if (!this.isReady) {
            this.isReady = true; // Still allow attempts
            resolve(true);
          }
        }, 15000);
      } catch (err) {
        console.error('Failed to create worker:', err);
        resolve(false);
      }
    });

    return this.initPromise;
  }

  public async runSingle(
    code: string,
    input: string,
    timeoutMs: number = 2000
  ): Promise<{
    success: boolean;
    stdout: string;
    stderr: string;
    error: string | null;
    isTimeout: boolean;
    durationMs: number;
  }> {
    if (!this.worker) {
      await this.preload();
    }

    const startTime = performance.now();
    const msgId = ++this.messageCounter;

    return new Promise((resolve) => {
      let timer: any = null;
      let settled = false;

      const finish = (result: any) => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        this.worker?.removeEventListener('message', onMessage);
        resolve(result);
      };

      const onMessage = (e: MessageEvent) => {
        if (e.data.id === msgId && e.data.type === 'RUN_DONE') {
          const durationMs = Math.round(performance.now() - startTime);
          finish({
            success: e.data.success,
            stdout: e.data.stdout || '',
            stderr: e.data.stderr || '',
            error: e.data.error,
            isTimeout: false,
            durationMs,
          });
        }
      };

      this.worker?.addEventListener('message', onMessage);

      // 2000ms Timeout safeguard: terminate worker and respawn
      timer = setTimeout(() => {
        if (settled) return;
        console.warn(`Python execution timed out (> ${timeoutMs}ms). Terminating worker...`);
        try {
          this.worker?.terminate();
        } catch (_) {}
        this.worker = this.createWorker();
        // Warm up the new worker
        this.worker.postMessage({ id: ++this.messageCounter, type: 'INIT' });

        finish({
          success: false,
          stdout: '',
          stderr: '',
          error: `Quá thời gian cho phép (Vượt quá ${timeoutMs / 1000}s). Có thể gặp vòng lặp vô hạn hoặc thuật toán quá chậm.`,
          isTimeout: true,
          durationMs: timeoutMs,
        });
      }, timeoutMs);

      try {
        this.worker?.postMessage({
          id: msgId,
          type: 'RUN',
          code,
          input,
        });
      } catch (err) {
        finish({
          success: false,
          stdout: '',
          stderr: '',
          error: String(err),
          isTimeout: false,
          durationMs: 0,
        });
      }
    });
  }

  public async evaluateAllTests(
    code: string,
    testCases: TestCase[],
    onProgress?: (completed: number, total: number, lastResult: TestResult) => void
  ): Promise<{
    results: TestResult[];
    passedTests: number;
    totalTests: number;
    score: number;
  }> {
    await this.preload();
    const results: TestResult[] = [];
    let passedCount = 0;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const res = await this.runSingle(code, tc.input, 2000);

      let status: TestStatus = 'PASSED';
      let errorMessage = res.error || undefined;

      if (res.isTimeout) {
        status = 'TIMEOUT';
      } else if (!res.success || res.error) {
        status = 'ERROR';
      } else {
        const normActual = normalizeOutput(res.stdout);
        const normExpected = normalizeOutput(tc.expectedOutput);
        if (normActual === normExpected) {
          status = 'PASSED';
          passedCount++;
        } else {
          status = 'FAILED';
        }
      }

      const itemResult: TestResult = {
        testId: tc.id,
        status,
        input: tc.input,
        actualOutput: res.stdout,
        expectedOutput: tc.expectedOutput,
        executionTimeMs: res.durationMs,
        errorMessage,
        isHidden: tc.isHidden,
        description: tc.description,
      };

      results.push(itemResult);
      if (onProgress) {
        onProgress(i + 1, testCases.length, itemResult);
      }
    }

    const totalTests = testCases.length;
    // Điểm = (số test đúng / tổng số test) * 10, làm tròn 0.25
    const rawScore = totalTests > 0 ? (passedCount / totalTests) * 10 : 0;
    const roundedScore = Math.round(rawScore * 4) / 4;

    return {
      results,
      passedTests: passedCount,
      totalTests,
      score: roundedScore,
    };
  }
}

export const pyodideManager = new PyodideManager();
