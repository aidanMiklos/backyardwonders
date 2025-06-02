import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { getWonderById } from '../services/api';
import WikiEditor from './WikiEditor/WikiEditor';
import RevisionHistory from './WikiEditor/RevisionHistory';
import './WonderPage.css';

const WonderPage = () => {
  const { id } = useParams();
  const { user } = useUser();
  const [wonder, setWonder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchWonderDetails();
  }, [id]);

  const fetchWonderDetails = async () => {
    try {
      const data = await getWonderById(id);
      setWonder(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load wonder details');
      setLoading(false);
    }
  };

  const handleSaveEdit = (updatedWonder) => {
    setWonder(updatedWonder);
    setIsEditing(false);
  };

  const handleRevert = (updatedWonder) => {
    setWonder(updatedWonder);
    setShowHistory(false);
  };

  if (loading) {
    return <div className="wonder-page-loading">Loading...</div>;
  }

  if (error) {
    return (
      <div className="wonder-page-error">
        {error}
        <Link to="/">Return to home</Link>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="wonder-page-container">
        <WikiEditor
          wonder={wonder}
          onSave={handleSaveEdit}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  if (showHistory) {
    return (
      <div className="wonder-page-container">
        <RevisionHistory
          wonder={wonder}
          onRevert={handleRevert}
        />
        <button
          className="back-to-wonder"
          onClick={() => setShowHistory(false)}
        >
          Back to Wonder
        </button>
      </div>
    );
  }

  return (
    <div className="wonder-page-container">
      <header className="wonder-page-header">
        <div className="header-content">
          <h1>{wonder.name}</h1>
          <nav className="wonder-page-breadcrumbs">
            <Link to="/">Home</Link> / <span>{wonder.name}</span>
          </nav>
        </div>
        {user && (
          <div className="page-actions">
            <button
              className="edit-button"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
            <button
              className="history-button"
              onClick={() => setShowHistory(true)}
            >
              View History
            </button>
          </div>
        )}
      </header>
      
      <div className="wonder-page-main-content">
        <aside className="wonder-page-infobox">
          {wonder.coverImage?.url && (
            <img src={wonder.coverImage.url} alt={wonder.name} className="infobox-image" />
          )}
          <h2>{wonder.name}</h2>
          <p><strong>Category:</strong> {wonder.category}</p>
          <p><strong>Subcategory:</strong> {wonder.subcategory}</p>
          <p><strong>Country:</strong> {wonder.country}</p>
          <p><strong>Coordinates:</strong> {wonder.location.coordinates[1].toFixed(4)}, {wonder.location.coordinates[0].toFixed(4)}</p>
          <p><strong>Last edited by:</strong> {wonder.lastEditedBy?.displayName || 'Unknown'}</p>
          <p><strong>Last edited:</strong> {new Date(wonder.updatedAt).toLocaleDateString()}</p>
        </aside>

        <article className="wonder-page-article">
          <p className="wonder-page-description">{wonder.description}</p>
          
          {wonder.history && (
            <section>
              <h2>History</h2>
              <p>{wonder.history}</p>
            </section>
          )}

          {wonder.culturalSignificance && (
            <section>
              <h2>Cultural Significance</h2>
              <p>{wonder.culturalSignificance}</p>
            </section>
          )}

          {wonder.category === 'nature' && wonder.floraAndFauna && (
            <section>
              <h2>Flora & Fauna</h2>
              <p>{wonder.floraAndFauna}</p>
            </section>
          )}

          {wonder.visitingInformation && (
            <section>
              <h2>Visiting Information</h2>
              <p>{wonder.visitingInformation}</p>
            </section>
          )}

          {wonder.safetyGuidelines && (
            <section>
              <h2>Safety Guidelines</h2>
              <p>{wonder.safetyGuidelines}</p>
            </section>
          )}

          {wonder.references && wonder.references.length > 0 && (
            <section className="references-section">
              <h2>References</h2>
              <ol>
                {wonder.references.map((ref, index) => (
                  <li key={index}>
                    {ref.title} - <a href={ref.url} target="_blank" rel="noopener noreferrer">{ref.url}</a>
                    <span className="access-date"> (Accessed: {new Date(ref.accessDate).toLocaleDateString()})</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </article>
      </div>
    </div>
  );
};

export default WonderPage; 