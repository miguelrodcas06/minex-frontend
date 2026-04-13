import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SavingsIcon from "@mui/icons-material/Savings";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ShowChartIcon from "@mui/icons-material/ShowChart";

import api from "../api";

const MINERALS = [
  { nombre: "oro",     label: "Oro",     symbol: "Au", color: "#FFD700" },
  { nombre: "plata",   label: "Plata",   symbol: "Ag", color: "#C0C0C0" },
  { nombre: "platino", label: "Platino", symbol: "Pt", color: "#E8E4DC" },
  { nombre: "paladio", label: "Paladio", symbol: "Pd", color: "#CEC4B0" },
  { nombre: "cobre",   label: "Cobre",   symbol: "Cu", color: "#B87333" },
];

const ORANGE = "#e07b39";

function fmt(val, decimals = 2) {
  return Number(val).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function mineralColor(nombre) {
  return MINERALS.find((m) => m.nombre === nombre)?.color ?? ORANGE;
}

function mineralLabel(nombre) {
  return MINERALS.find((m) => m.nombre === nombre)?.label ?? nombre;
}

// primaryBtnSx stays module-level (ORANGE never changes between themes)
const primaryBtnSx = {
  backgroundColor: ORANGE,
  color: "white",
  textTransform: "none",
  fontWeight: 600,
  boxShadow: "none",
  "&:hover": { backgroundColor: "#c96a2a", boxShadow: "none" },
  "&:disabled": { backgroundColor: "rgba(224,123,57,0.3)", color: "rgba(255,255,255,0.4)" },
};

const alertSx = (severity) => ({
  backgroundColor: severity === "success" ? "#0e2a1a" : "#1a0a0a",
  color:           severity === "success" ? "#80ff9b" : "#ff6b6b",
  "& .MuiAlert-icon": { color: severity === "success" ? "#4caf50" : "#f44336" },
});

// ─── Component ───────────────────────────────────────────────────────────────

function Tesoreria() {
  const theme    = useTheme();
  const DARK_BG  = theme.palette.background.default;
  const CARD_BG  = theme.palette.background.paper;
  const BORDER   = theme.palette.divider;
  const TEXT_MUTED = theme.palette.text.secondary;

  const selectSx = {
    color: "text.primary",
    ".MuiOutlinedInput-notchedOutline": { borderColor: BORDER },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(128,128,128,0.5)" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: ORANGE },
    ".MuiSvgIcon-root": { color: TEXT_MUTED },
  };

  const textFieldSx = {
    "& .MuiOutlinedInput-root": {
      color: "text.primary",
      "& fieldset": { borderColor: BORDER },
      "&:hover fieldset": { borderColor: "rgba(128,128,128,0.5)" },
      "&.Mui-focused fieldset": { borderColor: ORANGE },
    },
    "& .MuiInputLabel-root": { color: TEXT_MUTED },
    "& .MuiInputLabel-root.Mui-focused": { color: ORANGE },
  };

  const [tesoreria,    setTesoreria]    = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState(null);

  // Balance local — synced to sessionStorage
  const [balance, setBalance] = useState(() => {
    const u = JSON.parse(sessionStorage.getItem("usuario") ?? "null");
    return u?.balance ?? null;
  });

  // ── Add form ──
  const [mineral,      setMineral]      = useState("oro");
  const [cantidad,     setCantidad]     = useState("");
  const [precioActual, setPrecioActual] = useState(null);
  const [addLoading,   setAddLoading]   = useState(false);
  const [addError,     setAddError]     = useState(null);

  // ── Delete / sell dialog ──
  const [deleteDialog,  setDeleteDialog]  = useState({ open: false, item: null });
  const [deleteQty,     setDeleteQty]     = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError,   setDeleteError]   = useState(null);

  // ── Snackbar ──
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // ─────────────────────────────────────────────────────────────────────────

  const fetchTesoreria = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [resTesoreria, resSaldo] = await Promise.allSettled([
        api.get("/tesoreria"),
        api.get("/usuarios/saldo"),
      ]);
      if (resTesoreria.status === "fulfilled") setTesoreria(resTesoreria.value.datos);
      else setFetchError(resTesoreria.reason?.mensaje ?? "Error al cargar la tesorería.");
      if (resSaldo.status === "fulfilled" && resSaldo.value.balance != null) {
        const saldo = parseFloat(resSaldo.value.balance);
        setBalance(saldo);
        const u = JSON.parse(sessionStorage.getItem("usuario") ?? "null");
        if (u) sessionStorage.setItem("usuario", JSON.stringify({ ...u, balance: saldo }));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTesoreria(); }, [fetchTesoreria]);

  // Fetch current price whenever the selected mineral changes
  useEffect(() => {
    let cancelled = false;
    setPrecioActual(null);
    api.get(`/minerales/${mineral}`)
      .then((res) => { if (!cancelled) setPrecioActual(res.datos?.precio ?? null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [mineral]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const updateBalance = (nuevoBalance) => {
    setBalance(nuevoBalance);
    const u = JSON.parse(sessionStorage.getItem("usuario") ?? "null");
    if (u) sessionStorage.setItem("usuario", JSON.stringify({ ...u, balance: nuevoBalance }));
  };

  const handleAgregar = async () => {
    const cant = parseFloat(cantidad);
    if (!cant || cant <= 0) {
      setAddError("Introduce una cantidad válida en gramos.");
      return;
    }
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await api.post("/tesoreria", { mineral, cantidad: cant });
      if (res.datos?.nuevo_balance !== undefined) updateBalance(res.datos.nuevo_balance);
      setCantidad("");
      setSnackbar({ open: true, message: res.mensaje, severity: "success" });
      await fetchTesoreria();
    } catch (e) {
      setAddError(e.mensaje ?? "Error al agregar a la tesorería.");
    } finally {
      setAddLoading(false);
    }
  };

  const openDeleteDialog = (item) => {
    setDeleteDialog({ open: true, item });
    setDeleteQty("");
    setDeleteError(null);
  };

  const closeDeleteDialog = () => {
    if (!deleteLoading) setDeleteDialog({ open: false, item: null });
  };

  const handleVender = async (cantVender) => {
    const { item } = deleteDialog;
    const cant = parseFloat(cantVender);
    if (!cant || cant <= 0 || cant > item.cantidad) {
      setDeleteError(`Introduce una cantidad entre 0.01 y ${fmt(item.cantidad, 4)} g.`);
      return;
    }
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await api.post("/tesoreria/vender", { id_item: item.id_item, cantidad: cant });
      if (res.nuevo_balance !== undefined) updateBalance(res.nuevo_balance);
      setSnackbar({ open: true, message: res.mensaje, severity: "success" });
      setDeleteDialog({ open: false, item: null });
      await fetchTesoreria();
    } catch (e) {
      setDeleteError(e.mensaje ?? "Error al vender.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Derived values ─────────────────────────────────────────────────────────

  const resumen      = tesoreria?.resumen;
  const items        = tesoreria?.items ?? [];
  const balanceTotal = parseFloat(resumen?.balance_total ?? 0);
  const esGanancia   = balanceTotal >= 0;
  const pctGlobal    = resumen && parseFloat(resumen.total_invertido) > 0
    ? (balanceTotal / parseFloat(resumen.total_invertido)) * 100
    : 0;

  const costoEstimado = precioActual && cantidad && parseFloat(cantidad) > 0
    ? precioActual * parseFloat(cantidad)
    : null;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ backgroundColor: DARK_BG, py: 4 }}>
      <Container maxWidth="lg">

        {/* ── Header ── */}
        <Box sx={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", flexWrap: "wrap",
          gap: 2, mb: 4,
        }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: "50%",
                backgroundColor: "rgba(224,123,57,0.15)",
                border: "1px solid rgba(224,123,57,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <AccountBalanceIcon sx={{ color: ORANGE, fontSize: 20 }} />
              </Box>
              <Typography variant="h5" sx={{ color: "text.primary", fontWeight: 700 }}>
                Tesorería Simbólica
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: TEXT_MUTED, ml: 7 }}>
              Gestiona tu colección de metales preciosos en tiempo real
            </Typography>
          </Box>

          {balance !== null && (
            <Chip
              icon={<AttachMoneyIcon sx={{ color: `${ORANGE} !important` }} />}
              label={`Balance disponible: $${fmt(balance)}`}
              sx={{
                backgroundColor: "rgba(224,123,57,0.1)",
                border: "1px solid rgba(224,123,57,0.3)",
                color: ORANGE,
                fontWeight: 600,
                fontSize: "0.875rem",
                height: 36,
              }}
            />
          )}
        </Box>

        {/* ── Summary cards ── */}
        {!loading && tesoreria && (
          <Grid container spacing={2} sx={{ mb: 4 }} alignItems="stretch">
            {[
              {
                label: "Valor Actual",
                value: `$${fmt(resumen.valor_actual_total)}`,
                icon:  <SavingsIcon sx={{ fontSize: 26, color: ORANGE }} />,
                accent: ORANGE,
              },
              {
                label: "Total Invertido",
                value: `$${fmt(resumen.total_invertido)}`,
                icon:  <AttachMoneyIcon sx={{ fontSize: 26, color: "#64b5f6" }} />,
                accent: "#64b5f6",
              },
              {
                label: esGanancia ? "Ganancia" : "Pérdida",
                value: `${esGanancia ? "+" : ""}$${fmt(Math.abs(balanceTotal))}`,
                extra: `${esGanancia ? "+" : ""}${fmt(pctGlobal)}%`,
                icon:  esGanancia
                  ? <TrendingUpIcon sx={{ fontSize: 26, color: "#4caf50" }} />
                  : <TrendingDownIcon sx={{ fontSize: 26, color: "#f44336" }} />,
                accent: esGanancia ? "#4caf50" : "#f44336",
              },
            ].map(({ label, value, extra, icon, accent }) => (
              <Grid key={label} size={{ xs: 12, sm: 4 }} sx={{ display: "flex" }}>
                <Card sx={{
                  flex: 1,
                  backgroundColor: CARD_BG,
                  border: `1px solid ${accent}33`,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${CARD_BG} 0%, ${accent}10 100%)`,
                }}>
                  <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, py: "16px !important" }}>
                    <Box sx={{
                      width: 48, height: 48, borderRadius: "50%",
                      backgroundColor: `${accent}18`,
                      border: `1px solid ${accent}40`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {icon}
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: TEXT_MUTED, display: "block" }}>
                        {label}
                      </Typography>
                      <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 700, lineHeight: 1.2 }}>
                        {value}
                      </Typography>
                      {extra && (
                        <Typography variant="caption" sx={{ color: accent, fontWeight: 600 }}>
                          {extra}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* ── Main two-column layout ── */}
        <Grid container spacing={3}>

          {/* Left column: add form + info */}
          <Grid size={{ xs: 12, md: 4 }}>

            {/* Add form */}
            <Card sx={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 2 }}>
              <Box sx={{ px: 2.5, pt: 2.5, pb: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <AddCircleOutlineIcon sx={{ color: ORANGE, fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ color: "text.primary", fontWeight: 600 }}>
                    Agregar Mineral
                  </Typography>
                </Box>
              </Box>

              <CardContent sx={{ pt: 0 }}>
                {/* Mineral selector */}
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel sx={{ color: TEXT_MUTED }}>Mineral</InputLabel>
                  <Select
                    value={mineral}
                    label="Mineral"
                    onChange={(e) => { setMineral(e.target.value); setAddError(null); }}
                    sx={selectSx}
                  >
                    {MINERALS.map((m) => (
                      <MenuItem key={m.nombre} value={m.nombre}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: m.color, flexShrink: 0 }} />
                          {m.label}
                          <Typography variant="caption" sx={{ color: TEXT_MUTED, ml: 0.5 }}>
                            ({m.symbol})
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Current price badge */}
                {precioActual !== null ? (
                  <Box sx={{
                    mb: 2, p: 1.5,
                    backgroundColor: "rgba(255,255,255,0.04)",
                    borderRadius: 1,
                    border: `1px solid ${BORDER}`,
                  }}>
                    <Typography variant="caption" sx={{ color: TEXT_MUTED }}>Precio actual</Typography>
                    <Typography variant="body2" sx={{ color: ORANGE, fontWeight: 600 }}>
                      ${fmt(precioActual)} / g
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={12} sx={{ color: TEXT_MUTED }} />
                    <Typography variant="caption" sx={{ color: TEXT_MUTED }}>Cargando precio...</Typography>
                  </Box>
                )}

                {/* Quantity input */}
                <TextField
                  label="Cantidad (gramos)"
                  value={cantidad}
                  onChange={(e) => { setCantidad(e.target.value); setAddError(null); }}
                  type="number"
                  fullWidth
                  size="small"
                  slotProps={{ htmlInput: { min: 0.01, step: "0.01" } }}
                  sx={{ ...textFieldSx, mb: costoEstimado ? 1 : 2 }}
                />

                {/* Cost preview */}
                {costoEstimado && (
                  <Box sx={{
                    mb: 2, p: 1.5,
                    backgroundColor: "rgba(224,123,57,0.08)",
                    borderRadius: 1,
                    border: "1px solid rgba(224,123,57,0.2)",
                  }}>
                    <Typography variant="caption" sx={{ color: TEXT_MUTED }}>Coste estimado</Typography>
                    <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 600 }}>
                      ${fmt(costoEstimado)}
                    </Typography>
                  </Box>
                )}

                {addError && (
                  <Alert severity="error" sx={{ ...alertSx("error"), mb: 2 }}>
                    {addError}
                  </Alert>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleAgregar}
                  disabled={addLoading || !cantidad || parseFloat(cantidad) <= 0}
                  startIcon={addLoading ? <CircularProgress size={16} color="inherit" /> : <AddCircleOutlineIcon />}
                  sx={primaryBtnSx}
                >
                  {addLoading ? "Comprando..." : "Agregar a Tesorería"}
                </Button>
              </CardContent>
            </Card>

          </Grid>

          {/* Right column: holdings list */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 2 }}>
              <Box sx={{ px: 2.5, pt: 2.5, pb: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <ShowChartIcon sx={{ color: ORANGE, fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ color: "text.primary", fontWeight: 600 }}>
                    Mi Colección
                  </Typography>
                  {items.length > 0 && (
                    <Chip
                      label={`${items.length} ${items.length === 1 ? "compra" : "compras"}`}
                      size="small"
                      sx={{
                        height: 20, fontSize: "0.7rem",
                        backgroundColor: "rgba(255,255,255,0.07)",
                        color: TEXT_MUTED,
                      }}
                    />
                  )}
                </Box>
              </Box>

              <CardContent sx={{ pt: 0 }}>

                {/* Loading */}
                {loading && (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                    <CircularProgress sx={{ color: ORANGE }} />
                  </Box>
                )}

                {/* Error */}
                {!loading && fetchError && (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography variant="body2" sx={{ color: "#f44336", mb: 2 }}>
                      {fetchError}
                    </Typography>
                    <Button
                      onClick={fetchTesoreria}
                      size="small"
                      sx={{ color: ORANGE, textTransform: "none" }}
                    >
                      Reintentar
                    </Button>
                  </Box>
                )}

                {/* Empty state */}
                {!loading && !fetchError && items.length === 0 && (
                  <Box sx={{ textAlign: "center", py: 6 }}>
                    <SavingsIcon sx={{ fontSize: 64, color: "rgba(255,255,255,0.08)", mb: 2 }} />
                    <Typography variant="body1" sx={{ color: TEXT_MUTED, mb: 0.5 }}>
                      Tu tesorería está vacía
                    </Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)" }}>
                      Usa el formulario para agregar tu primer mineral
                    </Typography>
                  </Box>
                )}

                {/* Items list */}
                {!loading && !fetchError && items.length > 0 && (
                  <Box>
                    {items.map((item, i) => {
                      const ganancia = parseFloat(item.rendimiento);
                      const esPos    = ganancia >= 0;
                      const pct      = item.precio_compra > 0
                        ? ((item.precio_actual - item.precio_compra) / item.precio_compra) * 100
                        : 0;
                      const mColor   = mineralColor(item.mineral);

                      return (
                        <Box key={item.id_item}>
                          {i > 0 && <Divider sx={{ borderColor: BORDER, my: 1.5 }} />}

                          <Box sx={{
                            display: "flex", alignItems: "flex-start",
                            justifyContent: "space-between", gap: 1,
                          }}>
                            {/* Left: mineral info */}
                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, flex: 1, minWidth: 0 }}>
                              <Box sx={{
                                width: 10, height: 10, borderRadius: "50%",
                                backgroundColor: mColor, mt: 0.6, flexShrink: 0,
                              }} />
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.75, mb: 0.5 }}>
                                  <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 600 }}>
                                    {mineralLabel(item.mineral)}
                                  </Typography>
                                  <Chip
                                    label={`${fmt(item.cantidad, 4)} g`}
                                    size="small"
                                    sx={{ height: 20, fontSize: "0.7rem", backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
                                  />
                                  <Chip
                                    label={`compra: $${fmt(item.precio_compra)}/g`}
                                    size="small"
                                    sx={{ height: 20, fontSize: "0.7rem", backgroundColor: "rgba(255,255,255,0.05)", color: TEXT_MUTED }}
                                  />
                                </Box>
                                <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                                  Actual:{" "}
                                  <Typography component="span" variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                                    ${fmt(item.precio_actual)}/g
                                  </Typography>
                                  {"  •  "}
                                  Inversión:{" "}
                                  <Typography component="span" variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                                    ${fmt(item.valor_invertido)}
                                  </Typography>
                                </Typography>
                              </Box>
                            </Box>

                            {/* Right: value + P&L + delete */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                              <Box sx={{ textAlign: "right" }}>
                                <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 600 }}>
                                  ${fmt(item.valor_actual)}
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.25 }}>
                                  {esPos
                                    ? <TrendingUpIcon sx={{ fontSize: 13, color: "#4caf50" }} />
                                    : <TrendingDownIcon sx={{ fontSize: 13, color: "#f44336" }} />}
                                  <Typography
                                    variant="caption"
                                    sx={{ color: esPos ? "#4caf50" : "#f44336", fontWeight: 600 }}
                                  >
                                    {esPos ? "+" : ""}{fmt(ganancia)}{" "}
                                    ({esPos ? "+" : ""}{fmt(pct)}%)
                                  </Typography>
                                </Box>
                              </Box>
                              <IconButton
                                size="small"
                                onClick={() => openDeleteDialog(item)}
                                sx={{
                                  color: "rgba(255,255,255,0.25)",
                                  "&:hover": { color: "#f44336", backgroundColor: "rgba(244,67,54,0.1)" },
                                }}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}

              </CardContent>
            </Card>
          </Grid>

          {/* Info card — ancho completo */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 2 }}>
              <CardContent sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                <InfoOutlinedIcon sx={{ color: TEXT_MUTED, fontSize: 18, mt: 0.2, flexShrink: 0 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "text.primary", fontWeight: 600, mb: 0.5 }}>
                    Sobre la Tesorería
                  </Typography>
                  <Typography variant="caption" sx={{ color: TEXT_MUTED, lineHeight: 1.8, display: "block" }}>
                    La Tesorería Simbólica simula la compra y venta de metales preciosos usando precios en
                    tiempo real de Yahoo Finance. Cada compra descuenta del balance virtual y cada venta lo
                    incrementa al precio de mercado actual.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

        </Grid>
      </Container>

      {/* ── Delete / Sell dialog ── */}
      <Dialog
        open={deleteDialog.open}
        onClose={closeDeleteDialog}
        slotProps={{
          paper: {
            sx: {
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              minWidth: { xs: "90vw", sm: 380 },
            },
          },
        }}
      >
        {deleteDialog.item && (() => {
          const item = deleteDialog.item;
          const previewVenta = deleteQty && parseFloat(deleteQty) > 0 && parseFloat(deleteQty) <= item.cantidad
            ? item.precio_actual * parseFloat(deleteQty)
            : null;

          return (
            <>
              <DialogTitle sx={{ color: "text.primary", pb: 1 }}>
                Vender {mineralLabel(item.mineral)}
              </DialogTitle>

              <DialogContent>
                {/* Stock info */}
                <Box sx={{
                  mb: 2, p: 2,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderRadius: 1,
                  border: `1px solid ${BORDER}`,
                }}>
                  <Typography variant="caption" sx={{ color: TEXT_MUTED, display: "block" }}>
                    Disponible
                  </Typography>
                  <Typography variant="body1" sx={{ color: "text.primary", fontWeight: 600 }}>
                    {fmt(item.cantidad, 4)} gramos
                  </Typography>
                  <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                    Precio actual: ${fmt(item.precio_actual)}/g
                    {"  •  "}
                    Valor total: ${fmt(item.valor_actual)}
                  </Typography>
                </Box>

                {/* Quantity input */}
                <TextField
                  label="Cantidad a vender (g)"
                  value={deleteQty}
                  onChange={(e) => { setDeleteQty(e.target.value); setDeleteError(null); }}
                  type="number"
                  fullWidth
                  size="small"
                  slotProps={{ htmlInput: { min: 0.01, max: item.cantidad, step: "0.01" } }}
                  sx={{ ...textFieldSx, mb: previewVenta ? 1 : 0 }}
                />

                {/* Income preview */}
                {previewVenta && (
                  <Typography variant="caption" sx={{ color: ORANGE, display: "block", mt: 1 }}>
                    Recibirías: ~${fmt(previewVenta)}
                  </Typography>
                )}

                {deleteError && (
                  <Alert severity="error" sx={{ ...alertSx("error"), mt: 1.5 }}>
                    {deleteError}
                  </Alert>
                )}
              </DialogContent>

              <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, flexWrap: "wrap" }}>
                <Button
                  onClick={closeDeleteDialog}
                  disabled={deleteLoading}
                  sx={{ color: TEXT_MUTED, textTransform: "none" }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => handleVender(item.cantidad)}
                  disabled={deleteLoading}
                  variant="outlined"
                  sx={{
                    color: "#f44336", borderColor: "#f44336", textTransform: "none",
                    "&:hover": { backgroundColor: "rgba(244,67,54,0.1)", borderColor: "#f44336" },
                  }}
                >
                  Eliminar todo
                </Button>
                <Button
                  onClick={() => handleVender(parseFloat(deleteQty))}
                  disabled={deleteLoading || !deleteQty || parseFloat(deleteQty) <= 0}
                  variant="contained"
                  startIcon={deleteLoading ? <CircularProgress size={14} color="inherit" /> : null}
                  sx={primaryBtnSx}
                >
                  {deleteLoading ? "Vendiendo..." : "Vender cantidad"}
                </Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={alertSx(snackbar.severity)}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Tesoreria;
