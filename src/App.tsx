import { useState, useEffect } from 'react';
import type { FishboneData } from './types/fishbone';
import FishboneEditor from './components/FishboneEditor';
import MermaidViewer from './components/MermaidViewer';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import { useDebounce } from './hooks/useDebounce';
import { useLocalPersistence } from './hooks/useLocalPersistence';
import { Share2, LayoutDashboard, Settings } from 'lucide-react';
import './styles/globals.css';

const DEFAULT_DATA: FishboneData = {
  title: 'Service Outage in Production',
  categories: [
    {
      id: '1',
      name: 'Hardware',
      causes: [
        {
          id: '1-1', text: 'Server overheating',
          subCauses: [{ id: '1-1-1', text: 'Fan failure', subCauses: [] }]
        },
        { id: '1-2', text: 'Disk failure', subCauses: [] }
      ]
    },
    {
      id: '2',
      name: 'Software',
      causes: [
        { id: '2-1', text: 'Memory leak in v1.2', subCauses: [] },
        { id: '2-2', text: 'Database deadlock', subCauses: [] }
      ]
    },
    {
      id: '3',
      name: 'Network',
      causes: [
        { id: '3-1', text: 'DNS resolution failure', subCauses: [] }
      ]
    }
  ]
};

const diagramId = 'main-fishbone';

function App() {
  // Primary data layer: localStorage (persists across reloads)
  const [data, setData] = useLocalPersistence(DEFAULT_DATA);
  const [isRemoteUpdate, setIsRemoteUpdate] = useState(false);
  const debouncedData = useDebounce(data, 1200);

  // Supabase: Load + subscribe
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const run = async () => {
      const { data: row } = await supabase
        .from('diagrams').select('state').eq('id', diagramId).single();
      if (row?.state) setData(row.state);

      const ch = supabase.channel('fishbone-rt')
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public', table: 'diagrams', filter: `id=eq.${diagramId}`
        }, (payload) => {
          setIsRemoteUpdate(true);
          setData(payload.new.state);
        })
        .subscribe();

      return () => supabase.removeChannel(ch);
    };

    run();
  }, []);

  // Supabase: sync changes
  useEffect(() => {
    if (!isSupabaseConfigured || isRemoteUpdate) {
      setIsRemoteUpdate(false);
      return;
    }
    supabase.from('diagrams').upsert({ id: diagramId, state: debouncedData, updated_at: new Date() });
  }, [debouncedData, isRemoteUpdate]);

  return (
    <div className="app-shell">
      {/* Top Bar */}
      <nav className="top-bar">
        <div className="brand">
          <div className="brand-icon">
            <LayoutDashboard size={16} color="white" />
          </div>
          <span className="brand-name">Fishbone Studio</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className={`status-pill ${isSupabaseConfigured ? 'live' : 'local'}`}>
            <div className={`status-dot ${isSupabaseConfigured ? 'pulse' : ''}`} />
            {isSupabaseConfigured ? 'Realtime Sync' : 'Local Mode'}
          </div>
          <button className="btn-ghost" style={{ padding: '6px 10px' }}>
            <Settings size={13} />
          </button>
          <button className="btn-primary">
            <Share2 size={13} /> Share
          </button>
        </div>
      </nav>

      {/* Workspace */}
      <div className="workspace">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <span className="sidebar-title">Configuration</span>
          </div>
          <div className="sidebar-scroll">
            <FishboneEditor data={data} onChange={setData} />
          </div>
        </aside>

        {/* Canvas */}
        <main className="canvas">
          <div className="canvas-inner">
            <MermaidViewer data={data} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
