import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link'; // ✅ Already Present

export default function Home() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState('');
  const [css, setCss] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/login');
  }, []);

  const sendPrompt = async () => {
    setLoading(true);
    try {
      // Step 1: Call AI to generate code
      const aiRes = await axios.post('http://localhost:5000/generate', { prompt });
      const fullCode = aiRes.data.code;

      const jsxMatch = fullCode.match(/```jsx([\s\S]*?)```/);
      const cssMatch = fullCode.match(/```css([\s\S]*?)```/);

      const jsx = jsxMatch ? jsxMatch[1].trim() : fullCode;
      const extractedCss = cssMatch ? cssMatch[1].trim() : '';

      setCode(jsx);
      setCss(extractedCss);

      // Step 2: Save session to DB
      await axios.post('http://localhost:5000/generate', {
        prompt,
        jsx,
        css: extractedCss,
      });

    } catch (err) {
      console.error(err);
      alert('AI generation or save failed');
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const downloadAsFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* 🔗 Top-right View History */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">🧠 Component Generator</h1>
        <div className="space-x-4">
          <Link href="/history">
            <span className="text-blue-600 underline hover:text-blue-800">📜 View History</span>
          </Link>
          <Link href="/editor">
            <span className="text-purple-600 underline hover:text-purple-800">🎨 Bonus Editor</span>
          </Link>
        </div>
      </div>

      {/* 🚀 Input + Button */}
      <div className="flex gap-4 justify-center">
        <input
          type="text"
          placeholder="Describe the component"
          className="border p-2 rounded w-1/2"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          onClick={sendPrompt}
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {/* 🎯 Output */}
      {code && (
        <div className="grid grid-cols-2 gap-6">
          {/* 🔍 Live Preview */}
          <iframe
            title="Component Preview"
            srcDoc={`<html><style>${css}</style><body>${code}</body></html>`}
            className="w-full h-[400px] border rounded bg-white"
          ></iframe>

          {/* 🧾 Code Display */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Generated JSX</h2>
            <pre className="bg-gray-100 p-3 rounded overflow-x-auto text-sm">
              <code>{code}</code>
            </pre>
            <div className="mt-2 flex gap-2">
              <button onClick={() => copyToClipboard(code)} className="px-3 py-1 bg-blue-500 text-white rounded">Copy</button>
              <button onClick={() => downloadAsFile('Component.jsx', code)} className="px-3 py-1 bg-green-500 text-white rounded">Download</button>
            </div>

            {css && (
              <>
                <h2 className="text-lg font-semibold mt-4 mb-2">Generated CSS</h2>
                <pre className="bg-gray-100 p-3 rounded overflow-x-auto text-sm">
                  <code>{css}</code>
                </pre>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => copyToClipboard(css)} className="px-3 py-1 bg-blue-500 text-white rounded">Copy</button>
                  <button onClick={() => downloadAsFile('styles.css', css)} className="px-3 py-1 bg-green-500 text-white rounded">Download</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
