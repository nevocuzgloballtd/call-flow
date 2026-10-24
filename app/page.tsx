
'use client';

import { useEffect, useState } from 'react';
import './globals.css';

type HistoryItem = {
  id: string;
  type: 'Call' | 'SMS';
  number: string;
  status: string;
  time: string;
};

export default function Home() {
  const [tab, setTab] = useState<'call' | 'sms' | 'history'>('call');
  const [number, setNumber] = useState('');
  const [message, setMessage] = useState('');
  const [balance, setBalance] = useState<string | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  async function loadBalance() {
    setLoadingBalance(true);
    try {
      const res = await fetch('/api/balance', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load balance');
      setBalance(String(data.balance));
      setCurrency(data.currency || 'USD');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Balance unavailable');
    } finally {
      setLoadingBalance(false);
    }
  }

  async function loadHistory() {
    try {
      const res = await fetch('/api/history', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && Array.isArray(data.history)) {
        setHistory(data.history);
      }
    } catch {
      // History will be available once the backend is configured.
    }
  }

  useEffect(() => {
    void loadBalance();
    void loadHistory();
  }, []);

  function addDigit(digit: string) {
    setNumber((current) => current + digit);
  }

  async function makeCall() {
    if (!number.trim() || busy) return;
    setBusy(true);
    setNotice('');

    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: number.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Call request failed');

      setNotice(data.message || 'Call request accepted.');
      await loadHistory();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Call failed');
    } finally {
      setBusy(false);
    }
  }

  async function sendSMS() {
    if (!number.trim() || !message.trim() || busy) return;
    setBusy(true);
    setNotice('');

    try {
      const res = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: number.trim(), text: message.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'SMS failed');

      setNotice(data.message || 'SMS request accepted.');
      setMessage('');
      await loadHistory();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'SMS failed');
    } finally {
      setBusy(false);
    }
  }

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '0', '⌫'];

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-icon">T</span>
          <span>Talkdesk<span className="brand-dot">.</span>
            <small>BUSINESS COMMUNICATIONS</small>
          </span>
        </a>
        <span className="connection"><i /> My workspace</span>
      </header>

      <section className="welcome">
        <div>
          <p className="eyebrow">YOUR COMMUNICATION HUB</p>
          <h1>Stay connected<span>.</span></h1>
          <p className="subtitle">Calls and messages, all in one place.</p>
        </div>
        <button className="refresh-btn" onClick={loadBalance} disabled={loadingBalance}>
          {loadingBalance ? 'Refreshing…' : '↻ Refresh balance'}
        </button>
      </section>

      <section className="balance-card">
        <div className="balance-info">
          <div className="balance-icon">＄</div>
          <div>
            <p className="muted">TELNYX ACCOUNT BALANCE</p>
            <h2>{balance === null ? '— — —' : `${currency} ${balance}`}</h2>
            <p className="balance-caption">Provider balance · Not a separate app wallet</p>
          </div>
        </div>
        <span className="live-tag"><i /> PROVIDER</span>
      </section>

      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} aria-label="Dismiss message">×</button>
        </div>
      )}

      <nav className="tabs" aria-label="Communication options">
        <button className={tab === 'call' ? 'tab active' : 'tab'} onClick={() => setTab('call')}>
          <span>☎</span> Make a call
        </button>
        <button className={tab === 'sms' ? 'tab active' : 'tab'} onClick={() => setTab('sms')}>
          <span>▤</span> Send SMS
        </button>
        <button className={tab === 'history' ? 'tab active' : 'tab'} onClick={() => { setTab('history'); void loadHistory(); }}>
          <span>◷</span> History
        </button>
      </nav>

      {tab === 'call' && (
        <section className="workspace">
          <div className="panel dialer">
            <div className="panel-heading">
              <div><h3>Make a call</h3><p>Enter an international phone number</p></div>
              <span className="panel-icon">☎</span>
            </div>

            <label className="field-label" htmlFor="phone">PHONE NUMBER</label>
            <div className="phone-input">
              <span>＋</span>
              <input
                id="phone"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void makeCall(); }}
                placeholder="Enter number, e.g. +14155550123"
                type="tel"
                autoComplete="tel"
              />
              <button onClick={() => setNumber((n) => n.slice(0, -1))} aria-label="Delete last digit">⌫</button>
            </div>

            <div className="dial-pad">
              {digits.map((digit) => (
                <button
                  key={digit}
                  onClick={() => digit === '⌫' ? setNumber((n) => n.slice(0, -1)) : addDigit(digit)}
                  aria-label={digit === '⌫' ? 'Delete last digit' : `Enter ${digit}`}
                >
                  {digit}
                  {digit !== '+' && digit !== '⌫' && (
                    <small>{({ '1': '', '2': 'ABC', '3': 'DEF', '4': 'GHI', '5': 'JKL', '6': 'MNO', '7': 'PQRS', '8': 'TUV', '9': 'WXYZ', '0': '+' } as Record<string, string>)[digit]}</small>
                  )}
                </button>
              ))}
            </div>

            <button className="primary-btn call-btn" disabled={!number.trim() || busy} onClick={makeCall}>
              <span>☎</span> {busy ? 'Please wait…' : 'Start call'}
            </button>
            <p className="fine-print">International calling requires an enabled Telnyx voice connection.</p>
          </div>

          <aside className="panel side-panel">
            <div className="panel-heading"><div><h3>Quick tips</h3><p>Before you connect</p></div></div>
            <div className="tip"><span>01</span><div><b>Use the full number</b><p>Include the country code, e.g. +1 for the US or +44 for the UK.</p></div></div>
            <div className="tip"><span>02</span><div><b>Check your balance</b><p>Keep enough Telnyx credit for international call charges.</p></div></div>
            <div className="tip"><span>03</span><div><b>Test your setup</b><p>Your voice connection and caller ID must be configured with Telnyx.</p></div></div>
            <div className="security-note">🔒 Your Telnyx secret key belongs on the server, never in this page.</div>
          </aside>
        </section>
      )}

      {tab === 'sms' && (
        <section className="panel sms-panel">
          <div className="panel-heading"><div><h3>Send a message</h3><p>Send an SMS to an international number</p></div><span className="panel-icon">▤</span></div>
          <label className="field-label" htmlFor="sms-number">RECIPIENT PHONE NUMBER</label>
          <input className="text-field" id="sms-number" type="tel" autoComplete="tel" placeholder="+14155550123" value={number} onChange={(e) => setNumber(e.target.value)} />
          <label className="field-label" htmlFor="sms-message">YOUR MESSAGE</label>
          <textarea id="sms-message" placeholder="Write your message here…" rows={5} maxLength={1600} value={message} onChange={(e) => setMessage(e.target.value)} />
          <div className="message-meta"><span>SMS availability and length depend on the destination.</span><span>{message.length}/1600</span></div>
          <button className="primary-btn" disabled={!number.trim() || !message.trim() || busy} onClick={sendSMS}>
            {busy ? 'Sending…' : '➤  Send SMS'}
          </button>
          <p className="fine-print">The recipient must be reachable through a destination supported by your Telnyx messaging setup.</p>
        </section>
      )}

      {tab === 'history' && (
        <section className="panel history-panel">
          <div className="panel-heading">
            <div><h3>Recent activity</h3><p>Your call and SMS records</p></div>
            <button className="refresh-btn" onClick={loadHistory}>↻ Refresh</button>
          </div>
          {history.length === 0 ? (
            <div className="empty-state"><span>◷</span><h3>No activity yet</h3><p>Your call and message records will appear here when the history API is connected.</p></div>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <div className="history-item" key={item.id}>
                  <span className="history-icon">{item.type === 'Call' ? '☎' : '▤'}</span>
                  <div className="history-details"><b>{item.number}</b><small>{item.type} · {item.time}</small></div>
                  <span className="history-status">{item.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <footer><span>Talkdesk · Private business workspace</span><span>Powered by Telnyx</span></footer>
    </main>
  );
}
