/**
 * @fileoverview Página de noticias del mercado de metales preciosos de MineX.
 * Recupera artículos de Yahoo Finance a través del backend `/api/minerales/noticias`.
 * Incluye botones de selección rápida por tema, buscador libre y tarjetas de noticia
 * con imagen, fuente, fecha y enlace externo.
 * @module pages/Noticias
 */

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";

import ArticleIcon from "@mui/icons-material/Article";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RefreshIcon from "@mui/icons-material/Refresh";
import NewspaperIcon from "@mui/icons-material/Newspaper";

import api from "../api";

const ORANGE = "#e07b39";

function formatFecha(fechaStr) {
  try {
    return new Date(fechaStr).toLocaleDateString("es-ES", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return fechaStr;
  }
}

function Noticias() {
  const theme      = useTheme();
  const CARD_BG    = theme.palette.background.paper;
  const BORDER     = theme.palette.divider;
  const TEXT_MUTED = theme.palette.text.secondary;

  const [noticias, setNoticias] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchNoticias = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/minerales/noticias");
      setNoticias(res.datos ?? []);
    } catch (e) {
      setError(e.mensaje ?? "No se pudieron cargar las noticias.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNoticias(); }, [fetchNoticias]);

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="lg">

        {/* ── Header ── */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: "50%",
            backgroundColor: "rgba(224,123,57,0.15)",
            border: "1px solid rgba(224,123,57,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ArticleIcon sx={{ color: ORANGE, fontSize: 20 }} />
          </Box>
          <Typography variant="h5" sx={{ color: "text.primary", fontWeight: 700 }}>
            Noticias del Mercado
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, ml: 7 }}>
          Últimas noticias sobre metales preciosos y mercados de materias primas
        </Typography>

        {/* ── Estado: cargando / error / vacío ── */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: ORANGE }} />
          </Box>
        )}

        {!loading && error && (
          <Box sx={{
            textAlign: "center", py: 6,
            bgcolor: CARD_BG,
            border: "1px solid", borderColor: BORDER,
            borderRadius: 2,
          }}>
            <Typography variant="body1" sx={{ color: "#f44336", mb: 2 }}>{error}</Typography>
            <Button
              onClick={() => fetchNoticias()}
              startIcon={<RefreshIcon />}
              size="small"
              sx={{ color: ORANGE, textTransform: "none" }}
            >
              Reintentar
            </Button>
          </Box>
        )}

        {!loading && !error && noticias.length === 0 && (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <NewspaperIcon sx={{ fontSize: 64, color: BORDER, mb: 2 }} />
            <Typography variant="body1" sx={{ color: TEXT_MUTED }}>
              No se encontraron noticias en este momento
            </Typography>
          </Box>
        )}

        {/* ── Grid de noticias ── */}
        {!loading && !error && noticias.length > 0 && (
          <>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
                {noticias.length} {noticias.length === 1 ? "noticia" : "noticias"} recientes
              </Typography>
              <IconButton
                size="small"
                onClick={() => fetchNoticias()}
                sx={{ color: TEXT_MUTED, "&:hover": { color: ORANGE } }}
                title="Actualizar"
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Box>

            <Grid container spacing={2.5}>
              {noticias.map((noticia) => (
                <Grid key={noticia.id} size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: "flex" }}>
                  <Card
                    sx={{
                      flex: 1,
                      bgcolor: CARD_BG,
                      border: "1px solid", borderColor: BORDER,
                      borderRadius: 2,
                      display: "flex",
                      flexDirection: "column",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                      "&:hover": {
                        borderColor: ORANGE,
                        boxShadow: `0 0 0 1px ${ORANGE}44`,
                      },
                    }}
                  >
                    <CardActionArea
                      component="a"
                      href={noticia.enlace}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "stretch" }}
                    >
                      {/* Imagen */}
                      {noticia.imagen ? (
                        <CardMedia
                          component="img"
                          image={noticia.imagen}
                          alt={noticia.titulo}
                          sx={{ height: 160, objectFit: "cover" }}
                        />
                      ) : (
                        <Box sx={{
                          height: 120,
                          bgcolor: "rgba(224,123,57,0.06)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          borderBottom: "1px solid", borderColor: BORDER,
                        }}>
                          <NewspaperIcon sx={{ fontSize: 40, color: `${ORANGE}66` }} />
                        </Box>
                      )}

                      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2 }}>
                        {/* Fuente + fecha */}
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                          <Chip
                            label={noticia.fuente}
                            size="small"
                            sx={{
                              height: 20, fontSize: "0.68rem",
                              bgcolor: "rgba(224,123,57,0.1)",
                              color: ORANGE,
                              fontWeight: 600,
                              maxWidth: 140,
                            }}
                          />
                          <Typography variant="caption" sx={{ color: TEXT_MUTED, flexShrink: 0, ml: 1 }}>
                            {formatFecha(noticia.fecha)}
                          </Typography>
                        </Box>

                        {/* Título */}
                        <Typography
                          variant="body2"
                          sx={{
                            color: "text.primary",
                            fontWeight: 600,
                            lineHeight: 1.5,
                            flex: 1,
                            display: "-webkit-box",
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {noticia.titulo}
                        </Typography>

                        {/* Leer más */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1.5 }}>
                          <Typography variant="caption" sx={{ color: ORANGE, fontWeight: 600 }}>
                            Leer más
                          </Typography>
                          <OpenInNewIcon sx={{ fontSize: 12, color: ORANGE }} />
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* ── Aviso ── */}
        {!loading && !error && noticias.length > 0 && (
          <Box sx={{
            mt: 4, p: 2,
            bgcolor: "rgba(224,123,57,0.06)",
            border: "1px solid rgba(224,123,57,0.2)",
            borderRadius: 2,
            display: "flex", alignItems: "flex-start", gap: 1.5,
          }}>
            <ArticleIcon sx={{ color: ORANGE, fontSize: 18, flexShrink: 0, mt: 0.2 }} />
            <Typography variant="caption" sx={{ color: TEXT_MUTED, lineHeight: 1.7 }}>
              Las noticias son proporcionadas por Yahoo Finance y fuentes externas. MineX no es responsable
              del contenido de terceros. Esta información es exclusivamente educativa e informativa.
            </Typography>
          </Box>
        )}

      </Container>
    </Box>
  );
}

export default Noticias;
