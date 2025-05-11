import { Box, IconButton, TextField, Typography } from '@mui/material';
import React, { useState, ChangeEvent } from 'react';

const Image: React.FC = () => {
  const [texto, setTexto] = useState('');

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTexto(event.target.value);
  };

  return (
        <Box sx={{ p: 3, mt: 1 }}>
            <Box sx={{ mb: 1 }}>
                <TextField
                    label="Imagem"
                    onChange={(e: any) => { handleChange(e) }}
                    placeholder='Digite aqui o nome do arquivo'
                />
            </Box>
        </Box>
  );
}

export default Image;