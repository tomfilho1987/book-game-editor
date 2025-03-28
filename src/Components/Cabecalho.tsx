import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import { Link, Outlet } from "react-router-dom";

export function Cabecalho(){
    return (
        <Box sx={{ flexGrow: 1, mb: 2 }}>
            <AppBar position="sticky" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Editor de Livro-Jogo
                    </Typography>

                    <Button color="inherit" component={Link} to="/">Criar História</Button>
                    <Button color="inherit" component={Link} to="/game-setup">Configurar Jogo</Button> {/* Novo botão */}
                </Toolbar>
            </AppBar>
            <Outlet />
        </Box>
    );
}

export default Cabecalho;