import React, { useEffect, useState } from 'react';

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
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
        setError(d.error || 'Failed to load');
      } else {
        const d = await res.json();
        setMessages(Array.isArray(d.messages) ? d.messages : []);
      }
    } catch (err) {
      setError('Network error');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchMessages(); }, []);

  const handleReply = async (id) => {
    const body = (replyBodies[id] || '').trim();
    if (!body) return alert('Reply body required');
    try {
      setSendingReplies(prev => ({...prev, [id]: true}));
      setReplyStatus(prev => ({...prev, [id]: null}));
      const res = await fetch(`http://localhost:5000/api/messages/${encodeURIComponent(id)}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ body })
      });
      const d = await res.json().catch(()=>({}));
      if (!res.ok) {
        setReplyStatus(prev => ({...prev, [id]: 'error'}));
        return alert(d.error || 'Failed to reply');
      }
      // success: clear input and refresh
      setReplyBodies(prev => ({...prev, [id]: ''}));
      setReplyStatus(prev => ({...prev, [id]: 'success'}));
      fetchMessages();
    } catch (err) { setReplyStatus(prev => ({...prev, [id]: 'error'})); alert('Network error'); }
    finally { setSendingReplies(prev => ({...prev, [id]: false})); }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm('Delete this message permanently?');
    if (!ok) return;
    try {
      const res = await fetch(`http://localhost:5000/api/messages/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
      const d = await res.json().catch(()=>({}));
      if (!res.ok) return alert(d.error || 'Failed to delete');
      setMessages(prev => prev.filter(m => (m._id||m.id) !== id));
    } catch (err) { alert('Network error'); }
  };

  const handleClose = async (id) => {
    const ok = window.confirm('Close this ticket? This will prevent further replies.');
    if (!ok) return;
    try {
      const res = await fetch(`http://localhost:5000/api/messages/${encodeURIComponent(id)}/close`, { method: 'POST', credentials: 'include' });
      const d = await res.json().catch(()=>({}));
      if (!res.ok) return alert(d.error || 'Failed to close');
      fetchMessages();
    } catch (err) { alert('Network error'); }
  };

  return (
    <div className="admin-messages">
      <h2>Admin Messages</h2>
      {loading ? <p>Loading...</p> : error ? <p>{error}</p> : (
        <div className="messages-list">
          {messages.length === 0 && <div>No messages</div>}
          {messages.map(m => (
            <div key={m._id || m.id} className="message-card">
              <div className="message-meta"><strong>{m.subject}</strong> from <em>{m.sender_email}</em> <span className="msg-date">{new Date(m.timestamp).toLocaleString()}</span></div>
              <div className="message-body">{m.body}</div>
              {m.closed && (
                <div className="message-reply"><strong>Closed</strong> by {m.closed_by} at {new Date(m.closed_at).toLocaleString()}</div>
              )}
              {/* show conversation if exists */}
              {Array.isArray(m.conversation) && m.conversation.length > 0 && (
                <div className="message-conversation">
                  {m.conversation.map((c,i) => (
                    <div key={i} className="message-convo-entry">
                      <div className="convo-meta">{c.sender === 'admin' ? `From admin (${c.admin_email})` : `From user (${m.sender_email})`} at {new Date(c.timestamp).toLocaleString()}</div>
                      <div className="convo-body">{c.body}</div>
                    </div>
                  ))}
                </div>
              )}

              {!m.closed ? (
                <div className="reply-controls">
                  {replyStatus[m._id || m.id] === 'success' && <div className="reply-success">Reply sent</div>}
                  {replyStatus[m._id || m.id] === 'error' && <div className="reply-error">Failed to send reply</div>}
                  <textarea placeholder="Type reply..." rows={3} value={replyBodies[m._id||m.id] || ''} onChange={e => setReplyBodies(prev => ({...prev, [m._id||m.id]: e.target.value}))}></textarea>
                  <div style={{display:'flex', gap:8, marginTop:8}}>
                    <button onClick={() => handleReply(m._id||m.id)} className={`btn-primary ${sendingReplies[m._id||m.id] ? 'btn-disabled' : ''}`} disabled={!!sendingReplies[m._id||m.id]}>Reply</button>
                    {!m.closed && <button onClick={() => handleClose(m._id||m.id)} className="btn-view">Close Ticket</button>}
                    <button onClick={() => handleDelete(m._id||m.id)} className="btn-delete">Delete</button>
                  </div>
                </div>
              ) : (
                <div style={{marginTop:8}} className="message-reply"><strong>Closed</strong> by {m.closed_by} at {m.closed_at ? new Date(m.closed_at).toLocaleString() : ''}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
