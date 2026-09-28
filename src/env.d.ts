/// <reference types="astro/client" />

/**
 * Bentuk balasan `api/quiz.php` yang dipakai halaman latihan.
 *
 * `results[qid]` memuat pilihan mahasiswa (`opt`) + penilaian server (`benar`)
 * + penjelasan. Indeks jawaban yang benar tidak pernah ikut dikirim.
 */
interface HasilKuis {
  ok: boolean;
  status: number;
  data?: {
    results?: Record<string, { opt: number; benar: boolean; jelas?: string }>;
    benar?: number;
    tertawab?: number;
    total?: number;
    tuntas?: boolean;
    progress?: Record<string, string>;
  };
  error?: string;
}

interface APIAuthGlobal {
  gradeQuiz(pertemuanId: number, jawaban: Record<string, number>): Promise<HasilKuis>;
  quizState(pertemuanId: number): Promise<HasilKuis>;
  refresh?(): void;
}

interface Window {
  APIAuth?: APIAuthGlobal;
}
