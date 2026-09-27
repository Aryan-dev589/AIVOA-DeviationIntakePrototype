import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateField, resetForm, submitDeviation } from './deviationSlice';

const IMPACT_OPTIONS = ["Product Quality", "Patient Safety", "Regulatory Compliance", "Minimal"];
const SEVERITY_OPTIONS = ["Critical", "Major", "Minor"];

function LogDeviationForm() {
  const dispatch = useDispatch();
  const { form, saveStatus } = useSelector((state) => state.deviation);

  const handleChange = (field) => (e) => {
    dispatch(updateField({ field, value: e.target.value }));
  };

  const handleSave = () => {
    dispatch(submitDeviation(form));
  };

  const handleReset = () => {
    dispatch(resetForm());
  };

  return (
    <div style={{ flex: 1, padding: '24px', borderRight: '1px solid #e0e0e0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 style={{ margin: 0 }}>Log Deviation</h2>
        <span style={{ background: '#fff3cd', padding: '4px 10px', borderRadius: '4px', fontSize: '12px' }}>
          Draft
        </span>
      </div>
      <p style={{ color: '#666', fontSize: '14px' }}>
        Record any unexpected event, out-of-specification result or non-conformance.
      </p>

      <h4>1. Deviation Information</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <label>
          Site / Plant
          <input value={form.site_plant || ''} onChange={handleChange('site_plant')} style={inputStyle} />
        </label>
        <label>
          Date of Occurrence
          <input
            type="text"
            placeholder="dd-mm-yyyy"
            value={form.date_of_occurrence || ''}
            onChange={handleChange('date_of_occurrence')}
            style={inputStyle}
          />
        </label>
        <label>
          Title / Short Description
          <input value={form.title || ''} onChange={handleChange('title')} style={inputStyle} />
        </label>
        <label>
          Source
          <input value={form.source || ''} onChange={handleChange('source')} style={inputStyle} />
        </label>
        <label>
          Related Product / Material
          <input value={form.related_product || ''} onChange={handleChange('related_product')} style={inputStyle} />
        </label>
        <label>
          Batch/Lot Number
          <input value={form.batch_lot_number || ''} onChange={handleChange('batch_lot_number')} style={inputStyle} />
        </label>
      </div>

      <h4>2. Deviation Details</h4>
      <label style={{ display: 'block' }}>
        Detailed Description
        <textarea
          value={form.detailed_description || ''}
          onChange={handleChange('detailed_description')}
          maxLength={2000}
          rows={5}
          style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
        />
        <div style={{ textAlign: 'right', fontSize: '12px', color: '#999' }}>
          {(form.detailed_description || '').length}/2000
        </div>
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <label>
          Initial Impact
          <select value={form.initial_impact || ''} onChange={handleChange('initial_impact')} style={inputStyle}>
            <option value="">Select impact</option>
            {IMPACT_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </label>
        <label>
          Initial Severity
          <select value={form.initial_severity || ''} onChange={handleChange('initial_severity')} style={inputStyle}>
            <option value="">Select severity</option>
            {SEVERITY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </label>
      </div>
        {form.severity_reason && (
          <div style={{
            marginTop: '16px',
            padding: '14px',
            background: '#eef2ff',
            borderRadius: '6px',
            border: '1px solid #c7d2fe',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#4338ca', marginBottom: '6px' }}>
              🛡 AI Copilot Risk Assessment
            </div>
            <div style={{ fontSize: '13px', color: '#374151' }}>
              <strong>Severity:</strong> {form.initial_severity || '—'} &nbsp;·&nbsp;
              <strong>Impact:</strong> {form.initial_impact || '—'}
            </div>
            <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '6px', fontStyle: 'italic' }}>
              "{form.severity_reason}"
            </div>
          </div>
        )}

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={handleReset} style={{ padding: '10px 20px' }}>Reset Form</button>
        <button
          onClick={handleSave}
          disabled={saveStatus === 'loading'}
          style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          {saveStatus === 'loading' ? 'Saving...' : 'Save Deviation'}
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '8px',
  marginTop: '4px',
  marginBottom: '10px',
  border: '1px solid #ccc',
  borderRadius: '4px',
};

export default LogDeviationForm;