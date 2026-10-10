import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { Field } from '../../components/FormControls';
import { Modal } from '../../components/Modal';
import { EXPLORER_MODULE_BY_ID } from '../../data/explorerModules';
import { db } from '../../database/db';
import { useChildren, useJarQuestions } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { addQuestion, answerQuestion } from '../../services/explorer';
import type { ChildProfile, JarQuestion } from '../../types';
import { formatLong, toDateKey } from '../../utils/dates';
import { ExploreTabs } from '../library/ExploreTabs';
import './explorer.css';

/** Frageglas „Das weiß ich noch nicht“: Fragen sammeln, später gemeinsam herausfinden. */
export function JarPage() {
  const today = toDateKey(useNow(60_000));
  const children = useChildren();
  const questions = useJarQuestions();
  const [text, setText] = useState('');
  const [guess, setGuess] = useState('');
  const [childId, setChildId] = useState<string | undefined>();
  const [answering, setAnswering] = useState<JarQuestion | null>(null);
  if (!children || !questions) return null;
  const open = questions.filter((q) => !q.answer).reverse();
  const done = questions.filter((q) => q.answer).sort((a, b) => (b.answeredAt ?? '').localeCompare(a.answeredAt ?? ''));
  const add = async () => {
    await addQuestion(db, { question: text, guess, childId });
    setText(''); setGuess('');
  };
  return (
    <div>
      <header className="page-head">
        <Link to="/entdecken/sonntage" className="btn btn--icon btn--ghost" aria-label="Zurück zu den Entdeckersonntagen"><ArrowLeft size={22} /></Link>
        <h1>🫙 Das weiß ich noch nicht</h1>
      </header>
      <ExploreTabs />
      <div className="lib-grid2">
        <div className="stack">
          <section className="card stack">
            <h2 className="card__title">Neue Frage ins Glas</h2>
            <div className="seg" role="group" aria-label="Wessen Frage">
              {children.map((c) => (
                <button key={c.id} type="button" className="seg__item" aria-pressed={childId === c.id} onClick={() => setChildId(childId === c.id ? undefined : c.id)}>{c.name}</button>
              ))}
            </div>
            <input className="input" value={text} placeholder="Meine Frage …" aria-label="Frage" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void add(); }} />
            <input className="input" value={guess} placeholder="Ich glaube vielleicht … (optional)" aria-label="Vermutung" onChange={(e) => setGuess(e.target.value)} />
            <button type="button" className="btn btn--sky" style={{ alignSelf: 'flex-start' }} disabled={!text.trim()} onClick={() => void add()}>Ins Glas</button>
          </section>
          <section className="card">
            <h2 className="card__title">Noch offen ({open.length})</h2>
            {open.length === 0 ? <p className="small muted">Das Glas ist leer. Die nächste Kinderfrage kommt bestimmt.</p> : (
              <ul className="list">{open.map((q) => <QuestionRow key={q.id} q={q} children={children} onAnswer={() => setAnswering(q)} />)}</ul>
            )}
          </section>
        </div>
        <section className="card">
          <h2 className="card__title">Schon herausgefunden ({done.length})</h2>
          {done.length === 0 ? <p className="small muted">Hier landen die Antworten, die ihr gemeinsam gefunden habt.</p> : (
            <ul className="list">{done.map((q) => <QuestionRow key={q.id} q={q} children={children} onAnswer={() => setAnswering(q)} />)}</ul>
          )}
        </section>
      </div>
      {answering && <AnswerModal q={answering} today={today} onClose={() => setAnswering(null)} />}
    </div>
  );
}

function QuestionRow({ q, children, onAnswer }: { q: JarQuestion; children: ChildProfile[]; onAnswer: () => void }) {
  const c = children.find((x) => x.id === q.childId);
  const m = q.moduleId ? EXPLORER_MODULE_BY_ID.get(q.moduleId) : undefined;
  return (
    <li className="list-item ex-question">
      {c && <Avatar avatar={c.avatar} color={c.color} size={36} />}
      <div className="list-item__main">
        <p className="list-item__title">{q.question}</p>
        <p className="list-item__meta">
          {q.guess && <>Vermutung: {q.guess} · </>}{m ? `${m.title} · ` : ''}{formatLong(q.createdAt.slice(0, 10))}
        </p>
        {q.answer && <p className="ex-answer">💡 {q.answer}{q.source ? <span className="small muted"> ({q.source})</span> : null}</p>}
      </div>
      <button type="button" className="btn btn--small" onClick={onAnswer}>{q.answer ? <Pencil size={14} aria-label="Antwort ändern" /> : 'Herausgefunden'}</button>
      <button type="button" className="btn btn--icon btn--ghost btn--small" aria-label="Frage löschen" onClick={() => void db.jarQuestions.delete(q.id)}><Trash2 size={14} /></button>
    </li>
  );
}

function AnswerModal({ q, today, onClose }: { q: JarQuestion; today: string; onClose: () => void }) {
  const [answer, setAnswer] = useState(q.answer ?? '');
  const [source, setSource] = useState(q.source ?? '');
  return (
    <Modal title="Herausgefunden" onClose={onClose} actions={
      <><button type="button" className="btn btn--ghost" onClick={onClose}>Abbrechen</button>
        <button type="button" className="btn btn--primary" onClick={() => void answerQuestion(db, q.id, answer, source, today).then(onClose)}>Speichern</button></>
    }>
      <div className="stack">
        <p><strong>{q.question}</strong></p>
        <Field label="Das haben wir herausgefunden"><textarea className="textarea" rows={3} value={answer} onChange={(e) => setAnswer(e.target.value)} /></Field>
        <Field label="Woher wissen wir es?" hint="Buch, Museum, Experiment, Nachgefragt"><input className="input" value={source} onChange={(e) => setSource(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
