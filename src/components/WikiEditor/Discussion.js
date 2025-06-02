import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { getWonderDiscussions, createDiscussion, addDiscussionComment } from '../../services/api';
import './Discussion.css';

const Discussion = ({ wonderId }) => {
  const { user } = useUser();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newDiscussion, setNewDiscussion] = useState({
    title: '',
    content: '',
    type: 'general'
  });
  const [activeDiscussion, setActiveDiscussion] = useState(null);
  const [newComment, setNewComment] = useState('');

  const fetchDiscussions = async () => {
    try {
      const data = await getWonderDiscussions(wonderId);
      setDiscussions(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load discussions');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussions();
  }, [wonderId, fetchDiscussions]);

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    try {
      const discussion = await createDiscussion(wonderId, newDiscussion);
      setDiscussions(prev => [...prev, discussion]);
      setNewDiscussion({ title: '', content: '', type: 'general' });
    } catch (err) {
      setError('Failed to create discussion');
    }
  };

  const handleAddComment = async (discussionId) => {
    if (!newComment.trim()) return;
    
    try {
      const comment = await addDiscussionComment(wonderId, discussionId, newComment);
      setDiscussions(prev => prev.map(d => {
        if (d._id === discussionId) {
          return {
            ...d,
            comments: [...d.comments, comment]
          };
        }
        return d;
      }));
      setNewComment('');
    } catch (err) {
      setError('Failed to add comment');
    }
  };

  if (loading) return <div className="discussion-loading">Loading discussions...</div>;
  if (error) return <div className="discussion-error">{error}</div>;

  return (
    <div className="discussion-container">
      <div className="discussion-header">
        <h2>Discussions</h2>
        <button 
          className="new-discussion-button"
          onClick={() => setActiveDiscussion('new')}
        >
          Start New Discussion
        </button>
      </div>

      {activeDiscussion === 'new' && (
        <form className="new-discussion-form" onSubmit={handleCreateDiscussion}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={newDiscussion.title}
              onChange={(e) => setNewDiscussion(prev => ({
                ...prev,
                title: e.target.value
              }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select
              value={newDiscussion.type}
              onChange={(e) => setNewDiscussion(prev => ({
                ...prev,
                type: e.target.value
              }))}
            >
              <option value="general">General Discussion</option>
              <option value="edit_proposal">Edit Proposal</option>
              <option value="content_issue">Content Issue</option>
              <option value="fact_check">Fact Check</option>
            </select>
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea
              value={newDiscussion.content}
              onChange={(e) => setNewDiscussion(prev => ({
                ...prev,
                content: e.target.value
              }))}
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setActiveDiscussion(null)}>
              Cancel
            </button>
            <button type="submit">
              Create Discussion
            </button>
          </div>
        </form>
      )}

      <div className="discussions-list">
        {discussions.map(discussion => (
          <div key={discussion._id} className="discussion-item">
            <div className="discussion-item-header">
              <div className="discussion-info">
                <span className={`discussion-type ${discussion.type}`}>
                  {discussion.type.replace('_', ' ')}
                </span>
                <h3 onClick={() => setActiveDiscussion(discussion._id)}>
                  {discussion.title}
                </h3>
              </div>
              <div className="discussion-meta">
                <span className="discussion-author">
                  {discussion.creator.displayName}
                </span>
                <span className="discussion-date">
                  {new Date(discussion.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {activeDiscussion === discussion._id && (
              <div className="discussion-details">
                <div className="discussion-content">
                  {discussion.content}
                </div>

                <div className="discussion-comments">
                  {discussion.comments.map(comment => (
                    <div key={comment._id} className="comment">
                      <div className="comment-header">
                        <img 
                          src={comment.user.picture} 
                          alt={comment.user.displayName}
                          className="comment-avatar"
                        />
                        <div className="comment-meta">
                          <span className="comment-author">
                            {comment.user.displayName}
                          </span>
                          <span className="comment-date">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="comment-content">
                        {comment.text}
                      </div>
                    </div>
                  ))}

                  <div className="add-comment">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                    />
                    <button 
                      onClick={() => handleAddComment(discussion._id)}
                      disabled={!newComment.trim()}
                    >
                      Comment
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Discussion; 