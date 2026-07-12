    const BACKEND_URL = "https://smartbuilderec.onrender.com";
    const formMsg = document.getElementById("formMsg");

    function setMsg(text, type) {
      formMsg.textContent = text;
      formMsg.className = "lp-form-msg " + (type || "");
    }

    document.getElementById("btnPagar").addEventListener("click", async () => {
      const btn = document.getElementById("btnPagar");

      btn.disabled = true;
      btn.textContent = "Redirigiendo al pago...";
      setMsg("", "");
      if (typeof fbq !== 'undefined') fbq('track','InitiateCheckout',{currency:'MXN',value:1799});

      const base = window.location.origin;
      const success_url = `${base}/checkout-success?session_id={CHECKOUT_SESSION_ID}`;
      const cancel_url  = `${base}/pago`;

      try {
        const res = await fetch(`${BACKEND_URL}/checkout/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ success_url, cancel_url }),
        });
        const data = await res.json();
        if (!res.ok) {
          const detalle = Array.isArray(data.detail)
            ? "Error en el servidor. Intenta de nuevo."
            : (data.detail || "Error al crear la sesión de pago.");
          throw new Error(detalle);
        }
        window.location.href = data.checkout_url;
      } catch (e) {
        setMsg(e.message || "Error al conectar con el servidor. Intenta de nuevo.", "error");
        btn.disabled = false;
        btn.textContent = "Pagar con tarjeta →";
      }
    });

    // Smooth scroll para el CTA del hero
    document.querySelector('a[href="#comprar"]')?.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("comprar")?.scrollIntoView({ behavior: "smooth" });
    });
