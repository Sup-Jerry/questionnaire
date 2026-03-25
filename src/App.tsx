import { useState } from 'react';
import ScoringQuestionnaire from './components/ScoringQuestionnaire';
import QuestionnaireHistory from './components/QuestionnaireHistory';
import { getAllQuestionnaires, getQuestionnaire } from './questionnaireRegistry';
import type { QuestionnaireType } from './questionnaireTypes';

export default function App() {
  const [page, setPage] = useState<'questionnaire' | 'history'>('questionnaire');
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<QuestionnaireType>('reasoning');

  const questionnaires = getAllQuestionnaires();
  const currentQuestionnaire = getQuestionnaire(selectedQuestionnaire);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <header style={{ backgroundColor: '#fff', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, textAlign: 'center' }}>问卷打分系统</h1>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 15, marginTop: 15, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <label><strong>选择问卷：</strong></label>
            <select
              value={selectedQuestionnaire}
              onChange={(e) => setSelectedQuestionnaire(e.target.value as QuestionnaireType)}
              style={{ padding: '8px 12px', fontSize: 14, cursor: 'pointer', borderRadius: 4 }}
            >
              {questionnaires.map(q => (
                <option key={q.id} value={q.id}>{q.name}</option>
              ))}
            </select>
          </div>
        </div>

        <nav style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 15 }}>
          <button
            onClick={() => setPage('questionnaire')}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              backgroundColor: page === 'questionnaire' ? '#007bff' : '#fff',
              color: page === 'questionnaire' ? '#fff' : '#000',
              border: '1px solid #007bff',
              borderRadius: 4
            }}
          >
            填写问卷
          </button>
          <button
            onClick={() => setPage('history')}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              backgroundColor: page === 'history' ? '#007bff' : '#fff',
              color: page === 'history' ? '#fff' : '#000',
              border: '1px solid #007bff',
              borderRadius: 4
            }}
          >
            历史记录
          </button>
        </nav>
      </header>

      <main style={{ padding: '20px 0' }}>
        {page === 'questionnaire' ? (
          <ScoringQuestionnaire
            questionnaire={currentQuestionnaire}
            onSubmit={() => setPage('history')}
          />
        ) : (
          <QuestionnaireHistory questionnaireId={selectedQuestionnaire} />
        )}
      </main>
    </div>
  );
}
