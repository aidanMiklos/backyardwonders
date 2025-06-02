import React, { useState } from 'react';
import { Diff, parseDiff } from 'react-diff-view';
import 'react-diff-view/style/index.css';
import './EditSuggestion.css';

const EditSuggestion = ({ 
  currentContent, 
  suggestedContent, 
  onApprove, 
  onReject,
  onComment,
  comments = [],
  status = 'pending',
  editor,
  createdAt
}) => {
  const [comment, setComment] = useState('');
  
  const generateDiff = () => {
    const diffText = `--- a/content
+++ b/content
@@ -1 +1 @@
-${currentContent}
+${suggestedContent}`;
    return parseDiff(diffText)[0];
  };

  const handleComment = () => {
    if (comment.trim()) {
      onComment(comment);
      setComment('');
    }
  };

  return (
    <div className="edit-suggestion">
      <div className="suggestion-header">
        <div className="suggestion-info">
          <img src={editor.picture} alt={editor.displayName} className="editor-avatar" />
          <div className="editor-info">
            <span className="editor-name">{editor.displayName}</span>
            <span className="edit-time">
              {new Date(createdAt).toLocaleDateString()} at {new Date(createdAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
        <div className="suggestion-status">
          <span className={`status-badge ${status}`}>{status}</span>
        </div>
      </div>

      <div className="diff-view">
        <Diff
          viewType="split"
          diffType="chars"
          hunks={[generateDiff()]}
          tokens={true}
        />
      </div>

      {status === 'pending' && (
        <div className="suggestion-actions">
          <button onClick={onReject} className="reject-button">
            Reject
          </button>
          <button onClick={onApprove} className="approve-button">
            Approve
          </button>
        </div>
      )}

      <div className="comments-section">
        <h4>Comments</h4>
        <div className="comments-list">
          {comments.map((comment, index) => (
            <div key={index} className="comment">
              <img src={comment.user.picture} alt={comment.user.displayName} className="comment-avatar" />
              <div className="comment-content">
                <div className="comment-header">
                  <span className="comment-author">{comment.user.displayName}</span>
                  <span className="comment-time">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="comment-text">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="comment-input">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
          />
          <button onClick={handleComment} disabled={!comment.trim()}>
            Comment
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditSuggestion; 