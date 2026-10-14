import React, { useState } from 'react';
import { Copy, Check, Download, ExternalLink, Terminal, FileCode, CheckCircle2 } from 'lucide-react';

interface StreamlitCodeViewerProps {
  appPyCode: string;
  requirementsTxt: string;
}

export const StreamlitCodeViewer: React.FC<StreamlitCodeViewerProps> = ({
  appPyCode,
  requirementsTxt
}) => {
  const [copiedApp, setCopiedApp] = useState(false);
  const [copiedReq, setCopiedReq] = useState(false);

  const handleCopyApp = () => {
    navigator.clipboard.writeText(appPyCode);
    setCopiedApp(true);
    setTimeout(() => setCopiedApp(false), 2500);
  };

  const handleCopyReq = () => {
    navigator.clipboard.writeText(requirementsTxt);
    setCopiedReq(true);
    setTimeout(() => setCopiedReq(false), 2500);
  };

  const downloadFile = (filename: string, content: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex flex-col gap-4 font-mono">
      {/* Top Banner */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
            <FileCode className="w-5 h-5 text-amber-400" />
            <span>CÓDIGO FUENTE DE STREAMLIT (app.py)</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700">
              Listo para Despliegue
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
            Archivo autónomo <code className="text-amber-300">app.py</code> optimizado con NumPy, Plotly y Streamlit Session State.
            Puedes copiarlo o descargarlo directamente para ejecutarlo localmente o en Streamlit Community Cloud.
          </p>
        </div>

        {/* Action Download Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadFile('app.py', appPyCode)}
            className="px-3.5 py-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30 text-xs font-semibold flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Descargar app.py</span>
          </button>

          <button
            onClick={() => downloadFile('requirements.txt', requirementsTxt)}
            className="px-3.5 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 text-xs font-semibold flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>requirements.txt</span>
          </button>
        </div>
      </div>

      {/* Deployment Instructions Card */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
        <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono">
            <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-600 flex items-center justify-center text-[11px]">1</span>
            <span>Instalación Local</span>
          </div>
          <p className="text-slate-400 text-[11px]">Ejecuta en tu terminal:</p>
          <div className="bg-black/60 p-2 rounded text-[11px] font-mono text-cyan-300 border border-slate-800">
            pip install -r requirements.txt<br/>
            streamlit run app.py
          </div>
        </div>

        <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-2 text-cyan-400 font-bold font-mono">
            <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-600 flex items-center justify-center text-[11px]">2</span>
            <span>Subir a GitHub</span>
          </div>
          <p className="text-slate-400 text-[11px]">Crea un repositorio con:</p>
          <div className="bg-black/60 p-2 rounded text-[11px] font-mono text-emerald-300 border border-slate-800">
            • app.py<br/>
            • requirements.txt
          </div>
        </div>

        <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-2 text-purple-400 font-bold font-mono">
            <span className="w-5 h-5 rounded-full bg-purple-950 border border-purple-600 flex items-center justify-center text-[11px]">3</span>
            <span>Streamlit Cloud</span>
          </div>
          <p className="text-slate-400 text-[11px]">Ve a <strong className="text-slate-200">share.streamlit.io</strong>, selecciona tu repositorio y haz clic en <em>Deploy</em>.</p>
          <a
            href="https://share.streamlit.io"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-purple-300 hover:underline"
          >
            <span>Abrir Streamlit Cloud</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Code Display Container */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
        {/* Header toolbar */}
        <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-200">app.py</span>
            <span className="text-[11px] text-slate-500">Python 3.10+ • Streamlit + Plotly + NumPy</span>
          </div>

          <button
            onClick={handleCopyApp}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition"
          >
            {copiedApp ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Código</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <div className="p-4 max-h-[550px] overflow-y-auto text-[11px] font-mono leading-relaxed bg-[#0b0f19] text-slate-300 scrollbar-thin">
          <pre className="whitespace-pre">{appPyCode}</pre>
        </div>
      </div>
    </div>
  );
};
