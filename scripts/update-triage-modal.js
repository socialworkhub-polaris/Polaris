const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '..', 'components', 'TriageModal.tsx');
let code = fs.readFileSync(targetFile, 'utf-8');

// 1. Add state
const targetState = '  const [result, setResult] = useState<TriageResponse | null>(null);';
const newState = targetState + '\n  const [originalResult, setOriginalResult] = useState<TriageResponse | null>(null);\n  const [selectedLang, setSelectedLang] = useState<"de" | "uk" | "en" | "pl" | "ar" | "ru">("de");\n  const [translating, setTranslating] = useState<boolean>(false);';
code = code.replace(targetState, newState);

// 2. Add in handleSubmit
const targetSubmit = 'const data: TriageResponse = await res.json();\n      setResult(data);';
const newSubmit = 'const data: TriageResponse = await res.json();\n      setResult(data);\n      setOriginalResult(data);\n      setSelectedLang("de");';
code = code.replace(targetSubmit, newSubmit);

// 3. Add handleLanguageChange after handleSubmit
const targetAfterSubmit = '    } finally {\n      setIsLoading(false);\n    }\n  };';
const langFunc = `
  const handleLanguageChange = async (targetLang: "de" | "uk" | "en" | "pl" | "ar" | "ru") => {
    if (!originalResult || targetLang === selectedLang) return;
    if (targetLang === "de") {
      setResult(originalResult);
      setSelectedLang("de");
      return;
    }

    setTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          triageResponse: originalResult,
          targetLanguage: targetLang,
        }),
      });
      if (!res.ok) throw new Error("Translation failed");
      const data = await res.json();
      if (data.translated) {
        setResult(data.translated);
        setSelectedLang(targetLang);
      }
    } catch (err: any) {
      console.warn("Translation error:", err);
    } finally {
      setTranslating(false);
    }
  };
`;
code = code.replace(targetAfterSubmit, targetAfterSubmit + '\n' + langFunc);

// 4. Add Language Selector & Print Header in Ergebnisansicht
const targetErgebnis = '<div className="space-y-6">';
const newErgebnis = `<div className="space-y-6">

              {/* Print-Only Client Handoff Header */}
              <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">POLARIS</h1>
                    <p className="text-xs text-slate-600 font-medium">Sozialarbeiter-Kompass Berlin · Persönlicher Handlungsplan</p>
                  </div>
                  <div className="text-right text-xs text-slate-600">
                    <div>Datum: {new Date().toLocaleDateString("de-DE")}</div>
                    <div>Bezirk: {formData.district || "Berlinweit"}</div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-700 mt-2 bg-slate-100 p-2 rounded border border-slate-300">
                  Hinweis: Dieser Handlungsplan wurde im Rahmen einer Erstberatung erstellt. Bitte bringen Sie die abgehakten Unterlagen zu den angegebenen Sprechzeiten mit.
                </p>
              </div>

              {/* 1-Click Multi-Language Translation Pills */}
              <div className="flex items-center justify-between flex-wrap gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl print:hidden">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>Klienten-Sprache / Translation:</span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {[
                    { code: "de", label: "🇩🇪 Deutsch" },
                    { code: "uk", label: "🇺🇦 Українська" },
                    { code: "en", label: "🇬🇧 English" },
                    { code: "pl", label: "🇵🇱 Polski" },
                    { code: "ar", label: "🇸🇾 العربية" },
                    { code: "ru", label: "🇷🇺 Русский" },
                  ].map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      disabled={translating}
                      onClick={() => handleLanguageChange(l.code as any)}
                      className={\`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer disabled:opacity-50 \${
                        selectedLang === l.code
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                      }\`}
                    >
                      {translating && selectedLang === l.code ? (
                        <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> {l.label}</span>
                      ) : (
                        l.label
                      )}
                    </button>
                  ))}
                </div>
              </div>`;

code = code.replace(targetErgebnis, newErgebnis);

fs.writeFileSync(targetFile, code, 'utf-8');
console.log('Updated TriageModal.tsx successfully!');
