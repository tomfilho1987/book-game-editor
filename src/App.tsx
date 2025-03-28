/**
 * @file App.tsx
 * @description Componente principal da aplicação, responsável por renderizar a barra de menu e as rotas.
 * @author [Seu Nome]
 * @date [Data de Criação]
 * @version 1.0
 */
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Router } from '../src/Routes/Router'

/**
 * Componente principal da aplicação.
 * @returns {JSX.Element} Elemento JSX contendo a barra de menu e as rotas.
 */
const App: React.FC = () => {

    return (
        <BrowserRouter>
            <Router></Router>
        </BrowserRouter>
    );
};

export default App;