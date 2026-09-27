import './App.css';
import LogDeviationForm from './features/deviation/LogDeviationForm';
import AIDeviationAssistant from './features/deviation/AIDeviationAssistant';

function App() {
  return (
    <div style={{ display: 'flex', maxWidth: '1400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <LogDeviationForm />
      <AIDeviationAssistant />
    </div>
  );
}

export default App;