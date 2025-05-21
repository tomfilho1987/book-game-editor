import React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export interface ICustomAlertDialogProps {
  open: boolean,
  title: string,
  message: string,
  handleClickYes: React.MouseEventHandler<HTMLButtonElement> | undefined,
  handleClickNo: React.MouseEventHandler<HTMLButtonElement> | undefined,
  handleClickClose: ((event: {}, reason: "backdropClick" | "escapeKeyDown") => void) | undefined
}

/**
 * @description CustomAlertDialog
 * @version 1.0.0
 * @author 
 */
export default function CustomAlertDialog({ open, title, message,
  handleClickYes, handleClickNo, handleClickClose }: ICustomAlertDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={handleClickClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClickNo} color="primary">
          Não
        </Button>
        <Button onClick={handleClickYes} variant="contained" color="primary" autoFocus>
          Sim
        </Button>
      </DialogActions>
    </Dialog>
  );
}
