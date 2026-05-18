import React, { useState, useEffect } from 'react';
import { ApiRequest } from '../../types/request';
import { useCollectionStore } from '../../stores/collectionStore';
import { Folder } from '../../types/collection';
import { X, Search, Folder as FolderIcon, ChevronRight, ChevronDown, Briefcase, Plus } from 'lucide-react';

interface SaveRequestModalProps {
  request: ApiRequest;
  onSave: (collectionId: string, folderId: string | null, name: string) => void;
  onClose: () => void;
}

export const SaveRequestModal: React.FC<SaveRequestModalProps> = ({ request, onSave, onClose }) => {
  const { collections, folders, loadCollections, addFolder } = useCollectionStore();
  
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [requestName, setRequestName] = useState(request.name || 'Untitled Request');
  const [search, setSearch] = useState('');
  
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    if (collections.length === 0) {
      loadCollections();
    }
  }, [collections.length, loadCollections]);

  useEffect(() => {
    if (collections.length > 0 && !selectedCollection) {
      setSelectedCollection(collections[0].id);
    }
  }, [collections, selectedCollection]);

  // Handle auto-expanding based on search
  useEffect(() => {
    if (search) {
      const lowerSearch = search.toLowerCase();
      const newExpanded = { ...expanded };
      let hasChanges = false;
      
      collections.forEach(col => {
        const colFolders = folders[col.id] || [];
        const matchCol = col.name.toLowerCase().includes(lowerSearch);
        const matchFolders = colFolders.some(f => f.name.toLowerCase().includes(lowerSearch));
        
        if (matchCol || matchFolders) {
          if (!newExpanded[col.id]) {
            newExpanded[col.id] = true;
            hasChanges = true;
          }
        }
        
        colFolders.forEach(folder => {
          const children = colFolders.filter(f => f.parent_folder_id === folder.id);
          if (children.some(c => c.name.toLowerCase().includes(lowerSearch)) && !newExpanded[folder.id]) {
            newExpanded[folder.id] = true;
            hasChanges = true;
          }
        });
      });
      if (hasChanges) setExpanded(newExpanded);
    }
  }, [search, collections, folders]);

  const handleSave = () => {
    if (!selectedCollection) return;
    onSave(selectedCollection, selectedFolder || null, requestName);
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !selectedCollection) {
      setIsCreatingFolder(false);
      setNewFolderName('');
      return;
    }
    await addFolder(selectedCollection, selectedFolder || null, newFolderName.trim());
    setIsCreatingFolder(false);
    setNewFolderName('');
    
    // Auto-expand the parent where the folder was created
    if (selectedFolder) {
      setExpanded(prev => ({ ...prev, [selectedFolder]: true }));
    } else {
      setExpanded(prev => ({ ...prev, [selectedCollection]: true }));
    }
  };

  const renderFolder = (folder: Folder, allFolders: Folder[], depth = 1) => {
    const lowerSearch = search.toLowerCase();
    const children = allFolders.filter(f => f.parent_folder_id === folder.id);
    const matchFolder = folder.name.toLowerCase().includes(lowerSearch);
    const matchChildren = children.some(c => c.name.toLowerCase().includes(lowerSearch));
    
    if (search && !matchFolder && !matchChildren) return null;
    
    const isExpanded = expanded[folder.id] || !!search;
    const isSelected = selectedFolder === folder.id;

    return (
      <div key={folder.id}>
        <div 
          onClick={() => {
            setSelectedCollection(folder.collection_id);
            setSelectedFolder(folder.id);
          }}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: `6px 12px 6px ${12 + (depth * 16)}px`,
            cursor: 'pointer',
            backgroundColor: isSelected ? 'hsl(var(--bg-hover))' : 'transparent',
            borderLeft: isSelected ? '2px solid hsl(var(--primary))' : '2px solid transparent',
            color: isSelected ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))',
            fontSize: '0.85rem'
          }}
        >
          <div 
            onClick={(e) => toggleExpand(folder.id, e)} 
            style={{ width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 4 }}
          >
            {children.length > 0 ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span style={{ width: 14 }} />}
          </div>
          <FolderIcon size={14} style={{ marginRight: 8, color: isSelected ? 'hsl(var(--primary))' : 'inherit' }} />
          <span>{folder.name}</span>
        </div>
        
        {isExpanded && children.map(child => renderFolder(child, allFolders, depth + 1))}
        
        {/* Inline Folder Creation for this folder */}
        {isCreatingFolder && isExpanded && selectedFolder === folder.id && (
          <div style={{ padding: `4px 12px 4px ${12 + ((depth + 1) * 16)}px`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderIcon size={14} style={{ color: 'hsl(var(--text-muted))' }} />
            <input
              autoFocus
              type="text"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') { setIsCreatingFolder(false); setNewFolderName(''); }
              }}
              onBlur={handleCreateFolder}
              placeholder="Folder name"
              style={{
                backgroundColor: 'hsl(var(--bg-base))',
                border: '1px solid hsl(var(--border-light))',
                color: 'hsl(var(--text-main))',
                padding: '4px 8px',
                fontSize: '0.85rem',
                borderRadius: '4px',
                outline: 'none',
                flex: 1
              }}
            />
          </div>
        )}
      </div>
    );
  };

  const getBreadcrumbs = () => {
    if (!selectedCollection) return '';
    const col = collections.find(c => c.id === selectedCollection);
    if (!col) return '';
    
    let path = col.name;
    
    if (selectedFolder) {
      const allFolders = folders[selectedCollection] || [];
      const folder = allFolders.find(f => f.id === selectedFolder);
      if (folder) {
        // Build path up to root (simplified to just one level for now, can be recursive)
        path += ` / ${folder.name}`;
      }
    }
    
    return path;
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: 'hsl(var(--bg-panel))',
        border: '1px solid hsl(var(--border-light))',
        borderRadius: '8px',
        width: '500px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid hsl(var(--border-light))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: 'hsl(var(--text-main))', fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            SAVE REQUEST
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {/* Top Form */}
          <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem', fontWeight: 500 }}>Request name</label>
            <input
              type="text"
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              placeholder="Request name"
              style={{
                backgroundColor: 'hsl(var(--bg-base))',
                border: '1px solid hsl(var(--border-light))',
                color: 'hsl(var(--text-main))',
                padding: '10px 12px',
                borderRadius: '4px',
                outline: 'none',
                fontSize: '0.9rem'
              }}
            />
            <div style={{ marginTop: 4 }}>
              <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem', textDecoration: 'underline', cursor: 'pointer' }}>
                Add description
              </span>
            </div>
          </div>

          <div style={{ padding: '0 24px', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem', fontWeight: 500 }}>Save to</span>
            <span style={{ color: 'hsl(var(--text-main))', fontSize: '0.85rem', fontWeight: 600 }}>{getBreadcrumbs()}</span>
          </div>

          {/* Tree View Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderTop: '1px solid hsl(var(--border-light))', borderBottom: '1px solid hsl(var(--border-light))', minHeight: 250, overflow: 'hidden' }}>
            
            {/* Search */}
            <div style={{ padding: '8px', borderBottom: '1px solid hsl(var(--border-light))', backgroundColor: 'hsl(var(--bg-base))', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ color: 'hsl(var(--text-muted))', margin: '0 8px' }} />
              <input
                type="text"
                placeholder="Search for collection or folder"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'hsl(var(--text-main))',
                  outline: 'none',
                  flex: 1,
                  fontSize: '0.85rem',
                  padding: '4px'
                }}
              />
            </div>

            {/* Tree List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {collections.map(col => {
                const lowerSearch = search.toLowerCase();
                const isExpanded = expanded[col.id] || !!search;
                const colFolders = folders[col.id] || [];
                const rootFolders = colFolders.filter(f => !f.parent_folder_id);
                
                const matchCol = col.name.toLowerCase().includes(lowerSearch);
                const matchFolders = colFolders.some(f => f.name.toLowerCase().includes(lowerSearch));
                if (search && !matchCol && !matchFolders) return null;

                const isSelected = selectedCollection === col.id && !selectedFolder;

                return (
                  <div key={col.id}>
                    <div 
                      onClick={() => {
                        setSelectedCollection(col.id);
                        setSelectedFolder('');
                      }}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '6px 12px',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'hsl(var(--bg-hover))' : 'transparent',
                        borderLeft: isSelected ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                        color: isSelected ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))',
                        fontSize: '0.85rem',
                        fontWeight: 500
                      }}
                    >
                      <div 
                        onClick={(e) => toggleExpand(col.id, e)}
                        style={{ width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 4 }}
                      >
                        {colFolders.length > 0 ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span style={{ width: 14 }} />}
                      </div>
                      <Briefcase size={14} style={{ marginRight: 8, color: isSelected ? 'hsl(var(--primary))' : 'inherit' }} />
                      <span>{col.name}</span>
                    </div>

                    {isExpanded && rootFolders.map(folder => renderFolder(folder, colFolders))}

                    {/* Inline Folder Creation for Root Collection */}
                    {isCreatingFolder && isExpanded && selectedCollection === col.id && !selectedFolder && (
                      <div style={{ padding: '4px 12px 4px 28px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FolderIcon size={14} style={{ color: 'hsl(var(--text-muted))' }} />
                        <input
                          autoFocus
                          type="text"
                          value={newFolderName}
                          onChange={e => setNewFolderName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleCreateFolder();
                            if (e.key === 'Escape') { setIsCreatingFolder(false); setNewFolderName(''); }
                          }}
                          onBlur={handleCreateFolder}
                          placeholder="Folder name"
                          style={{
                            backgroundColor: 'hsl(var(--bg-base))',
                            border: '1px solid hsl(var(--border-light))',
                            color: 'hsl(var(--text-main))',
                            padding: '4px 8px',
                            fontSize: '0.85rem',
                            borderRadius: '4px',
                            outline: 'none',
                            flex: 1
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'hsl(var(--bg-base))',
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px'
        }}>
          <button
            onClick={() => {
              if (selectedCollection) {
                // Ensure parent is expanded so we can see the new folder
                if (selectedFolder) {
                  setExpanded(prev => ({ ...prev, [selectedFolder]: true }));
                } else {
                  setExpanded(prev => ({ ...prev, [selectedCollection]: true }));
                }
                setIsCreatingFolder(true);
              }
            }}
            disabled={!selectedCollection}
            style={{
              padding: '6px 8px',
              backgroundColor: 'transparent',
              border: 'none',
              color: selectedCollection ? 'hsl(var(--text-muted))' : 'hsl(var(--border-light))',
              cursor: selectedCollection ? 'pointer' : 'not-allowed',
              fontSize: '0.85rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Plus size={14} />
            New Folder
          </button>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: '1px solid hsl(var(--border-light))',
                color: 'hsl(var(--text-main))',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedCollection}
              style={{
                padding: '8px 16px',
                backgroundColor: 'hsl(var(--primary))',
                border: 'none',
                color: 'white',
                borderRadius: '4px',
                cursor: selectedCollection ? 'pointer' : 'not-allowed',
                opacity: selectedCollection ? 1 : 0.5,
                fontSize: '0.85rem',
                fontWeight: 500
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
