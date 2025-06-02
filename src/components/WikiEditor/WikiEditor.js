import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { createWonderRevision } from '../../services/api';
import './WikiEditor.css';

const WikiEditor = ({ wonder, onSave, onCancel }) => {
  const { token } = useUser();
  const [formData, setFormData] = useState({
    name: wonder.name,
    description: wonder.description,
    category: wonder.category,
    subcategory: wonder.subcategory,
    country: wonder.country,
    history: wonder.history || '',
    culturalSignificance: wonder.culturalSignificance || '',
    floraAndFauna: wonder.floraAndFauna || '',
    visitingInformation: wonder.visitingInformation || '',
    safetyGuidelines: wonder.safetyGuidelines || '',
    references: wonder.references || []
  });
  const [editSummary, setEditSummary] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReferenceChange = (index, field, value) => {
    const newReferences = [...formData.references];
    newReferences[index] = {
      ...newReferences[index],
      [field]: value,
      accessDate: field === 'url' ? new Date() : newReferences[index].accessDate
    };
    setFormData(prev => ({
      ...prev,
      references: newReferences
    }));
  };

  const addReference = () => {
    setFormData(prev => ({
      ...prev,
      references: [...prev.references, { title: '', url: '', accessDate: new Date() }]
    }));
  };

  const removeReference = (index) => {
    setFormData(prev => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editSummary) {
      setError('Please provide a summary of your changes');
      return;
    }

    try {
      const result = await createWonderRevision(wonder._id, formData, editSummary, token);
      onSave(result.wonder);
    } catch (err) {
      setError('Failed to save changes. Please try again.');
    }
  };

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'details', label: 'Details' },
    { id: 'visiting', label: 'Visiting Info' },
    { id: 'references', label: 'References' }
  ];

  const renderOverviewSection = () => (
    <div className="editor-section">
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="history">History</label>
        <textarea
          id="history"
          name="history"
          value={formData.history}
          onChange={handleInputChange}
        />
      </div>
    </div>
  );

  const renderDetailsSection = () => (
    <div className="editor-section">
      <div className="form-group">
        <label htmlFor="culturalSignificance">Cultural Significance</label>
        <textarea
          id="culturalSignificance"
          name="culturalSignificance"
          value={formData.culturalSignificance}
          onChange={handleInputChange}
        />
      </div>

      {wonder.category === 'nature' && (
        <div className="form-group">
          <label htmlFor="floraAndFauna">Flora & Fauna</label>
          <textarea
            id="floraAndFauna"
            name="floraAndFauna"
            value={formData.floraAndFauna}
            onChange={handleInputChange}
          />
        </div>
      )}
    </div>
  );

  const renderVisitingSection = () => (
    <div className="editor-section">
      <div className="form-group">
        <label htmlFor="visitingInformation">Visiting Information</label>
        <textarea
          id="visitingInformation"
          name="visitingInformation"
          value={formData.visitingInformation}
          onChange={handleInputChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="safetyGuidelines">Safety Guidelines</label>
        <textarea
          id="safetyGuidelines"
          name="safetyGuidelines"
          value={formData.safetyGuidelines}
          onChange={handleInputChange}
        />
      </div>
    </div>
  );

  const renderReferencesSection = () => (
    <div className="editor-section">
      <div className="references-list">
        {formData.references.map((ref, index) => (
          <div key={index} className="reference-item">
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={ref.title}
                onChange={(e) => handleReferenceChange(index, 'title', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>URL</label>
              <input
                type="url"
                value={ref.url}
                onChange={(e) => handleReferenceChange(index, 'url', e.target.value)}
              />
            </div>
            <button
              type="button"
              className="remove-reference"
              onClick={() => removeReference(index)}
            >
              Remove
            </button>
          </div>
        ))}
        <button type="button" className="add-reference" onClick={addReference}>
          Add Reference
        </button>
      </div>
    </div>
  );

  return (
    <div className="wiki-editor">
      <div className="editor-header">
        <h2>Editing: {wonder.name}</h2>
        <div className="editor-tabs">
          {sections.map(section => (
            <button
              key={section.id}
              className={`tab-button ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="editor-content">
          {activeSection === 'overview' && renderOverviewSection()}
          {activeSection === 'details' && renderDetailsSection()}
          {activeSection === 'visiting' && renderVisitingSection()}
          {activeSection === 'references' && renderReferencesSection()}
        </div>

        <div className="editor-footer">
          {error && <div className="error-message">{error}</div>}
          
          <div className="edit-summary">
            <label htmlFor="editSummary">Edit Summary (required)</label>
            <input
              type="text"
              id="editSummary"
              value={editSummary}
              onChange={(e) => setEditSummary(e.target.value)}
              placeholder="Briefly describe your changes"
              required
            />
          </div>

          <div className="editor-actions">
            <button type="button" className="cancel-button" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="save-button">
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default WikiEditor; 