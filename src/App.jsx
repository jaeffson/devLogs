// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast'; // <-- 1. Importe o 'toast'

// --- Imports das Páginas e Layouts ---
import LoginPage from './pages/LoginPage';
import MainLayout from './layouts/MainLayout';
import ProfessionalDashboardPage from './pages/ProfessionalDashboardPage';
import SecretaryDashboardPage from './pages/SecretaryDashboardPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import MedicationsPage from './pages/MedicationsPage';
import AdminReportsPage from './pages/AdminReportsPage';
import SecretarySettingsPage from './pages/SecretarySettingsPage';

// --- Imports de Componentes Comuns e Utils ---
// import { ToastContainer } from './components/common/ToastContainer'; // <-- 2. REMOVA ISSO
import { FullScreenPreloader } from './components/common/FullScreenPreloader';
import { getMedicationName } from './utils/helpers';

// --- Dados Mock (IDÊNTICOS, COMO PEDIDO) ---
let MOCK_USERS = [
  {
    id: 1,
    name: 'Dr. João Silva',
    email: 'profissional@email.com',
    password: '123',
    role: 'profissional',
    status: 'active',
  },
  {
    id: 2,
    name: 'Ana Costa (Secretária)',
    email: 'secretario@email.com',
    password: '123',
    role: 'secretario',
    status: 'active',
  },
  {
    id: 3,
    name: 'Maria Souza (Admin)',
    email: 'admin@email.com',
    password: '123',
    role: 'admin',
    status: 'active',
  },
];
let MOCK_PATIENTS = [
  {
    id: 1,
    name: 'PEDRO GONÇALVES DE FARIAS',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 2,
    name: 'SUELI ALVES',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 3,
    name: 'LENICE RIBEIRO',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 4,
    name: 'DOUGLAS LEONARDO ALVES',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 5,
    name: 'JOSEFA AURICELIA QUEIROZ',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 6,
    name: 'EDILENE ALCÂNTARA RIBEIRO',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 7,
    name: 'JOSIELIA ALMEIDA',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 8,
    name: 'MIGUEL PEDRO ALMEIDA',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 9,
    name: 'HELCIO DE SÁ',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 10,
    name: 'JOSELMO OLIVEIRA DE QUEIROZ',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 11,
    name: 'MARIA BETANIA DE QUEIROZ RIBEIRO',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 12,
    name: 'JOÃO BOSCO GOMES BATISTA',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 13,
    name: 'SEVERINA FERREIRA DA SILVA',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 14,
    name: 'LUCIENE OLIVEIRA DE AQUINO',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 16,
    name: 'MARIA MARTINHA DE SOUZA',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 17,
    name: 'ANA LAURA RIBEIRO',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 18,
    name: 'JOAO BATISTA SOUZA FILHO',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 19,
    name: 'LUCIA DE FÁTIMA SANTOS',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 20,
    name: 'MARCOS ANTONIO FERREIRA',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 21,
    name: 'MARGARENE FARIAS',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 22,
    name: 'ANTONIO RICARDO DE SOUZA',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 23,
    name: 'JOSE VANDERLEY BRITO SANTOS',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 24,
    name: 'VALDILENE MOURA SANTOS',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 25,
    name: 'LUCILENE DOS SANTOS',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 26,
    name: 'MARIA DOS MILAGRES',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 27,
    name: 'INACIA ANA CAVALCANTE',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 28,
    name: 'INACIA SEVERINA DA SILVA',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 29,
    name: 'MARGARIDA MARIA ALVES',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 30,
    name: 'MARINALVA BRITO',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 31,
    name: 'TARCIANA DE QUEIROZ SILVA',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 32,
    name: 'ANTONIO BRAZ DA SILVA',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 33,
    name: 'IVONE QUEIROZ SILVA',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 34,
    name: 'FRANCISCO DAS CHAGAS SIMÃO',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 35,
    name: 'MARIA RODRIGUES MOURA',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 36,
    name: 'MARIA HELENA SABINO',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 37,
    name: 'CARLA OLIVEIRA DE QUEIROZ',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 38,
    name: 'ALGUSTINHO ALVES DE BRITO',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 39,
    name: 'MARIA DO SOCORRO FERREIRA FARIAS',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 40,
    name: 'ANA CELIA LINO',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 41,
    name: 'ARLENE BRAZ DA CONCEIÇÃO',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 42,
    name: 'TEREZINHA ALVES',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 43,
    name: 'MARIA DO SOCORRO BERNADINO',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 44,
    name: 'FRANCILENE DOS SANTOS',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 45,
    name: 'TEREZINHA FERREIRA DO NASCMENTO',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 46,
    name: 'MARIA DOLORES DA SILVA',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 47,
    name: 'EDVALDO ALVES DE QUEIROZ',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 48,
    name: 'JOÃO BATISTA CALUÊTE',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 49,
    name: 'JOSÉ ARIMATEIA ALVES',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 50,
    name: 'RAFAELA DUARTE MOREIRA',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 51,
    name: 'FABIO QUEIROZ',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 52,
    name: 'JAQUELINE DA SILVA QUEIROZ',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 53,
    name: 'ANA MARIA JOSE RODRIGUES',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 54,
    name: 'JOSE DE FARIAS',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 56,
    name: 'MARIA GERLANIA PEQUENO',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 57,
    name: 'PEDRO HENRIQUE PEQUENO',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 58,
    name: 'MARIA JOSE FERREIRA DE SOUZA',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 59,
    name: 'MARIA JOSE DOS SANTOS',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-24',
    status: 'Ativo',
  },
  {
    id: 60,
    name: 'MELYNA MOURA BARRETO',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-25',
    status: 'Ativo',
  },
  {
    id: 62,
    name: 'DAMIAO PEDRO DE SOUZA',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-25',
    status: 'Ativo',
  },
  {
    id: 63,
    name: 'MARLI APOLONIO DE LIMA',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-25',
    status: 'Ativo',
  },
  {
    id: 64,
    name: 'JESSICA SEVERINA A.QUEIROZ',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-25',
    status: 'Ativo',
  },
  {
    id: 65,
    name: 'LEANE DA SILVA TARGINO',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-25',
    status: 'Ativo',
  },
  {
    id: 66,
    name: 'JOSE LEANDRO TARGINO',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-25',
    status: 'Ativo',
  },
  {
    id: 67,
    name: 'JOELSO SABINO',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-25',
    status: 'Ativo',
  },
  {
    id: 68,
    name: 'JOSE EUDO FERREIRA LINO',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-26',
    status: 'Ativo',
  },
  {
    id: 69,
    name: 'MARIA DO SOCORRO BERNARDINO',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-26',
    status: 'Ativo',
  },
  {
    id: 70,
    name: 'MARIA DO SOCORRO FERREIRA NASCIMENTO',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-02-26',
    status: 'Ativo',
  },
  {
    id: 71,
    name: 'JOSE ARTHUR FRANÇA',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-03-06',
    status: 'Ativo',
  },
  {
    id: 72,
    name: 'ADRIANA ARAUJO DOS SANTOS',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-03-06',
    status: 'Ativo',
  },
  {
    id: 73,
    name: 'JOSEFA MARIA DA CONCEIÇÃO',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-03-06',
    status: 'Ativo',
  },
  {
    id: 74,
    name: 'JOSE DELMIRO VICENTE',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-03-06',
    status: 'Ativo',
  },
  {
    id: 75,
    name: 'JOANA DARC ARAUJO DE QUEIROZ',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-03-06',
    status: 'Ativo',
  },
  {
    id: 76,
    name: 'JOSE JOAQUIM BATISTA GOUVEIA',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-03-06',
    status: 'Ativo',
  },
  {
    id: 77,
    name: 'JOSEFA RIBEIRO FEITOSA',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-03-06',
    status: 'Ativo',
  },
  {
    id: 78,
    name: 'JOSE CAVALCANTE DE FARIAS',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-03-06',
    status: 'Ativo',
  },
  {
    id: 79,
    name: 'JOSEFA JAILSA DE QUEIROZ FERNANDES',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-03-06',
    status: 'Ativo',
  },
  {
    id: 80,
    name: 'MARIA DA PAZ FERREIRA DE FARIAS',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-03-06',
    status: 'Ativo',
  },
  {
    id: 81,
    name: 'JOSE GERONIMO FERNANDES',
    cpf: '',
    susCard: '',
    observations: '',
    generalNotes: '',
    createdAt: '2025-03-06',
    status: 'Ativo',
  },
];
let MOCK_MEDICATIONS = [
  { id: 20250311115147, name: 'BRITENS  COLIRIO', createdAt: '' },
  { id: 20250311115713, name: 'RETIMIC 5MG', createdAt: '' },
  { id: 20250311115641, name: 'BACLOFENO 10 MG', createdAt: '' },
  { id: 20250311115517, name: 'PREGABALINA 75 MG', createdAt: '' },
  { id: 20250311132207, name: 'COMBODART 0,6, 0,4', createdAt: '' },
  { id: 20250311132124, name: 'COMBODART', createdAt: '' },
  { id: 20250311132741, name: 'GROW FERRO 100MG /ML', createdAt: '' },
  { id: 20250311134006, name: 'VALSARTANA 320 MG', createdAt: '' },
  { id: 20250311133240, name: 'SUCCINATO DE METOPROLOL 50MG', createdAt: '' },
  { id: 20250311134407, name: 'DEPAKENE 50MG/ML', createdAt: '' },
  { id: 20250311134324, name: 'CANABIDIOL 20MG/ML', createdAt: '' },
  { id: 20250311134850, name: 'CLORIDRATO DE SERTRALINA 25 MG', createdAt: '' },
  { id: 20250311134739, name: 'PROLOPA BD 100/25 MG', createdAt: '' },
  { id: 20250311134649, name: 'MANTIDAN 100MG', createdAt: '' },
  { id: 20250311135320, name: 'MELOXICAM 15 MG', createdAt: '' },
  {
    id: 20250311135224,
    name: 'CLORIDRATO DE NARATRIPTANA 2,5MG',
    createdAt: '',
  },
  { id: 20250311135520, name: 'MALEATO DE ENALAPRIL 10 MG', createdAt: '' },
  { id: 20250311143837, name: 'PANTOPRAZOL SODICO 40MG', createdAt: '' },
  { id: 20250311144923, name: 'TAMISA 75MCG+20MCG', createdAt: '' },
  { id: 20250311145133, name: 'DUTAM 0,5MG+0,4MG', createdAt: '' },
  { id: 20250311145527, name: 'MECLIM  50MG', createdAt: '' },
  { id: 20250311145832, name: 'ARTRODAR 50 MG', createdAt: '' },
  { id: 20250311150025, name: 'CETOPROFENO 20MG/ML', createdAt: '' },
  { id: 20250311150354, name: 'LEVOTIROXINA 150 MCG', createdAt: '' },
  {
    id: 20250311150620,
    name: 'CLORIDRATO DE CICLOBENZAPINA 10MG',
    createdAt: '',
  },
  { id: 20250311150801, name: 'DOMPERIDONA 10 MG', createdAt: '' },
  {
    id: 20250311150959,
    name: 'HEMIFUMARATO DE BISOPROLOL 5 MG',
    createdAt: '',
  },
  { id: 20250311150924, name: 'ARADOIS 50 MG', createdAt: '' },
  { id: 20250311151626, name: 'BASILATO DE ANLODIPINO 10MG', createdAt: '' },
  { id: 20250311152512, name: 'CLORIDRATO DE MEMANTINA 10 MG', createdAt: '' },
  { id: 20250311153035, name: 'MELATONINA GTS', createdAt: '' },
  { id: 20250311152956, name: 'BIFILAC', createdAt: '' },
  { id: 20250311154043, name: 'METROPOLOL 25 MG', createdAt: '' },
  { id: 20250313095124, name: 'PROTOPIC 0,1% POMADA', createdAt: '' },
  { id: 20250313103400, name: 'MATERNA SUPLEMENTO ALIMENTAR', createdAt: '' },
  { id: 20250317111631, name: 'TORAGESIC 10MG', createdAt: '' },
  { id: 20250317112434, name: 'VALERATO DE BETAMETASONA 1MG', createdAt: '' },
];
let MOCK_RECORDS = [
  {
    id: 1,
    patientId: 1,
    professionalId: 1,
    medications: [
      {
        recordMedId: `rec-med-1-1`,
        medicationId: 1,
        quantity: '1 cx',
        value: 15.0,
      },
      {
        recordMedId: `rec-med-1-2`,
        medicationId: 2,
        quantity: '1 cx',
        value: 8.5,
      },
    ],
    referenceDate: '2025-10-18',
    observation: 'Pressão controlada',
    totalValue: 23.5,
    status: 'Pendente',
    entryDate: '2025-08-18T10:00:00Z',
    deliveryDate: '',
  },
  {
    id: 2,
    patientId: 1,
    professionalId: 1,
    medications: [
      {
        recordMedId: `rec-med-2-1`,
        medicationId: 1,
        quantity: '1 cx',
        value: 15.0,
      },
    ],
    referenceDate: '2025-09-15',
    observation: 'Início do tratamento',
    totalValue: 80.0,
    status: 'Atendido',
    entryDate: '2025-09-15T11:00:00Z',
    deliveryDate: '2025-09-16T09:00:00Z',
  },
  {
    id: 3,
    patientId: 2,
    professionalId: 1,
    medications: [
      {
        recordMedId: `rec-med-3-1`,
        medicationId: 3,
        quantity: '3 cxs',
        value: 22.0,
      },
    ],
    referenceDate: '2025-10-10',
    observation: 'Glicemia estável',
    totalValue: 130.0,
    status: 'Atendido',
    entryDate: '2025-10-10T08:00:00Z',
    deliveryDate: '2025-10-10T08:30:00Z',
  },
  {
    id: 4,
    patientId: 3,
    professionalId: 1,
    medications: [
      {
        recordMedId: `rec-med-4-1`,
        medicationId: 4,
        quantity: '1 tubo',
        value: 25.0,
      },
    ],
    referenceDate: '2025-10-18',
    observation: 'Uso em caso de crise',
    totalValue: 25.0,
    status: 'Pendente',
    entryDate: '2025-10-18T15:00:00Z',
    deliveryDate: null,
  },
  {
    id: 5,
    patientId: 2,
    professionalId: 1,
    medications: [
      {
        recordMedId: `rec-med-5-1`,
        medicationId: 5,
        quantity: '1 cx',
        value: 12.0,
      },
    ],
    referenceDate: '2025-10-17',
    observation: 'Ajuste de dose',
    totalValue: 12.0,
    status: 'Atendido',
    entryDate: '2025-10-17T09:30:00Z',
    deliveryDate: '2025-10-17T11:00:00Z',
  },
  {
    id: 6,
    patientId: 1,
    professionalId: 1,
    medications: [
      {
        recordMedId: `rec-med-6-1`,
        medicationId: 5,
        quantity: '1 cx',
        value: 18.0,
      },
    ],
    referenceDate: '2025-08-20',
    observation: 'Tratamento interrompido',
    totalValue: 18.0,
    status: 'Cancelado',
    entryDate: '2025-08-20T09:00:00Z',
    deliveryDate: null,
  },
];
// --- Fim dos Dados Mock ---

export default function App() {
  // --- PASSO 1: LER DO LOCALSTORAGE AO INICIAR ---
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser);
    } catch (error) {
      console.error('Falha ao analisar usuário do localStorage:', error);
      localStorage.removeItem('user');
      return null;
    }
  });

  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // --- 3. REMOVA OS ESTADOS DE TOAST CUSTOMIZADOS ---
  // const [toasts, setToasts] = useState([]);

  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [patients, setPatients] = useState(MOCK_PATIENTS);
  const [records, setRecords] = useState(MOCK_RECORDS);
  const [medications, setMedications] = useState(MOCK_MEDICATIONS);
  const [users, setUsers] = useState(MOCK_USERS);
  const [annualBudget, setAnnualBudget] = useState(5000.0);
  const [activityLog, setActivityLog] = useState([]);

  const navigate = useNavigate();

  // --- 4. ATUALIZE A FUNÇÃO addToast ---
  const addToast = (message, type = 'success') => {
    if (type === 'success') {
      toast.success(message);
    } else if (type === 'error') {
      toast.error(message);
    } else {
      // Para 'info', 'warning', ou padrão
      toast(message);
    }
  };

  // --- 5. REMOVA a função removeToast ---
  // const removeToast = (id) => { ... };

  const addLog = (userName, action) => {
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      user: userName || 'Sistema',
      action,
    };
    setActivityLog((prev) => [newLog, ...prev].slice(0, 100));
  };

  const handleUpdateBudget = (newBudget) => {
    const numericBudget = parseFloat(newBudget);
    if (!isNaN(numericBudget) && numericBudget >= 0) {
      setAnnualBudget(numericBudget);
      addToast('Orçamento atualizado com sucesso!', 'success'); // Já vai funcionar!
      addLog(
        user?.name,
        `atualizou o orçamento para R$ ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericBudget)}.`
      );
    } else {
      addToast('Valor de orçamento inválido recebido.', 'error'); // Já vai funcionar!
    }
  };

  const handleAcceptCookies = () => {
    localStorage.setItem('cookieConsent', 'true');
    setShowCookieBanner(false);
  };

  useEffect(() => {
    const initTimer = setTimeout(() => setIsInitializing(false), 1000);
    const consent = localStorage.getItem('cookieConsent');
    if (consent !== 'true') {
      const bannerTimer = setTimeout(() => setShowCookieBanner(true), 1500);
      return () => clearTimeout(bannerTimer);
    }
    return () => clearTimeout(initTimer);
  }, []);

  // --- Lógica de Login/Logout (Já estava correta) ---
  const handleLogin = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    addLog(userData.name, 'fez login.');
    navigate('/dashboard', { replace: true });
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    addLog(user?.name, 'fez logout.');
    setTimeout(() => {
      localStorage.removeItem('user');
      setUser(null);
      setIsLoggingOut(false);
      navigate('/login', { replace: true });
    }, 500);
  };

  if (isInitializing || isLoggingOut) {
    return <FullScreenPreloader />;
  }

  // O novo addToast já está sendo passado aqui, perfeito.
  const commonPageProps = {
    user,
    patients,
    setPatients,
    records,
    setRecords,
    medications,
    setMedications,
    users,
    setUsers,
    addToast,
    addLog,
    annualBudget,
    handleUpdateBudget,
    activityLog,
    getMedicationName,
  };

  return (
    <>
      {/* --- 6. REMOVA O <ToastContainer /> CUSTOMIZADO --- */}
      {/* <ToastContainer toasts={toasts} removeToast={removeToast} /> */}

      <Routes>
        <Route
          path="/login"
          element={
            !user ? (
              <LoginPage
                onLogin={handleLogin}
                setUsers={setUsers}
                addToast={addToast}
                addLog={addLog}
                MOCK_USERS={users}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        <Route
          path="/"
          element={
            user ? (
              <MainLayout
                user={user}
                handleLogout={handleLogout}
                {...commonPageProps}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route
            path="dashboard"
            element={
              user?.role === 'secretario' ? (
                <SecretaryDashboardPage {...commonPageProps} />
              ) : (
                <ProfessionalDashboardPage {...commonPageProps} />
              )
            }
          />

          {(user?.role === 'profissional' || user?.role === 'admin') && (
            <>
              <Route
                path="patients"
                element={
                  <ProfessionalDashboardPage
                    {...commonPageProps}
                    activeTabForced="patients"
                  />
                }
              />
              <Route
                path="history"
                element={
                  <ProfessionalDashboardPage
                    {...commonPageProps}
                    activeTabForced="historico"
                  />
                }
              />
              <Route
                path="deliveries"
                element={
                  <ProfessionalDashboardPage
                    {...commonPageProps}
                    activeTabForced="deliveries"
                  />
                }
              />
              
              {/* --- ALTERAÇÃO AQUI --- */}
              {/* Movi a rota 'medications' de 'admin' para este bloco */}
              <Route
                path="medications"
                element={<MedicationsPage {...commonPageProps} />}
              />
              {/* --- FIM DA ALTERAÇÃO --- */}
            </>
          )}

          {user?.role === 'secretario' && (
            <>
              <Route
                path="deliveries"
                element={
                  <SecretaryDashboardPage
                    {...commonPageProps}
                    activeTabForced="deliveries"
                  />
                }
              />
              <Route
                path="reports-general"
                element={
                  <SecretaryDashboardPage
                    {...commonPageProps}
                    activeTabForced="all_history"
                  />
                }
              />
              <Route
                path="patient-history"
                element={
                  <SecretaryDashboardPage
                    {...commonPageProps}
                    activeTabForced="records"
                  />
                }
              />
              <Route
                path="settings"
                element={<SecretarySettingsPage {...commonPageProps} />}
              />
            </>
          )}

          {user?.role === 'admin' && (
            <>
              {/* --- ALTERAÇÃO AQUI --- */}
              {/* A rota 'medications' foi removida daqui */}
              {/* --- FIM DA ALTERAÇÃO --- */}
              <Route
                path="settings"
                element={<AdminSettingsPage {...commonPageProps} />}
              />
            </>
          )}

          {(user?.role === 'admin' || user?.role === 'secretario') && (
            <Route
              path="reports"
              element={<AdminReportsPage {...commonPageProps} />}
            />
          )}

          <Route
            path="*"
            element={
              <div className="text-center p-6 bg-white rounded shadow">
                <h2>Página não encontrada</h2>
                <Link to="/dashboard" className="text-blue-600">
                  Voltar ao Dashboard
                </Link>
              </div>
            }
          />
        </Route>
      </Routes>

      {showCookieBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 shadow-lg animate-fade-in-up z-[9990]">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-sm text-center md:text-left">
              🍪 Usamos cookies para garantir que você tenha a melhor
              experiência em nosso site.
            </p>
            <button
              onClick={handleAcceptCookies}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg text-sm flex-shrink-0"
            >
              Entendi e Aceitar
            </button>
          </div>
        </div>
      )}
    </>
  );
}