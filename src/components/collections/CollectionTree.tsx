import React, { useEffect } from 'react';
import { Folder as FolderIcon, ChevronRight, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useCollectionStore } from '../../stores/collectionStore';
import { useRequestStore } from '../../stores/requestStore';
import { useTabStore } from '../../stores/tabStore';
import { Collection, Folder } from '../../types/collection';
import { ApiRequest } from '../../types/request';

export const CollectionTree: React.FC = () => {
  const { collections, folders, loadCollections, addCollection, deleteCollection, addFolder, deleteFolder } = useCollectionStore();
  const { requests, loadRequests, createRequest, deleteRequest } = useRequestStore();
  const { openTab } = useTabStore();
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  useEffect(() => {
    loadCollections().then(() => {
      // For a real app, we might want to load requests only when collection is expanded to save data, 
      // but for simplicity we load all requests for loaded collections.
      collections.forEach(c => loadRequests(c.id));
    });
  }, [loadCollections, collections.length]);

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

  const handleAddRequest = (collectionId: string, folderId: string | null = null, e: React.MouseEvent) => {
    e.stopPropagation();
    const name = prompt('New Request Name:');
    if (name) createRequest(collectionId, folderId, name);
  };

  const handleDeleteCollection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this collection?')) deleteCollection(id);
  };

  const handleDeleteFolder = (id: string, collectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this folder?')) deleteFolder(id, collectionId);
  };

  const handleDeleteRequest = (req: ApiRequest, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this request?')) deleteRequest(req.id, req.collection_id);
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'var(--color-success)';
      case 'POST': return 'var(--color-warning)';
      case 'PUT': return 'var(--color-info)';
      case 'DELETE': return 'var(--color-danger)';
      case 'PATCH': return 'var(--color-warning)';
      default: return 'var(--text-muted)';
    }
  };

  const renderRequest = (req: ApiRequest) => {
    return (
      <div key={req.id} className="collection-item request-item" onClick={() => openTab(req)} style={{ paddingLeft: 32 }}>
        <span style={{ fontSize: '10px', fontWeight: 700, width: 36, color: `hsl(${getMethodColor(req.method)})` }}>
          {req.method}
        </span>
        <span style={{ flex: 1, fontSize: '13px' }}>{req.name || 'Untitled'}</span>
        <button className="icon-btn-small" onClick={(e) => handleDeleteRequest(req, e)}>
          <Trash2 size={12} />
        </button>
      </div>
    );
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
          <button className="icon-btn-small" onClick={(e) => handleAddRequest(folder.collection_id, folder.id, e)}>
            <Plus size={12} />
          </button>
          <button className="icon-btn-small" onClick={(e) => handleDeleteFolder(folder.id, folder.collection_id, e)}>
            <Trash2 size={12} />
          </button>
        </div>
        {isExpanded && children.map(child => renderFolder(child, allFolders))}
        {isExpanded && (requests[folder.collection_id] || []).filter(r => r.folder_id === folder.id).map(renderRequest)}
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
            {isExpanded && (requests[col.id] || []).filter(r => !r.folder_id).map(renderRequest)}
          </div>
        );
      })}
    </div>
  );
};
