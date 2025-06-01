import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getWonders } from '../services/api'; // Corrected import path
import './WonderPage.css'; // To be created

const WonderPage = () => {
  const { slug } = useParams();
  const [wonder, setWonder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWonderDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        // In a real app, you'd have an API endpoint like /api/wonders/slug/:slug
        // For now, fetch all and filter. This is not efficient for many wonders.
        const wonders = await getWonders();
        const foundWonder = wonders.find(w => w.slug === slug);
        if (foundWonder) {
          setWonder(foundWonder);
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

  if (loading) {
    return <div className="wonder-page-loading">Loading wonder details...</div>;
  }

  if (error) {
    return <div className="wonder-page-error">Error: {error} <Link to="/">Go Home</Link></div>;
  }

  if (!wonder) {
    return <div className="wonder-page-error">Wonder not found. <Link to="/">Go Home</Link></div>;
  }

  // Basic Wikipedia-style layout
  return (
    <div className="wonder-page-container">
      <header className="wonder-page-header">
        <h1>{wonder.name}</h1>
        <nav className="wonder-page-breadcrumbs">
          <Link to="/">Home</Link> / <span>{wonder.name}</span>
        </nav>
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
          {/* Add more key details here */}
        </aside>

        <article className="wonder-page-article">
          <p className="wonder-page-description">{wonder.description}</p>
          
          {wonder.history && (
            <section>
              <h2>History</h2>
              <p>{wonder.history}</p>
            </section>
          )}

          {wonder.accessibility && (
            <section>
              <h2>Accessibility</h2>
              <p>{wonder.accessibility}</p>
            </section>
          )}
          
          {/* Add more sections like Geography, Ecology, Visiting Info etc. */}
        </article>
      </div>

      {/* Placeholder for future gallery, related wonders, etc. */}
      {/* <footer className="wonder-page-footer">
        <p>Content is user-generated. Last updated: {new Date(wonder.updatedAt).toLocaleDateString()}</p>
      </footer> */}
    </div>
  );
};

export default WonderPage; 