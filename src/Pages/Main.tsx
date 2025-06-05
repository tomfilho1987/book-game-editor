import { Box, Tab, Tabs } from "@mui/material";
import BookEditor from "./BookEditor";
import { useState } from "react";
import GameSetup from "./GameSetup";

const Main: React.FC = () => {
    const [tab, setTab] = useState(0); // Controla as abas
    const [pendingTabIndex, setPendingTabIndex] = useState<number | null>(null); // Armazena o índice da aba para a qual o usuário deseja ir
    
    const handleTabChange = (_: React.SyntheticEvent, newIndex: number) => {
        // Se a aba atual for a mesma, não faz nada
        if (newIndex === tab) {
            return;
        }

        setTab(newIndex);
        setPendingTabIndex(newIndex); // Armazena a aba para a qual o usuário quer ir
    };

    return(
        <>
            <Tabs value={tab} onChange={handleTabChange}>
                <Tab label="História" />
                <Tab label="Configuração" />
            </Tabs>
            <Box sx={{ display: tab === 0 ? 'block' : 'none' }}>
                <BookEditor />
            </Box>
            <Box sx={{ display: tab === 1 ? 'block' : 'none' }}>
                <GameSetup />
            </Box>
        </>
    );
};

export default Main;