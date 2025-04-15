import { Tab, Tabs } from "@mui/material";
import { useState } from "react";
import BookEditor from "./BookEditor";
import GameSetup from "./GameSetup";

const Main: React.FC = () => {
/** Estado para controlar a aba selecionada (História e Configuração). */
  const [tab, setTab] = useState(0); // Controla as abas
    return(
        <>
            <Tabs value={tab} onChange={(_, newIndex) => setTab(newIndex)}>
                <Tab label="História" />
                <Tab label="Configuração" />
            </Tabs>
        
            {tab === 0 && <BookEditor />}
            {tab === 1 && <GameSetup />}
        </>
    );
};

export default Main;