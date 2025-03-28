/**
 * @file Router.tsx
 * @description Componente principal da aplicação, responsável por renderizar as rotas.
 * @author [Seu Nome]
 * @date [Data de Criação]
 * @version 1.0
 */
import { Route, Routes } from "react-router-dom";
import BookEditor from "../Pages/BookEditor";
import GameSetup from "../Pages/GameSetup";
import { Chapter } from "../Types/Chapter";
import Cabecalho from "../Components/Cabecalho";

export function Router(){
    // Busca os dados do localStorage
    const chapters: Chapter[] = JSON.parse(localStorage.getItem('bookData') || '[]');

    return (
        <Routes>
            <Route element={<Cabecalho />}>
                <Route path="/" element={<BookEditor />} />
                <Route path="/game-setup" element={<GameSetup />} />
            </Route>
        </Routes>
    );
}

export default Router;