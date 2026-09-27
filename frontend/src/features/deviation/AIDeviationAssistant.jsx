import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { runExtraction, editViaChat } from './deviationSlice';

function AIDeviationAssistant() {
  const dispatch = useDispatch();
  const { extractionStatus, extractionError } = useSelector((state) => state.deviation);
  const form = useSelector((state) => state.deviation.form);

  const [pastedText, setPastedText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const isLoading = extractionStatus === 'loading';

  const simulateProgress = () => {
    setProgress(0);
    setStatusText('Reading input...');
    const steps = [
      { pct: 20, text: 'Analyzing document content and extracting key details...' },
      { pct: 55, text: 'Identifying deviation fields...' },
      { pct: 85, text: 'Assessing impact and severity...' },
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setProgress(steps[i].pct);
        setStatusText(steps[i].text);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 700);
    return interval;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    runExtractionWithProgress(formData);
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    const formData = new FormData();
    formData.append('text', pastedText);
    runExtractionWithProgress(formData);
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    const before = { ...form };
    dispatch(editViaChat({ message: userMsg, currentForm: form })).then((action) => {
      if (!editViaChat.fulfilled.match(action)) {
        const errorMessage = action.payload || action.error.message || 'Edit request failed.';
        setChatMessages((prev) => [...prev, { role: 'ai', text: `Edit failed: ${errorMessage}` }]);
        return;
      }

      console.log(action.payload);
      const changed = Object.keys(action.payload).filter(
        (k) => action.payload[k] !== before[k]
      );
      const summary = changed.length
        ? `Got it — updated: ${changed.join(', ')}.`
        : "Noted, but I didn't find anything to change based on that.";
      setChatMessages((prev) => [...prev, { role: 'ai', text: summary }]);
    });
  };

  const runExtractionWithProgress = (formData) => {
    const interval = simulateProgress();
    dispatch(runExtraction(formData)).finally(() => {
      clearInterval(interval);
      setProgress(100);
      setStatusText('Done.');
      setTimeout(() => {
        setProgress(0);
        setStatusText('');
      }, 1500);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    runExtractionWithProgress(formData);
  };

  return (
    <div style={{ flex: 1, padding: '24px', background: '#fafafa' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>AI Deviation Assistant</h3>
        <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
          BETA
        </span>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          border: '2px dashed #ccc',
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center',
          marginTop: '16px',
          background: 'white',
        }}
      >
        <p style={{ margin: 0, color: '#666' }}>
          Drag & drop supporting document here, or{' '}
          <label style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}>
            click to browse
            <input type="file" hidden onChange={handleFileChange} accept=".pdf,.docx,.txt,.xls,.xlsx,.jpg,.png" />
          </label>
        </p>
        <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
          Supported: PDF, DOCX, TXT, XLS, JPG, PNG — Max 10MB
        </p>
      </div>

      <div style={{ textAlign: 'center', margin: '12px 0', color: '#999', fontSize: '12px' }}>OR</div>

      {!showPasteBox ? (
        <button
          onClick={() => setShowPasteBox(true)}
          style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', background: 'white' }}
        >
          Paste deviation details / notes
        </button>
      ) : (
        <div>
          <textarea
            rows={4}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste deviation email, report text, or lab notes here..."
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }}
          />
          <button
            onClick={handlePasteSubmit}
            disabled={isLoading}
            style={{ marginTop: '8px', padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            {isLoading ? 'Processing...' : 'Extract with AI'}
          </button>
        </div>
      )}

      {(isLoading || progress > 0) && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>EXTRACTION PROGRESS</div>
          <div style={{ background: '#eee', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, background: '#2563eb', height: '100%', transition: 'width 0.4s' }} />
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>{statusText}</p>
        </div>
      )}

      {extractionStatus === 'succeeded' && (
        <p style={{ color: '#16a34a', fontSize: '13px', marginTop: '12px' }}>
          ✓ Form populated — review and edit before saving.
        </p>
      )}
      {extractionStatus === 'failed' && (
        <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '12px' }}>
          Extraction failed: {extractionError}
        </p>
      )}

      <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '14px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>
          ASK ME ANYTHING ABOUT THIS DEVIATION
        </div>
        <div style={{ maxHeight: '160px', overflowY: 'auto', marginBottom: '8px' }}>
          {chatMessages.map((m, i) => (
            <div key={i} style={{
              textAlign: m.role === 'user' ? 'right' : 'left',
              margin: '6px 0',
            }}>
              <span style={{
                display: 'inline-block',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '13px',
                background: m.role === 'user' ? '#2563eb' : '#f3f4f6',
                color: m.role === 'user' ? 'white' : '#111',
              }}>
                {m.text}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
            placeholder="Ask me anything about deviations..."
            style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <button onClick={handleChatSend} style={{ padding: '8px 14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px' }}>
            Send
          </button>
        </div>
      </div>

      <p style={{ fontSize: '11px', color: '#999', marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
        AI responses may contain errors. Please verify information.
      </p>
    </div>
  );
}

export default AIDeviationAssistant;