import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp, uid } from '../context';
import Modal from '../components/Modal';
import { School } from '../types';

export default function HomePage() {
  const { state, dispatch } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editSchool, setEditSchool] = useState<School | null>(null);
  const [name, setName] = useState('');

  const totalTouchpoints = (schoolId: string) =>
    state.touchpoints.filter(t => t.schoolId === schoolId).length;
  const totalPeople = (schoolId: string) =>
    state.people.filter(p => p.schoolId === schoolId).length;

  function openAdd() { setName(''); setShowAdd(true); }
  function openEdit(s: School) { setEditSchool(s); setName(s.name); }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    dispatch({ type: 'ADD_SCHOOL', payload: { id: uid(), name: name.trim(), createdAt: new Date().toISOString() } });
    setShowAdd(false);
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editSchool || !name.trim()) return;
    dispatch({ type: 'UPDATE_SCHOOL', payload: { ...editSchool, name: name.trim() } });
    setEditSchool(null);
  }

  function handleDelete(school: School) {
    const count = totalPeople(school.id);
    const msg = count > 0
      ? `Delete "${school.name}"? This will also delete ${count} person/team record(s) and all their touchpoints.`
      : `Delete "${school.name}"?`;
    if (confirm(msg)) dispatch({ type: 'DELETE_SCHOOL', payload: school.id });
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Schools</h1>
          <p className="page-subtitle">Select a school to view your coaching contacts</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add School</button>
      </div>

      {state.schools.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏫</div>
          <h3>No schools yet</h3>
          <p>Add a school to get started tracking your coaching touchpoints.</p>
          <button className="btn btn-primary" onClick={openAdd}>Add Your First School</button>
        </div>
      ) : (
        <div className="card-grid">
          {state.schools.map(school => (
            <div key={school.id} className="card">
              <Link to={`/school/${school.id}`} className="card-link">
                <div className="card-icon">🏫</div>
                <div className="card-body">
                  <h3 className="card-title">{school.name}</h3>
                  <div className="card-stats">
                    <span>{totalPeople(school.id)} people</span>
                    <span>·</span>
                    <span>{totalTouchpoints(school.id)} touchpoints</span>
                  </div>
                </div>
              </Link>
              <div className="card-actions">
                <button className="btn-icon" onClick={() => openEdit(school)} title="Edit">✏️</button>
                <button className="btn-icon btn-icon--danger" onClick={() => handleDelete(school)} title="Delete">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="Add School" onClose={() => setShowAdd(false)} size="sm">
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label className="form-label">School Name</label>
              <input
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Lincoln Elementary"
                autoFocus
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={!name.trim()}>Add School</button>
            </div>
          </form>
        </Modal>
      )}

      {editSchool && (
        <Modal title="Edit School" onClose={() => setEditSchool(null)} size="sm">
          <form onSubmit={handleEdit}>
            <div className="form-group">
              <label className="form-label">School Name</label>
              <input
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setEditSchool(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={!name.trim()}>Save Changes</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
