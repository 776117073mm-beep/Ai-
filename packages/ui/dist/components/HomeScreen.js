import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const tools = [
    { title: 'Video Editing', description: 'Professional nonlinear editing workspace', accent: '#7c3aed' },
    { title: 'Image Editing', description: 'Generative and compositing workflows', accent: '#22c55e' },
    { title: 'Audio Studio', description: 'Mixing, voice, and audio AI', accent: '#38bdf8' },
    { title: 'Motion Graphics', description: 'Motion design and template authoring', accent: '#f59e0b' },
    { title: 'Animation', description: 'Keyframe-driven animation systems', accent: '#ec4899' },
    { title: '3D Studio', description: 'Scene composition and asset pipelines', accent: '#14b8a6' },
    { title: 'AI Assistant', description: 'Natural language creative orchestration', accent: '#64748b' },
    { title: 'Cloud Projects', description: 'Workspace and collaboration hub', accent: '#0ea5e9' }
];
export function HomeScreen() {
    return (_jsx("div", { style: { minHeight: '100vh', padding: 32, color: '#f8fafc' }, children: _jsxs("div", { style: { maxWidth: 1280, margin: '0 auto' }, children: [_jsxs("div", { style: { marginBottom: 24 }, children: [_jsx("p", { style: { textTransform: 'uppercase', letterSpacing: '0.3em', color: '#94a3b8', marginBottom: 8 }, children: "AI Creative Studio" }), _jsx("h1", { style: { fontSize: 40, margin: 0 }, children: "Modular creative platform foundation" }), _jsx("p", { style: { color: '#cbd5e1', maxWidth: 760, lineHeight: 1.6 }, children: "A scalable monorepo designed for unlimited creative engines, shared AI orchestration, cloud services, and a professional editing experience." })] }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }, children: tools.map((tool) => (_jsxs("div", { style: { background: 'rgba(15, 23, 42, 0.88)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 20, minHeight: 140, boxShadow: '0 20px 40px rgba(2, 6, 23, 0.25)' }, children: [_jsx("div", { style: { width: 44, height: 8, borderRadius: 999, background: tool.accent, marginBottom: 16 } }), _jsx("h3", { style: { margin: '0 0 8px', fontSize: 22 }, children: tool.title }), _jsx("p", { style: { margin: 0, color: '#94a3b8', lineHeight: 1.5 }, children: tool.description })] }, tool.title))) })] }) }));
}
