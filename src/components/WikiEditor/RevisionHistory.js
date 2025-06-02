import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { getWonderRevisions, compareWonderRevisions, revertWonderRevision } from '../../services/api';
import { ReactDiffViewer } from 'react-diff-viewer';
import './RevisionHistory.css';

const RevisionHistory = ({ wonder, onRevert }) => {
  const { token } = useUser();
  const [revisions, setRevisions] = useState([]);
  const [selectedRevisions, setSelectedRevisions] = useState({ from: null, to: null });
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRevisions();
  }, [wonder._id]);

  const fetchRevisions = async () => {
    try {
      const data = await getWonderRevisions(wonder._id);
      setRevisions(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load revision history');
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!selectedRevisions.from || !selectedRevisions.to) {
      setError('Please select two revisions to compare');
      return;
    }

    try {
      const data = await compareWonderRevisions(
        wonder._id,
        selectedRevisions.from,
        selectedRevisions.to
      );
      setComparison(data);
      setError(null);
    } catch (err) {
      setError('Failed to compare revisions');
    }
  };

  const handleRevert = async (version) => {
    if (!window.confirm('Are you sure you want to revert to this version?')) {
      return;
    }

    try {
      const result = await revertWonderRevision(wonder._id, version, token);
      onRevert(result.wonder);
      setError(null);
    } catch (err) {
      setError('Failed to revert to selected version');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="revision-loading">Loading revision history...</div>;
  }

  if (error) {
    return <div className="revision-error">{error}</div>;
  }

  return (
    <div className="revision-history">
      <h2>Revision History</h2>

      <div className="revision-list">
        <table>
          <thead>
            <tr>
              <th>Compare</th>
              <th>Version</th>
              <th>Editor</th>
              <th>Edit Summary</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {revisions.map((rev) => (
              <tr key={rev.version}>
                <td>
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (!selectedRevisions.from) {
                          setSelectedRevisions({ ...selectedRevisions, from: rev.version });
                        } else if (!selectedRevisions.to) {
                          setSelectedRevisions({ ...selectedRevisions, to: rev.version });
                        }
                      } else {
                        if (selectedRevisions.from === rev.version) {
                          setSelectedRevisions({ ...selectedRevisions, from: null });
                        } else if (selectedRevisions.to === rev.version) {
                          setSelectedRevisions({ ...selectedRevisions, to: null });
                        }
                      }
                    }}
                    checked={selectedRevisions.from === rev.version || selectedRevisions.to === rev.version}
                  />
                </td>
                <td>{rev.version}</td>
                <td>
                  <div className="editor-info">
                    <img src={rev.editor.picture} alt={rev.editor.displayName} />
                    <span>{rev.editor.displayName}</span>
                  </div>
                </td>
                <td>{rev.editSummary}</td>
                <td>{formatDate(rev.createdAt)}</td>
                <td>
                  <button
                    className="revert-button"
                    onClick={() => handleRevert(rev.version)}
                  >
                    Revert to this
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="comparison-actions">
        <button
          className="compare-button"
          onClick={handleCompare}
          disabled={!selectedRevisions.from || !selectedRevisions.to}
        >
          Compare Selected Versions
        </button>
      </div>

      {comparison && (
        <div className="revision-comparison">
          <h3>Comparing Version {comparison.fromRevision.version} to {comparison.toRevision.version}</h3>
          
          {Object.entries(comparison.diff).map(([field, isDifferent]) => {
            if (!isDifferent) return null;
            
            const oldValue = comparison.fromRevision.changes[field];
            const newValue = comparison.toRevision.changes[field];
            
            return (
              <div key={field} className="diff-section">
                <h4>{field.charAt(0).toUpperCase() + field.slice(1)}</h4>
                <ReactDiffViewer
                  oldValue={typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue, null, 2)}
                  newValue={typeof newValue === 'string' ? newValue : JSON.stringify(newValue, null, 2)}
                  splitView={true}
                  showDiffOnly={false}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RevisionHistory; 