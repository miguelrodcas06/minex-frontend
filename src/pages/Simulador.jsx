import { useState, useEffect, useCallback, useRef } from "react";
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
import ListSubheader from "@mui/material/ListSubheader";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Switch from "@mui/material/Switch";
import Snackbar from "@mui/material/Snackbar";

import SwapVertIcon from "@mui/icons-material/SwapVert";
import CalculateIcon from "@mui/icons-material/Calculate";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import api from "../api";

// ─── Datos ────────────────────────────────────────────────────────────────────
const MINERALS = [
  { id: 1, nombre: "oro",     label: "Oro",     symbol: "XAU", color: "#FFD700" },
  { id: 2, nombre: "plata",   label: "Plata",   symbol: "XAG", color: "#A8A9AD" },
  { id: 3, nombre: "platino", label: "Platino", symbol: "XPT", color: "#7EC8E3" },
  { id: 4, nombre: "paladio", label: "Paladio", symbol: "XPD", color: "#9B59B6" },
  { id: 5, nombre: "cobre",   label: "Cobre",   symbol: "CU",  color: "#CB6D51" },
];

// Monedas soportadas por el backend vía ?moneda=XXX
// "GRM" es un código interno para indicar que la cantidad ya está en gramos
const CURRENCIES = [
  { code: "GRM", label: "Gramos (g)",           flag: "⚖️" },
  { code: "USD", label: "Dólar estadounidense", flag: "🇺🇸" },
  { code: "EUR", label: "Euro",                 flag: "🇪🇺" },
  { code: "GBP", label: "Libra esterlina",      flag: "🇬🇧" },
  { code: "JPY", label: "Yen japonés",          flag: "🇯🇵" },
  { code: "CHF", label: "Franco suizo",         flag: "🇨🇭" },
  { code: "CAD", label: "Dólar canadiense",     flag: "🇨🇦" },
  { code: "AUD", label: "Dólar australiano",    flag: "🇦🇺" },
  { code: "CNY", label: "Yuan chino",           flag: "🇨🇳" },
];

// Helpers para parsear el valor prefijado del selector "Hacia"
// Formato: "m:oro" = mineral, "c:EUR" = moneda
const esMoneda   = (v) => v.startsWith("c:");
const parsarHacia = (v) => v.slice(2); // quita el prefijo

const ORANGE = "#e07b39";

function MineralOption({ mineral }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: mineral.color }} />
      {mineral.label} ({mineral.symbol})
    </Box>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
function Simulador() {
  const theme    = useTheme();
  const DARK_BG  = theme.palette.background.default;
  const CARD_BG  = theme.palette.background.paper;
  const BORDER   = theme.palette.divider;
  const TEXT_MAIN  = theme.palette.text.primary;
  const TEXT_MUTED = theme.palette.text.secondary;

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      color: TEXT_MAIN,
      backgroundColor: DARK_BG,
      "& fieldset": { borderColor: BORDER },
      "&:hover fieldset": { borderColor: "rgba(128,128,128,0.4)" },
      "&.Mui-focused fieldset": { borderColor: ORANGE },
    },
    "& .MuiInputLabel-root": { color: TEXT_MUTED },
    "& .MuiInputLabel-root.Mui-focused": { color: ORANGE },
    "& .MuiSvgIcon-root": { color: TEXT_MUTED },
  };

  const menuSx = {
    PaperProps: { sx: { backgroundColor: CARD_BG, color: TEXT_MAIN } },
  };

  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(sessionStorage.getItem("token")));

  // — Calculadora —
  // "hacia" usa prefijo: "m:plata" = mineral · "c:EUR" = moneda
  const [cantidad,     setCantidad]     = useState("100");
  const [monedaDesde,  setMonedaDesde]  = useState("GRM");
  const [mineralDesde, setMineralDesde] = useState("oro");
  const [hacia,        setHacia]        = useState("m:plata");
  const [resultado,    setResultado]    = useState(null);
  const [loadingCalc,  setLoadingCalc]  = useState(false);
  const [errorCalc,    setErrorCalc]    = useState(null);

  // — Alertas —
  const [alertMineral,   setAlertMineral]   = useState("");
  const [alertCondicion, setAlertCondicion] = useState("above");
  const [alertPrecio,    setAlertPrecio]    = useState("");
  const [alertas,        setAlertas]        = useState([]);
  const [loadingAlerta,  setLoadingAlerta]  = useState(false);
  const [loadingAlertas, setLoadingAlertas] = useState(false);
  const [errorAlerta,    setErrorAlerta]    = useState(null);
  const [okAlerta,       setOkAlerta]       = useState(null);
  const [notif,          setNotif]          = useState({ open: false, mensaje: "" });

  // Refs para detectar alertas disparadas por el vigilante
  const alertasRef            = useRef([]);
  const eliminadasManualRef   = useRef(new Set());

  // Cargar alertas del usuario
  const cargarAlertas = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoadingAlertas(true);
    try {
      const res = await api.get("/alertas");
      const nuevas = res.datos ?? [];

      // Detectar alertas disparadas por el vigilante (desaparecieron sin borrado manual)
      const nuevasIds = new Set(nuevas.map((a) => a.id_alert));
      const disparadas = alertasRef.current.filter(
        (a) => !nuevasIds.has(a.id_alert) && !eliminadasManualRef.current.has(a.id_alert)
      );
      if (disparadas.length > 0) {
        const a = disparadas[0];
        const condicion = a.condition_type === "above" ? "superado" : "caído por debajo de";
        const mineral   = a.id_mineral_mineral?.name ?? "Mineral";
        setNotif({
          open: true,
          mensaje: `🔔 ¡Alerta disparada! ${mineral} ha ${condicion} $${a.threshold_price}/g`,
        });
      }

      alertasRef.current = nuevas;
      setAlertas(nuevas);
    } catch { /* silencioso */ }
    finally { setLoadingAlertas(false); }
  }, [isLoggedIn]);

  // Escuchar eventos de login/logout del Navbar
  useEffect(() => {
    const onLogin  = () => setIsLoggedIn(true);
    const onLogout = () => { setIsLoggedIn(false); setAlertas([]); };
    window.addEventListener("minex:login",  onLogin);
    window.addEventListener("minex:logout", onLogout);
    return () => {
      window.removeEventListener("minex:login",  onLogin);
      window.removeEventListener("minex:logout", onLogout);
    };
  }, []);

  // Cargar alertas al montar/login y refrescar cada 60s para detectar alertas disparadas
  useEffect(() => {
    if (!isLoggedIn) return;
    cargarAlertas();
    const intervalo = setInterval(cargarAlertas, 60_000);
    return () => clearInterval(intervalo);
  }, [isLoggedIn, cargarAlertas]);

  // — Calcular equivalencia —
  const calcular = async () => {
    const cant = parseFloat(cantidad);
    if (!cant || cant <= 0) { setErrorCalc("Introduce una cantidad válida."); return; }
    setErrorCalc(null);
    setLoadingCalc(true);
    setResultado(null);

    try {
      const currDesde = CURRENCIES.find((c) => c.code === monedaDesde);
      const esGramos  = monedaDesde === "GRM";

      // Paso 1: obtener gramos del mineral origen
      let gramosOrigen, precioPorGramo;
      if (esGramos) {
        // La cantidad ya es en gramos, no hay que convertir
        gramosOrigen   = cant;
        precioPorGramo = null;
      } else {
        // Convertir importe monetario → gramos
        const endpoint = monedaDesde === "USD"
          ? `/minerales/${mineralDesde}`
          : `/minerales/${mineralDesde}?moneda=${monedaDesde}`;
        const resOrigen = await api.get(endpoint);
        precioPorGramo = resOrigen.datos.precio;
        gramosOrigen   = cant / precioPorGramo;
      }

      const valor = parsarHacia(hacia);

      if (esMoneda(hacia)) {
        // Paso 2a: convertir los gramos al valor en la moneda destino
        const currHacia = CURRENCIES.find((c) => c.code === valor);
        let totalDestino;
        if (valor === "GRM") {
          // El destino son gramos directamente — ya los tenemos calculados
          totalDestino = gramosOrigen;
        } else if (valor === monedaDesde) {
          totalDestino = cant; // misma moneda, sin conversión
        } else {
          const endpointH = valor === "USD"
            ? `/minerales/${mineralDesde}`
            : `/minerales/${mineralDesde}?moneda=${valor}`;
          const resHacia   = await api.get(endpointH);
          totalDestino = gramosOrigen * resHacia.datos.precio;
        }

        setResultado({
          tipo: "moneda",
          cant, monedaDesde, gramosOrigen,
          labelDesde:    MINERALS.find((m) => m.nombre === mineralDesde)?.label,
          flagDesde:     currDesde?.flag,
          totalDestino,
          monedaHacia:   valor,
          labelMonedaH:  currHacia?.label,
          flagHacia:     currHacia?.flag,
          precioPorGramo,
        });
      } else {
        // Paso 2b: convertir los gramos del origen a gramos del mineral destino
        const mineralHacia = valor;
        // Necesitamos precios en USD para hacer la conversión entre minerales
        const [resA, resB] = await Promise.all([
          api.get(`/minerales/${mineralDesde}`),
          api.get(`/minerales/${mineralHacia}`),
        ]);
        const precioAusd   = resA.datos.precio;
        const precioBusd   = resB.datos.precio;
        const valorUSD     = gramosOrigen * precioAusd;
        const equivalente  = valorUSD / precioBusd;

        setResultado({
          tipo: "mineral",
          cant, monedaDesde, gramosOrigen,
          labelDesde:  MINERALS.find((m) => m.nombre === mineralDesde)?.label,
          flagDesde:   currDesde?.flag,
          labelHacia:  MINERALS.find((m) => m.nombre === mineralHacia)?.label,
          colorHacia:  MINERALS.find((m) => m.nombre === mineralHacia)?.color,
          equivalente,
          valorUSD,
          precioAusd,
          precioBusd,
          precioPorGramo,
        });
      }
    } catch {
      setErrorCalc("No se pudo obtener la cotización. Comprueba el servidor.");
    } finally {
      setLoadingCalc(false);
    }
  };

  // Swap solo si ambos lados son minerales
  const swapMinerales = () => {
    if (esMoneda(hacia)) return;
    const nombreHacia = parsarHacia(hacia);
    setMineralDesde(nombreHacia);
    setHacia(`m:${mineralDesde}`);
    setResultado(null);
  };

  // — Crear alerta —
  const crearAlerta = async () => {
    if (!alertMineral || !alertPrecio) { setErrorAlerta("Completa todos los campos."); return; }
    const mineral = MINERALS.find((m) => m.nombre === alertMineral);
    setErrorAlerta(null);
    setOkAlerta(null);
    setLoadingAlerta(true);
    try {
      await api.post("/alertas", {
        id_mineral:      mineral.id,
        threshold_price: parseFloat(alertPrecio),
        condition_type:  alertCondicion,
      });
      setOkAlerta("Alerta creada correctamente.");
      setAlertMineral("");
      setAlertPrecio("");
      cargarAlertas();
    } catch (err) {
      setErrorAlerta(err.mensaje ?? "Error al crear la alerta.");
    } finally {
      setLoadingAlerta(false);
    }
  };

  const toggleAlerta = async (id) => {
    try { await api.patch(`/alertas/toggle/${id}`); cargarAlertas(); }
    catch { /* silencioso */ }
  };

  const eliminarAlerta = async (id) => {
    try {
      eliminadasManualRef.current.add(id);
      await api.delete(`/alertas/${id}`);
      setAlertas((prev) => prev.filter((a) => a.id_alert !== id));
      alertasRef.current = alertasRef.current.filter((a) => a.id_alert !== id);
    } catch { /* silencioso */ }
  };

  const alertasActivas = alertas.filter((a) => a.is_active).length;
  const mineralInfo    = (nombre) => MINERALS.find((m) => m.nombre === nombre);

  return (
    <Box sx={{ backgroundColor: DARK_BG, minHeight: "100vh", py: 4 }}>
      <Container maxWidth="lg">

        {/* ── Encabezado ───────────────────────────────────────────────── */}
        <Typography variant="h5" sx={{ color: TEXT_MAIN, fontWeight: 700, mb: 0.5 }}>
          Simulador de Intercambio
        </Typography>
        <Typography variant="body2" sx={{ color: TEXT_MUTED, mb: 4 }}>
          Calcula equivalencias entre diferentes minerales y monedas, y configura alertas de precio
        </Typography>

        {/* ── Calculadora ──────────────────────────────────────────────── */}
        <Card sx={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 2, mb: 3 }}>
          <CardContent sx={{ p: 3 }}>

            {/* Desde */}
            <Typography variant="caption" sx={{ color: TEXT_MUTED, fontWeight: 600, letterSpacing: 1 }}>
              DESDE
            </Typography>
            <Grid container spacing={2} sx={{ mt: 0.5, mb: 1 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Cantidad"
                  type="number"
                  value={cantidad}
                  onChange={(e) => { setCantidad(e.target.value); setResultado(null); }}
                  inputProps={{ min: 0, step: "any" }}
                  sx={inputSx}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth sx={inputSx}>
                  <InputLabel>Moneda</InputLabel>
                  <Select
                    value={monedaDesde}
                    label="Moneda"
                    onChange={(e) => { setMonedaDesde(e.target.value); setResultado(null); }}
                    MenuProps={menuSx}
                  >
                    {CURRENCIES.map((c) => (
                      <MenuItem key={c.code} value={c.code}>
                        {c.flag} {c.code} — {c.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth sx={inputSx}>
                  <InputLabel>Mineral</InputLabel>
                  <Select
                    value={mineralDesde}
                    label="Mineral"
                    onChange={(e) => { setMineralDesde(e.target.value); setResultado(null); }}
                    MenuProps={menuSx}
                  >
                    {MINERALS.map((m) => (
                      <MenuItem key={m.nombre} value={m.nombre}>
                        <MineralOption mineral={m} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Botón swap (solo activo si "hacia" es un mineral) */}
            <Box sx={{ display: "flex", justifyContent: "center", my: 1 }}>
              <IconButton
                onClick={swapMinerales}
                disabled={esMoneda(hacia)}
                sx={{
                  border: `1px solid ${BORDER}`,
                  backgroundColor: CARD_BG,
                  color: esMoneda(hacia) ? TEXT_MUTED : ORANGE,
                  "&:hover": { backgroundColor: "rgba(224,123,57,0.1)" },
                  "&.Mui-disabled": { color: TEXT_MUTED },
                }}
              >
                <SwapVertIcon />
              </IconButton>
            </Box>

            {/* Hacia */}
            <Typography variant="caption" sx={{ color: TEXT_MUTED, fontWeight: 600, letterSpacing: 1 }}>
              HACIA
            </Typography>
            <FormControl fullWidth sx={{ ...inputSx, mt: 1, mb: 2 }}>
              <InputLabel>Mineral / Moneda</InputLabel>
              <Select
                value={hacia}
                label="Mineral / Moneda"
                onChange={(e) => { setHacia(e.target.value); setResultado(null); }}
                MenuProps={menuSx}
              >
                <ListSubheader sx={{ backgroundColor: "#1c2333", color: TEXT_MUTED, fontSize: "0.7rem", letterSpacing: 1 }}>
                  MINERALES
                </ListSubheader>
                {MINERALS.map((m) => (
                  <MenuItem key={`m:${m.nombre}`} value={`m:${m.nombre}`}>
                    <MineralOption mineral={m} />
                  </MenuItem>
                ))}
                <ListSubheader sx={{ backgroundColor: "#1c2333", color: TEXT_MUTED, fontSize: "0.7rem", letterSpacing: 1 }}>
                  MONEDAS
                </ListSubheader>
                {CURRENCIES.map((c) => (
                  <MenuItem key={`c:${c.code}`} value={`c:${c.code}`}>
                    {c.flag} {c.label} ({c.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {errorCalc && (
              <Alert severity="error" sx={{ mb: 2, backgroundColor: "#1e1010", color: "#ff6b6b" }}>
                {errorCalc}
              </Alert>
            )}

            <Button
              fullWidth
              variant="contained"
              startIcon={loadingCalc ? <CircularProgress size={16} color="inherit" /> : <CalculateIcon />}
              onClick={calcular}
              disabled={loadingCalc}
              sx={{
                backgroundColor: ORANGE,
                color: "white",
                textTransform: "none",
                fontWeight: 600,
                py: 1.4,
                boxShadow: "none",
                "&:hover": { backgroundColor: "#c96a2a", boxShadow: "none" },
              }}
            >
              {loadingCalc ? "Calculando..." : "Calcular Equivalencia"}
            </Button>

            {/* Resultado */}
            {resultado && (
              <Box
                sx={{
                  mt: 3, p: 2.5,
                  backgroundColor: "rgba(224,123,57,0.06)",
                  border: `1px solid rgba(224,123,57,0.2)`,
                  borderRadius: 2,
                  textAlign: "center",
                }}
              >
                {(() => {
                  const esG = resultado.monedaDesde === "GRM";
                  const desdeLabel = esG
                    ? `${resultado.cant} g de ${resultado.labelDesde}`
                    : `${resultado.flagDesde} ${resultado.cant.toLocaleString()} ${resultado.monedaDesde} de ${resultado.labelDesde} (${resultado.gramosOrigen.toFixed(4)} g)`;

                  return resultado.tipo === "mineral" ? (
                    <>
                      <Typography variant="body2" sx={{ color: TEXT_MUTED, mb: 0.5 }}>
                        {desdeLabel} equivalen a
                      </Typography>
                      <Typography variant="h4" sx={{ color: resultado.colorHacia ?? ORANGE, fontWeight: 700 }}>
                        {resultado.equivalente.toFixed(6)} g
                      </Typography>
                      <Typography variant="body2" sx={{ color: TEXT_MAIN, fontWeight: 600 }}>
                        de {resultado.labelHacia}
                      </Typography>
                      <Divider sx={{ borderColor: BORDER, my: 1.5 }} />
                      <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                        {!esG && `Precio ${resultado.labelDesde}: ${resultado.precioPorGramo.toFixed(4)} ${resultado.monedaDesde}/g · `}
                        Valor USD: ${resultado.valorUSD.toFixed(4)} · 1g {resultado.labelHacia} = ${resultado.precioBusd}/g
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="body2" sx={{ color: TEXT_MUTED, mb: 0.5 }}>
                        {desdeLabel} equivalen a
                      </Typography>
                      <Typography variant="h4" sx={{ color: ORANGE, fontWeight: 700 }}>
                        {resultado.totalDestino.toFixed(4)} {resultado.monedaHacia}
                      </Typography>
                      <Typography variant="body2" sx={{ color: TEXT_MAIN, fontWeight: 600 }}>
                        {resultado.flagHacia} {resultado.labelMonedaH}
                      </Typography>
                      <Divider sx={{ borderColor: BORDER, my: 1.5 }} />
                      <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                        {!esG && `Precio ${resultado.labelDesde}: ${resultado.precioPorGramo.toFixed(4)} ${resultado.monedaDesde}/g`}
                      </Typography>
                    </>
                  );
                })()}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* ── Alertas ───────────────────────────────────────────────────── */}
        <Grid container spacing={3} sx={{ mb: 3 }}>

          {/* Configurar alerta */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 2, height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ color: TEXT_MAIN, fontWeight: 700, mb: 2.5 }}>
                  Configurar Alerta de Precio
                </Typography>

                {!isLoggedIn ? (
                  <Alert severity="info" sx={theme.palette.mode === "dark" ? { backgroundColor: "#0d1f33", color: "#64b5f6" } : {}}>
                    Inicia sesión para configurar alertas de precio.
                  </Alert>
                ) : (
                  <>
                    <FormControl fullWidth sx={{ ...inputSx, mb: 2 }}>
                      <InputLabel>Mineral</InputLabel>
                      <Select value={alertMineral} label="Mineral" onChange={(e) => setAlertMineral(e.target.value)} MenuProps={menuSx}>
                        <MenuItem value="" disabled>Seleccionar...</MenuItem>
                        {MINERALS.map((m) => (
                          <MenuItem key={m.nombre} value={m.nombre}><MineralOption mineral={m} /></MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ ...inputSx, mb: 2 }}>
                      <InputLabel>Condición</InputLabel>
                      <Select value={alertCondicion} label="Condición" onChange={(e) => setAlertCondicion(e.target.value)} MenuProps={menuSx}>
                        <MenuItem value="above">Por encima de</MenuItem>
                        <MenuItem value="below">Por debajo de</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      fullWidth
                      label="Precio Objetivo (USD/g)"
                      type="number"
                      value={alertPrecio}
                      onChange={(e) => setAlertPrecio(e.target.value)}
                      inputProps={{ min: 0, step: "any" }}
                      sx={{ ...inputSx, mb: 2 }}
                    />

                    {errorAlerta && <Alert severity="error" sx={{ mb: 2, backgroundColor: "#1e1010", color: "#ff6b6b" }}>{errorAlerta}</Alert>}
                    {okAlerta    && <Alert severity="success" sx={{ mb: 2, backgroundColor: "#0e2a1a", color: "#80ff9b" }}>{okAlerta}</Alert>}

                    <Button
                      fullWidth variant="contained"
                      startIcon={loadingAlerta ? <CircularProgress size={16} color="inherit" /> : <NotificationsActiveIcon />}
                      onClick={crearAlerta} disabled={loadingAlerta}
                      sx={{ backgroundColor: ORANGE, color: "white", textTransform: "none", fontWeight: 600, py: 1.2, boxShadow: "none", "&:hover": { backgroundColor: "#c96a2a", boxShadow: "none" } }}
                    >
                      {loadingAlerta ? "Creando..." : "Crear Alerta"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Alertas configuradas */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 2, height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
                  <Typography variant="subtitle1" sx={{ color: TEXT_MAIN, fontWeight: 700 }}>
                    Alertas Configuradas
                  </Typography>
                  <Chip
                    label={`${alertasActivas} activas`}
                    size="small"
                    sx={{ backgroundColor: alertasActivas > 0 ? "rgba(224,123,57,0.15)" : "rgba(255,255,255,0.06)", color: alertasActivas > 0 ? ORANGE : TEXT_MUTED, fontWeight: 600 }}
                  />
                </Box>

                {!isLoggedIn ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <NotificationsOffIcon sx={{ fontSize: 48, color: BORDER, mb: 1 }} />
                    <Typography variant="body2" sx={{ color: TEXT_MUTED }}>Inicia sesión para ver tus alertas</Typography>
                  </Box>
                ) : loadingAlertas ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress size={28} sx={{ color: ORANGE }} />
                  </Box>
                ) : alertas.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <NotificationsOffIcon sx={{ fontSize: 48, color: BORDER, mb: 1 }} />
                    <Typography variant="body2" sx={{ color: TEXT_MUTED }}>No hay alertas configuradas</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {alertas.map((alerta) => {
                      const nombre = alerta.id_mineral_mineral?.name?.toLowerCase() ?? "";
                      const info   = mineralInfo(nombre);
                      return (
                        <Box
                          key={alerta.id_alert}
                          sx={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            p: 1.5, backgroundColor: DARK_BG, border: `1px solid ${BORDER}`,
                            borderRadius: 1.5, opacity: alerta.is_active ? 1 : 0.5,
                          }}
                        >
                          <Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.3 }}>
                              {info && <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: info.color }} />}
                              <Typography variant="body2" sx={{ color: TEXT_MAIN, fontWeight: 600 }}>
                                {alerta.id_mineral_mineral?.name ?? "—"}
                              </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                              {alerta.condition_type === "above" ? "Por encima de" : "Por debajo de"} ${alerta.threshold_price}/g
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Switch
                              size="small"
                              checked={Boolean(alerta.is_active)}
                              onChange={() => toggleAlerta(alerta.id_alert)}
                              sx={{ "& .MuiSwitch-thumb": { backgroundColor: alerta.is_active ? ORANGE : undefined } }}
                            />
                            <IconButton size="small" onClick={() => eliminarAlerta(alerta.id_alert)}
                              sx={{ color: TEXT_MUTED, "&:hover": { color: "#ff6b6b" } }}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ── Info cards ───────────────────────────────────────────────── */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <HelpOutlineIcon sx={{ color: ORANGE, fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ color: TEXT_MAIN, fontWeight: 700 }}>¿Cómo funciona?</Typography>
                </Box>
                <Typography variant="body2" sx={{ color: TEXT_MUTED, lineHeight: 1.7 }}>
                  El simulador utiliza las cotizaciones actuales para calcular equivalencias precisas entre
                  diferentes minerales y monedas. Ideal para análisis comparativos y educación financiera.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <InfoOutlinedIcon sx={{ color: ORANGE, fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ color: TEXT_MAIN, fontWeight: 700 }}>Valores de Referencia</Typography>
                </Box>
                <Typography variant="body2" sx={{ color: TEXT_MUTED, lineHeight: 1.7 }}>
                  Los precios se basan en cotizaciones de mercados internacionales. Para metales preciosos
                  se usa onza troy (31.1g), para metales industriales toneladas métricas.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

      </Container>

      {/* ── Notificación alerta disparada ────────────────────────────── */}
      <Snackbar
        open={notif.open}
        autoHideDuration={6000}
        onClose={() => setNotif((n) => ({ ...n, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setNotif((n) => ({ ...n, open: false }))}
          severity="success"
          sx={{ backgroundColor: "#1a2e1a", color: "#80ff9b", "& .MuiAlert-icon": { color: "#4caf50" } }}
        >
          {notif.mensaje}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Simulador;
