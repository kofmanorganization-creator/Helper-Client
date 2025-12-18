import React, { useState } from "react";
import { createOrder } from "../services/order.service";

const CreateOrder: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleCreateOrder = async () => {
    try {
      setLoading(true);

      const result = await createOrder({
        serviceType: "plomberie",
        latitude: 5.336,
        longitude: -4.026,
      });

      console.log("✅ Commande créée :", result);
      alert("Commande envoyée avec succès !");
    } catch (error) {
      console.error("❌ Erreur création commande", error);
      alert("Erreur lors de la création de la commande");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Créer une commande</h2>

      <button onClick={handleCreateOrder} disabled={loading}>
        {loading ? "Envoi..." : "Commander un service"}
      </button>
    </div>
  );
};

export default CreateOrder;

