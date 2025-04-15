/**
 * @file Router.tsx
 * @description Componente principal da aplicação, responsável por renderizar as rotas.
 * @author [Seu Nome]
 * @date [Data de Criação]
 * @version 1.0
 */
import { Route, Routes } from "react-router-dom";
import Cabecalho from "../Components/Cabecalho";
import Main from "../Pages/Main";

export function Router(){
    return (
        <Routes>
            <Route element={<Cabecalho />}>
                <Route path="/" element={<Main />} />
            </Route>
        </Routes>
    );
}

export default Router;