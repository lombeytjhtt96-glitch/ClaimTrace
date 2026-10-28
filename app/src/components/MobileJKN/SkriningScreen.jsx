import React, { useState } from 'react';
import { ChevronLeft, Heart, Activity, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function SkriningScreen({ onNavigate }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(false);

  const questions = [
    {
      id: 1,
      title: 'Riwayat Penyakit Keluarga',
      question: 'Apakah orang tua atau saudara kandung Anda memiliki riwayat Diabetes Melitus (Kencing Manis)?',
    },
    {
      id: 2,
      title: 'Pola Makan & Konsumsi Gula',
      question: 'Apakah Anda rutin mengonsumsi minuman manis / makanan berlemak tinggi lebih dari 3 kali seminggu?',
    },
    {
      id: 3,
      title: 'Aktivitas Fisik Harian',
      question: 'Apakah Anda melakukan aktivitas fisik / olahraga minimal 30 menit sehari selama 3 kali seminggu?',
    },
    {
      id: 4,
      title: 'Gejala Tekanan Darah',
      question: 'Apakah Anda sering mengalami pusing tengkuk berat atau tekanan darah di atas 130/90 mmHg?',
    },
  ];

  const handleAnswer = (ans) => {
    setAnswers({ ...answers, [step]: ans });
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setCompleted(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F5F7FA] overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center space-x-3 shadow-sm shrink-0">
        <button type="button" onClick={() => onNavigate('home')} className="p-1 text-slate-700 hover:text-black rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm font-bold text-slate-900 leading-tight">
            Skrining Riwayat Kesehatan
          </h2>
          <span className="text-[10px] text-slate-500 font-medium">
            Deteksi Dini Faktor Risiko Penyakit
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {completed ? (
          /* HASIL SKRINING KESEHATAN */
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3 text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  HASIL SKRINING TAHUN 2026
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Risiko Kesehatan Rendah
                </h3>
                <p className="text-xs text-slate-500">
                  AHMAD SYAFIQ (PESERTA SIMULASI - 28 TAHUN)
                </p>
              </div>

              {/* Matrix Risiko */}
              <div className="space-y-2 pt-2 text-left text-xs">
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex justify-between items-center">
                  <span className="font-semibold text-slate-800">Diabetes Melitus:</span>
                  <span className="font-bold text-emerald-700">Risiko Rendah</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex justify-between items-center">
                  <span className="font-semibold text-slate-800">Hipertensi:</span>
                  <span className="font-bold text-emerald-700">Risiko Rendah</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex justify-between items-center">
                  <span className="font-semibold text-slate-800">Penyakit Ginjal Kronis:</span>
                  <span className="font-bold text-emerald-700">Risiko Rendah</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 text-center leading-relaxed pt-2">
                *) Hasil ini merupakan penapisan awal. Pertahankan pola hidup sehat, cukupi hidrasi, dan rutin berolahraga.
              </p>

              <button type="button"
                onClick={() => {
                  setCompleted(false);
                  setStep(0);
                  setAnswers({});
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition"
              >
                Ulangi Skrining
              </button>
            </div>
          </div>
        ) : (
          /* KUESIONER */
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-500">
                <span>Pertanyaan {step + 1} dari {questions.length}</span>
                <span>{Math.round(((step + 1) / questions.length) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${((step + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {questions[step].title}
              </span>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                "{questions[step].question}"
              </h3>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button type="button"
                  onClick={() => handleAnswer('ya')}
                  className="bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 text-slate-800 hover:text-emerald-700 font-bold py-3.5 rounded-2xl text-xs transition active:scale-95"
                >
                  Ya
                </button>
                <button type="button"
                  onClick={() => handleAnswer('tidak')}
                  className="bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-400 text-slate-800 hover:text-blue-700 font-bold py-3.5 rounded-2xl text-xs transition active:scale-95"
                >
                  Tidak
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
