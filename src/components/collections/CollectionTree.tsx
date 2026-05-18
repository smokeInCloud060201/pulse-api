import React, { useEffect } from 'react';
import { Folder as FolderIcon, ChevronRight, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useCollectionStore } from '../../stores/collectionStore';
import { Collection, Folder } from '../../types/collection';

export const CollectionTree: React.FC = () => {
  const { collections, folders, loadCollections, addCollection, deleteCollection, addFolder, deleteFolder } = useCollectionStore();
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddCollection = () => {
    const name = prompt('New Collection Name:');
    if (name) addCollection(name);
  };

  const handleAddFolder = (collectionId: string, parentId: string | null = null, e: React.MouseEvent) => {
    e.stopPropagation();
    const name = prompt('New Folder Name:');
    if (name) addFolder(collectionId, parentId, name);
  };

  const handleDeleteCollection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this collection?')) deleteCollection(id);
  };

  const handleDeleteFolder = (id: string, collectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this folder?')) deleteFolder(id, collectionId);
  };

  const renderFolder = (folder: Folder, allFolders: Folder[]) => {
    const isExpanded = expanded[folder.id];
    const children = allFolders.filter(f => f.parent_folder_id === folder.id);

    return (
      <div key={folder.id} style={{ paddingLeft: 16 }}>
        <div className="collection-item" onClick={(e) => toggleExpand(folder.id, e)}>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <FolderIcon size={14} className="icon" />
          <span style={{ flex: 1 }}>{folder.name}</span>
          
          <button className="icon-btn-small" onClick={(e) => handleAddFolder(folder.collection_id, folder.id, e)}>
            <Plus size={12} />
          </button>
          <button className="icon-btn-small" onClick={(e) => handleDeleteFolder(folder.id, folder.collection_id, e)}>
            <Trash2 size={12} />
          </button>
        </div>
        {isExpanded && children.map(child => renderFolder(child, allFolders))}
      </div>
    );
  };

  return (
    <div className="collection-tree">
      <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Collections</span>
        <button className="icon-btn-small" onClick={handleAddCollection}><Plus size={14} /></button>
      </div>

      {collections.map(col => {
        const isExpanded = expanded[col.id];
        const colFolders = folders[col.id] || [];
        const rootFolders = colFolders.filter(f => !f.parent_folder_id);

        return (
          <div key={col.id}>
            <div className="collection-item" onClick={(e) => toggleExpand(col.id, e)}>
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span style={{ flex: 1, fontWeight: 500 }}>{col.name}</span>
              <button className="icon-btn-small" onClick={(e) => handleAddFolder(col.id, null, e)}>
                <Plus size={12} />
              </button>
              <button className="icon-btn-small" onClick={(e) => handleDeleteCollection(col.id, e)}>
                <Trash2 size={12} />
              </button>
            </div>
            
            {isExpanded && rootFolders.map(folder => renderFolder(folder, colFolders))}
          </div>
        );
      })}
    </div>
  );
};
