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
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Switch from "@mui/material/Switch";
import Snackbar from "@mui/material/Snackbar";

import CalculateIcon from "@mui/icons-material/Calculate";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

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
const CURRENCIES = [
  { code: "USD", label: "Dólar estadounidense", flag: "🇺🇸" },
  { code: "EUR", label: "Euro",                 flag: "🇪🇺" },
  { code: "GBP", label: "Libra esterlina",      flag: "🇬🇧" },
  { code: "JPY", label: "Yen japonés",          flag: "🇯🇵" },
  { code: "CHF", label: "Franco suizo",         flag: "🇨🇭" },
  { code: "CAD", label: "Dólar canadiense",     flag: "🇨🇦" },
  { code: "AUD", label: "Dólar australiano",    flag: "🇦🇺" },
  { code: "CNY", label: "Yuan chino",           flag: "🇨🇳" },
];

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
  const [cantidad,       setCantidad]       = useState("100");
  const [mineralDesde,   setMineralDesde]   = useState("oro");
  const [monedaHacia,    setMonedaHacia]    = useState("USD");
  const [resultado,      setResultado]      = useState(null);
  const [loadingCalc,    setLoadingCalc]    = useState(false);
  const [errorCalc,      setErrorCalc]      = useState(null);

  // — Añadir a tesorería —
  const [loadingTesoreria, setLoadingTesoreria] = useState(false);
  const [snackTesoreria,   setSnackTesoreria]   = useState({ open: false, mensaje: "", severity: "success" });

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
      // DESDE siempre son gramos → HACIA siempre es una moneda
      const endpoint = monedaHacia === "USD"
        ? `/minerales/${mineralDesde}`
        : `/minerales/${mineralDesde}?moneda=${monedaHacia}`;

      const res          = await api.get(endpoint);
      const precioPorGramo = res.datos.precio;
      const totalDestino   = cant * precioPorGramo;
      const currHacia      = CURRENCIES.find((c) => c.code === monedaHacia);

      setResultado({
        cant,
        mineralDesde,
        labelDesde:   MINERALS.find((m) => m.nombre === mineralDesde)?.label,
        totalDestino,
        monedaHacia,
        labelMonedaH: currHacia?.label,
        flagHacia:    currHacia?.flag,
        precioPorGramo,
      });
    } catch {
      setErrorCalc("No se pudo obtener la cotización. Comprueba el servidor.");
    } finally {
      setLoadingCalc(false);
    }
  };

  // — Añadir resultado a la tesorería —
  const añadirATesoreria = async () => {
    if (!resultado) return;
    setLoadingTesoreria(true);
    try {
      // El backend siempre trabaja en USD: calcula el coste con precio spot actual
      // y lo descuenta del balance del usuario — no necesitamos convertir aquí
      await api.post("/tesoreria", {
        mineral:  resultado.mineralDesde,
        cantidad: resultado.cant,
      });
      setSnackTesoreria({
        open:     true,
        mensaje:  `✅ ${resultado.cant} g de ${resultado.labelDesde} añadidos a tu tesorería`,
        severity: "success",
      });
    } catch (err) {
      setSnackTesoreria({
        open:     true,
        mensaje:  err.mensaje ?? "Error al añadir a la tesorería",
        severity: "error",
      });
    } finally {
      setLoadingTesoreria(false);
    }
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
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: "50%",
              backgroundColor: "rgba(224,123,57,0.15)",
              border: "1px solid rgba(224,123,57,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <CalculateIcon sx={{ color: ORANGE, fontSize: 20 }} />
            </Box>
            <Typography variant="h5" sx={{ color: TEXT_MAIN, fontWeight: 700 }}>
              Simulador de Intercambio
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: TEXT_MUTED, ml: 7 }}>
            Calcula equivalencias entre diferentes minerales y monedas, y configura alertas de precio
          </Typography>
        </Box>

        {/* ── Calculadora ──────────────────────────────────────────────── */}
        <Card sx={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 2, mb: 3 }}>
          <CardContent sx={{ p: 3 }}>

            {/* Desde */}
            <Typography variant="caption" sx={{ color: TEXT_MUTED, fontWeight: 600, letterSpacing: 1 }}>
              DESDE
            </Typography>
            <Grid container spacing={2} sx={{ mt: 0.5, mb: 1 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Cantidad (gramos)"
                  type="number"
                  value={cantidad}
                  onChange={(e) => { setCantidad(e.target.value); setResultado(null); }}
                  inputProps={{ min: 0, step: "any" }}
                  sx={inputSx}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
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

            {/* Separador */}
            <Divider sx={{ borderColor: BORDER, my: 2 }}>
              <Typography variant="caption" sx={{ color: TEXT_MUTED, fontWeight: 600, letterSpacing: 1, px: 1 }}>
                EQUIVALE A
              </Typography>
            </Divider>

            {/* Hacia */}
            <Typography variant="caption" sx={{ color: TEXT_MUTED, fontWeight: 600, letterSpacing: 1 }}>
              HACIA
            </Typography>
            <FormControl fullWidth sx={{ ...inputSx, mt: 1, mb: 2 }}>
              <InputLabel>Moneda</InputLabel>
              <Select
                value={monedaHacia}
                label="Moneda"
                onChange={(e) => { setMonedaHacia(e.target.value); setResultado(null); }}
                MenuProps={menuSx}
              >
                {CURRENCIES.map((c) => (
                  <MenuItem key={c.code} value={c.code}>
                    {c.flag} {c.code} — {c.label}
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
                <Typography variant="body2" sx={{ color: TEXT_MUTED, mb: 0.5 }}>
                  {resultado.cant} g de {resultado.labelDesde} equivalen a
                </Typography>
                <Typography variant="h4" sx={{ color: ORANGE, fontWeight: 700 }}>
                  {resultado.totalDestino.toFixed(4)} {resultado.monedaHacia}
                </Typography>
                <Typography variant="body2" sx={{ color: TEXT_MAIN, fontWeight: 600 }}>
                  {resultado.flagHacia} {resultado.labelMonedaH}
                </Typography>
                <Divider sx={{ borderColor: BORDER, my: 1.5 }} />
                <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                  Precio {resultado.labelDesde}: {resultado.precioPorGramo.toFixed(4)} {resultado.monedaHacia}/g
                </Typography>

                {/* Botón añadir a tesorería (solo si está logueado) */}
                {isLoggedIn && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={loadingTesoreria ? <CircularProgress size={14} color="inherit" /> : <AccountBalanceIcon />}
                      onClick={añadirATesoreria}
                      disabled={loadingTesoreria}
                      sx={{
                        borderColor: ORANGE,
                        color: ORANGE,
                        textTransform: "none",
                        fontWeight: 600,
                        "&:hover": { backgroundColor: "rgba(224,123,57,0.1)", borderColor: ORANGE },
                      }}
                    >
                      {loadingTesoreria ? "Añadiendo..." : `Añadir ${resultado.cant} g de ${resultado.labelDesde} a mi tesorería`}
                    </Button>
                    {resultado.monedaHacia !== "USD" && (
                      <Typography variant="caption" sx={{ display: "block", mt: 0.75, color: TEXT_MUTED }}>
                        El coste se descontará de tu saldo en USD al precio spot actual.
                      </Typography>
                    )}
                  </Box>
                )}
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

      {/* ── Notificación tesorería ───────────────────────────────────── */}
      <Snackbar
        open={snackTesoreria.open}
        autoHideDuration={4000}
        onClose={() => setSnackTesoreria((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackTesoreria((s) => ({ ...s, open: false }))}
          severity={snackTesoreria.severity}
          sx={snackTesoreria.severity === "success"
            ? { backgroundColor: "#0e2a1a", color: "#80ff9b", "& .MuiAlert-icon": { color: "#4caf50" } }
            : { backgroundColor: "#2a0e0e", color: "#ff6b6b", "& .MuiAlert-icon": { color: "#f44336" } }
          }
        >
          {snackTesoreria.mensaje}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Simulador;
