import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { FiCreditCard, FiLoader } from 'react-icons/fi';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51SJPna4JoFWBOVcMwldUabjC4FiXLSapqJJc0ZY8Hu1iUpJyMeJCNwGCMZR58b4UZedj7UMdqyziBraGujUlqdYk00iUOgzkUD');

const CheckoutForm = ({ amount, orderId, onSuccess, onError, requirePostalCode = true }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:2002'}/api/stripe/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        orderId: orderId
      }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        onError(data.error || 'Error al crear el pago');
      }
    })
    .catch(err => {
      onError('Error de conexión con el servidor');
    });
  }, [amount, orderId, onError]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setProcessing(true);
    const card = elements.getElement(CardElement);

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: card,
      }
    });

    setProcessing(false);

    if (error) {
      onError(error.message);
    } else if (paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent);
    }
  };

  return (
    <div className="stripe-payment-container">
      <form onSubmit={handleSubmit} className="stripe-form">
        <div className="stripe-card-section">
          <label className="stripe-label">
            <FiCreditCard /> Información de la tarjeta
          </label>
          <div className="stripe-card-element">
            <CardElement
              options={{
                hidePostalCode: !requirePostalCode,
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
            />
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={!stripe || processing || !clientSecret}
          className={processing ? 'stripe-pay-button processing' : 'stripe-pay-button'}
        >
          {processing ? (
            <>
              <FiLoader className="stripe-spinner" />
              Procesando...
            </>
          ) : (
            <>
              <FiCreditCard />
              Pagar ${amount.toFixed(2)} MXN
            </>
          )}
        </button>
      </form>

      <div className="stripe-test-info">
        <p><strong>Para pruebas usar:</strong></p>
        <p><code>4242 4242 4242 4242</code></p>
        <p>Fecha: <code>12/34</code> | CVC: <code>123</code></p>
      </div>
    </div>
  );
};

const StripePayment = ({ amount, orderId, onSuccess, onError, requirePostalCode = true }) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm 
        amount={amount} 
        orderId={orderId} 
        onSuccess={onSuccess} 
        onError={onError}
        requirePostalCode={requirePostalCode} 
      />
    </Elements>
  );
};

export default StripePayment;