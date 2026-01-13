
import React, { useState, useRef, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";

// Inline SVG Icons for maximum reliability without external dependencies
const Icons = {
  Sparkles: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.456-2.455L18 2.25l.259 1.036a3.375 3.375 0 002.455 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.455z" /></svg>,
  Sun: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M3 12h2.25m.386-6.364l1.591 1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M3 12h2.25m.386-6.364l1.591 1.591M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>,
  Moon: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 12.845a9.933 9.933 0 01-4.087 1.258 9.75 9.75 0 01-14.748-9.923 9.967 9.967 0 001.558 4.59 9.75 9.75 0 0013.277 4.075z" /></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>,
  Photo: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-24 h-24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>,
  Download: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
};

const CATEGORIES = {
  style: {
    label: "Stil",
    options: [
      { id: 'none', name: 'Standard', modifier: '' },
      { id: 'photo', name: 'Fotorealistisch', modifier: 'photorealistic, highly detailed' },
      { id: '3d', name: '3D Render', modifier: 'unreal engine 5 render, octan render, 3d style' },
      { id: 'anime', name: 'Anime', modifier: 'high quality anime art style' }
    ]
  },
  mood: {
    label: "Stimmung",
    options: [
      { id: 'none', name: 'Standard', modifier: '' },
      { id: 'dark', name: 'Düster', modifier: 'dark, moody, cinematic atmosphere' },
      { id: 'bright', name: 'Hell & Freundlich', modifier: 'bright, cheerful, vibrant colors' },
      { id: 'neon', name: 'Cyberpunk', modifier: 'neon lights, cyberpunk aesthetic' }
    ]
  }
};

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [prompt, setPrompt] = useState('Ein kleiner Affe mit einer Banane im Weltraum');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [selections, setSelections] = useState({ style: 'none', mood: 'none' });

  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  const imageRef = useRef<HTMLImageElement>(null);

  const filterStyle = useMemo(() => ({
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
    transition: 'filter 0.2s ease'
  }), [brightness, contrast, saturation]);

  const generateImage = async () => {
    const apiKey = process.env.API_KEY;
    if (!prompt.trim() || loading) return;
    
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey || "" });
      
      const activeModifiers = Object.entries(selections)
        .map(([cat, id]) => (CATEGORIES as any)[cat].options.find((opt: any) => opt.id === id)?.modifier)
        .filter(m => m && m.length > 0);

      const finalPrompt = `${prompt}. Style: ${activeModifiers.join(', ')}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: finalPrompt }] },
        config: { imageConfig: { aspectRatio: aspectRatio as any } }
      });

      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (part?.inlineData) {
        setImage(`data:image/png;base64,${part.inlineData.data}`);
      } else {
        throw new Error("Kein Bild erhalten.");
      }
    } catch (error: any) { 
      alert("Fehler: " + (error.message || "API-Key prüfen.")); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDownload = () => {
    if (!imageRef.current) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = imageRef.current.naturalWidth;
    canvas.height = imageRef.current.naturalHeight;
    ctx.filter = filterStyle.filter;
    ctx.drawImage(imageRef.current, 0, 0);
    const link = document.createElement('a');
    link.download = 'nano-banana.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${isDarkMode ? 'bg-[#0f172a] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <aside className={`w-full md:w-80 glass p-6 flex flex-col space-y-6 border-r overflow-y-auto ${isDarkMode ? 'border-slate-800' : 'border-slate-300'}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2 text-yellow-400">
            <Icons.Sparkles />
            <h1 className="text-xl font-black">NANO BANANA</h1>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg bg-slate-800 text-yellow-400">
            {isDarkMode ? <Icons.Sun /> : <Icons.Moon />}
          </button>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase text-slate-500">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400/50 min-h-[100px]"
          />
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase text-slate-500">Format</label>
          <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm">
            <option value="1:1">1:1 Quadrat</option>
            <option value="16:9">16:9 Breitbild</option>
            <option value="9:16">9:16 Portrait</option>
          </select>

          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <div key={key} className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500">{cat.label}</label>
              <select 
                value={(selections as any)[key]} 
                onChange={(e) => setSelections(prev => ({...prev, [key]: e.target.value}))} 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm"
              >
                {cat.options.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
              </select>
            </div>
          ))}
        </div>

        <button 
          onClick={generateImage} 
          disabled={loading} 
          className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded-xl font-black shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {loading ? "MALT..." : "BILD GENERIEREN"}
        </button>
      </aside>

      <main className="flex-1 p-6 flex items-center justify-center overflow-hidden">
        <div className="w-full max-w-2xl">
          <div className="glass rounded-3xl overflow-hidden min-h-[300px] flex items-center justify-center border border-slate-800 relative">
            {loading ? (
              <div className="text-center animate-pulse text-yellow-400 font-black">GENERIERUNG...</div>
            ) : image ? (
              <img ref={imageRef} src={image} style={filterStyle} className="max-w-full max-h-[80vh] shadow-2xl" alt="AI Gen" />
            ) : (
              <div className="opacity-20"><Icons.Photo /></div>
            )}
          </div>

          {image && !loading && (
            <div className="mt-6 space-y-4 glass p-4 rounded-2xl border border-slate-800">
               <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold">Helligkeit</label>
                    <input type="range" min="50" max="150" value={brightness} onChange={e=>setBrightness(Number(e.target.value))} className="w-full accent-yellow-400" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold">Kontrast</label>
                    <input type="range" min="50" max="150" value={contrast} onChange={e=>setContrast(Number(e.target.value))} className="w-full accent-yellow-400" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold">Sättigung</label>
                    <input type="range" min="0" max="200" value={saturation} onChange={e=>setSaturation(Number(e.target.value))} className="w-full accent-yellow-400" />
                  </div>
               </div>
               <button onClick={handleDownload} className="w-full py-3 bg-emerald-500 text-slate-950 font-black rounded-xl">DOWNLOAD</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
