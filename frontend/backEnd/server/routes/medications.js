// server/routes/medications.js
const express = require('express');
const Medication = require('../../models/Medication');
const router = express.Router();

// ROTA 1: GET /api/medications - Listar todas as medicações
router.get('/', async (req, res) => {
    try {
        // Ordena por nome ascendente (A-Z) para refletir a lógica do Frontend
        const medications = await Medication.find().sort({ name: 1 });
        res.json(medications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ROTA 2: POST /api/medications - Adicionar nova medicação (Cadastro rápido)
router.post('/', async (req, res) => {
    // Lógica para verificar se já existe a medicação antes de salvar
    const existingMed = await Medication.findOne({ name: req.body.name });
    if (existingMed) {
        return res.status(409).json({ message: 'Medicação já cadastrada.' });
    }
    
    const medication = new Medication({
        name: req.body.name,
    });

    try {
        const newMedication = await medication.save();
        res.status(201).json(newMedication);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;