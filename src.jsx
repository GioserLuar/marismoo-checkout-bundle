import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';

function dbg(msg, err) {
  var el = document.getElementById('debug-log');
  if (el) {
    var line = document.createElement('div');
    line.style.color = err ? '#c00' : '#070';
    line.style.fontSize = '11px';
    line.style.fontFamily = 'monospace';
    line.style.wordBreak = 'break-all';
    line.style.padding = '2px 0';
    line.textContent = '[' + new Date().toISOString().substr(11, 12) + '] ' + msg;
    el.appendChild(line);
    el.scrollTop = el.scrollHeight;
  }
  console.log(msg);
}

dbg('IIFE started');

(async function main() {
  try {
    dbg('Importing CrossmintProvider...');
    const sdk = await import('@crossmint/client-sdk-react-ui');
    dbg('SDK imported. Available exports: ' + Object.keys(sdk).slice(0, 15).join(', '));
    
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('orderId');
    const clientSecret = params.get('clientSecret');
    const env = params.get('env') || 'staging';
    
    if (!orderId || !clientSecret) {
      dbg('Missing params', true);
      document.getElementById('root').innerHTML = '<div style="color:#c00;padding:20px;background:#fee;border-radius:8px">Faltan parametros</div>';
      return;
    }
    
    dbg('orderId=' + orderId.substr(0,12) + '...');
    dbg('clientSecret length=' + clientSecret.length);
    dbg('env=' + env);
    
    const CK_KEY = 'ck_staging_zYeLjhTDaUTaFZZu6T1ZMxTzemKAZ3T2srLnPFrA9LCJSa1H1LTWLusupYa59kvQen35LFb6e51b2UopEnyo2EpVJDwsUZhFeRPkZ3jQbMeutU7LCSjkwqn5K4NsdYqzdXJjsSBaK3GcRRSAtrkPo18j4vRWHHS7coz8oEN7ZqnQ1GMxKrvQuRzAEyJkGFRsfkgqMBsa';
    
    const Provider = sdk.CrossmintProvider;
    const Checkout = sdk.CrossmintEmbeddedCheckout;
    
    if (!Provider || !Checkout) {
      dbg('Missing CrossmintProvider or CrossmintEmbeddedCheckout in SDK', true);
      return;
    }
    
    dbg('Components found, mounting React...');
    
    function App() {
      useEffect(() => { dbg('App component mounted'); }, []);
      return React.createElement(Provider, { apiKey: CK_KEY },
        React.createElement(Checkout, {
          orderId, clientSecret,
          onEvent: (e) => {
            dbg('CM event: ' + (e.type || JSON.stringify(e).substr(0,80)));
            if (e.type === 'payment:process.succeeded') {
              document.getElementById('root').innerHTML = '<div style="color:#2a7d2a;padding:20px;background:#efe;border-radius:8px;text-align:center"><h2>Pago confirmado</h2><p style="margin-top:10px">Tu acceso a AquíEstás se activará en unos segundos.</p></div>';
            }
          }
        })
      );
    }
    
    const root = createRoot(document.getElementById('root'));
    dbg('Calling root.render...');
    root.render(React.createElement(App));
    dbg('Render call completed (UI may take a moment to appear)');
    
  } catch (e) {
    dbg('ERROR: ' + (e && e.message || String(e)), true);
    if (e && e.stack) dbg('STACK: ' + String(e.stack).substr(0, 400), true);
    document.getElementById('root').innerHTML = '<div style="color:#c00;padding:20px;background:#fee;border-radius:8px">Error: ' + (e && e.message || 'unknown') + '</div>';
  }
})();
