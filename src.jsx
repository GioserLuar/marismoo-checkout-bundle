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
  constructor(props) { super(props); this.state = {}; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) {
    dbg('REACT ERROR: ' + (error && error.message), true);
    if (info && info.componentStack) dbg('CS: ' + String(info.componentStack).substr(0, 300), true);
  }
  render() {
    if (this.state.error) return React.createElement('div', {style:{color:'#c00',padding:20,background:'#fee',borderRadius:8}}, 'Error: ' + this.state.error.message);
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
    // NEW: Get plan info from URL instead of orderId
    const planId = params.get('planId') || params.get('plan_id') || '';
    const totalPrice = params.get('amount') || '12';
    const email = params.get('email') || '';
    const env = params.get('env') || 'staging';

    dbg('planId=' + planId.substr(0,12));
    dbg('amount=' + totalPrice);
    dbg('email=' + (email ? email.substr(0,5)+'...' : 'MISSING'));

    if (!email || !planId) {
      dbg('Missing email or planId', true);
      document.getElementById('root').innerHTML = '<div style="color:#c00;padding:20px;background:#fee;border-radius:8px">Faltan parametros (planId, email)</div>';
      return;
    }

    const CK_KEY = 'ck_staging_zYeLjhTDaUTaFZZu6T1ZMxTzemKAZ3T2srLnPFrA9LCJSa1H1LTWLusupYa59kvQen35LFb6e51b2UopEnyo2EpVJDwsUZhFeRPkZ3jQbMeutU7LCSjkwqn5K4NsdYqzdXJjsSBaK3GcRRSAtrkPo18j4vRWHHS7coz8oEN7ZqnQ1GMxKrvQuRzAEyJkGFRsfkgqMBsamBYddLAk1RdRj7';
    const COLLECTION_ID = '346786ce-6e4f-46cb-8e28-3a8467c1f20e';

    function App() {
      useEffect(() => { dbg('App mounted'); }, []);
      return React.createElement(ErrorBoundary, null,
        React.createElement(sdk.CrossmintProvider, { apiKey: CK_KEY },
          React.createElement(sdk.CrossmintCheckoutProvider, null,
            React.createElement(sdk.CrossmintEmbeddedCheckout, {
              lineItems: {
                collectionLocator: 'crossmint:' + COLLECTION_ID,
                callData: { totalPrice: String(totalPrice) }
              },
              payment: {
                crypto: { enabled: false },
                fiat: { enabled: true, defaultCurrency: 'eur' }
              },
              recipient: { email: email },
              locale: 'es-ES',
              metadata: { planId: planId, email: email },
              onEvent: (e) => {
                dbg('CM evt: ' + (e.type || JSON.stringify(e).substr(0,100)));
                if (e.type === 'payment:process.succeeded') {
                  document.getElementById('root').innerHTML = '<div style="color:#2a7d2a;padding:30px;background:#efe;border-radius:8px;text-align:center"><h2>Pago confirmado</h2><p style="margin-top:15px">Tu acceso a AquíEstás se activará en unos segundos.</p></div>';
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
    dbg('Render done');

  } catch (e) {
    dbg('TOP ERROR: ' + (e && e.message), true);
    if (e && e.stack) dbg('STACK: ' + String(e.stack).substr(0, 500), true);
  }
})();
