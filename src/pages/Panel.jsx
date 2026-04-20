/**
 * @fileoverview Panel de control principal de MineX.
 * Muestra el precio spot actual del mineral seleccionado, una gráfica de histórico
 * de precios con Recharts (períodos 30d/12m/5y) y tarjetas de cotización en tiempo real.
 * Los datos se obtienen del backend en `/api/minerales`.
 * @module pages/Panel
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";

import Chip from "@mui/material/Chip";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ShowChartIcon from "@mui/icons-material/ShowChart";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import api from "../api";

// ─── Configuración de minerales ───────────────────────────────────────────────
const MINERALS = [
  { nombre: "oro",      label: "Oro",      symbol: "XAU", color: "#FFD700" },
  { nombre: "plata",    label: "Plata",    symbol: "XAG", color: "#A8A9AD" },
  { nombre: "platino",  label: "Platino",  symbol: "XPT", color: "#7EC8E3" },
  { nombre: "paladio",  label: "Paladio",  symbol: "XPD", color: "#9B59B6" },
  { nombre: "cobre",    label: "Cobre",    symbol: "CU",  color: "#CB6D51" },
];

const PERIODOS = [
  { value: "30d", label: "30 Días" },
  { value: "12m", label: "12 Meses" },
  { value: "5y",  label: "5 Años" },
];

const ORANGE = "#e07b39";

// ─── Tooltip personalizado del gráfico ────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        px: 1.5,
        py: 1,
      }}
    >
      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: ORANGE, fontWeight: 700 }}>
        {Number(payload[0].value).toFixed(4)} USD/g
      </Typography>
    </Box>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
function Panel() {
  const theme    = useTheme();
  const DARK_BG  = theme.palette.background.default;
  const CARD_BG  = theme.palette.background.paper;
  const BORDER   = theme.palette.divider;
  const TEXT_MAIN  = theme.palette.text.primary;
  const TEXT_MUTED = theme.palette.text.secondary;

  const [precios, setPrecios]               = useState({});
  const [loadingPrecios, setLoadingPrecios] = useState(true);
  const [errorPrecios, setErrorPrecios]     = useState(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  const [selectedMineral, setSelectedMineral] = useState("oro");
  const [selectedPeriodo, setSelectedPeriodo] = useState("12m");

  const [historico, setHistorico]         = useState([]);
  const [loadingChart, setLoadingChart]   = useState(false);
  const [errorChart, setErrorChart]       = useState(null);

  const chartRef = useRef(null);

  // ── Cargar todas las cotizaciones ────────────────────────────────────────
  const fetchPrecios = useCallback(async (esRefresco = false) => {
    if (!esRefresco) setLoadingPrecios(true);
    setErrorPrecios(null);
    try {
      const results = await Promise.allSettled(
        MINERALS.map((m) =>
          api.get(`/minerales/${m.nombre}`).then((res) => ({
            nombre: m.nombre,
            precio: res.datos.precio,
            fecha:  res.datos.fecha_actualizacion,
          }))
        )
      );
      const map = {};
      let algunoOk = false;
      let primerError = null;
      results.forEach((r, i) => {
        if (r.status === "fulfilled") {
          map[MINERALS[i].nombre] = r.value;
          algunoOk = true;
        } else if (!primerError) {
          primerError = r.reason?.mensaje || r.reason?.message || "Error desconocido";
        }
      });
      if (!algunoOk) throw new Error(primerError || "Todos los minerales fallaron");
      setPrecios(map);
      setUltimaActualizacion(new Date());
      setErrorPrecios(null);
    } catch (err) {
      const detalle = err.message || err.mensaje || "";
      setErrorPrecios(
        `No se pudieron cargar las cotizaciones. ${detalle ? `Detalle: ${detalle}` : "Comprueba que el servidor está activo."}`
      );
    } finally {
      if (!esRefresco) setLoadingPrecios(false);
    }
  }, []);

  useEffect(() => {
    fetchPrecios();
    const intervalo = setInterval(() => fetchPrecios(true), 60_000);
    return () => clearInterval(intervalo);
  }, [fetchPrecios]);

  // ── Cargar histórico cuando cambia mineral o período ─────────────────────
  const fetchHistorico = useCallback(async () => {
    setLoadingChart(true);
    setErrorChart(null);
    try {
      const res = await api.get(`/minerales/${selectedMineral}/historico?periodo=${selectedPeriodo}`);
      setHistorico(res.datos.historico ?? []);
    } catch {
      setErrorChart("No se pudo cargar el histórico de precios.");
    } finally {
      setLoadingChart(false);
    }
  }, [selectedMineral, selectedPeriodo]);

  useEffect(() => {
    fetchHistorico();
  }, [fetchHistorico]);

  // ── Click en card: seleccionar mineral y hacer scroll al gráfico ─────────
  const handleCardClick = (nombre) => {
    setSelectedMineral(nombre);
    setTimeout(() => {
      chartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const mineralInfo = MINERALS.find((m) => m.nombre === selectedMineral);
  const ultimaFecha = ultimaActualizacion
    ? ultimaActualizacion.toLocaleString("es-ES", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <Box sx={{ backgroundColor: DARK_BG, minHeight: "100vh", py: 4 }}>
      <Container maxWidth="lg">

        {/* ── Encabezado ───────────────────────────────────────────────── */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: "50%",
              backgroundColor: "rgba(224,123,57,0.15)",
              border: "1px solid rgba(224,123,57,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ShowChartIcon sx={{ color: ORANGE, fontSize: 20 }} />
            </Box>
            <Typography variant="h5" sx={{ color: TEXT_MAIN, fontWeight: 700 }}>
              Panel de Mercado
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: TEXT_MUTED, ml: 7 }}>
            Cotizaciones en tiempo real y evolución histórica de metales preciosos
          </Typography>
        </Box>

        {/* ── Banner de bienvenida ─────────────────────────────────────── */}
        <Box
          sx={{
            backgroundColor: theme.palette.mode === "dark" ? "#1a1208" : "rgba(224,123,57,0.08)",
            border: `1px solid rgba(224,123,57,0.25)`,
            borderRadius: 2,
            p: { xs: 2.5, sm: 3 },
            mb: 4,
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 2,
          }}
        >
          {/* Icono en círculo naranja */}
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: ORANGE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <InfoOutlinedIcon sx={{ color: "#fff", fontSize: 20 }} />
          </Box>

          <Box>
            <Typography variant="h6" sx={{ color: TEXT_MAIN, fontWeight: 700 }}>
              Bienvenido a MineX
            </Typography>
            <Typography variant="body2" sx={{ color: TEXT_MUTED, mb: ultimaFecha ? 1 : 0 }}>
              Consulta cotizaciones actualizadas, analiza tendencias del mercado y explora
              información educativa sobre minerales y metales preciosos.
            </Typography>
            {ultimaFecha && (
              <Chip
                icon={<AccessTimeIcon sx={{ fontSize: "13px !important", color: "#fff !important" }} />}
                label={`Última actualización: ${ultimaFecha}`}
                size="small"
                sx={{
                  backgroundColor: ORANGE,
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  height: 24,
                }}
              />
            )}
          </Box>
        </Box>

        {/* ── Cotizaciones en tiempo real ──────────────────────────────── */}
        <Typography variant="h6" sx={{ color: TEXT_MAIN, fontWeight: 700, mb: 2 }}>
          Cotizaciones en Tiempo Real
        </Typography>

        {errorPrecios && (
          <Alert
            severity="error"
            sx={{ mb: 2, backgroundColor: "#1e1010", color: "#ff6b6b" }}
            action={
              <Button
                size="small"
                onClick={() => fetchPrecios()}
                sx={{ color: "#ff8080", textTransform: "none" }}
              >
                Reintentar
              </Button>
            }
          >
            {errorPrecios}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 5 }}>
          {MINERALS.map((mineral) => {
            const dato   = precios[mineral.nombre];
            const precio = dato?.precio;
            const isSelected = selectedMineral === mineral.nombre;

            return (
              <Grid size={{ xs: 6, sm: 4, md: 12/5 }} key={mineral.nombre}>
                <Card
                  sx={{
                    backgroundColor: isSelected ? "rgba(224,123,57,0.08)" : CARD_BG,
                    border: `1px solid ${isSelected ? ORANGE : BORDER}`,
                    borderRadius: 2,
                    transition: "all 0.2s",
                    height: "100%",
                    "&:hover": {
                      borderColor: ORANGE,
                      backgroundColor: "rgba(224,123,57,0.05)",
                    },
                  }}
                >
                  <CardActionArea onClick={() => handleCardClick(mineral.nombre)} sx={{ height: "100%" }}>
                    {/* Barra de color superior */}
                    <Box sx={{ height: 4, backgroundColor: mineral.color, borderRadius: "8px 8px 0 0" }} />

                    <CardContent sx={{ p: 2 }}>
                      {/* Símbolo */}
                      <Typography variant="caption" sx={{ color: TEXT_MUTED, fontWeight: 600, letterSpacing: 1 }}>
                        {mineral.symbol}
                      </Typography>

                      {/* Nombre */}
                      <Typography variant="subtitle2" sx={{ color: TEXT_MAIN, fontWeight: 700, mt: 0.5, mb: 1.5 }}>
                        {mineral.label}
                      </Typography>

                      {/* Precio */}
                      {loadingPrecios ? (
                        <CircularProgress size={16} sx={{ color: ORANGE }} />
                      ) : precio != null ? (
                        <>
                          <Typography variant="h6" sx={{ color: TEXT_MAIN, fontWeight: 700, lineHeight: 1.2 }}>
                            ${Number(precio).toFixed(4)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                            USD/g
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
                          No disponible
                        </Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* ── Evolución histórica de precios ───────────────────────────── */}
        <Box
          ref={chartRef}
          sx={{
            backgroundColor: CARD_BG,
            border: `1px solid ${BORDER}`,
            borderRadius: 2,
            p: { xs: 2, sm: 3 },
            mb: 4,
            scrollMarginTop: "80px",
          }}
        >
          <Typography variant="h6" sx={{ color: TEXT_MAIN, fontWeight: 700, mb: 2 }}>
            Evolución Histórica de Precios
          </Typography>

          {/* Controles: selector de mineral + período */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 2,
              mb: 3,
            }}
          >
            {/* Selector de mineral */}
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <Select
                value={selectedMineral}
                onChange={(e) => setSelectedMineral(e.target.value)}
                sx={{
                  color: TEXT_MAIN,
                  backgroundColor: DARK_BG,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 1,
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  "& .MuiSvgIcon-root": { color: TEXT_MUTED },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: { backgroundColor: CARD_BG, color: TEXT_MAIN },
                  },
                }}
                renderValue={(value) => {
                  const m = MINERALS.find((x) => x.nombre === value);
                  return (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: m?.color,
                        }}
                      />
                      {m?.label} ({m?.symbol})
                    </Box>
                  );
                }}
              >
                {MINERALS.map((m) => (
                  <MenuItem key={m.nombre} value={m.nombre}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: m.color,
                        }}
                      />
                      {m.label} ({m.symbol})
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Botones de período */}
            <Box sx={{ display: "flex", gap: 1 }}>
              {PERIODOS.map((p) => (
                <Button
                  key={p.value}
                  size="small"
                  onClick={() => setSelectedPeriodo(p.value)}
                  sx={{
                    textTransform: "none",
                    fontWeight: selectedPeriodo === p.value ? 700 : 400,
                    backgroundColor:
                      selectedPeriodo === p.value ? ORANGE : "transparent",
                    color:
                      selectedPeriodo === p.value ? "white" : TEXT_MUTED,
                    border: `1px solid ${selectedPeriodo === p.value ? ORANGE : BORDER}`,
                    "&:hover": {
                      backgroundColor:
                        selectedPeriodo === p.value
                          ? "#c96a2a"
                          : "rgba(255,255,255,0.05)",
                    },
                  }}
                >
                  {p.label}
                </Button>
              ))}
            </Box>

            {/* Precio actual del mineral seleccionado */}
            {precios[selectedMineral] && (
              <Box sx={{ ml: "auto" }}>
                <Typography variant="h6" sx={{ color: mineralInfo?.color, fontWeight: 700 }}>
                  ${Number(precios[selectedMineral].precio).toFixed(4)}
                </Typography>
                <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                  USD/g
                </Typography>
              </Box>
            )}
          </Box>

          {/* Gráfico */}
          {errorChart ? (
            <Alert severity="error" sx={{ backgroundColor: "#1e1010", color: "#ff6b6b" }}>
              {errorChart}
            </Alert>
          ) : loadingChart ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress sx={{ color: ORANGE }} />
            </Box>
          ) : historico.length === 0 ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
                Sin datos para el período seleccionado.
              </Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={460}>
              <LineChart data={historico} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="fecha"
                  tick={{ fill: TEXT_MUTED, fontSize: 11 }}
                  axisLine={{ stroke: BORDER }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: TEXT_MUTED, fontSize: 11 }}
                  axisLine={{ stroke: BORDER }}
                  tickLine={false}
                  tickFormatter={(v) => `$${v.toFixed(2)}`}
                  width={70}
                  domain={["auto", "auto"]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="precio"
                  stroke={mineralInfo?.color ?? ORANGE}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: mineralInfo?.color ?? ORANGE }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Box>

        {/* ── Aviso educativo ──────────────────────────────────────────── */}
        <Box
          sx={{
            backgroundColor: "rgba(224,123,57,0.06)",
            border: `1px solid rgba(224,123,57,0.2)`,
            borderRadius: 2,
            p: 2.5,
            display: "flex",
            gap: 2,
            alignItems: "flex-start",
          }}
        >
          <InfoOutlinedIcon sx={{ color: ORANGE, flexShrink: 0, mt: 0.2 }} />
          <Box>
            <Typography variant="subtitle2" sx={{ color: ORANGE, fontWeight: 700 }}>
              Carácter Informativo y Educativo
            </Typography>
            <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
              MineX es una plataforma exclusivamente consultiva. No ofrecemos servicios de
              compraventa ni asesoramiento financiero. Los datos son con fines informativos y de análisis.
            </Typography>
          </Box>
        </Box>

      </Container>
    </Box>
  );
}

export default Panel;
