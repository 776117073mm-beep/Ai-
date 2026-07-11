export function VideoWorkspace() {
  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', padding: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 'calc(100vh - 40px)' }}>
        <header style={{ background: '#111827', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: '14px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: 18 }}>Top Toolbar</strong>
              <div style={{ color: '#94a3b8', marginTop: 4 }}>Import, trim, transitions, effects, AI commands, export</div>
            </div>
            <div style={{ color: '#38bdf8' }}>Professional Editing Workspace</div>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 320px', gap: 12, flex: 1 }}>
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#0f172a', borderRadius: 16, padding: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
              <h4 style={{ margin: '0 0 8px' }}>Project Panel</h4>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>Project metadata, bins, collections, and cloud sync state.</p>
            </div>
            <div style={{ background: '#0f172a', borderRadius: 16, padding: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
              <h4 style={{ margin: '0 0 8px' }}>Media Browser</h4>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>Library, proxies, cache, and lazy loading surfaces.</p>
            </div>
            <div style={{ background: '#0f172a', borderRadius: 16, padding: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
              <h4 style={{ margin: '0 0 8px' }}>Effects Library</h4>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>Reusable effects, presets, and plugin-ready categories.</p>
            </div>
            <div style={{ background: '#0f172a', borderRadius: 16, padding: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
              <h4 style={{ margin: '0 0 8px' }}>Transitions Library</h4>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>Professional transitions, crossfades, and custom transitions.</p>
            </div>
          </aside>

          <main style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <section style={{ background: '#111827', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: 16, minHeight: 260 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <strong>Live Preview</strong>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>GPU ready · Proxy playback · HDR ready</span>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: 14, minHeight: 200, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                Preview surface for playback, frame stepping, loop control, and safe areas.
              </div>
            </section>

            <section style={{ background: '#111827', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: 16, minHeight: 240 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <strong>Professional Timeline</strong>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>Unlimited tracks · nested sequences · markers · regions</span>
              </div>
              <div style={{ background: '#020617', borderRadius: 14, minHeight: 170, border: '1px solid rgba(255,255,255,0.06)', padding: 12, color: '#94a3b8' }}>
                Timeline engine scaffold with video/audio tracks, ripple editing, snapping, virtualization, caching, and state restoration.
              </div>
            </section>
          </main>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#0f172a', borderRadius: 16, padding: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
              <h4 style={{ margin: '0 0 8px' }}>Properties Inspector</h4>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>Clip properties, keyframes, effects, and transition controls.</p>
            </div>
            <div style={{ background: '#0f172a', borderRadius: 16, padding: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
              <h4 style={{ margin: '0 0 8px' }}>Audio Mixer</h4>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>Track-level audio, automation, monitoring, and mix state.</p>
            </div>
            <div style={{ background: '#0f172a', borderRadius: 16, padding: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
              <h4 style={{ margin: '0 0 8px' }}>AI Assistant</h4>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>Collapsible assistant panel ready for future voice and AI commands.</p>
            </div>
            <div style={{ background: '#0f172a', borderRadius: 16, padding: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
              <h4 style={{ margin: '0 0 8px' }}>Status Bar</h4>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>Playback state, project status, render queue, and system health.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
