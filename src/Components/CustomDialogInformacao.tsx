import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, styled } from "@mui/material";

interface IProps{
    titulo: string,
    abrirModal: boolean,
    handleFechar: any,
    mensagem: string
}

export default function CustomDialogInformacao({ titulo, abrirModal, handleFechar, mensagem}: IProps) {
    return (
        <>
            <Dialog open={abrirModal} onClose={handleFechar} aria-labelledby="alert-dialog-title-3" aria-describedby="alert-dialog-description-3" >
                <DialogTitle id="alert-dialog-title-2"> {titulo} </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description-3" style={{ whiteSpace: 'pre-line' }}> {mensagem} </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleFechar}> Fechar </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
