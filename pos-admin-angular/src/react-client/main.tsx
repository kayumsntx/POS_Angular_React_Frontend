import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import Profile from './pages/Profile';
import MyOrders from './pages/MyOrders';
import Cart from './pages/Cart';
import ProductDetails from './pages/ProductDetails';
import PaymentSuccess from './pages/PaymentSuccess';

export function mountReactApp(container: HTMLElement) {
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  return () => root.unmount();
}

export function mountReactProfile(container: HTMLElement) {
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <Profile />
    </React.StrictMode>
  );

  return () => root.unmount();
}

export function mountReactMyOrders(container: HTMLElement) {
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <MyOrders />
    </React.StrictMode>
  );

  return () => root.unmount();
}

export function mountReactCart(container: HTMLElement) {
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <Cart />
    </React.StrictMode>
  );

  return () => root.unmount();
}

export function mountReactProductDetails(container: HTMLElement) {
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <ProductDetails />
    </React.StrictMode>
  );

  return () => root.unmount();
}

export function mountReactPaymentSuccess(container: HTMLElement) {
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <PaymentSuccess />
    </React.StrictMode>
  );

  return () => root.unmount();
}
