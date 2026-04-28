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

// Map AquiEstas plan recId -> Crossmint collection id
const PLAN_TO_COLLECTION = {
  'recCwcdrgVAFfm0b1': '738933a6-293d-4a5a-88df-47e5be6232f8',  // Despertar
  'recuEy0AEm07KR91v': 'd6474522-ccba-43a9-8749-9fb24505074d',  // Brisa
  'recMSvF8y63q18HBV': '7735c54d-7130-4e19-a8b5-6e35c557be72',  // Aurora
  'recc5eG2O95H2C5d5': '3bf0a070-250b-461c-b1ec-d58519ab526f'   // Horizonte
};

dbg('IIFE started');

(async function main() {
  try {
    dbg('Importing SDK...');
    const sdk = await import('@crossmint/client-sdk-react-ui');
    dbg('SDK ok');

    const params = new URLSearchParams(window.location.search);
    const planId = params.get('planId') || params.get('plan_id') || '';
    const email = params.get('email') || '';
    const env = params.get('env') || 'staging';

    const collectionId = PLAN_TO_COLLECTION[planId];

    dbg('planId=' + planId.substr(0,12));
    dbg('email=' + (email ? email.substr(0,5)+'...' : 'MISSING'));
    dbg('collection=' + (collectionId ? collectionId.substr(0,12) : 'NOT FOUND'));

    if (!email || !planId || !collectionId) {
      dbg('Missing email/planId/collection', true);
      document.getElementById('root').innerHTML = '<div style="color:#c00;padding:20px;background:#fee;border-radius:8px">Faltan parametros o plan invalido</div>';
      return;
    }

    const CK_KEY = 'ck_staging_zYeLjhTDaUTaFZZu6T1ZMxTzemKAZ3T2srLnPFrA9LCJSa1H1LTWLusupYa59kvQen35LFb6e51b2UopEnyo2EpVJDwsUZhFeRPkZ3jQbMeutU7LCSjkwqn5K4NsdYqzdXJjsSBaK3GcRRSAtrkPo18j4vRWHHS7coz8oEN7ZqnQ1GMxKrvQuRzAEyJkGFRsfkgqMBsamBYddLAk1RdRj7';

    function App() {
      useEffect(() => { dbg('App mounted'); }, []);
      return React.createElement(ErrorBoundary, null,
        React.createElement(sdk.CrossmintProvider, { apiKey: CK_KEY },
          React.createElement(sdk.CrossmintCheckoutProvider, null,
            React.createElement(sdk.CrossmintEmbeddedCheckout, {
              lineItems: { collectionLocator: 'crossmint:' + collectionId },
              payment: {
                crypto: { enabled: false },
                fiat: { enabled: true, defaultCurrency: 'eur' }
              },
              recipient: { walletAddress: '0xAb7e9B36D31c4514c2d26805b1525F8A1C6585EB' },
              locale: 'es-ES',
              metadata: { planId: planId, email: email, source: 'marismoobot' },
              onEvent: (e) => {
                dbg('CM evt: ' + (e.type || JSON.stringify(e).substr(0,100)));
                if (e.type === 'payment:process.succeeded') {
                  document.getElementById('root').innerHTML = '<div style="color:#2a7d2a;padding:30px;background:#efe;border-radius:8px;text-align:center"><h2>¡Donacion confirmada! 💚</h2><p style="margin-top:15px">Tu acceso a AquiEstas se activara en unos segundos en Telegram.</p></div>';
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
