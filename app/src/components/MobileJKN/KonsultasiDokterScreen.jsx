import React, { useState } from 'react';
import { ChevronLeft, Send, Stethoscope, Clock, ShieldCheck, CheckCheck } from 'lucide-react';

export default function KonsultasiDokterScreen({ onNavigate }) {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [messages, setMessages] = useState([
    {
      sender: 'doctor',
      time: '09:40',
      text: 'Halo Bapak Ahmad. Saya dr. Siti Rahma dari FKTP Klinik Pratama Nasional BPJS (Simulasi). Ada keluhan yang bisa saya bantu terkait kesehatan Anda?',
    },
  ]);
  const [inputText, setInputText] = useState('');

  const doctors = [
    {
      id: 1,
      name: 'dr. Siti Rahma',
      spec: 'Dokter Umum (FKTP Anda)',
      sip: 'SIP: 503/446/DU/2022',
      clinic: 'Klinik Pratama Nasional BPJS',
      status: 'Online',
      avatar: '/assets/images/dokter_avatar.png',
    },
    {
      id: 2,
      name: 'drg. Anindya Putri',
      spec: 'Dokter Gigi',
      sip: 'SIP: 503/112/DG/2023',
      clinic: 'Klinik Pratama Nasional BPJS',
      status: 'Online',
      avatar: '/assets/images/female_icon.png',
    },
    {
      id: 3,
      name: 'dr. Budi Santoso, Sp.A',
      spec: 'Spesialis Anak (Konsul Rujukan)',
      sip: 'SIP: 446/782/SpA/2021',
      clinic: 'RSUPN Dr. Cipto Mangunkusumo',
      status: 'Sibuk',
      avatar: '/assets/images/docter_icon.png',
    },
  ];

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: inputText,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Simulasi jawaban dokter otomatis
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'doctor',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'Terima kasih atas informasinya. Keluhan Anda telah kami catat pada riwayat konsultasi medis digital. Jangan lupa istirahat cukup dan banyak minum air putih ya.',
        },
      ]);
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F5F7FA] overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center space-x-3 shadow-sm shrink-0">
        <button type="button" 
          onClick={() => {
            if (selectedDoctor) {
              setSelectedDoctor(null);
            } else {
              onNavigate('home');
            }
          }} 
          className="p-1 text-slate-700 hover:text-black rounded-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm font-bold text-slate-900 leading-tight">
            {selectedDoctor ? selectedDoctor.name : 'Konsultasi Dokter Online'}
          </h2>
          <span className="text-[10px] text-slate-500 font-medium">
            {selectedDoctor ? selectedDoctor.spec : 'FKTP Klinik Pratama Nasional BPJS'}
          </span>
        </div>
      </div>

      {selectedDoctor ? (
        /* CHAT VIEW DENGAN DOKTER */
        <div className="flex-1 flex flex-col bg-[#ECE5DD] overflow-hidden">
          
          {/* Security Banner */}
          <div className="bg-white/80 backdrop-blur py-1.5 px-3 border-b border-slate-200 text-center text-[10px] text-slate-600 flex items-center justify-center space-x-1 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Percakapan terenkripsi & tercatat dalam Rekam Medis Elektronik JKN</span>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 shadow-sm text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#E1FFC7] text-slate-900 rounded-tr-none'
                      : 'bg-white text-slate-900 rounded-tl-none'
                  }`}
                >
                  <p>{m.text}</p>
                  <div className="flex items-center justify-end space-x-1 mt-1 text-[9px] text-slate-400">
                    <span>{m.time}</span>
                    {m.sender === 'user' && <CheckCheck className="w-3 h-3 text-blue-500" />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSend} className="bg-white p-2 border-t border-slate-200 flex items-center space-x-2 shrink-0">
            <input aria-label="Bidang input data"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ketik pesan keluhan kepada dokter..."
              className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            <button aria-label="Kirim pesan"
              type="submit"
              className="bg-[#0288D1] hover:bg-blue-600 text-white p-2 rounded-full shadow-xs active:scale-95 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        /* DAFTAR DOKTER FKTP */
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200 text-xs text-blue-900 space-y-1">
            <span className="font-bold">Layanan Telemedisin BPJS Kesehatan</span>
            <p className="text-[10.5px] text-blue-700">
              Konsultasi langsung tanpa harus datang ke faskes untuk keluhan ringan dan peresepan obat berkelanjutan.
            </p>
          </div>

          <div className="space-y-2.5">
            {doctors.map((d) => (
              <div
                key={d.id}
                onClick={() => setSelectedDoctor(d)}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3 cursor-pointer hover:border-blue-400 transition"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Stethoscope className="w-6 h-6 text-emerald-700" />
                  </div>
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    d.status === 'Online' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-slate-900">{d.name}</h4>
                    <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {d.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 font-medium">{d.spec}</p>
                  <p className="text-[9.5px] text-slate-400">{d.clinic}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
