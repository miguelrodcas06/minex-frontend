import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import IconButton from "@mui/material/IconButton";

import DiamondIcon from "@mui/icons-material/Diamond";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import CloseIcon from "@mui/icons-material/Close";

import api from "../api";

const ORANGE = "#e07b39";
const OZ_TO_G = 31.1035;

const TIPOS = [
  { value: "",      label: "Todos"    },
  { value: "coin",  label: "Monedas"  },
  { value: "ingot", label: "Lingotes" },
  { value: "bar",   label: "Barras"   },
];

const METALES = [
  { value: "",      label: "Todos" },
  { value: "oro",   label: "Oro"   },
  { value: "plata", label: "Plata" },
];

const TYPE_LABEL = { coin: "Moneda", ingot: "Lingote", bar: "Barra", round: "Round" };

function formatPrecio(valor) {
  if (valor == null) return "—";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD" }).format(valor);
}

function formatPureza(purity) {
  return `${(parseFloat(purity) * 1000).toFixed(0)}/1000`;
}

function formatPeso(weight_oz) {
  const gramos = parseFloat(weight_oz) * OZ_TO_G;
  // Si es número entero de gramos lo mostramos sin decimales
  return gramos % 1 === 0 ? `${gramos.toFixed(0)} g` : `${gramos.toFixed(2)} g`;
}

// ─── Tarjeta de producto ──────────────────────────────────────────────────────
function ProductCard({ producto, onClick }) {
  const isGold = producto.mineral?.name === "oro";
  const accentColor = isGold ? "#FFD700" : "#C0C0C0";
  const [imgError, setImgError] = useState(false);

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        transition: "box-shadow 0.2s, border-color 0.2s",
        "&:hover": {
          boxShadow: `0 0 0 1.5px ${ORANGE}55`,
          borderColor: ORANGE,
        },
      }}
    >
      <CardActionArea onClick={() => onClick(producto)} sx={{ p: 0 }}>
        {/* Imagen / icono */}
        <Box
          sx={{
            height: 130,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: isGold ? "rgba(255,215,0,0.06)" : "rgba(192,192,192,0.06)",
            borderBottom: "1px solid",
            borderColor: "divider",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {producto.image_url && !imgError ? (
            <Box
              component="img"
              src={producto.image_url}
              alt={producto.name}
              onError={() => setImgError(true)}
              sx={{
                height: "100%",
                width: "100%",
                objectFit: "contain",
                p: 1.5,
              }}
            />
          ) : (
            <MonetizationOnIcon sx={{ fontSize: 52, color: accentColor, opacity: 0.7 }} />
          )}

          {producto.is_exclusive && (
            <WorkspacePremiumIcon
              sx={{ position: "absolute", top: 8, right: 8, fontSize: 18, color: ORANGE }}
            />
          )}
        </Box>

        <CardContent sx={{ p: 2 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1.3, mb: 0.75 }}
          >
            {producto.name}
          </Typography>

          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 1.5 }}>
            <Chip
              label={TYPE_LABEL[producto.type] ?? producto.type}
              size="small"
              sx={{ fontSize: "0.65rem", height: 18, bgcolor: `${accentColor}22`, color: "text.secondary" }}
            />
            <Chip
              label={formatPeso(producto.weight_oz)}
              size="small"
              sx={{ fontSize: "0.65rem", height: 18 }}
              variant="outlined"
            />
            <Chip
              label={formatPureza(producto.purity)}
              size="small"
              sx={{ fontSize: "0.65rem", height: 18 }}
              variant="outlined"
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {producto.country ?? "—"}
              {producto.year ? ` · ${producto.year}` : ""}
            </Typography>
            <Typography variant="caption" sx={{ color: ORANGE, fontWeight: 600 }}>
              Ver precio →
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

// ─── Dialog de detalle ────────────────────────────────────────────────────────
function ProductDialog({ producto, open, onClose }) {
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!open || !producto) return;
    setDetalle(null);
    setImgError(false);
    setLoading(true);
    api.get(`/productos/${producto.id_product}`)
      .then((res) => setDetalle(res.datos))
      .catch(() => setDetalle(producto))
      .finally(() => setLoading(false));
  }, [open, producto]);

  if (!producto) return null;

  const isGold = producto.mineral?.name === "oro";
  const accentColor = isGold ? "#FFD700" : "#C0C0C0";

  const fila = (label, valor) => (
    <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.75 }}>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>{valor}</Typography>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, pr: 1 }}>
          {producto.name}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={32} sx={{ color: ORANGE }} />
          </Box>
        ) : (
          <>
            {/* Imagen */}
            {detalle?.image_url && !imgError && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mb: 2,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: isGold ? "rgba(255,215,0,0.06)" : "rgba(192,192,192,0.06)",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Box
                  component="img"
                  src={detalle.image_url}
                  alt={detalle.name}
                  onError={() => setImgError(true)}
                  sx={{ height: 160, objectFit: "contain" }}
                />
              </Box>
            )}

            {/* Precio actual */}
            <Box
              sx={{
                textAlign: "center",
                py: 2,
                mb: 2,
                borderRadius: 2,
                bgcolor: isGold ? "rgba(255,215,0,0.07)" : "rgba(192,192,192,0.07)",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Precio estimado actual
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: ORANGE }}>
                {formatPrecio(detalle?.precio_actual)}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Prima sobre spot: {parseFloat(detalle?.premium_pct ?? 0).toFixed(1)}%
              </Typography>
            </Box>

            <Divider sx={{ mb: 1.5 }} />

            {fila("Metal", isGold ? "Oro" : "Plata")}
            {fila("Tipo", TYPE_LABEL[detalle?.type] ?? detalle?.type)}
            {fila("Peso", formatPeso(detalle?.weight_oz))}
            {fila("Pureza", formatPureza(detalle?.purity))}
            {fila("País", detalle?.country ?? "—")}
            {fila("Año", detalle?.year ?? "—")}

            {detalle?.is_exclusive && (
              <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 0.5 }}>
                <WorkspacePremiumIcon sx={{ fontSize: 16, color: ORANGE }} />
                <Typography variant="caption" sx={{ color: ORANGE, fontWeight: 600 }}>
                  Producto exclusivo
                </Typography>
              </Box>
            )}

            {detalle?.description && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                  {detalle.description}
                </Typography>
              </>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small" sx={{ color: "text.secondary", textTransform: "none" }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
function Catalogo() {
  const [productos,     setProductos]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [tipoFiltro,    setTipoFiltro]    = useState("");
  const [metalFiltro,   setMetalFiltro]   = useState("");
  const [soloExclusive, setSoloExclusive] = useState(false);
  const [dialogProducto, setDialogProducto] = useState(null);
  const [dialogOpen,     setDialogOpen]     = useState(false);

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (tipoFiltro)    params.type      = tipoFiltro;
      if (metalFiltro)   params.mineral   = metalFiltro;
      if (soloExclusive) params.exclusive = true;

      const res = await api.get("/productos", { params });
      setProductos(res.datos ?? []);
    } catch (err) {
      setError(err.mensaje ?? "Error al cargar el catálogo");
    } finally {
      setLoading(false);
    }
  }, [tipoFiltro, metalFiltro, soloExclusive]);

  useEffect(() => { fetchProductos(); }, [fetchProductos]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>

        {/* Cabecera */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
            <DiamondIcon sx={{ color: ORANGE, fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary" }}>
              Catálogo de Metales
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Monedas, lingotes y barras de metales preciosos con precio estimado en tiempo real.
          </Typography>
        </Box>

        {/* Filtros */}
        <Box
          sx={{
            display: "flex", flexWrap: "wrap", gap: 2, mb: 3, p: 2,
            borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper",
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary", mb: 0.5, display: "block" }}>Tipo</Typography>
            <ToggleButtonGroup size="small" exclusive value={tipoFiltro}
              onChange={(_, val) => val !== null && setTipoFiltro(val)}>
              {TIPOS.map((t) => (
                <ToggleButton key={t.value} value={t.value}
                  sx={{ textTransform: "none", fontSize: "0.75rem", px: 1.5,
                    "&.Mui-selected": { color: ORANGE, borderColor: ORANGE, bgcolor: `${ORANGE}15` } }}>
                  {t.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary", mb: 0.5, display: "block" }}>Metal</Typography>
            <ToggleButtonGroup size="small" exclusive value={metalFiltro}
              onChange={(_, val) => val !== null && setMetalFiltro(val)}>
              {METALES.map((m) => (
                <ToggleButton key={m.value} value={m.value}
                  sx={{ textTransform: "none", fontSize: "0.75rem", px: 1.5,
                    "&.Mui-selected": { color: ORANGE, borderColor: ORANGE, bgcolor: `${ORANGE}15` } }}>
                  {m.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ display: "flex", alignItems: "flex-end" }}>
            <Chip
              icon={<WorkspacePremiumIcon sx={{ fontSize: "14px !important" }} />}
              label="Solo exclusivos"
              onClick={() => setSoloExclusive((v) => !v)}
              variant={soloExclusive ? "filled" : "outlined"}
              size="small"
              sx={{
                cursor: "pointer",
                ...(soloExclusive
                  ? { bgcolor: ORANGE, color: "#fff", "& .MuiChip-icon": { color: "#fff" } }
                  : { borderColor: "divider" }),
              }}
            />
          </Box>

          <Box sx={{ ml: "auto", display: "flex", alignItems: "flex-end" }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              <ViewModuleIcon sx={{ fontSize: 13, mr: 0.4, verticalAlign: "middle" }} />
              {loading ? "—" : `${productos.length} productos`}
            </Typography>
          </Box>
        </Box>

        {/* Contenido */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress sx={{ color: ORANGE }} />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: "center", py: 10 }}>
            <Typography variant="body2" sx={{ color: "error.main", mb: 2 }}>{error}</Typography>
            <Button onClick={fetchProductos} size="small" sx={{ color: ORANGE, textTransform: "none" }}>Reintentar</Button>
          </Box>
        ) : productos.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 10 }}>
            <DiamondIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              No hay productos con los filtros seleccionados.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {productos.map((p) => (
              <Grid key={p.id_product} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <ProductCard producto={p} onClick={(prod) => { setDialogProducto(prod); setDialogOpen(true); }} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <ProductDialog
        producto={dialogProducto}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </Box>
  );
}

export default Catalogo;
