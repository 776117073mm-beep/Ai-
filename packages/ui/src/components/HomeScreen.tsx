export type ToolCard = {
  title: string;
  description: string;
  accent: string;
};

const tools: ToolCard[] = [
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
  return (
    <div style={{ minHeight: '100vh', padding: 32, color: '#f8fafc' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ textTransform: 'uppercase', letterSpacing: '0.3em', color: '#94a3b8', marginBottom: 8 }}>AI Creative Studio</p>
          <h1 style={{ fontSize: 40, margin: 0 }}>Modular creative platform foundation</h1>
          <p style={{ color: '#cbd5e1', maxWidth: 760, lineHeight: 1.6 }}>
            A scalable monorepo designed for unlimited creative engines, shared AI orchestration, cloud services, and a professional editing experience.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {tools.map((tool) => (
            <div key={tool.title} style={{ background: 'rgba(15, 23, 42, 0.88)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 20, minHeight: 140, boxShadow: '0 20px 40px rgba(2, 6, 23, 0.25)' }}>
              <div style={{ width: 44, height: 8, borderRadius: 999, background: tool.accent, marginBottom: 16 }} />
              <h3 style={{ margin: '0 0 8px', fontSize: 22 }}>{tool.title}</h3>
              <p style={{ margin: 0, color: '#94a3b8', lineHeight: 1.5 }}>{tool.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
