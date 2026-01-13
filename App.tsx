
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  ArrowPathIcon, 
  SparklesIcon,
  PhotoIcon,
  PaintBrushIcon,
  SunIcon,
  MoonIcon,
  CameraIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  BriefcaseIcon,
  Squares2X2Icon,
  CodeBracketIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  LanguageIcon,
  AdjustmentsHorizontalIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const CATEGORIES = {
  cinematic: {
    label: "Fotorealismus & Cinematic",
    icon: <CameraIcon className="w-4 h-4" />,
    options: [
      { id: 'none', name: 'Standard', modifier: '' },
      { id: 'photo', name: 'Photorealistic', modifier: 'photorealistic professional photography, 8k resolution' },
      { id: 'cine_light', name: 'Cinematic lighting', modifier: 'cinematic lighting, dramatic shadows' },
      { id: 'film_still', name: 'Film still look', modifier: '35mm movie still, cinematic film grain' },
      { id: 'studio', name: 'Studio photography', modifier: 'professional studio lighting, clean backdrop' }
    ]
  },
  illustration: {
    label: "Illustration & Art",
    icon: <PaintBrushIcon className="w-4 h-4" />,
    options: [
      { id: 'none', name: 'Standard', modifier: '' },
      { id: 'vector', name: 'Vector illustration', modifier: 'strictly 2D vector art, clean flat shapes' },
      { id: 'flat', name: 'Flat design', modifier: 'minimalist flat design, no gradients, 2D graphic' },
      { id: 'watercolor', name: 'Watercolor', modifier: 'strictly traditional watercolor painting, bleeding colors, wet-on-wet technique, paper texture' },
      { id: 'oil', name: 'Oil painting', modifier: 'strictly classical oil painting, heavy impasto brushstrokes, thick paint texture' },
      { id: 'digital', name: 'Digital painting', modifier: 'high-end digital art painting, smooth gradients' },
      { id: 'line', name: 'Line art', modifier: 'pure minimalist line art, ink drawing' },
      { id: 'hand_drawn', name: 'Hand-drawn', modifier: 'hand-drawn pencil sketch, graphite texture' },
      { id: 'minimal_illu', name: 'Minimalist illustration', modifier: 'ultra-minimalist modern illustration' }
    ]
  },
  design: {
    label: "Design & Marke",
    icon: <BriefcaseIcon className="w-4 h-4" />,
    options: [
      { id: 'none', name: 'Standard', modifier: '' },
      { id: 'luxury', name: 'Luxury', modifier: 'premium luxury branding, elegant' },
      { id: 'minimalist', name: 'Minimalist', modifier: 'clean minimalist layout' },
      { id: 'product', name: 'Product visualization', modifier: 'commercial product shot, professional lighting' }
    ]
  },
  lighting: {
    label: "Licht & Stimmung",
    icon: <LightBulbIcon className="w-4 h-4" />,
    options: [
      { id: 'none', name: 'Standard', modifier: '' },
      { id: 'dramatic', name: 'Dramatic', modifier: 'dramatic chiaroscuro lighting' },
      { id: 'golden', name: 'Golden hour', modifier: 'warm golden hour sun' },
      { id: 'volumetric', name: 'Volumetric', modifier: 'volumetric lighting, god rays' }
    ]
  },
  composition: {
    label: "Kamera & Komposition",
    icon: <CameraIcon className="w-4 h-4" />,
    options: [
      { id: 'none', name: 'Standard', modifier: '' },
      { id: 'macro', name: 'Macro shot', modifier: 'macro lens extreme detail' },
      { id: 'top', name: 'Top view', modifier: 'overhead flat lay view' },
      { id: 'closeup', name: 'Close-up', modifier: 'tight close-up shot' }
    ]
  },
  special: {
    label: "Spezial-Looks",
    icon: <RocketLaunchIcon className="w-4 h-4" />,
    options: [
      { id: 'none', name: 'Standard', modifier: '' },
      { id: 'cyberpunk', name: 'Cyberpunk', modifier: 'cyberpunk aesthetic, neon lights' },
      { id: 'pixar', name: 'Pixar style', modifier: '3D animation, pixar style, disney style' },
      { id: 'anime', name: 'Anime style', modifier: 'high detailed anime art' }
    ]
  }
};

const ASPECT_RATIOS = [
  { id: '1:1', name: '1:1 (Quadratisch)' },
  { id: '16:9', name: '16:9 (Breitbild)' },
  { id: '9:16', name: '9:16 (Portrait)' }
];

const FONTS = ['Bebas Neue', 'Roboto', 'Montserrat', 'Playfair Display', 'Pacifico'];

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [prompt, setPrompt] = useState('A flamingo on the beach with a cocktail');
  const [image, setImage] = useState<string | null>(null);
  const [lastGenConfig, setLastGenConfig] = useState<any>(null);
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<{url: string, prompt: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  
  const [selections, setSelections] = useState({
    cinematic: 'none',
    illustration: 'none',
    design: 'none',
    lighting: 'none',
    composition: 'none',
    special: 'none'
  });

  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [vignette, setVignette] = useState(0);

  const [overlayText, setOverlayText] = useState('');
  const [fontSize, setFontSize] = useState(48);
  const [fontFamily, setFontFamily] = useState('Bebas Neue');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textY, setTextY] = useState(50); 
  const [textX, setTextX] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const resetToStandard = () => {
    setPrompt('');
    setImage(null);
    setSelections({
      cinematic: 'none',
      illustration: 'none',
      design: 'none',
      lighting: 'none',
      composition: 'none',
      special: 'none'
    });
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
    setVignette(0);
    setOverlayText('');
  };

  const filterStyle = useMemo(() => ({
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
    transform: `rotate(${rotation}deg)`,
    transition: 'filter 0.2s ease, transform 0.3s ease'
  }), [brightness, contrast, saturation, rotation]);

  const generateImage = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setShowJson(false);
    try {
      // Nutzt den Key aus dem Environment (Vercel-Safe)
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const activeModifiers = Object.entries(selections)
        .map(([cat, id]) => (CATEGORIES as any)[cat].options.find((opt: any) => opt.id === id)?.modifier)
        .filter(m => m && m.length > 0);

      // FORCE STYLE LOGIC
      // Wir packen den Kunststil an den ABSOLUTEN ANFANG des Satzes
      let artStyle = CATEGORIES.illustration.options.find(o => o.id === selections.illustration)?.modifier || "";
      let finalPrompt = "";
      
      if (artStyle) {
        finalPrompt = `STRICT ARTISTIC STYLE: ${artStyle}. SUBJECT: ${prompt}. `;
      } else {
        finalPrompt = prompt;
      }

      if (activeModifiers.length > 0) {
        finalPrompt += ` Additional details: ${activeModifiers.join(', ')}.`;
      }
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: finalPrompt }] },
        config: { 
          imageConfig: { aspectRatio: aspectRatio as any },
          systemInstruction: "You are a specialized image generator. When a specific art style like 'Watercolor' or 'Oil Painting' is requested, you must ignore your default photographic style and strictly render in that artistic medium. Make the style obvious and unmistakable."
        }
      });

      let generatedUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          generatedUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
      if (generatedUrl) {
        setHistory(prev => [{ url: generatedUrl, prompt }, ...prev].slice(0, 12));
        setImage(generatedUrl);
        setLastGenConfig({ prompt: finalPrompt, aspectRatio });
      }
    } catch (error) { 
      console.error(error);
      alert("Fehler bei der Generierung. Prüfe den API-Key."); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDownload = () => {
    if (!imageRef.current) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = imageRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.filter = filterStyle.filter;
    ctx.drawImage(img, 0, 0);
    if (overlayText) {
      ctx.fillStyle = textColor;
      ctx.font = `${fontSize * (canvas.width / 1000)}px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.fillText(overlayText, (textX / 100) * canvas.width, (textY / 100) * canvas.height);
    }
    const link = document.createElement('a');
    link.download = 'nano-banana.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${isDarkMode ? 'bg-[#0f172a] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <aside className={`w-full md:w-80 lg:w-96 glass p-6 flex flex-col space-y-6 border-r overflow-y-auto max-h-screen custom-scrollbar ${isDarkMode ? 'border-slate-800' : 'border-slate-300'}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <SparklesIcon className="w-6 h-6 text-yellow-400" />
            <h1 className="text-xl font-bold">Nano Banana</h1>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg bg-slate-800 text-yellow-400">
            {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-black uppercase text-slate-500">Master Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-yellow-400/50 min-h-[100px]"
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase text-slate-500 border-b border-slate-800 pb-2">Styles & Effekte</h2>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase flex items-center gap-2"><Squares2X2Icon className="w-4 h-4" /> Bildformat</label>
            <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-bold">
              {ASPECT_RATIOS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <div key={key} className="space-y-2">
              <label className="text-[10px] font-black uppercase flex items-center gap-2">{cat.icon} {cat.label}</label>
              <select value={(selections as any)[key]} onChange={(e) => setSelections(prev => ({...prev, [key]: e.target.value}))} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-bold">
                {cat.options.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
              </select>
            </div>
          ))}
        </div>

        <div className="pt-4 mt-auto border-t border-slate-800 space-y-4">
          <button onClick={generateImage} disabled={loading || !prompt.trim()} className="w-full py-4 bg-yellow-400 text-slate-950 rounded-2xl font-black shadow-xl disabled:bg-slate-700">
            {loading ? "Wird generiert..." : "Render Vision"}
          </button>
          <button onClick={resetToStandard} className="w-full py-2 text-xs font-black text-red-400 bg-slate-800 rounded-xl flex items-center justify-center gap-2">
            <TrashIcon className="w-4 h-4" /> Leeren (Standard)
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-12 overflow-y-auto custom-scrollbar bg-slate-900/50">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="relative glass rounded-[2.5rem] overflow-hidden min-h-[500px] flex items-center justify-center border border-slate-800 shadow-2xl">
            {loading ? (
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-t-yellow-400 border-yellow-400/20 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400 font-medium">KI mischt Farben...</p>
              </div>
            ) : image ? (
              <div ref={imageContainerRef} className="relative p-8 w-full flex flex-col items-center">
                <img ref={imageRef} src={image} style={filterStyle} className="max-w-full max-h-[65vh] rounded-2xl shadow-2xl" alt="Preview" />
                {overlayText && (
                  <div className="absolute text-center cursor-move select-none" style={{ left: `${textX}%`, top: `${textY}%`, fontFamily, fontSize: `${fontSize}px`, color: textColor, transform: 'translate(-50%, -50%)', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                    {overlayText}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-12 opacity-40">
                <PhotoIcon className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-black">Bereit für deine Kreation</h3>
              </div>
            )}
          </div>

          {image && !loading && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="glass rounded-3xl p-6 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500">Belichtung</label>
                  <input type="range" min="50" max="150" value={brightness} onChange={e=>setBrightness(parseInt(e.target.value))} className="w-full accent-yellow-400" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500">Kontrast</label>
                  <input type="range" min="50" max="150" value={contrast} onChange={e=>setContrast(parseInt(e.target.value))} className="w-full accent-yellow-400" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500">Sättigung</label>
                  <input type="range" min="0" max="200" value={saturation} onChange={e=>setSaturation(parseInt(e.target.value))} className="w-full accent-yellow-400" />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <button onClick={handleDownload} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black shadow-lg">Download</button>
                <button onClick={() => setShowJson(!showJson)} className="py-3 px-6 bg-slate-800 rounded-2xl text-xs font-black"><CodeBracketIcon className="w-5 h-5" /></button>
              </div>

              {showJson && (
                <pre className="p-6 bg-black rounded-2xl text-yellow-400 text-xs font-mono overflow-auto max-h-40">
                  {JSON.stringify(lastGenConfig, null, 2)}
                </pre>
              )}
            </div>
          )}

          {history.length > 0 && (
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3 pt-8 border-t border-slate-800">
              {history.map((h, i) => (
                <img key={i} src={h.url} onClick={() => setImage(h.url)} className="aspect-square object-cover rounded-xl cursor-pointer hover:ring-2 hover:ring-yellow-400 transition-all" />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
