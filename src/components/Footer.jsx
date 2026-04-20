/**
 * @fileoverview Pie de página de MineX con tres columnas informativas:
 * descripción de la plataforma, aviso legal y fuentes de datos.
 * @module components/Footer
 */

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

const COLUMNAS = [
  {
    titulo: "Sobre MineX",
    texto:
      "Plataforma consultiva y educativa dedicada al análisis e información sobre minerales y metales preciosos.",
  },
  {
    titulo: "Aviso Legal",
    texto:
      "Esta plataforma no ofrece servicios de compraventa ni asesoramiento financiero. Los datos son con fines informativos y educativos.",
  },
  {
    titulo: "Fuentes de Datos",
    texto:
      "Información obtenida de fuentes oficiales y APIs especializadas para garantizar precisión y actualidad.",
  },
];

/**
 * Pie de página con información legal y de fuentes.
 * @returns {JSX.Element}
 */
function Footer() {
  return (
    <Box
      component="footer"
      sx={{ bgcolor: "background.default", borderTop: "1px solid", borderColor: "divider" }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 5 } }}>
        <Grid container spacing={4}>
          {COLUMNAS.map(({ titulo, texto }) => (
            <Grid size={{ xs: 12, sm: 4 }} key={titulo}>
              <Typography
                variant="subtitle2"
                sx={{ color: "text.primary", fontWeight: 700, mb: 1 }}
              >
                {titulo}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                {texto}
              </Typography>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ borderColor: "divider", my: 3 }} />

        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", textAlign: "center" }}>
          © {new Date().getFullYear()} MineX. Plataforma educativa sin fines comerciales.
        </Typography>
      </Container>
    </Box>
  );
}

export default Footer;
