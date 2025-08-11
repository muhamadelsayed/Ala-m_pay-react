import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'bootstrap/dist/css/bootstrap.min.css';

// --- >> بداية إعداد محاكاة الـ API << ---
import MockAdapter from 'axios-mock-adapter';
import walletInstance from './utilities/axios/walletInstance.ts'; // استدعاء الـ instance
import pricingInstance from './utilities/axios/pricingInstance.ts';

// إنشاء محاكي للـ wallet instance
const mockWallet = new MockAdapter(walletInstance, { delayResponse: 500 }); // تأخير 500ms لمحاكاة الشبكة

// اعتراض طلب GET الخاص برصيد المحفظة
mockWallet.onGet("/wallet/balance").reply(200, {
  data: {
    balance: "50.00" // يمكنك تغيير هذا الرصيد لترى سلوكًا مختلفًا
  }
});

// اعتراض طلب POST الخاص بالدفع
mockWallet.onPost("/wallet/payment-link").reply(200, {
    data: {
        payment_reference: "https://example.com/mock-payment-url", // رابط وهمي
        open_modal: true,
    }
});

// إنشاء محاكي للـ pricing instance
const mockPricing = new MockAdapter(pricingInstance, { delayResponse: 500 });

// اعتراض طلب POST الخاص بشراء الباقة من المحفظة
mockPricing.onPost("/subscription").reply(200, {
    data: {
        url: "/pricing-bundles?success=true"
    }
});
// --- >> نهاية إعداد محاكاة الـ API << ---


import BundleCheckout from './pages/BundleCheckout/BundleCheckout.tsx';
import './i18n'; // <-- استدعاء ملف إعداد الترجمة

// ... (بقية الكود كما هو)
const store = configureStore({
  reducer: {
    notifications: () => ({}),
    modalStates: () => ({}),
    modalManager: () => ({}),
  },
});

const queryClient = new QueryClient();

function HomePage() {
  const navigate = useNavigate();
  const mockBundleData = {
    id: 101, name: "Premium Bundle",
    features: [{ key: { name: "price" }, value: "150" }, { key: { name: "valid_for" }, value: "3" }],
  };
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Home Page</h1>
      <button onClick={() => navigate('/bundle-checkout', { state: mockBundleData })}>
        Go to Checkout (Balance is $50, Price is $150)
      </button>
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div style={{ padding: "20px" }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/bundle-checkout" element={<BundleCheckout />} />
            </Routes>
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;