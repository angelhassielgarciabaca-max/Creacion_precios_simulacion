# ==============================================================================
# PROYECTO: QUANTMARKET TERMINAL & SIMULADOR DE MONTE CARLO
# Aplicación interactiva de Finanzas Cuantitativas & Microestructura de Mercado
# Diseñado para Streamlit Community Cloud (Estilo Terminal Bloomberg / Refinitiv)
# ==============================================================================

import time
import datetime
import numpy as np
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import streamlit as st

# ------------------------------------------------------------------------------
# 1. CONFIGURACIÓN DE PÁGINA Y ESTILO TERMINAL PREMIUM (IDÉNTICO A REACT)
# ------------------------------------------------------------------------------
st.set_page_config(
    page_title="QuantMarket Terminal | Microestructura & Monte Carlo",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Inyección de CSS de alta fidelidad para replicar la terminal de AI Studio
st.markdown("""
<style>
    /* Ocultar barra superior vacía de Streamlit y ajustar márgenes */
    header[data-testid="stHeader"] {
        background: rgba(7, 11, 20, 0.85) !important;
        backdrop-filter: blur(8px);
    }
    .main .block-container {
        padding-top: 1.5rem !important;
        padding-bottom: 2rem !important;
        max-width: 98% !important;
    }
    .stApp {
        background-color: #070b14 !important;
        color: #f1f5f9 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", monospace !important;
    }

    /* Pestañas estilo Terminal Cuántica */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
        background-color: transparent;
        border-bottom: 1px solid #1e293b;
        padding-bottom: 4px;
        margin-bottom: 16px;
    }
    .stTabs [data-baseweb="tab"] {
        background-color: #0b1120 !important;
        border: 1px solid #1e293b !important;
        border-radius: 8px 8px 0 0 !important;
        color: #94a3b8 !important;
        font-weight: 600 !important;
        font-size: 0.82rem !important;
        padding: 8px 16px !important;
        transition: all 0.2s ease;
    }
    .stTabs [aria-selected="true"] {
        background: linear-gradient(180deg, #132238 0%, #0c1829 100%) !important;
        color: #38bdf8 !important;
        border-color: #0284c7 !important;
        border-bottom: 2px solid #38bdf8 !important;
    }

    /* Botones primarios y secundarios */
    .stButton > button {
        background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%) !important;
        color: #ffffff !important;
        border: 1px solid #38bdf8 !important;
        border-radius: 8px !important;
        font-weight: 700 !important;
        font-size: 0.82rem !important;
        padding: 0.5rem 1rem !important;
        transition: all 0.2s ease !important;
        box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25) !important;
    }
    .stButton > button:hover {
        transform: translateY(-1px) !important;
        box-shadow: 0 6px 16px rgba(2, 132, 199, 0.45) !important;
        border-color: #7dd3fc !important;
    }

    /* Tarjetas métricas superiores */
    .metric-card {
        background: linear-gradient(135deg, #0d1527 0%, #090e1a 100%);
        border: 1px solid #1e293b;
        border-radius: 10px;
        padding: 10px 14px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
    }
    .metric-title {
        font-size: 0.70rem;
        color: #64748b;
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.05em;
        margin-bottom: 2px;
    }
    .metric-val {
        font-size: 1.45rem;
        font-weight: 800;
        font-family: "Courier New", monospace;
    }
    .c-green { color: #10b981; }
    .c-red { color: #f43f5e; }
    .c-cyan { color: #38bdf8; }
    .c-gold { color: #fbbf24; }

    /* Contenedores de paneles */
    .panel-box {
        background: #090d16;
        border: 1px solid #1e293b;
        border-radius: 10px;
        padding: 14px;
        margin-bottom: 12px;
    }
    .panel-header {
        font-size: 0.8rem;
        font-weight: 700;
        color: #e2e8f0;
        letter-spacing: 0.03em;
        border-bottom: 1px solid #1e293b;
        padding-bottom: 6px;
        margin-bottom: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    /* Fila del Libro de órdenes L2 */
    .book-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
        padding: 3px 8px;
        margin-bottom: 2px;
        font-family: monospace;
        font-size: 11.5px;
        background: #0c1322;
        border-radius: 4px;
        overflow: hidden;
    }
    .book-fill-ask {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        background: rgba(244, 63, 94, 0.16);
        pointer-events: none;
    }
    .book-fill-bid {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        background: rgba(16, 185, 129, 0.16);
        pointer-events: none;
    }
    .block-tag {
        background: rgba(245, 158, 11, 0.20);
        color: #fcd34d;
        border: 1px solid #f59e0b;
        padding: 1px 6px;
        border-radius: 3px;
        font-size: 9.5px;
        font-weight: bold;
    }
</style>
""", unsafe_allow_html=True)


# ------------------------------------------------------------------------------
# 2. INICIALIZACIÓN DE ESTADO DE SESIÓN (st.session_state)
# ------------------------------------------------------------------------------
def init_session_state():
    if "market_paused" not in st.session_state:
        st.session_state.market_paused = False

    if "current_price" not in st.session_state:
        st.session_state.current_price = 100.00

    if "s0_frozen" not in st.session_state:
        st.session_state.s0_frozen = 100.00

    if "price_history" not in st.session_state:
        base_price = 100.00
        now = datetime.datetime.now()
        history = []
        for i in range(30, 0, -1):
            t = now - datetime.timedelta(seconds=i * 3)
            open_p = base_price
            delta = (np.random.uniform(-0.4, 0.4))
            close_p = round(open_p + delta, 2)
            high_p = round(max(open_p, close_p) + np.random.uniform(0.02, 0.2), 2)
            low_p = round(min(open_p, close_p) - np.random.uniform(0.02, 0.2), 2)
            vol = int(np.random.uniform(100, 450))
            history.append({
                "time": t.strftime("%H:%M:%S"),
                "timestamp": t,
                "open": open_p,
                "high": high_p,
                "low": low_p,
                "close": close_p,
                "volume": vol
            })
            base_price = close_p
        st.session_state.price_history = history
        st.session_state.current_price = history[-1]["close"]
        st.session_state.s0_frozen = st.session_state.current_price

    if "order_book" not in st.session_state:
        generate_market_maker_liquidity()

    if "trade_tape" not in st.session_state:
        st.session_state.trade_tape = [
            {"time": datetime.datetime.now().strftime("%H:%M:%S"), "side": "BUY", "price": 100.05, "qty": 150, "type": "MKT"},
            {"time": datetime.datetime.now().strftime("%H:%M:%S"), "side": "SELL", "price": 99.95, "qty": 80, "type": "LMT"},
        ]

    if "monte_carlo_results" not in st.session_state:
        # Pre-calcular una simulación de inicio para que la pestaña no aparezca vacía
        st.session_state.monte_carlo_results = run_monte_carlo_simulation(100.0, 63, 0.25, 0.08)


# ------------------------------------------------------------------------------
# 3. MOTOR DE LIQUIDEZ Y FORMACIÓN DE PRECIOS
# ------------------------------------------------------------------------------
def generate_market_maker_liquidity():
    mid = st.session_state.current_price
    bids, asks = [], []
    special_bid = 3
    special_ask = 4

    for i in range(1, 10):
        b_px = round(mid - i * 0.05, 2)
        a_px = round(mid + i * 0.05, 2)
        b_vol = int(np.clip(np.random.normal(120, 30), 50, 220))
        a_vol = int(np.clip(np.random.normal(120, 30), 50, 220))

        is_b_block = (i == special_bid)
        is_a_block = (i == special_ask)

        if is_b_block:
            b_vol = int(np.random.uniform(700, 1200))
        if is_a_block:
            a_vol = int(np.random.uniform(750, 1300))

        bids.append({"price": b_px, "volume": b_vol, "is_block": is_b_block})
        asks.append({"price": a_px, "volume": a_vol, "is_block": is_a_block})

    st.session_state.order_book = {"bids": bids, "asks": asks}


def execute_order(side: str, order_type: str, qty: int, limit_price: float = None):
    if st.session_state.market_paused:
        st.warning("⚠️ El mercado está pausado. No se procesan nuevas órdenes.")
        return

    now_str = datetime.datetime.now().strftime("%H:%M:%S")
    bids = st.session_state.order_book["bids"]
    asks = st.session_state.order_book["asks"]
    curr_px = st.session_state.current_price

    if order_type == "MARKET":
        if side == "BUY":
            rem = qty
            new_p = curr_px
            for a in asks:
                take = min(rem, a["volume"])
                a["volume"] -= take
                rem -= take
                new_p = a["price"]
                if rem <= 0:
                    break
            st.session_state.current_price = new_p
            st.session_state.trade_tape.insert(0, {"time": now_str, "side": "BUY", "price": new_p, "qty": qty, "type": "MKT"})
        else:
            rem = qty
            new_p = curr_px
            for b in bids:
                take = min(rem, b["volume"])
                b["volume"] -= take
                rem -= take
                new_p = b["price"]
                if rem <= 0:
                    break
            st.session_state.current_price = new_p
            st.session_state.trade_tape.insert(0, {"time": now_str, "side": "SELL", "price": new_p, "qty": qty, "type": "MKT"})
    else:
        # Límite
        target = limit_price or curr_px
        if side == "BUY":
            if target >= (asks[0]["price"] if asks else 9999):
                execute_order("BUY", "MARKET", qty)
                return
            bids.append({"price": target, "volume": qty, "is_block": (qty >= 400)})
            bids.sort(key=lambda x: x["price"], reverse=True)
        else:
            if target <= (bids[0]["price"] if bids else 0):
                execute_order("SELL", "MARKET", qty)
                return
            asks.append({"price": target, "volume": qty, "is_block": (qty >= 400)})
            asks.sort(key=lambda x: x["price"])
        st.session_state.trade_tape.insert(0, {"time": now_str, "side": side, "price": target, "qty": qty, "type": "LMT"})

    st.session_state.trade_tape = st.session_state.trade_tape[:25]
    update_candle_history()


def update_candle_history():
    last = st.session_state.price_history[-1]
    curr = st.session_state.current_price
    st.session_state.price_history.append({
        "time": datetime.datetime.now().strftime("%H:%M:%S"),
        "timestamp": datetime.datetime.now(),
        "open": last["close"],
        "close": curr,
        "high": max(last["close"], curr, round(curr + 0.08, 2)),
        "low": min(last["close"], curr, round(curr - 0.08, 2)),
        "volume": int(np.random.uniform(120, 500))
    })
    st.session_state.price_history = st.session_state.price_history[-45:]


def simulate_market_tick():
    if st.session_state.market_paused:
        return
    shock = np.random.normal(0.0, 0.04)
    st.session_state.current_price = round(st.session_state.current_price + shock, 2)
    generate_market_maker_liquidity()
    update_candle_history()


# ------------------------------------------------------------------------------
# 4. SIMULACIÓN DE MONTE CARLO (10,000 TRAYECTORIAS VECTORIZADAS)
# ------------------------------------------------------------------------------
def run_monte_carlo_simulation(s0: float, days: int, annual_vol: float, annual_drift: float, num_sims: int = 10000):
    dt = 1.0 / 252.0
    steps = int(days)
    np.random.seed(int(time.time()))
    Z = np.random.standard_normal((num_sims, steps))

    drift_comp = (annual_drift - 0.5 * (annual_vol ** 2)) * dt
    diff_comp = annual_vol * np.sqrt(dt) * Z
    log_rets = drift_comp + diff_comp
    cum_log_rets = np.cumsum(log_rets, axis=1)

    sim_paths = s0 * np.exp(cum_log_rets)
    col0 = np.full((num_sims, 1), s0)
    full = np.hstack((col0, sim_paths))

    final_prices = full[:, -1]
    mean_f = np.mean(final_prices)
    median_f = np.median(final_prices)
    std_f = np.std(final_prices)

    p5 = np.percentile(full, 5, axis=0)
    p25 = np.percentile(full, 25, axis=0)
    p50 = np.percentile(full, 50, axis=0)
    p75 = np.percentile(full, 75, axis=0)
    p95 = np.percentile(full, 95, axis=0)

    var95_px = np.percentile(final_prices, 5)
    var95_loss = max(0.0, s0 - var95_px)
    var95_pct = (var95_loss / s0) * 100.0

    tail = final_prices[final_prices <= var95_px]
    cvar_px = np.mean(tail) if len(tail) > 0 else var95_px
    cvar_loss = max(0.0, s0 - cvar_px)
    cvar_pct = (cvar_loss / s0) * 100.0

    prob_profit = np.mean(final_prices > s0) * 100.0

    return {
        "full_paths": full,
        "sample_paths": full[:100, :],
        "final_prices": final_prices,
        "p5": p5, "p25": p25, "p50": p50, "p75": p75, "p95": p95,
        "time_grid": np.arange(0, steps + 1),
        "mean_f": mean_f, "median_f": median_f, "std_f": std_f,
        "var95_px": var95_px, "var95_loss": var95_loss, "var95_pct": var95_pct,
        "cvar_px": cvar_px, "cvar_loss": cvar_loss, "cvar_pct": cvar_pct,
        "prob_profit": prob_profit,
        "s0": s0, "days": days, "vol": annual_vol, "drift": annual_drift
    }


# ------------------------------------------------------------------------------
# 5. GRÁFICOS PLOTLY DE ALTA VELOCIDAD (ESTILO NEÓN / TERMINAL)
# ------------------------------------------------------------------------------
def create_candlestick_chart(df_candles):
    fig = make_subplots(
        rows=2, cols=1,
        shared_xaxes=True,
        vertical_spacing=0.03,
        row_heights=[0.76, 0.24]
    )
    # Candlestick
    fig.add_trace(go.Candlestick(
        x=df_candles["time"],
        open=df_candles["open"],
        high=df_candles["high"],
        low=df_candles["low"],
        close=df_candles["close"],
        name="Precio",
        increasing_line_color="#10b981",
        increasing_fillcolor="#10b981",
        decreasing_line_color="#f43f5e",
        decreasing_fillcolor="#f43f5e",
    ), row=1, col=1)

    # Volumen
    colors = ["#10b981" if c >= o else "#f43f5e" for c, o in zip(df_candles["close"], df_candles["open"])]
    fig.add_trace(go.Bar(
        x=df_candles["time"],
        y=df_candles["volume"],
        marker_color=colors,
        name="Volumen",
        opacity=0.6
    ), row=2, col=1)

    fig.update_layout(
        template="plotly_dark",
        plot_bgcolor="#090d16",
        paper_bgcolor="#090d16",
        margin=dict(l=10, r=10, t=10, b=10),
        xaxis_rangeslider_visible=False,
        showlegend=False,
        height=320,
        yaxis=dict(gridcolor="#1e293b", title="USD ($)", side="right"),
        yaxis2=dict(gridcolor="#1e293b", title="Vol", side="right")
    )
    return fig


def create_order_book_depth_chart(order_book):
    bids = sorted(order_book["bids"], key=lambda x: x["price"], reverse=True)
    asks = sorted(order_book["asks"], key=lambda x: x["price"])
    df_b = pd.DataFrame(bids)
    df_a = pd.DataFrame(asks)
    df_b["cum"] = df_b["volume"].cumsum()
    df_a["cum"] = df_a["volume"].cumsum()

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=df_b["price"], y=df_b["cum"], fill="tozeroy", mode="lines",
        line=dict(color="#10b981", width=2.5, shape="hv"),
        fillcolor="rgba(16, 185, 129, 0.20)", name="Bids (Demanda)"
    ))
    fig.add_trace(go.Scatter(
        x=df_a["price"], y=df_a["cum"], fill="tozeroy", mode="lines",
        line=dict(color="#f43f5e", width=2.5, shape="hv"),
        fillcolor="rgba(244, 63, 94, 0.20)", name="Asks (Oferta)"
    ))

    # Bloques destacados
    b_blocks = [b for b in bids if b.get("is_block")]
    a_blocks = [a for a in asks if a.get("is_block")]
    if b_blocks:
        fig.add_trace(go.Scatter(
            x=[b["price"] for b in b_blocks], y=[b["cum"] for b in b_blocks],
            mode="markers+text", marker=dict(symbol="star", size=11, color="#fbbf24"),
            text=[f"🧱 Soporte {b['volume']}u" for b in b_blocks], textposition="top right", name="Muro Soporte"
        ))
    if a_blocks:
        fig.add_trace(go.Scatter(
            x=[a["price"] for a in a_blocks], y=[a["cum"] for a in a_blocks],
            mode="markers+text", marker=dict(symbol="star", size=11, color="#fbbf24"),
            text=[f"🧱 Muro {a['volume']}u" for a in a_blocks], textposition="top left", name="Muro Resistencia"
        ))

    fig.update_layout(
        template="plotly_dark",
        plot_bgcolor="#090d16",
        paper_bgcolor="#090d16",
        margin=dict(l=10, r=10, t=15, b=10),
        height=260,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        xaxis=dict(gridcolor="#1e293b", title="Precio ($)"),
        yaxis=dict(gridcolor="#1e293b", title="Volumen Acumulado", side="right")
    )
    return fig


def create_monte_carlo_chart(mc_res):
    tg = mc_res["time_grid"]
    samples = mc_res["sample_paths"]
    s0 = mc_res["s0"]
    fig = go.Figure()

    # 1. 100 Trayectorias de muestra con código de color (verde si sube, rojo si baja)
    for i in range(len(samples)):
        path = samples[i]
        is_bull = path[-1] >= s0
        c = "rgba(52, 211, 153, 0.22)" if is_bull else "rgba(248, 113, 113, 0.18)"
        fig.add_trace(go.Scatter(
            x=tg, y=path, mode="lines",
            line=dict(color=c, width=0.8),
            showlegend=False, hoverinfo="skip"
        ))

    # 2. Banda 90% [P5 - P95]
    fig.add_trace(go.Scatter(
        x=np.concatenate([tg, tg[::-1]]),
        y=np.concatenate([mc_res["p95"], mc_res["p5"][::-1]]),
        fill="toself", fillcolor="rgba(14, 165, 233, 0.18)",
        line=dict(color="rgba(255,255,255,0)"),
        name="Banda 90% [5%-95%]"
    ))

    # 3. Rango Intercuartil [P25 - P75]
    fig.add_trace(go.Scatter(
        x=np.concatenate([tg, tg[::-1]]),
        y=np.concatenate([mc_res["p75"], mc_res["p25"][::-1]]),
        fill="toself", fillcolor="rgba(14, 165, 233, 0.32)",
        line=dict(color="rgba(255,255,255,0)"),
        name="Intercuartil [25%-75%]"
    ))

    # 4. Mediana (P50) en Neón
    fig.add_trace(go.Scatter(
        x=tg, y=mc_res["p50"], mode="lines",
        line=dict(color="#38bdf8", width=3.5),
        name=f"Mediana P50 (${mc_res['median_f']:.2f})"
    ))

    # Líneas de referencia
    fig.add_hline(y=s0, line_dash="dash", line_color="#94a3b8", annotation_text=f"S₀ = ${s0:.2f}")
    fig.add_hline(y=mc_res["var95_px"], line_dash="dot", line_color="#f43f5e", annotation_text=f"VaR 95% = ${mc_res['var95_px']:.2f}")

    fig.update_layout(
        template="plotly_dark",
        plot_bgcolor="#090d16",
        paper_bgcolor="#090d16",
        margin=dict(l=10, r=60, t=30, b=10),
        height=420,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        xaxis=dict(gridcolor="#1e293b", title=f"Días de Proyección (T = {mc_res['days']} días)"),
        yaxis=dict(gridcolor="#1e293b", title="Precio Simulado ($)", side="right")
    )
    return fig


def create_distribution_histogram(mc_res):
    fp = mc_res["final_prices"]
    s0 = mc_res["s0"]
    mean_val = mc_res["mean_f"]
    var_px = mc_res["var95_px"]

    fig = go.Figure()
    fig.add_trace(go.Histogram(
        x=fp, nbinsx=65,
        marker=dict(color="#0ea5e9", line=dict(color="#1e293b", width=1)),
        opacity=0.75, name="S_T"
    ))
    fig.add_vline(x=s0, line_dash="dash", line_color="#cbd5e1", annotation_text="S₀")
    fig.add_vline(x=mean_val, line_dash="solid", line_color="#10b981", annotation_text=f"E[S_T]=${mean_val:.2f}")
    fig.add_vline(x=var_px, line_dash="dot", line_color="#f43f5e", annotation_text=f"VaR 95%=${var_px:.2f}")

    fig.update_layout(
        template="plotly_dark",
        plot_bgcolor="#090d16",
        paper_bgcolor="#090d16",
        margin=dict(l=10, r=10, t=30, b=10),
        height=320,
        showlegend=False,
        xaxis=dict(gridcolor="#1e293b", title="Precio Final S_T ($)"),
        yaxis=dict(gridcolor="#1e293b", title="Frecuencia", side="right")
    )
    return fig


# ------------------------------------------------------------------------------
# 6. FLUJO Y RENDERIZADO PRINCIPAL (TERMINAL WALL STREET)
# ------------------------------------------------------------------------------
init_session_state()

if not st.session_state.market_paused:
    simulate_market_tick()

# TOP TICKER & METRIC RIBBON
best_bid = st.session_state.order_book["bids"][0]["price"] if st.session_state.order_book["bids"] else st.session_state.current_price - 0.05
best_ask = st.session_state.order_book["asks"][0]["price"] if st.session_state.order_book["asks"] else st.session_state.current_price + 0.05
spread = round(max(0.01, best_ask - best_bid), 2)
first_p = st.session_state.price_history[0]["open"]
chg_pct = ((st.session_state.current_price - first_p) / first_p) * 100
is_bull = chg_pct >= 0

# Encabezado compacto
st.markdown(f"""
<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #1e293b; padding-bottom:8px; margin-bottom:12px;">
    <div style="display:flex; align-items:center; gap:10px;">
        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#10b981;"></span>
        <span style="font-weight:900; font-family:monospace; font-size:1.25rem; letter-spacing:0.02em; color:#ffffff;">
            QUANTMARKET <span style="color:#64748b; font-weight:normal;">TERMINAL</span>
        </span>
        <span style="background:#1e293b; color:#94a3b8; font-size:0.75rem; padding:2px 8px; border-radius:4px; font-family:monospace;">QNTM/USD</span>
    </div>
    <div style="display:flex; align-items:center; gap:8px;">
        {'<span style="background:rgba(244,63,94,0.15); color:#fb7185; border:1px solid #e11d48; padding:3px 10px; border-radius:9999px; font-weight:bold; font-size:0.75rem;">⏸️ PAUSADO (S₀ FIJADO)</span>' if st.session_state.market_paused else '<span style="background:rgba(16,185,129,0.15); color:#34d399; border:1px solid #059669; padding:3px 10px; border-radius:9999px; font-weight:bold; font-size:0.75rem;">🟢 EN VIVO</span>'}
    </div>
</div>
""", unsafe_allow_html=True)

# 5 Métricas superiores en tarjetas
m1, m2, m3, m4, m5 = st.columns(5)
with m1:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-title">Precio Spot S_t</div>
        <div class="metric-val {'c-green' if is_bull else 'c-red'}">${st.session_state.current_price:.2f}</div>
    </div>
    """, unsafe_allow_html=True)
with m2:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-title">Variación 24h</div>
        <div class="metric-val {'c-green' if is_bull else 'c-red'}">{'+' if is_bull else ''}{chg_pct:.2f}%</div>
    </div>
    """, unsafe_allow_html=True)
with m3:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-title">Bid / Ask</div>
        <div class="metric-val c-cyan" style="font-size:1.15rem;">${best_bid:.2f} / ${best_ask:.2f}</div>
    </div>
    """, unsafe_allow_html=True)
with m4:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-title">Spread</div>
        <div class="metric-val c-gold">${spread:.2f}</div>
    </div>
    """, unsafe_allow_html=True)
with m5:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-title">S₀ Congelado</div>
        <div class="metric-val c-cyan">${st.session_state.s0_frozen:.2f}</div>
    </div>
    """, unsafe_allow_html=True)

# Barra de control: Pausa / Tick manual
st.markdown("<div style='margin-bottom:8px;'></div>", unsafe_allow_html=True)
ctrl_c1, ctrl_c2, ctrl_c3, _ = st.columns([1.2, 1.2, 1.4, 5.0])
with ctrl_c1:
    if st.button("⏸️ Pausar Mercado", use_container_width=True, disabled=st.session_state.market_paused):
        st.session_state.market_paused = True
        st.session_state.s0_frozen = st.session_state.current_price
        st.rerun()
with ctrl_c2:
    if st.button("▶️ Reanudar Mercado", use_container_width=True, disabled=not st.session_state.market_paused):
        st.session_state.market_paused = False
        st.rerun()
with ctrl_c3:
    if st.button("⚡ Tick de Mercado", use_container_width=True, disabled=st.session_state.market_paused):
        simulate_market_tick()
        st.rerun()

# PESTAÑAS PRINCIPALES
tab_market, tab_mc, tab_theory = st.tabs([
    "📊 MÓDULO 1: Mercado & Bloques de Liquidez",
    "🎲 MÓDULO 3: Monte Carlo (10,000 Trayectorias)",
    "📚 Exposición Académica & Formulación"
])

# ==========================================
# PESTAÑA 1: MERCADO EN VIVO & LIBRO DE ÓRDENES
# (Distribuido exactamente en 2 columnas como en React)
# ==========================================
with tab_market:
    col_left_charts, col_right_trading = st.columns([1.75, 1.1])

    with col_left_charts:
        st.markdown('<div class="panel-box">', unsafe_allow_html=True)
        st.markdown('<div class="panel-header"><span>📈 FORMACIÓN DE PRECIOS EN VIVO (VELAS + VOLUMEN)</span><span style="color:#64748b; font-size:11px;">Intervalo 3s</span></div>', unsafe_allow_html=True)
        df_candles = pd.DataFrame(st.session_state.price_history)
        st.plotly_chart(create_candlestick_chart(df_candles), use_container_width=True, config={'displayModeBar': False})
        st.markdown('</div>', unsafe_allow_html=True)

        st.markdown('<div class="panel-box">', unsafe_allow_html=True)
        st.markdown('<div class="panel-header"><span>🌊 PROFUNDIDAD DE MERCADO & BLOQUES DE LIQUIDEZ</span><span style="color:#fbbf24; font-size:11px;">🧱 Muros Institucionales</span></div>', unsafe_allow_html=True)
        st.plotly_chart(create_order_book_depth_chart(st.session_state.order_book), use_container_width=True, config={'displayModeBar': False})
        st.markdown('</div>', unsafe_allow_html=True)

    with col_right_trading:
        # Formulario de participación del público
        st.markdown('<div class="panel-box">', unsafe_allow_html=True)
        st.markdown('<div class="panel-header"><span>📱 PARTICIPACIÓN DEL PÚBLICO</span><span style="color:#38bdf8; font-size:11px;">Envío de Órdenes</span></div>', unsafe_allow_html=True)
        
        ord_col1, ord_col2 = st.columns(2)
        with ord_col1:
            side_sel = st.selectbox("Sentido:", ["COMPRAR (Bid)", "VENDER (Ask)"])
        with ord_col2:
            type_sel = st.selectbox("Tipo:", ["MERCADO", "LÍMITE"])

        qty_input = st.number_input("Cantidad de Acciones:", min_value=10, max_value=2000, value=200, step=50)

        limit_val = None
        if "LÍMITE" in type_sel:
            def_px = st.session_state.current_price - 0.10 if "COMPRAR" in side_sel else st.session_state.current_price + 0.10
            limit_val = st.number_input("Precio Límite ($):", value=float(round(def_px, 2)), step=0.05)

        is_buy_act = "COMPRAR" in side_sel
        btn_txt = f"{'🟢 Comprar' if is_buy_act else '🔴 Vender'} {qty_input} Acciones"
        if st.button(btn_txt, use_container_width=True, disabled=st.session_state.market_paused):
            clean_s = "BUY" if is_buy_act else "SELL"
            clean_t = "MARKET" if "MERCADO" in type_sel else "LIMIT"
            execute_order(clean_s, clean_t, int(qty_input), limit_val)
            st.rerun()
        st.markdown('</div>', unsafe_allow_html=True)

        # Libro de Órdenes L2 con barras de profundidad visuales (HTML)
        st.markdown('<div class="panel-box">', unsafe_allow_html=True)
        st.markdown('<div class="panel-header"><span>📖 LIBRO DE ÓRDENES (L2 LADDER)</span><span style="color:#64748b; font-size:11px;">Volumen Acumulado</span></div>', unsafe_allow_html=True)
        
        asks_list = st.session_state.order_book["asks"][:7]
        bids_list = st.session_state.order_book["bids"][:7]
        max_v = max([a["volume"] for a in asks_list] + [b["volume"] for b in bids_list] + [1])

        # Header de tabla
        st.markdown("""
        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; font-size:10px; color:#64748b; padding:2px 8px; border-bottom:1px solid #1e293b; font-family:monospace; text-transform:uppercase;">
            <span>Precio ($)</span><span style="text-align:right;">Tamaño</span><span style="text-align:right;">Bloque</span>
        </div>
        """, unsafe_allow_html=True)

        # ASKS (Rojos)
        for a in reversed(asks_list):
            w = (a["volume"] / max_v) * 100
            tag = '<span class="block-tag">🧱 MURO</span>' if a.get("is_block") else '<span style="color:#475569;">—</span>'
            st.markdown(f"""
            <div class="book-row">
                <div class="book-fill-ask" style="width:{w}%;"></div>
                <span style="color:#f43f5e; font-weight:bold; z-index:1;">${a['price']:.2f}</span>
                <span style="color:#f1f5f9; z-index:1;">{a['volume']}</span>
                <span style="z-index:1;">{tag}</span>
            </div>
            """, unsafe_allow_html=True)

        # Spread central
        st.markdown(f"""
        <div style="background:#020617; border-top:1px solid #1e293b; border-bottom:1px solid #1e293b; padding:4px 8px; font-size:11px; font-weight:bold; display:flex; justify-content:space-between; margin:4px 0; font-family:monospace;">
            <span style="color:#64748b;">Spread: ${spread:.2f}</span>
            <span style="color:#38bdf8;">Spot: ${st.session_state.current_price:.2f}</span>
        </div>
        """, unsafe_allow_html=True)

        # BIDS (Verdes)
        for b in bids_list:
            w = (b["volume"] / max_v) * 100
            tag = '<span class="block-tag">🧱 SOPORTE</span>' if b.get("is_block") else '<span style="color:#475569;">—</span>'
            st.markdown(f"""
            <div class="book-row">
                <div class="book-fill-bid" style="width:{w}%;"></div>
                <span style="color:#10b981; font-weight:bold; z-index:1;">${b['price']:.2f}</span>
                <span style="color:#f1f5f9; z-index:1;">{b['volume']}</span>
                <span style="z-index:1;">{tag}</span>
            </div>
            """, unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

        # Cinta de operaciones (Time & Sales)
        st.markdown('<div class="panel-box">', unsafe_allow_html=True)
        st.markdown('<div class="panel-header"><span>⚡ CINTA DE OPERACIONES (TAPE)</span><span style="color:#64748b; font-size:11px;">Últimos Trades</span></div>', unsafe_allow_html=True)
        tape_rows = "".join([f"""
        <div style="display:flex; justify-content:space-between; align-items:center; padding:3px 6px; font-size:11px; font-family:monospace; border-bottom:1px solid #111c30;">
            <span style="color:{'#10b981' if t['side']=='BUY' else '#f43f5e'}; font-weight:bold;">{t['side']}</span>
            <span style="color:#f1f5f9; font-weight:bold;">${t['price']:.2f}</span>
            <span style="color:#94a3b8;">({t['qty']} u.)</span>
            <span style="color:#64748b; font-size:9.5px;">{t['time']}</span>
        </div>
        """ for t in st.session_state.trade_tape[:7]])
        st.markdown(tape_rows, unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)


# ==========================================
# PESTAÑA 2: MONTE CARLO (10,000 TRAYECTORIAS)
# ==========================================
with tab_mc:
    st.markdown('<div class="panel-box">', unsafe_allow_html=True)
    st.markdown('<div class="panel-header"><span>⚙️ PARÁMETROS DEL MODELO ESTOCÁSTICO (MOVIMIENTO GEOMÉTRICO BROWNIANO)</span><span style="color:#38bdf8; font-size:11px;">10,000 Trayectorias</span></div>', unsafe_allow_html=True)
    
    mc_c1, mc_c2, mc_c3, mc_c4 = st.columns(4)
    with mc_c1:
        s0_in = st.number_input("Precio Inicial (S₀):", value=float(st.session_state.s0_frozen if st.session_state.market_paused else st.session_state.current_price), step=0.5)
    with mc_c2:
        days_in = st.slider("Horizonte T (Días Hábiles):", min_value=10, max_value=252, value=63, step=1)
    with mc_c3:
        vol_in = st.slider("Volatilidad Anual (σ %):", min_value=5, max_value=120, value=25, step=1) / 100.0
    with mc_c4:
        drift_in = st.slider("Drift / Retorno Anual (μ %):", min_value=-40, max_value=50, value=8, step=1) / 100.0

    if st.button("🔥 Ejecutar 10,000 Simulaciones de Monte Carlo", type="primary", use_container_width=True):
        with st.spinner("Calculando 10,000 trayectorias vectorizadas en NumPy..."):
            st.session_state.monte_carlo_results = run_monte_carlo_simulation(s0_in, days_in, vol_in, drift_in)
    st.markdown('</div>', unsafe_allow_html=True)

    if st.session_state.monte_carlo_results:
        res = st.session_state.monte_carlo_results
        ret_exp = ((res["mean_f"] - res["s0"]) / res["s0"]) * 100

        # Tarjetas Métricas Cuantitativas
        q1, q2, q3, q4, q5 = st.columns(5)
        with q1:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-title">Precio Esperado E[S_T]</div>
                <div class="metric-val c-green">${res['mean_f']:.2f}</div>
                <div style="font-size:11px; color:#94a3b8;">Retorno: {ret_exp:+.2f}%</div>
            </div>
            """, unsafe_allow_html=True)
        with q2:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-title">Mediana Final (P50)</div>
                <div class="metric-val c-cyan">${res['median_f']:.2f}</div>
                <div style="font-size:11px; color:#94a3b8;">Desv. Est: ±${res['std_f']:.2f}</div>
            </div>
            """, unsafe_allow_html=True)
        with q3:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-title">Probabilidad Ganancia</div>
                <div class="metric-val c-gold">{res['prob_profit']:.1f}%</div>
                <div style="font-size:11px; color:#94a3b8;">P(S_T > S₀)</div>
            </div>
            """, unsafe_allow_html=True)
        with q4:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-title">Value at Risk (VaR 95%)</div>
                <div class="metric-val c-red">-${res['var95_loss']:.2f}</div>
                <div style="font-size:11px; color:#f43f5e;">Pérdida Máx: -{res['var95_pct']:.2f}%</div>
            </div>
            """, unsafe_allow_html=True)
        with q5:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-title">Conditional VaR (CVaR)</div>
                <div class="metric-val c-red">-${res['cvar_loss']:.2f}</div>
                <div style="font-size:11px; color:#fda4af;">Expected Shortfall: -{res['cvar_pct']:.2f}%</div>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("<div style='margin-bottom:12px;'></div>", unsafe_allow_html=True)

        # Gráficos de Monte Carlo
        mc_g1, mc_g2 = st.columns([1.65, 1.1])
        with mc_g1:
            st.markdown('<div class="panel-box">', unsafe_allow_html=True)
            st.markdown('<div class="panel-header"><span>🌌 CONO DE INCERTIDUMBRE (10,000 TRAYECTORIAS)</span><span style="color:#38bdf8; font-size:11px;">Bandas 90% y 50%</span></div>', unsafe_allow_html=True)
            st.plotly_chart(create_monte_carlo_chart(res), use_container_width=True, config={'displayModeBar': False})
            st.caption("Muestra de 100 trayectorias coloreadas (verde si sube, rojo si baja) con bandas de percentiles y mediana en neón.")
            st.markdown('</div>', unsafe_allow_html=True)

        with mc_g2:
            st.markdown('<div class="panel-box">', unsafe_allow_html=True)
            st.markdown(f'<div class="panel-header"><span>🔔 DISTRIBUCIÓN EN T ({res["days"]} DÍAS)</span><span style="color:#0ea5e9; font-size:11px;">Log-Normal</span></div>', unsafe_allow_html=True)
            st.plotly_chart(create_distribution_histogram(res), use_container_width=True, config={'displayModeBar': False})
            st.caption("Histograma con corte de VaR al 95% de confianza (área crítica de riesgo de cola).")
            st.markdown('</div>', unsafe_allow_html=True)


# ==========================================
# PESTAÑA 3: EXPOSICIÓN ACADÉMICA
# ==========================================
with tab_theory:
    st.markdown('<div class="panel-box">', unsafe_allow_html=True)
    st.markdown("### 🎓 Fundamentos Teóricos de Microestructura y Modelado Estocástico")
    
    t_c1, t_c2 = st.columns(2)
    with t_c1:
        st.markdown("""
        #### 1. Microestructura de Mercado & Libro de Órdenes (CLOB)
        * **Órdenes Límite (Pasivas / Market Makers):** Crean liquidez cotizando simultáneamente precios de compra (*Bids*) y venta (*Asks*). Su margen es el *Spread*, asumiendo riesgo de selección adversa.
        * **Órdenes de Mercado (Activas / Takers):** Demandan inmediatez y ejecutan contra las mejores órdenes del libro, causando *deslizamiento (slippage)* al consumir niveles completos.
        * **Bloques de Liquidez:** Muros de volumen masivo (5x a 10x el promedio) colocados por inversores institucionales en zonas clave de soporte o resistencia.
        """)

    with t_c2:
        st.markdown("""
        #### 2. Movimiento Geométrico Browniano (MGB)
        Ecuación Diferencial Estocástica (SDE) de Black-Scholes-Merton:
        """)
        st.latex(r"dS_t = \mu S_t dt + \sigma S_t dW_t")
        st.markdown("""
        Aplicando el **Lema de Itô** a $f(S_t) = \ln(S_t)$, obtenemos la solución cerrada exacta implementada en NumPy:
        """)
        st.latex(r"S_T = S_0 \exp\left( \left(\mu - \frac{1}{2}\sigma^2\right)T + \sigma \sqrt{T} Z \right), \quad Z \sim \mathcal{N}(0, 1)")
        st.markdown("""
        *El término $-\frac{1}{2}\sigma^2$ es la corrección de convexidad de Jensen.*
        """)
    st.markdown('</div>', unsafe_allow_html=True)
