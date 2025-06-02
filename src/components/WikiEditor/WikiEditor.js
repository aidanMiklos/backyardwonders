import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useUser } from '../../context/UserContext';
import './WikiEditor.css';

const WikiEditor = ({ 
  content, 
  onSave, 
  section, 
  wonder,
  isPreview = false,
  canEdit = false 
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [previewContent, setPreviewContent] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    setEditContent(content);
  }, [content]);

  const handleEdit = () => {
    if (!canEdit) {
      // Show suggestion modal instead
      return;
    }
    setEditMode(true);
  };

  const handleSave = async () => {
    try {
      await onSave(editContent);
      setEditMode(false);
    } catch (error) {
      console.error('Error saving content:', error);
    }
  };

  const handleCancel = () => {
    setEditContent(content);
    setEditMode(false);
  };

  const renderToolbar = () => (
    <div className="wiki-editor-toolbar">
      <div className="toolbar-group">
        <button onClick={() => insertMarkdown('**', '**')} title="Bold">B</button>
        <button onClick={() => insertMarkdown('*', '*')} title="Italic">I</button>
        <button onClick={() => insertMarkdown('### ', '')} title="Heading">H</button>
      </div>
      <div className="toolbar-group">
        <button onClick={() => insertMarkdown('- ', '')} title="Bullet List">•</button>
        <button onClick={() => insertMarkdown('1. ', '')} title="Numbered List">1.</button>
        <button onClick={() => insertMarkdown('> ', '')} title="Quote">""</button>
      </div>
      <div className="toolbar-group">
        <button onClick={() => insertMarkdown('[', '](url)')} title="Link">🔗</button>
        <button onClick={() => insertMarkdown('![alt text](', ')')} title="Image">🖼️</button>
        <button onClick={() => insertMarkdown('`', '`')} title="Code">{'<>'}</button>
      </div>
    </div>
  );

  const insertMarkdown = (prefix, suffix) => {
    const textarea = document.getElementById('wiki-editor-textarea');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);
    
    const newText = before + prefix + selection + suffix + after;
    setEditContent(newText);
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        end + prefix.length
      );
    }, 0);
  };

  if (isPreview) {
    return (
      <div className="wiki-content preview">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="wiki-editor">
      {editMode ? (
        <>
          {renderToolbar()}
          <div className="editor-container">
            <textarea
              id="wiki-editor-textarea"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="wiki-textarea"
            />
            {previewContent && (
              <div className="preview-pane">
                <ReactMarkdown>{editContent}</ReactMarkdown>
              </div>
            )}
          </div>
          <div className="editor-actions">
            <button onClick={() => setPreviewContent(!previewContent)}>
              {previewContent ? 'Hide Preview' : 'Show Preview'}
            </button>
            <div>
              <button onClick={handleCancel} className="cancel-button">Cancel</button>
              <button onClick={handleSave} className="save-button">Save Changes</button>
            </div>
          </div>
        </>
      ) : (
        <div className="wiki-content">
          <div className="content-header">
            <h3>{section}</h3>
            {user && (
              <button onClick={handleEdit} className="edit-button">
                {canEdit ? 'Edit' : 'Suggest Edit'}
              </button>
            )}
          </div>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default WikiEditor; 