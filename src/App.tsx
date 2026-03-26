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
    <div className="app-shell">
      <header className="app-header">
        <h1 style={{ margin: 0, textAlign: 'center' }}>问卷打分系统</h1>

        <div className="center-row">
          <div className="row row-middle">
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

        <nav className="center-row">
          <button
            onClick={() => setPage('questionnaire')}
            className={`btn btn-primary ${page === 'questionnaire' ? 'is-active' : ''}`}
          >
            填写问卷
          </button>
          <button
            onClick={() => setPage('history')}
            className={`btn btn-primary ${page === 'history' ? 'is-active' : ''}`}
          >
            历史记录
          </button>
        </nav>
      </header>

      <main className="content-wrap">
        {page === 'questionnaire' ? (
          <ScoringQuestionnaire
            questionnaire={currentQuestionnaire}
            onSubmit={() => setPage('history')}
          />
        ) : (
          <QuestionnaireHistory key={selectedQuestionnaire} questionnaireId={selectedQuestionnaire} />
        )}
      </main>
    </div>
  );
}

