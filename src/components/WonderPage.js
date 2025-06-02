import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { getWonders, getWonderRevisions, submitWonderEdit } from '../services/api';
import WikiEditor from './WikiEditor/WikiEditor';
import EditSuggestion from './WikiEditor/EditSuggestion';
import Discussion from './WikiEditor/Discussion';
import { CATEGORIES } from '../constants/categories';
import './WonderPage.css';

const WonderPage = () => {
  const { slug } = useParams();
  const { user } = useUser();
  const [wonder, setWonder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [pendingRevisions, setPendingRevisions] = useState([]);

  useEffect(() => {
    const fetchWonderDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const wonders = await getWonders();
        const foundWonder = wonders.find(w => w.slug === slug);
        if (foundWonder) {
          setWonder(foundWonder);
          // Fetch pending revisions
          const revisions = await getWonderRevisions(foundWonder._id);
          setPendingRevisions(revisions.filter(rev => rev.status === 'pending'));
        } else {
          setError('Wonder not found.');
        }
      } catch (err) {
        setError('Failed to fetch wonder details.');
        console.error(err);
      }
      setLoading(false);
    };

    if (slug) {
      fetchWonderDetails();
    }
  }, [slug]);

  const handleSectionEdit = async (section, content) => {
    try {
      const wonderId = wonder.id || wonder._id;
      const edit = await submitWonderEdit(wonderId, {
        section,
        content,
        previousContent: wonder.content[section]?.text || ''
      });
      
      // If user has direct edit privileges, update immediately
      if (user?.editPrivileges !== 'none') {
        setWonder(prev => ({
          ...prev,
          content: {
            ...prev.content,
            [section]: {
              text: content,
              lastEditedBy: user._id,
              lastEditedAt: new Date()
            }
          }
        }));
      } else {
        // Add to pending revisions
        setPendingRevisions(prev => [...prev, edit]);
      }
    } catch (err) {
      console.error('Failed to submit edit:', err);
    }
  };

  const handleRevisionApprove = async (revisionId) => {
    try {
      // API call to approve revision
      setPendingRevisions(prev => 
        prev.filter(rev => rev._id !== revisionId)
      );
      // Refresh wonder data
    } catch (err) {
      console.error('Failed to approve revision:', err);
    }
  };

  const handleRevisionReject = async (revisionId) => {
    try {
      // API call to reject revision
      setPendingRevisions(prev => 
        prev.filter(rev => rev._id !== revisionId)
      );
    } catch (err) {
      console.error('Failed to reject revision:', err);
    }
  };

  if (loading) {
    return <div className="wonder-page-loading">Loading wonder details...</div>;
  }

  if (error) {
    return <div className="wonder-page-error">Error: {error} <Link to="/">Go Home</Link></div>;
  }

  if (!wonder) {
    return <div className="wonder-page-error">Wonder not found. <Link to="/">Go Home</Link></div>;
  }

  const canEdit = user?.editPrivileges !== 'none';
  const canModerate = user?.canModerate?.();

  return (
    <div className="wonder-page-container">
      <div className="wonder-page-header">
        <div className="wonder-page-breadcrumbs">
          <Link to="/">Home</Link> / <span>{wonder.name}</span>
        </div>
        <h1>{wonder.name}</h1>
        <div className="wonder-metadata">
          <div className="wonder-category">
            <span className="category-icon">{CATEGORIES[wonder.category]?.icon}</span>
            <span className="category-label">{CATEGORIES[wonder.category]?.label}</span>
          </div>
          <div className="wonder-contributor">
            <span className="contributor-label">Added by </span>
            <span className="contributor-name">
              {wonder.initialContributor?.displayName || 'Unknown'}
            </span>
            <span className="contributor-date">
              on {wonder.contributedAt ? new Date(wonder.contributedAt).toLocaleDateString() : ''}
            </span>
          </div>
        </div>
      </div>
      
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
        </aside>

        <article className="wonder-page-article">
          <div className="article-sections">
            <div className="section-tabs">
              <button 
                className={activeSection === 'overview' ? 'active' : ''} 
                onClick={() => setActiveSection('overview')}
              >
                Overview
              </button>
              <button 
                className={activeSection === 'history' ? 'active' : ''} 
                onClick={() => setActiveSection('history')}
              >
                History
              </button>
              <button 
                className={activeSection === 'geography' ? 'active' : ''} 
                onClick={() => setActiveSection('geography')}
              >
                Geography
              </button>
              {wonder.category === 'nature' && (
                <button 
                  className={activeSection === 'floraAndFauna' ? 'active' : ''} 
                  onClick={() => setActiveSection('floraAndFauna')}
                >
                  Flora & Fauna
                </button>
              )}
              <button 
                className={activeSection === 'culturalSignificance' ? 'active' : ''} 
                onClick={() => setActiveSection('culturalSignificance')}
              >
                Cultural Significance
              </button>
              <button 
                className={activeSection === 'visitingInfo' ? 'active' : ''} 
                onClick={() => setActiveSection('visitingInfo')}
              >
                Visiting Info
              </button>
              <button 
                className={activeSection === 'safetyGuidelines' ? 'active' : ''} 
                onClick={() => setActiveSection('safetyGuidelines')}
              >
                Safety Guidelines
              </button>
            </div>

            <div className="section-content">
              <WikiEditor
                content={wonder.content[activeSection]?.text || ''}
                onSave={(content) => handleSectionEdit(activeSection, content)}
                section={activeSection}
                wonder={wonder}
                canEdit={canEdit}
              />

              {canModerate && pendingRevisions.length > 0 && (
                <div className="pending-revisions">
                  <h3>Pending Edit Suggestions</h3>
                  {pendingRevisions.map(revision => (
                    <EditSuggestion
                      key={revision._id}
                      currentContent={revision.changes.previous}
                      suggestedContent={revision.changes.current}
                      onApprove={() => handleRevisionApprove(revision._id)}
                      onReject={() => handleRevisionReject(revision._id)}
                      editor={revision.editor}
                      createdAt={revision.createdAt}
                      status={revision.status}
                      comments={revision.comments}
                    />
                  ))}
                </div>
              )}

              <Discussion wonderId={wonder._id} />
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default WonderPage; 