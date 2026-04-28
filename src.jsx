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

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null, info: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) {
    dbg('REACT ERROR: ' + (error && error.message || String(error)), true);
    if (error && error.stack) dbg('STACK: ' + String(error.stack).substr(0, 500), true);
    if (info && info.componentStack) dbg('COMP STACK: ' + String(info.componentStack).substr(0, 400), true);
    this.setState({ info });
  }
  render() {
    if (this.state.error) {
      return React.createElement('div', { style:{color:'#c00',padding:20,background:'#fee',borderRadius:8}},
        'Error en componente: ' + (this.state.error.message || String(this.state.error)));
    }
    return this.props.children;
  }
}

dbg('IIFE started');

(async function main() {
  try {
    dbg('Importing SDK...');
    const sdk = await import('@crossmint/client-sdk-react-ui');
    dbg('SDK ok, exports: ' + Object.keys(sdk).length);

    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('orderId');
    const clientSecret = params.get('clientSecret');
    const env = params.get('env') || 'staging';

    if (!orderId || !clientSecret) {
      dbg('Missing params', true);
      return;
    }

    dbg('orderId=' + orderId.substr(0,12));
    dbg('clientSecret len=' + clientSecret.length);
    dbg('Decoding clientSecret JWT for diagnostics...');
    try {
      const parts = clientSecret.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        dbg('JWT payload: orderIdentifier=' + (payload.orderIdentifier || '?').substr(0,12) + ', exp=' + new Date(payload.exp*1000).toISOString());
        if (payload.exp * 1000 < Date.now()) dbg('WARNING: clientSecret JWT EXPIRED', true);
      }
    } catch (e) { dbg('JWT decode failed: ' + e.message, true); }

    const CK_KEY = 'ck_staging_zYeLjhTDaUTaFZZu6T1ZMxTzemKAZ3T2srLnPFrA9LCJSa1H1LTWLusupYa59kvQen35LFb6e51b2UopEnyo2EpVJDwsUZhFeRPkZ3jQbMeutU7LCSjkwqn5K4NsdYqzdXJjsSBaK3GcRRSAtrkPo18j4vRWHHS7coz8oEN7ZqnQ1GMxKrvQuRzAEyJkGFRsfkgqMBsamBYddLAk1RdRj7';

    function App() {
      useEffect(() => { dbg('App mounted'); }, []);
      return React.createElement(ErrorBoundary, null,
        React.createElement(sdk.CrossmintProvider, { apiKey: CK_KEY },
          React.createElement(ErrorBoundary, null,
            React.createElement(sdk.CrossmintEmbeddedCheckout, {
              orderId, clientSecret,
              onEvent: (e) => {
                dbg('CM event: ' + (e.type || JSON.stringify(e).substr(0,100)));
                if (e.type === 'payment:process.succeeded') {
                  document.getElementById('root').innerHTML = '<div style="color:#2a7d2a;padding:20px;background:#efe;border-radius:8px;text-align:center"><h2>Pago confirmado</h2></div>';
                }
              }
            })
          )
        )
      );
    }

    const root = createRoot(document.getElementById('root'));
    dbg('root.render...');
    root.render(React.createElement(App));
    dbg('Render returned');

    // Also intercept fetch to log API calls
    var origFetch = window.fetch;
    window.fetch = function(...args) {
      var url = String(args[0]);
      if (url.indexOf('crossmint') >= 0) dbg('FETCH: ' + url.substr(0,120));
      return origFetch.apply(this, args).catch(function(e) {
        if (url.indexOf('crossmint') >= 0) dbg('FETCH FAILED: ' + url.substr(0,80) + ' - ' + e.message, true);
        throw e;
      });
    };
    dbg('Fetch interceptor installed');

  } catch (e) {
    dbg('TOP ERROR: ' + (e && e.message || String(e)), true);
    if (e && e.stack) dbg('STACK: ' + String(e.stack).substr(0, 500), true);
  }
})();
