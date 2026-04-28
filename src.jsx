import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CrossmintProvider, CrossmintEmbeddedCheckout } from '@crossmint/client-sdk-react-ui';

function logToPage(msg, isError) {
  var el = document.getElementById('debug-log');
  if (el) {
    var line = document.createElement('div');
    line.style.color = isError ? '#c00' : '#666';
    line.style.fontSize = '11px';
    line.style.fontFamily = 'monospace';
    line.textContent = '[' + new Date().toISOString().substr(11, 12) + '] ' + msg;
    el.appendChild(line);
    el.scrollTop = el.scrollHeight;
  }
  console.log(msg);
}

window.addEventListener('error', function(e) {
  logToPage('JS Error: ' + (e.message || e), true);
});

window.addEventListener('unhandledrejection', function(e) {
  logToPage('Promise reject: ' + (e.reason && e.reason.message || e.reason), true);
});

logToPage('Bundle loaded, parsing params...');

const params = new URLSearchParams(window.location.search);
const orderId = params.get('orderId');
const clientSecret = params.get('clientSecret');
const env = params.get('env') || 'staging';

const CK_KEY = 'ck_staging_zYeLjhTDaUTaFZZu6T1ZMxTzemKAZ3T2srLnPFrA9LCJSa1H1LTWLusupYa59kvQen35LFb6e51b2UopEnyo2EpVJDwsUZhFeRPkZ3jQbMeutU7LCSjkwqn5K4NsdYqzdXJjsSBaK3GcRRSAtrkPo18j4vRWHHS7coz8oEN7ZqnQ1GMxKrvQuRzAEyJkGFRsfkgqMBsa';

logToPage('orderId=' + (orderId ? orderId.substr(0,12) + '...' : 'MISSING'));
logToPage('clientSecret=' + (clientSecret ? clientSecret.substr(0,30) + '...' : 'MISSING'));
logToPage('env=' + env);

function App() {
  const [evt, setEvt] = useState('starting');
  
  useEffect(() => {
    logToPage('React App mounted');
  }, []);
  
  if (!orderId || !clientSecret) {
    logToPage('Missing params, abort', true);
    return React.createElement('div', {style:{color:'#c00',padding:20,background:'#fee',borderRadius:8}}, 'Faltan parámetros (orderId, clientSecret).');
  }

  logToPage('Rendering CrossmintProvider...');
  
  return React.createElement(CrossmintProvider, { apiKey: CK_KEY },
    React.createElement(CrossmintEmbeddedCheckout, {
      orderId, clientSecret,
      onEvent: (e) => {
        logToPage('CM evt: ' + (e.type || e.event || JSON.stringify(e).substr(0,80)));
        setEvt(e.type || e.event || 'unknown');
        if (e.type === 'payment:process.succeeded' || (e.event && String(e.event).includes('succeeded'))) {
          document.getElementById('root').innerHTML = '<div style="color:#2a7d2a;padding:20px;background:#efe;border-radius:8px;text-align:center"><h2>Pago confirmado</h2><p style="margin-top:10px">Tu acceso a AquíEstás se activará en unos segundos.</p></div>';
        }
      }
    })
  );
}

try {
  logToPage('Creating React root...');
  const root = createRoot(document.getElementById('root'));
  logToPage('Rendering App...');
  root.render(React.createElement(App));
  logToPage('Render call returned');
} catch (e) {
  logToPage('Render failed: ' + (e.message || e), true);
}
