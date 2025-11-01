import React, { useEffect, useState } from 'react';

const Messages = () => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState('');
  const [messages, setMessages] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyBodies, setReplyBodies] = useState({});
  const [sendingReplies, setSendingReplies] = useState({});
  const [replyStatus, setReplyStatus] = useState({});

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/messages', { credentials: 'include' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Failed to load messages');
      } else {
        const d = await res.json();
        setMessages(Array.isArray(d.messages) ? d.messages : []);
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admins', { credentials: 'include' });
        if (res.ok) {
          const d = await res.json();
          setAdmins(Array.isArray(d.admins) ? d.admins : []);
        }
      } catch (e) { /* ignore */ }
    };
    fetchAdmins();
  }, []);

  const getAdminName = (email) => {
    const a = admins.find(x => x.email === email);
    return a ? (a.name || a.email) : email;
  };

  const handleSend = async (e) => {
    e.preventDefault();
  if (!subject.trim() || !body.trim()) return alert('Please enter subject and message');
  if (!selectedAdmin) return alert('Please select an admin to send to');
    try {
      const res = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject, body, recipient_admin: selectedAdmin })
      });
      const d = await res.json();
      if (!res.ok) return alert(d.error || 'Failed to send');
      setSubject(''); setBody(''); setSelectedAdmin('');
      // prepend message
      setMessages(prev => [d.data, ...prev]);
    } catch (err) {
      alert('Network error sending message');
    }
  };

  return (
    <div className="messages-page">
      <h2>Contact Admin</h2>
      <form onSubmit={handleSend} className="message-form">
        <div className="form-group">
          <label>Subject</label>
          <input value={subject} onChange={e => setSubject(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Send to admin</label>
          <select value={selectedAdmin} onChange={e => setSelectedAdmin(e.target.value)}>
            <option value="">Select admin</option>
            {admins.map(a => <option key={a.email} value={a.email}>{a.name || a.email}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Message</label>
          <textarea rows={5} value={body} onChange={e => setBody(e.target.value)} />
        </div>
        <div className="form-buttons">
          <button type="submit" className="btn-primary">Send</button>
        </div>
      </form>

      <h3>Your messages</h3>
      {loading ? <p>Loading...</p> : error ? <p>{error}</p> : (
        <div className="messages-list">
          {messages.length === 0 && <div>No messages yet</div>}
          {messages.map(m => (
            <div key={m._id || m.id} className="message-card">
              <div className="message-meta">
                <strong>{m.subject}</strong>
                <div className="message-recipient">To: {getAdminName(m.recipient_admin)}</div>
                <span className="msg-date">{new Date(m.timestamp).toLocaleString()}</span>
              </div>
              <div className="message-body">{m.body}</div>
              {/* Conversation */}
              {Array.isArray(m.conversation) && m.conversation.length > 0 && (
                <div className="message-conversation">
                  {m.conversation.map((c, i) => (
                    <div key={i} className="message-convo-entry">
                      <div className="convo-meta">{c.sender === 'admin' ? `From admin (${c.admin_email})` : 'From you'} at {new Date(c.timestamp).toLocaleString()}</div>
                      <div className="convo-body">{c.body}</div>
                    </div>
                  ))}
                </div>
              )}
              {m.closed ? (
                <div className="message-reply" style={{marginTop:8}}>
                  <strong>Closed</strong> by {m.closed_by} at {m.closed_at ? new Date(m.closed_at).toLocaleString() : ''}
                  <div style={{marginTop:8}}>
                    <button className="btn-delete" onClick={async () => {
                      const ok = window.confirm('Delete this closed message?');
                      if (!ok) return;
                      try {
                        const res = await fetch(`http://localhost:5000/api/messages/${encodeURIComponent(m._id || m.id)}`, { method: 'DELETE', credentials: 'include' });
                        const d = await res.json().catch(()=>({}));
                        if (!res.ok) return alert(d.error || 'Failed to delete');
                        setMessages(prev => prev.filter(x => (x._id||x.id) !== (m._id||m.id)));
                      } catch (err) { alert('Network error'); }
                    }}>Delete</button>
                  </div>
                </div>
              ) : (
                <div style={{marginTop:8}} className="reply-controls">
                  {replyStatus[m._id || m.id] === 'success' && <div className="reply-success">Reply sent</div>}
                  {replyStatus[m._id || m.id] === 'error' && <div className="reply-error">Failed to send reply</div>}
                  <textarea rows={3} value={replyBodies[m._id || m.id] || ''} onChange={e => setReplyBodies(prev => ({...prev, [m._id || m.id]: e.target.value}))} placeholder="Write a reply..." />
                  <div style={{display:'flex', gap:8, marginTop:8}}>
                    <button className={`btn-primary ${sendingReplies[m._id || m.id] ? 'btn-disabled' : ''}`} disabled={!!sendingReplies[m._id || m.id]} onClick={async () => {
                      const id = m._id || m.id;
                      const reply = (replyBodies[id] || '').trim();
                      if (!reply) return alert('Please enter a reply');
                      try {
                        setSendingReplies(prev => ({...prev, [id]: true}));
                        setReplyStatus(prev => ({...prev, [id]: null}));
                        const res = await fetch(`http://localhost:5000/api/messages/${encodeURIComponent(id)}/reply`, {
                          method: 'POST',
                          headers: {'Content-Type':'application/json'},
                          credentials: 'include',
                          body: JSON.stringify({ body: reply })
                        });
                        const d = await res.json().catch(()=>({}));
                        if (!res.ok) { setReplyStatus(prev => ({...prev, [id]: 'error'})); return alert(d.error || 'Failed to send reply'); }
                        setReplyBodies(prev => ({...prev, [id]: ''}));
                        setReplyStatus(prev => ({...prev, [id]: 'success'}));
                        fetchMessages();
                      } catch (err) { setReplyStatus(prev => ({...prev, [m._id || m.id]: 'error'})); alert('Network error'); }
                      finally { setSendingReplies(prev => ({...prev, [m._id || m.id]: false})); }
                    }}>Reply</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Messages;
