import React, { useState } from 'react';
import { Copy, Check, ShieldCheck, Database, Key, Binary, Network } from 'lucide-react';

export default function EvidenceGrid({ evidence = [] }) {
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getIconForKey = (key) => {
    const k = key.toLowerCase();
    if (k.includes('account') || k.includes('user')) return Key;
    if (k.includes('hash') || k.includes('sha')) return Binary;
    if (k.includes('destination') || k.includes('ip') || k.includes('c2')) return Network;
    return Database;
  };

  if (!evidence || evidence.length === 0) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
        No direct IoC indicators extracted yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
      {evidence.map((item, idx) => {
        const Icon = getIconForKey(item.key);
        const isCopied = copiedKey === item.key;
        return (
          <div 
            key={idx}
            style={{
              backgroundColor: 'var(--bg-surface-2)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                <Icon size={13} color="var(--primary)" />
                <span>{item.key}</span>
              </div>
              <button
                onClick={() => handleCopy(item.value, item.key)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isCopied ? '#34d399' : 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10px'
                }}
                title="Copy to clipboard"
              >
                {isCopied ? <Check size={12} /> : <Copy size={12} />}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '12px', 
              color: '#fff',
              backgroundColor: 'rgba(0,0,0,0.3)',
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              wordBreak: 'break-all'
            }}>
              {item.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
