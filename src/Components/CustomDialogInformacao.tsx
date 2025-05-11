import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, styled } from "@mui/material";
import { Warning } from "@mui/icons-material"; // Importe o ícone de alerta

interface IProps{
    titulo: string,
    abrirModal: boolean,
    handleFechar: any,
    mensagem: string
}

const AlertaIcon = styled(Warning)(({ theme }) => ({
    marginRight: theme.spacing(1),
    color: 'orange', // Cor amarela/laranja para o triângulo
    verticalAlign: 'middle', // Alinhar verticalmente com o texto
}));

export default function CustomDialogInformacao({ titulo, abrirModal, handleFechar, mensagem}: IProps) {
    return (
        <>
            <Dialog open={abrirModal} onClose={handleFechar} aria-labelledby="alert-dialog-title-3" aria-describedby="alert-dialog-description-3" >
                <DialogTitle id="alert-dialog-title-2"> {titulo} </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description-3"> {mensagem} </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleFechar}> Fechar </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
