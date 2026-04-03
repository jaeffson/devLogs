// src/utils/recordAdapters.js
export const getQuantityMultiplier = (quantityString) => {
  if (!quantityString) return 1;
  const match = String(quantityString).match(/^(\d+)/);
  return match ? parseFloat(match[0]) : 1;
};
export const adaptRecordMedications = (medications, defaultQuantity) => {
  if (!medications || !Array.isArray(medications)) return [];

  return medications.map((m, i) => {
    // Normalização da Quantidade
    let rawQty = m.quantity;
    if (typeof rawQty === 'number') rawQty = String(rawQty);
    if (rawQty && !isNaN(rawQty) && m.unit) rawQty = `${rawQty} ${m.unit}`;
    
    const qty = rawQty && rawQty.trim() !== '' ? rawQty : defaultQuantity;

    // Extração do ID e Nome
    let realId = '';
    let realName = '';

    if (m.medicationId && typeof m.medicationId === 'object') {
       realId = m.medicationId._id || m.medicationId.id;
       realName = m.medicationId.name;
    } else {
       realId = m.medicationId;
    }

    if (!realName && m.name) realName = m.name;

    // Cálculos
    const multiplier = getQuantityMultiplier(qty);
    const totalVal = parseFloat(m.value) || 0;
    const calculatedUnit =
      multiplier > 0 && totalVal > 0
        ? (totalVal / multiplier).toFixed(2)
        : '';

    return {
      medicationId: realId || '',
      savedName: realName || '', 
      quantity: qty,
      unitValue: calculatedUnit,
      value: m.value || '',
      tempId: m.recordMedId || m.id || `edit-${i}`,
    };
  });
};