import { useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useApp, uid } from '../context';
import Modal from '../components/Modal';
import Breadcrumb from '../components/Breadcrumb';
import { Person, Role, ROLE_LABELS, TOUCHPOINT_LABELS, TOUCHPOINT_COLORS } from '../types';

const ROLES: Role[] = ['teacher', 'team', 'administrator'];

function PersonCard({ person, schoolId }: { person: Person; schoolId: string }) {
  const { state } = useApp();
  const touchpoints = state.touchpoints
    .filter(t => t.personId === person.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const latest = touchpoints[0];

  return (
    <Link to={`/school/${schoolId}/person/${person.id}`} className="person-card">
      <div className="person-card-header">
        <div className="person-avatar">{person.name.charAt(0).toUpperCase()}</div>
        <div className="person-info">
          <span className="person-name">{person.name}</span>
          {(person.department || person.gradeLevel) && (
            <span className="person-sub">{[person.department, person.gradeLevel].filter(Boolean).join(' · ')}</span>
          )}
        </div>
        <span className="person-count">{touchpoints.length}</span>
      </div>
      {latest && (
        <div className="person-latest">
          <span
            className="touchpoint-badge"
            style={{ background: TOUCHPOINT_COLORS[latest.type] }}
          >
            {TOUCHPOINT_LABELS[latest.type]}
          </span>
          <span className="person-latest-date">{new Date(latest.date).toLocaleDateString()}</span>
        </div>
      )}
    </Link>
  );
}

export default function SchoolPage() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const { state, dispatch } = useApp();
  const school = state.schools.find(s => s.id === schoolId);

  const [showAdd, setShowAdd] = useState(false);
  const [editPerson, setEditPerson] = useState<Person | null>(null);
  const [form, setForm] = useState({ name: '', role: 'teacher' as Role, department: '', gradeLevel: '' });

  if (!school) return <Navigate to="/" />;

  const people = state.people.filter(p => p.schoolId === schoolId);

  function resetForm() { setForm({ name: '', role: 'teacher', department: '', gradeLevel: '' }); }

  function openAdd() { resetForm(); setShowAdd(true); }
  function openEdit(p: Person) {
    setEditPerson(p);
    setForm({ name: p.name, role: p.role, department: p.department || '', gradeLevel: p.gradeLevel || '' });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !school) return;
    dispatch({
      type: 'ADD_PERSON',
      payload: {
        id: uid(),
        schoolId: school.id,
        name: form.name.trim(),
        role: form.role,
        department: form.department.trim() || undefined,
        gradeLevel: form.gradeLevel.trim() || undefined,
      },
    });
    setShowAdd(false);
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editPerson || !form.name.trim()) return;
    dispatch({
      type: 'UPDATE_PERSON',
      payload: {
        ...editPerson,
        name: form.name.trim(),
        role: form.role,
        department: form.department.trim() || undefined,
        gradeLevel: form.gradeLevel.trim() || undefined,
      },
    });
    setEditPerson(null);
  }

  function handleDelete(person: Person) {
    const count = state.touchpoints.filter(t => t.personId === person.id).length;
    const msg = count > 0
      ? `Delete "${person.name}"? This will also delete ${count} touchpoint(s).`
      : `Delete "${person.name}"?`;
    if (confirm(msg)) dispatch({ type: 'DELETE_PERSON', payload: person.id });
  }

  const PersonForm = ({ onSubmit, onCancel, submitLabel }: { onSubmit: (e: React.FormEvent) => void; onCancel: () => void; submitLabel: string }) => (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <label className="form-label">Name</label>
        <input
          className="form-input"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Full name or team name"
          autoFocus
        />
      </div>
      <div className="form-group">
        <label className="form-label">Role</label>
        <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}>
          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Department / Subject <span className="form-optional">(optional)</span></label>
          <input
            className="form-input"
            value={form.department}
            onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
            placeholder="e.g. Math, ELA"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Grade Level <span className="form-optional">(optional)</span></label>
          <input
            className="form-input"
            value={form.gradeLevel}
            onChange={e => setForm(f => ({ ...f, gradeLevel: e.target.value }))}
            placeholder="e.g. 3rd, K–2"
          />
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={!form.name.trim()}>{submitLabel}</button>
      </div>
    </form>
  );

  return (
    <div className="page">
      <Breadcrumb crumbs={[{ label: 'Schools', to: '/' }, { label: school.name }]} />

      <div className="page-header">
        <div>
          <h1 className="page-title">{school.name}</h1>
          <p className="page-subtitle">{people.length} coaching contact{people.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Person / Team</button>
      </div>

      {people.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <h3>No contacts yet</h3>
          <p>Add teachers, teams, and administrators you coach at this school.</p>
          <button className="btn btn-primary" onClick={openAdd}>Add First Contact</button>
        </div>
      ) : (
        ROLES.map(role => {
          const group = people.filter(p => p.role === role);
          if (group.length === 0) return null;
          return (
            <section key={role} className="role-section">
              <h2 className="role-title">{ROLE_LABELS[role]}s</h2>
              <div className="person-list">
                {group.map(person => (
                  <div key={person.id} className="person-row">
                    <PersonCard person={person} schoolId={school.id} />
                    <div className="person-row-actions">
                      <button className="btn-icon" onClick={() => openEdit(person)} title="Edit">✏️</button>
                      <button className="btn-icon btn-icon--danger" onClick={() => handleDelete(person)} title="Delete">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}

      {showAdd && (
        <Modal title="Add Person / Team" onClose={() => setShowAdd(false)}>
          <PersonForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} submitLabel="Add" />
        </Modal>
      )}

      {editPerson && (
        <Modal title="Edit Contact" onClose={() => setEditPerson(null)}>
          <PersonForm onSubmit={handleEdit} onCancel={() => setEditPerson(null)} submitLabel="Save Changes" />
        </Modal>
      )}
    </div>
  );
}
