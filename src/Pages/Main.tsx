import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Tab, Tabs } from "@mui/material";
import BookEditor from "./BookEditor";
import { useState } from "react";
import GameSetup from "./GameSetup";

const Main: React.FC = () => {
    const [tab, setTab] = useState(0); // Controla as abas
    const [openConfirmModal, setOpenConfirmModal] = useState(false); // Controla a visibilidade do modal de confirmação
    const [pendingTabIndex, setPendingTabIndex] = useState<number | null>(null); // Armazena o índice da aba para a qual o usuário deseja ir
    
    const handleTabChange = (_: React.SyntheticEvent, newIndex: number) => {
        // Se a aba atual for a mesma, não faz nada
        if (newIndex === tab) {
            return;
        }

        setPendingTabIndex(newIndex); // Armazena a aba para a qual o usuário quer ir
        setOpenConfirmModal(true); // Abre o modal de confirmação
    };

    const handleConfirmChange = () => {
        if (pendingTabIndex !== null) {
            setTab(pendingTabIndex);
        }
        setOpenConfirmModal(false);
        setPendingTabIndex(null);
    };

    const handleCancelChange = () => {
        setOpenConfirmModal(false);
        setPendingTabIndex(null);
    };

    return(
        <>
            <Tabs value={tab} onChange={handleTabChange}>
                <Tab label="História" />
                <Tab label="Configuração" />
            </Tabs>
            {tab === 0 && <BookEditor />}
            {tab === 1 && <GameSetup />}

            <Dialog open={openConfirmModal} onClose={handleCancelChange} aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description">
                <DialogTitle id="confirm-dialog-title">{"Confirmar Mudança de Aba?"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="confirm-dialog-description">
                        <Alert severity="warning" variant='outlined' sx={{ mt: 2 }}>
                            Você tem certeza que deseja mudar de aba? Qualquer alteração não salva será perdida.
                        </Alert>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelChange} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirmChange} variant="contained" color="primary" autoFocus>
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default Main;