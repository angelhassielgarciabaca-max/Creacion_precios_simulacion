# ==============================================================================
# PROYECTO: QUANTMARKET TERMINAL & SIMULADOR DE MONTE CARLO
# Aplicación interactiva para divulgación y exposición de Finanzas Cuantitativas
# y Estructura de Mercado.
# Diseñado para Streamlit Community Cloud.
# ==============================================================================

import time
import datetime
import numpy as np
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import streamlit as st

# ------------------------------------------------------------------------------
# 1. CONFIGURACIÓN DE PÁGINA Y ESTILO TERMINAL FINANCIERO (BLOOMBERG STYLE)
# ------------------------------------------------------------------------------
st.set_page_config(
    page_title="QuantMarket Terminal | Microestructura & Monte Carlo",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Inyección de CSS personalizado para estética "Dark Financial Terminal"
st.markdown("""
<style>
    /* Fondo principal y tipografía de terminal */
    .stApp {
        background-color: #0b0f19;
        color: #e2e8f0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", monospace;
    }
    
    /* Contenedores y tarjetas métricas */
    .metric-card {
        background: linear-gradient(135deg, #131d31 0%, #0d1527 100%);
        border: 1px solid #1e293b;
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
    }
    .metric-title {
        font-size: 0.75rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 4px;
    }
    .metric-value {
        font-size: 1.5rem;
        font-weight: 700;
        font-family: "Courier New", monospace;
    }
    .metric-bull { color: #10b981; }
    .metric-bear { color: #f43f5e; }
    .metric-neutral { color: #38bdf8; }
    .metric-gold { color: #fbbf24; }

    /* Badges de estado */
    .badge-live {
        background-color: rgba(16, 185, 129, 0.15);
        color: #34d399;
        border: 1px solid #059669;
        padding: 4px 10px;
        border-radius: 9999px;
        font-weight: 600;
        font-size: 0.8rem;
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }
    .badge-paused {
        background-color: rgba(244, 63, 94, 0.15);
        color: #fb7185;
        border: 1px solid #e11d48;
        padding: 4px 10px;
        border-radius: 9999px;
        font-weight: 600;
        font-size: 0.8rem;
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }
    
    /* Bloques de Liquidez Destacados */
    .liquidity-block-badge {
        background: rgba(245, 158, 11, 0.15);
        border: 1px solid #f59e0b;
        color: #fcd34d;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: bold;
    }
</style>
""", unsafe_allow_html=True)


# ------------------------------------------------------------------------------
# 2. INICIALIZACIÓN DE ESTADO DE SESIÓN (st.session_state)
# ------------------------------------------------------------------------------
def init_session_state():
    """Inicializa todas las estructuras de datos requeridas si no existen."""
    if "market_paused" not in st.session_state:
        st.session_state.market_paused = False

    if "current_price" not in st.session_state:
        st.session_state.current_price = 100.00

    if "s0_frozen" not in st.session_state:
        st.session_state.s0_frozen = 100.00

    if "price_history" not in st.session_state:
        # Semilla inicial con 30 ticks para poder graficar velas desde el inicio
        base_price = 100.00
        now = datetime.datetime.now()
        history = []
        for i in range(30, 0, -1):
            t = now - datetime.timedelta(seconds=i * 2)
            open_p = base_price + np.random.uniform(-0.15, 0.15)
            close_p = open_p + np.random.uniform(-0.25, 0.25)
            high_p = max(open_p, close_p) + np.random.uniform(0.01, 0.15)
            low_p = min(open_p, close_p) - np.random.uniform(0.01, 0.15)
            vol = int(np.random.uniform(50, 400))
            history.append({
                "time": t,
                "open": round(open_p, 2),
                "high": round(high_p, 2),
                "low": round(low_p, 2),
                "close": round(close_p, 2),
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
            {"time": datetime.datetime.now().strftime("%H:%M:%S"), "side": "BUY", "price": 100.05, "qty": 150},
            {"time": datetime.datetime.now().strftime("%H:%M:%S"), "side": "SELL", "price": 99.95, "qty": 80},
        ]

    if "monte_carlo_results" not in st.session_state:
        st.session_state.monte_carlo_results = None


# ------------------------------------------------------------------------------
# 3. MOTOR DE LIQUIDEZ Y MARKET MAKERS AUTOMÁTICOS
# ------------------------------------------------------------------------------
def generate_market_maker_liquidity():
    """
    Genera el libro de órdenes con Market Makers automatizados.
    Crea bloques de liquidez (órdenes de gran volumen / muros institucionales)
    alrededor del precio mid, modelando microestructura real.
    """
    mid_price = st.session_state.current_price
    bids = []
    asks = []

    # Generamos 12 niveles de profundidad para cada lado con granularidad de $0.05
    # Identificamos niveles especiales donde se ubicarán "Bloques Institucionales"
    special_bid_idx = np.random.choice([3, 5, 8])
    special_ask_idx = np.random.choice([3, 5, 8])

    for i in range(1, 13):
        # Nivel de precios
        bid_px = round(mid_price - i * 0.05, 2)
        ask_px = round(mid_price + i * 0.05, 2)

        # Volumen base con distribución normal recortada
        base_bid_vol = int(np.clip(np.random.normal(loc=120, scale=35), 20, 300))
        base_ask_vol = int(np.clip(np.random.normal(loc=120, scale=35), 20, 300))

        is_bid_block = (i == special_bid_idx)
        is_ask_block = (i == special_ask_idx)

        # Si es un "Bloque de Liquidez", multiplicamos el volumen significativamente (Ballena / Soporte / Resistencia)
        if is_bid_block:
            base_bid_vol *= int(np.random.uniform(5, 9))
        if is_ask_block:
            base_ask_vol *= int(np.random.uniform(5, 9))

        bids.append({
            "price": bid_px,
            "volume": base_bid_vol,
            "is_block": is_bid_block
        })
        asks.append({
            "price": ask_px,
            "volume": base_ask_vol,
            "is_block": is_ask_block
        })

    st.session_state.order_book = {
        "bids": bids,
        "asks": asks
    }


def execute_order(side: str, order_type: str, qty: int, limit_price: float = None):
    """
    Ejecuta una orden enviada por el público o la audiencia.
    - Market Order: consume la mejor liquidez disponible en el libro y causa impacto de precio.
    - Limit Order: se ubica en el libro o se ejecuta si cruza el spread.
    """
    if st.session_state.market_paused:
        st.warning("⚠️ El mercado está pausado. No se pueden procesar órdenes.")
        return

    now_str = datetime.datetime.now().strftime("%H:%M:%S")
    bids = st.session_state.order_book["bids"]
    asks = st.session_state.order_book["asks"]
    curr_px = st.session_state.current_price

    if order_type == "MARKET":
        if side == "BUY":
            # Consume del libro de Asks (los vendedores)
            matched_qty = 0
            exec_prices = []
            for ask in asks:
                take = min(qty - matched_qty, ask["volume"])
                ask["volume"] -= take
                matched_qty += take
                exec_prices.append(ask["price"])
                if matched_qty >= qty:
                    break
            
            # Nuevo precio es el último ask consumido
            new_price = asks[0]["price"] if asks else curr_px
            st.session_state.current_price = new_price
            st.session_state.trade_tape.insert(0, {
                "time": now_str, "side": "BUY (MKT)", "price": new_price, "qty": qty
            })
            st.success(f"✅ Orden de Compra de Mercado Ejecutada: {qty} acciones a ${new_price:.2f}")

        elif side == "SELL":
            # Consume del libro de Bids (los compradores)
            matched_qty = 0
            for bid in bids:
                take = min(qty - matched_qty, bid["volume"])
                bid["volume"] -= take
                matched_qty += take
                if matched_qty >= qty:
                    break
            
            new_price = bids[0]["price"] if bids else curr_px
            st.session_state.current_price = new_price
            st.session_state.trade_tape.insert(0, {
                "time": now_str, "side": "SELL (MKT)", "price": new_price, "qty": qty
            })
            st.success(f"🔻 Orden de Venta de Mercado Ejecutada: {qty} acciones a ${new_price:.2f}")

    elif order_type == "LIMIT":
        if limit_price is None:
            limit_price = curr_px

        if side == "BUY":
            # Si el límite cruza el mejor Ask, ejecuta inmediatamente
            best_ask = asks[0]["price"] if asks else float("inf")
            if limit_price >= best_ask:
                execute_order("BUY", "MARKET", qty)
            else:
                # Se agrega como bloque de liquidez en el libro
                inserted = False
                for b in bids:
                    if abs(b["price"] - limit_price) < 0.025:
                        b["volume"] += qty
                        if qty > 400:
                            b["is_block"] = True
                        inserted = True
                        break
                if not inserted:
                    bids.append({"price": round(limit_price, 2), "volume": qty, "is_block": (qty > 400)})
                    bids.sort(key=lambda x: x["price"], reverse=True)
                st.info(f"📥 Orden Límite de Compra añadida al Libro: {qty} @ ${limit_price:.2f}")

        elif side == "SELL":
            best_bid = bids[0]["price"] if bids else 0.0
            if limit_price <= best_bid:
                execute_order("SELL", "MARKET", qty)
            else:
                inserted = False
                for a in asks:
                    if abs(a["price"] - limit_price) < 0.025:
                        a["volume"] += qty
                        if qty > 400:
                            a["is_block"] = True
                        inserted = True
                        break
                if not inserted:
                    asks.append({"price": round(limit_price, 2), "volume": qty, "is_block": (qty > 400)})
                    asks.sort(key=lambda x: x["price"])
                st.info(f"📤 Orden Límite de Venta añadida al Libro: {qty} @ ${limit_price:.2f}")

    # Mantener tamaño del tape
    st.session_state.trade_tape = st.session_state.trade_tape[:20]

    # Actualizar historia de precios (Velas)
    update_candle_history()


def update_candle_history():
    """Registra la evolución del precio en el historial de velas."""
    last_candle = st.session_state.price_history[-1]
    curr_px = st.session_state.current_price
    
    # Crear nueva vela o actualizar última
    new_open = last_candle["close"]
    new_close = curr_px
    new_high = max(new_open, new_close, last_candle["high"])
    new_low = min(new_open, new_close, last_candle["low"])
    new_vol = int(np.random.uniform(80, 500))
    
    st.session_state.price_history.append({
        "time": datetime.datetime.now(),
        "open": round(new_open, 2),
        "high": round(new_high, 2),
        "low": round(new_low, 2),
        "close": round(new_close, 2),
        "volume": new_vol
    })
    
    # Mantenemos las últimas 50 velas para rendimiento óptimo
    st.session_state.price_history = st.session_state.price_history[-50:]


def simulate_market_tick():
    """Simula una micro-transacción de mercado aleatoria por Market Makers."""
    if st.session_state.market_paused:
        return

    # 50% de probabilidad de cambio aleatorio leve inducido por flujo de órdenes institucional
    flow_shock = np.random.normal(loc=0.0, scale=0.04)
    st.session_state.current_price = round(st.session_state.current_price + flow_shock, 2)
    
    # Regenerar o adaptar libro de órdenes
    generate_market_maker_liquidity()
    update_candle_history()


# ------------------------------------------------------------------------------
# 4. MÓDULO 3: SIMULACIÓN DE MONTE CARLO VECTORIZADA (10,000 TRAYECTORIAS)
# ------------------------------------------------------------------------------
def run_monte_carlo_simulation(s0: float, days: int, annual_vol: float, annual_drift: float, num_simulations: int = 10000):
    """
    Ejecuta el Movimiento Geométrico Browniano (MGB) de forma 100% vectorizada en NumPy.
    
    Fórmula de la Ecuación Diferencial Estocástica (SDE):
        dS_t = mu * S_t * dt + sigma * S_t * dW_t
        
    Solución analítica exacta vía Lema de Itô:
        S_t = S_0 * exp( (mu - 0.5 * sigma^2) * dt + sigma * sqrt(dt) * Z )
        donde Z ~ N(0, 1)
    """
    # Parámetros temporales (252 días hábiles de negociación por año)
    trading_days_per_year = 252.0
    dt = 1.0 / trading_days_per_year
    steps = int(days)
    
    # Generación vectorizada de variables normales estándar Z (10000 x steps)
    # NumPy C-Engine ultrarrápido (< 50ms)
    np.random.seed(int(time.time()))
    Z = np.random.standard_normal((num_simulations, steps))
    
    # Componentes de deriva y difusión
    drift_component = (annual_drift - 0.5 * (annual_vol ** 2)) * dt
    diffusion_component = annual_vol * np.sqrt(dt) * Z
    
    # Retornos logarítmicos acumulados
    log_returns = drift_component + diffusion_component
    cumulative_log_returns = np.cumsum(log_returns, axis=1)
    
    # Matriz completa de precios proyectados S_t
    # Shape: (10000, steps)
    simulated_paths = s0 * np.exp(cumulative_log_returns)
    
    # Insertamos el día 0 con valor S0 exacto
    initial_column = np.full((num_simulations, 1), s0)
    full_paths = np.hstack((initial_column, simulated_paths))
    
    # Precios finales en el horizonte T
    final_prices = full_paths[:, -1]
    
    # Métricas estadísticas y de Gestión de Riesgo (Risk Management)
    mean_final = np.mean(final_prices)
    median_final = np.median(final_prices)
    std_final = np.std(final_prices)
    
    # Percentiles del cono de incertidumbre a lo largo del tiempo
    percentile_5 = np.percentile(full_paths, 5, axis=0)
    percentile_25 = np.percentile(full_paths, 25, axis=0)
    percentile_50 = np.percentile(full_paths, 50, axis=0)
    percentile_75 = np.percentile(full_paths, 75, axis=0)
    percentile_95 = np.percentile(full_paths, 95, axis=0)
    
    # Value at Risk (VaR al 95%) y Conditional VaR (Expected Shortfall)
    # VaR 95%: Pérdida máxima esperada con un 95% de confianza
    var_95_price = np.percentile(final_prices, 5) # Percentil 5 de precios
    var_95_loss_dollar = max(0.0, s0 - var_95_price)
    var_95_loss_pct = (var_95_loss_dollar / s0) * 100.0
    
    # CVaR (Expected Shortfall): promedio de las pérdidas en la cola del 5%
    cvar_tail = final_prices[final_prices <= var_95_price]
    cvar_mean_price = np.mean(cvar_tail) if len(cvar_tail) > 0 else var_95_price
    cvar_loss_dollar = max(0.0, s0 - cvar_mean_price)
    cvar_loss_pct = (cvar_loss_dollar / s0) * 100.0
    
    # Probabilidad de rentabilidad positiva
    prob_profit = np.mean(final_prices > s0) * 100.0

    return {
        "full_paths": full_paths,
        "sample_paths": full_paths[:120, :], # Muestra de ~120 trayectorias para renderizado visual sin sobrecargar WebGL
        "final_prices": final_prices,
        "percentile_5": percentile_5,
        "percentile_25": percentile_25,
        "percentile_50": percentile_50,
        "percentile_75": percentile_75,
        "percentile_95": percentile_95,
        "time_grid": np.arange(0, steps + 1),
        "mean_final": mean_final,
        "median_final": median_final,
        "std_final": std_final,
        "var_95_price": var_95_price,
        "var_95_loss_dollar": var_95_loss_dollar,
        "var_95_loss_pct": var_95_loss_pct,
        "cvar_mean_price": cvar_mean_price,
        "cvar_loss_dollar": cvar_loss_dollar,
        "cvar_loss_pct": cvar_loss_pct,
        "prob_profit": prob_profit,
        "s0": s0,
        "days": days,
        "annual_vol": annual_vol,
        "annual_drift": annual_drift
    }


# ------------------------------------------------------------------------------
# 5. CONSTRUCCIÓN DE GRÁFICOS PLOTLY DE ALTA VELOCIDAD
# ------------------------------------------------------------------------------
def create_candlestick_chart(df_candles):
    """Genera el gráfico interactivo de Velas Japonesas y Volumen en tiempo real."""
    fig = make_subplots(
        rows=2, cols=1,
        shared_xaxes=True,
        vertical_spacing=0.04,
        row_heights=[0.75, 0.25],
        subplot_titles=("", "")
    )

    # Velas de precio
    fig.add_trace(
        go.Candlestick(
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
        ),
        row=1, col=1
    )

    # Barras de volumen
    vol_colors = [
        "#10b981" if c >= o else "#f43f5e"
        for c, o in zip(df_candles["close"], df_candles["open"])
    ]
    fig.add_trace(
        go.Bar(
            x=df_candles["time"],
            y=df_candles["volume"],
            marker_color=vol_colors,
            name="Volumen",
            opacity=0.65
        ),
        row=2, col=1
    )

    fig.update_layout(
        template="plotly_dark",
        plot_bgcolor="#0d1527",
        paper_bgcolor="#0b0f19",
        margin=dict(l=10, r=10, t=10, b=10),
        xaxis_rangeslider_visible=False,
        showlegend=False,
        height=360,
        yaxis=dict(gridcolor="#1e293b", title="Precio (USD)"),
        yaxis2=dict(gridcolor="#1e293b", title="Vol")
    )
    return fig


def create_order_book_depth_chart(order_book):
    """
    Genera el gráfico de profundidad de mercado (Cumulative Market Depth)
    y resalta los bloques de liquidez de alta concentración (Muros).
    """
    bids = sorted(order_book["bids"], key=lambda x: x["price"], reverse=True)
    asks = sorted(order_book["asks"], key=lambda x: x["price"])

    df_bids = pd.DataFrame(bids)
    df_asks = pd.DataFrame(asks)

    df_bids["cum_vol"] = df_bids["volume"].cumsum()
    df_asks["cum_vol"] = df_asks["volume"].cumsum()

    fig = go.Figure()

    # Curva acumulada de Bids (Compradores)
    fig.add_trace(go.Scatter(
        x=df_bids["price"],
        y=df_bids["cum_vol"],
        fill="tozeroy",
        mode="lines",
        line=dict(color="#10b981", width=2.5, shape="hv"),
        fillcolor="rgba(16, 185, 129, 0.20)",
        name="Bids (Demanda Acumulada)"
    ))

    # Curva acumulada de Asks (Vendedores)
    fig.add_trace(go.Scatter(
        x=df_asks["price"],
        y=df_asks["cum_vol"],
        fill="tozeroy",
        mode="lines",
        line=dict(color="#f43f5e", width=2.5, shape="hv"),
        fillcolor="rgba(244, 63, 94, 0.20)",
        name="Asks (Oferta Acumulada)"
    ))

    # Marcadores destacados para "Bloques de Liquidez"
    bid_blocks = [b for b in bids if b.get("is_block")]
    ask_blocks = [a for a in asks if a.get("is_block")]

    if bid_blocks:
        fig.add_trace(go.Scatter(
            x=[b["price"] for b in bid_blocks],
            y=[b["volume"] for b in bid_blocks],
            mode="markers+text",
            marker=dict(symbol="star", size=13, color="#fbbf24"),
            text=[f"🧱 Bloque Compra ({b['volume']} u)" for b in bid_blocks],
            textposition="top right",
            name="Muro de Soporte"
        ))

    if ask_blocks:
        fig.add_trace(go.Scatter(
            x=[a["price"] for a in ask_blocks],
            y=[a["volume"] for a in ask_blocks],
            mode="markers+text",
            marker=dict(symbol="star", size=13, color="#fbbf24"),
            text=[f"🧱 Bloque Venta ({a['volume']} u)" for a in ask_blocks],
            textposition="top left",
            name="Muro de Resistencia"
        ))

    fig.update_layout(
        template="plotly_dark",
        plot_bgcolor="#0d1527",
        paper_bgcolor="#0b0f19",
        margin=dict(l=10, r=10, t=25, b=10),
        height=320,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        xaxis=dict(gridcolor="#1e293b", title="Nivel de Precio ($)"),
        yaxis=dict(gridcolor="#1e293b", title="Volumen Acumulado")
    )
    return fig


def create_monte_carlo_chart(mc_res):
    """
    Crea el gráfico de abanico de percentiles y muestra de 100 trayectorias
    del Movimiento Geométrico Browniano.
    """
    time_grid = mc_res["time_grid"]
    samples = mc_res["sample_paths"]
    
    fig = go.Figure()

    # 1. Graficar muestra de 100 trayectorias aleatorias con código de color (verde si sube, rojo si baja)
    s0 = mc_res["s0"]
    for i in range(min(100, len(samples))):
        path = samples[i]
        is_bull = path[-1] >= s0
        line_color = "rgba(52, 211, 153, 0.22)" if is_bull else "rgba(248, 113, 113, 0.18)"
        fig.add_trace(go.Scatter(
            x=time_grid,
            y=path,
            mode="lines",
            line=dict(color=line_color, width=0.8),
            showlegend=False,
            hoverinfo="skip"
        ))

    # 2. Cono del 90% (Percentiles 5% a 95%)
    fig.add_trace(go.Scatter(
        x=np.concatenate([time_grid, time_grid[::-1]]),
        y=np.concatenate([mc_res["percentile_95"], mc_res["percentile_5"][::-1]]),
        fill="toself",
        fillcolor="rgba(14, 165, 233, 0.15)",
        line=dict(color="rgba(255,255,255,0)"),
        name="Banda 90% Confianza [5%-95%]",
        showlegend=True
    ))

    # 3. Rango Intercuartil (Percentiles 25% a 75%)
    fig.add_trace(go.Scatter(
        x=np.concatenate([time_grid, time_grid[::-1]]),
        y=np.concatenate([mc_res["percentile_75"], mc_res["percentile_25"][::-1]]),
        fill="toself",
        fillcolor="rgba(14, 165, 233, 0.30)",
        line=dict(color="rgba(255,255,255,0)"),
        name="Rango Intercuartil [25%-75%]",
        showlegend=True
    ))

    # 4. Líneas clave: Mediana (P50) y Precio Inicial S0
    fig.add_trace(go.Scatter(
        x=time_grid,
        y=mc_res["percentile_50"],
        mode="lines",
        line=dict(color="#38bdf8", width=3),
        name="Mediana Proyectada (P50)"
    ))

    # Línea horizontal de S0 inicial
    fig.add_hline(
        y=mc_res["s0"],
        line_dash="dash",
        line_color="#94a3b8",
        annotation_text=f"S₀ Inicial = ${mc_res['s0']:.2f}",
        annotation_position="bottom right"
    )

    # Línea de VaR al 95%
    fig.add_hline(
        y=mc_res["var_95_price"],
        line_dash="dot",
        line_color="#f43f5e",
        annotation_text=f"Umbral VaR 95% = ${mc_res['var_95_price']:.2f}",
        annotation_position="top right"
    )

    fig.update_layout(
        template="plotly_dark",
        plot_bgcolor="#0d1527",
        paper_bgcolor="#0b0f19",
        margin=dict(l=10, r=10, t=30, b=10),
        height=420,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        xaxis=dict(gridcolor="#1e293b", title=f"Días de Proyección (T = {mc_res['days']} días)"),
        yaxis=dict(gridcolor="#1e293b", title="Precio Simulado ($)")
    )
    return fig


def create_distribution_histogram(mc_res):
    """
    Genera el histograma de distribución de precios finales en T
    marcando Media, Mediana, VaR 95% y CVaR.
    """
    final_prices = mc_res["final_prices"]
    s0 = mc_res["s0"]
    mean_val = mc_res["mean_final"]
    var_px = mc_res["var_95_price"]
    cvar_px = mc_res["cvar_mean_price"]

    fig = go.Figure()

    # Histograma de 10,000 precios finales
    fig.add_trace(go.Histogram(
        x=final_prices,
        nbinsx=70,
        marker=dict(
            color="#0ea5e9",
            line=dict(color="#1e293b", width=1)
        ),
        opacity=0.75,
        name="Distribución Final S_T"
    ))

    # Línea S0
    fig.add_vline(x=s0, line_dash="dash", line_color="#cbd5e1", line_width=2,
                  annotation_text="S₀", annotation_position="top")

    # Línea Media
    fig.add_vline(x=mean_val, line_dash="solid", line_color="#10b981", line_width=2.5,
                  annotation_text=f"E[S_T] = ${mean_val:.2f}", annotation_position="top right")

    # Línea VaR 95%
    fig.add_vline(x=var_px, line_dash="dot", line_color="#f43f5e", line_width=2.5,
                  annotation_text=f"VaR 95% = ${var_px:.2f}", annotation_position="top left")

    # Línea CVaR
    fig.add_vline(x=cvar_px, line_dash="dashdot", line_color="#fda4af", line_width=2,
                  annotation_text=f"CVaR = ${cvar_px:.2f}", annotation_position="bottom left")

    fig.update_layout(
        template="plotly_dark",
        plot_bgcolor="#0d1527",
        paper_bgcolor="#0b0f19",
        margin=dict(l=10, r=10, t=30, b=10),
        height=320,
        showlegend=False,
        xaxis=dict(gridcolor="#1e293b", title="Precio Final S_T ($)"),
        yaxis=dict(gridcolor="#1e293b", title="Frecuencia (de 10,000 trayectorias)")
    )
    return fig


# ------------------------------------------------------------------------------
# 6. FLUJO PRINCIPAL DE LA APLICACIÓN STREAMLIT
# ------------------------------------------------------------------------------
init_session_state()

# Simulación de un tick si el mercado está activo
if not st.session_state.market_paused:
    simulate_market_tick()

# ==================== BARRA LATERAL (SIDEBAR) ====================
with st.sidebar:
    st.markdown("### 🎛️ Terminal de Control")
    
    # Indicador de estado del mercado
    if st.session_state.market_paused:
        st.markdown('<div class="badge-paused">⏸️ MERCADO PAUSADO (S₀ FIJADO)</div>', unsafe_allow_html=True)
    else:
        st.markdown('<div class="badge-live">🟢 MERCADO EN VIVO (ACTIVO)</div>', unsafe_allow_html=True)

    st.markdown("---")

    # CONTROL DE PAUSA / REANUDAR
    col_p1, col_p2 = st.columns(2)
    with col_p1:
        if st.button("⏸️ Pausar", use_container_width=True, disabled=st.session_state.market_paused):
            st.session_state.market_paused = True
            st.session_state.s0_frozen = st.session_state.current_price
            st.rerun()
    with col_p2:
        if st.button("▶️ Reanudar", use_container_width=True, disabled=not st.session_state.market_paused):
            st.session_state.market_paused = False
            st.rerun()

    st.markdown("---")

    # MÓDULO DE PARTICIPACIÓN DEL PÚBLICO (ORDEN DE MERCADO / LÍMITE)
    st.markdown("### 📱 Participación del Público")
    st.caption("Envía órdenes desde el celular o navegador para mover el libro de órdenes en tiempo real.")

    order_side = st.radio("Sentido de la Orden:", ["COMPRA (Bid)", "VENTA (Ask)"], horizontal=True)
    order_type = st.selectbox("Tipo de Orden:", ["MARKET (Precio de Mercado)", "LIMIT (Precio Límite)"])
    
    order_qty = st.number_input("Cantidad de Acciones:", min_value=10, max_value=5000, value=200, step=50)

    limit_px = None
    if "LIMIT" in order_type:
        def_limit = st.session_state.current_price - 0.10 if "COMPRA" in order_side else st.session_state.current_price + 0.10
        limit_px = st.number_input("Precio Límite ($):", min_value=1.0, max_value=1000.0, value=round(def_limit, 2), step=0.05)

    btn_order_label = "🚀 Enviar Orden al Mercado"
    if st.button(btn_order_label, use_container_width=True, disabled=st.session_state.market_paused):
        clean_side = "BUY" if "COMPRA" in order_side else "SELL"
        clean_type = "MARKET" if "MARKET" in order_type else "LIMIT"
        execute_order(clean_side, clean_type, int(order_qty), limit_px)
        st.rerun()

    st.markdown("---")
    
    # REFRESH / TICK MANUAL
    if st.button("⚡ Generar Tick de Mercado", use_container_width=True, disabled=st.session_state.market_paused):
        simulate_market_tick()
        st.rerun()

    st.markdown("---")
    st.markdown("##### 📌 Datos del Activo")
    st.caption(f"**Ticker:** QNTM-USD\n\n**Precio Actual:** ${st.session_state.current_price:.2f}\n\n**S₀ Congelado:** ${st.session_state.s0_frozen:.2f}")


# ==================== CONTENIDO PRINCIPAL ====================

# Encabezado estilo Wall Street
st.markdown("""
<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-bottom: 16px;">
    <div>
        <h1 style="margin: 0; font-size: 1.8rem; font-weight: 800; color: #f8fafc; letter-spacing: -0.02em;">
            🏛️ QUANTMARKET TERMINAL
        </h1>
        <p style="margin: 0; color: #94a3b8; font-size: 0.9rem;">
            Plataforma Académica: Microestructura de Mercado, Bloques de Liquidez y Simulación Cuantitativa
        </p>
    </div>
</div>
""", unsafe_allow_html=True)

# Ticker Bar con Métricas en Vivo
col_m1, col_m2, col_m3, col_m4, col_m5 = st.columns(5)

best_bid = st.session_state.order_book["bids"][0]["price"] if st.session_state.order_book["bids"] else st.session_state.current_price - 0.05
best_ask = st.session_state.order_book["asks"][0]["price"] if st.session_state.order_book["asks"] else st.session_state.current_price + 0.05
spread = round(best_ask - best_bid, 2)
first_price = st.session_state.price_history[0]["open"]
chg_pct = ((st.session_state.current_price - first_price) / first_price) * 100

with col_m1:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-title">Precio Spot (S_t)</div>
        <div class="metric-value {'metric-bull' if chg_pct >= 0 else 'metric-bear'}">${st.session_state.current_price:.2f}</div>
    </div>
    """, unsafe_allow_html=True)

with col_m2:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-title">Variación Sesión</div>
        <div class="metric-value {'metric-bull' if chg_pct >= 0 else 'metric-bear'}">{'+' if chg_pct >= 0 else ''}{chg_pct:.2f}%</div>
    </div>
    """, unsafe_allow_html=True)

with col_m3:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-title">Bid / Ask (Spread)</div>
        <div class="metric-value metric-neutral">${best_bid:.2f} / ${best_ask:.2f}</div>
    </div>
    """, unsafe_allow_html=True)

with col_m4:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-title">Spread de Mercado</div>
        <div class="metric-value metric-gold">${spread:.2f}</div>
    </div>
    """, unsafe_allow_html=True)

with col_m5:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-title">S₀ de Referencia</div>
        <div class="metric-value metric-neutral">${st.session_state.s0_frozen:.2f}</div>
    </div>
    """, unsafe_allow_html=True)

# TABS PRINCIPALES: 1. MERCADO EN VIVO | 2. SIMULACIÓN MONTE CARLO | 3. MARCO TEÓRICO
tab_market, tab_mc, tab_theory = st.tabs([
    "📊 MÓDULO 1: Mercado en Vivo & Bloques de Liquidez",
    "🎲 MÓDULO 3: Monte Carlo (10,000 Trayectorias)",
    "📚 Exposición Académica & Formulación Matemática"
])

# ------------------------------------------------------------------------------
# TAB 1: MERCADO EN VIVO Y LIBRO DE ÓRDENES
# ------------------------------------------------------------------------------
with tab_market:
    col_chart_left, col_book_right = st.columns([1.7, 1.1])

    with col_chart_left:
        st.subheader("📈 Formación de Precios en Vivo (Candlestick + Volumen)")
        df_candles = pd.DataFrame(st.session_state.price_history)
        fig_candle = create_candlestick_chart(df_candles)
        st.plotly_chart(fig_candle, use_container_width=True)

        st.markdown("#### 🌊 Profundidad de Mercado & Muros de Liquidez")
        fig_depth = create_order_book_depth_chart(st.session_state.order_book)
        st.plotly_chart(fig_depth, use_container_width=True)

    with col_book_right:
        st.subheader("📖 Libro de Órdenes (L2 Depth)")
        
        # Sub-columnas para Asks y Bids
        bids = st.session_state.order_book["bids"][:8]
        asks = st.session_state.order_book["asks"][:8]

        # Tabla interactiva con barras de volumen relativas
        df_book_view = pd.DataFrame({
            "Tipo": ["ASK (Venta)"] * len(asks) + ["BID (Compra)"] * len(bids),
            "Precio ($)": [a["price"] for a in reversed(asks)] + [b["price"] for b in bids],
            "Volumen": [a["volume"] for a in reversed(asks)] + [b["volume"] for b in bids],
            "Bloque": ["🧱 INSTITUCIONAL" if a.get("is_block") else "" for a in reversed(asks)] + \
                      ["🧱 INSTITUCIONAL" if b.get("is_block") else "" for b in bids]
        })
        st.dataframe(
            df_book_view,
            use_container_width=True,
            hide_index=True,
            height=300
        )

        st.markdown("#### ⚡ Cinta de Operaciones (Time & Sales)")
        df_tape = pd.DataFrame(st.session_state.trade_tape)
        st.dataframe(df_tape, use_container_width=True, hide_index=True, height=240)


# ------------------------------------------------------------------------------
# TAB 2: MONTE CARLO (10,000 TRAYECTORIAS)
# ------------------------------------------------------------------------------
with tab_mc:
    st.subheader("🎲 Módulo Cuantitativo: Simulación de Monte Carlo (MGB)")

    if not st.session_state.market_paused:
        st.info("💡 **Consejo Académico:** Puedes pausar el mercado desde la barra lateral para fijar con precisión el precio inicial $S_0$. Actualmente usando el precio actual del activo.")

    # Parámetros del modelo estocástico
    st.markdown("#### ⚙️ Parámetros del Movimiento Geométrico Browniano (MGB)")
    col_p1, col_p2, col_p3, col_p4 = st.columns(4)

    with col_p1:
        s0_input = st.number_input(
            "Precio Inicial (S₀):",
            value=float(st.session_state.s0_frozen if st.session_state.market_paused else st.session_state.current_price),
            step=0.5,
            format="%.2f"
        )
    with col_p2:
        t_days = st.slider("Horizonte de Tiempo T (Días Hábiles):", min_value=10, max_value=252, value=63, step=1)
    with col_p3:
        vol_pct = st.slider("Volatilidad Anualizada (σ):", min_value=5, max_value=120, value=25, step=1)
        sigma = vol_pct / 100.0
    with col_p4:
        drift_pct = st.slider("Drift / Tasa Libre de Riesgo (μ):", min_value=-50, max_value=50, value=8, step=1)
        mu = drift_pct / 100.0

    num_sims = 10000
    st.caption(f"🚀 Vectorización en NumPy para **{num_sims:,} trayectorias** estocásticas independientes.")

    if st.button("🔥 Ejecutar 10,000 Simulaciones de Monte Carlo", type="primary", use_container_width=True):
        with st.spinner("Calculando 10,000 trayectorias estocásticas vectorizadas en NumPy..."):
            res = run_monte_carlo_simulation(s0_input, t_days, sigma, mu, num_simulations=num_sims)
            st.session_state.monte_carlo_results = res
            st.success(f"¡Cálculo de {num_sims:,} trayectorias completado exitosamente en tiempo récord!")

    # Si hay resultados, visualizarlos
    if st.session_state.monte_carlo_results is not None:
        mc = st.session_state.monte_carlo_results

        st.markdown("---")
        st.markdown("### 📊 Métricas Cuantitativas y Gestión de Riesgo (VaR)")

        mcol1, mcol2, mcol3, mcol4, mcol5 = st.columns(5)
        
        ret_expected = ((mc["mean_final"] - mc["s0"]) / mc["s0"]) * 100

        with mcol1:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-title">Precio Medio Esperado E[S_T]</div>
                <div class="metric-value metric-bull">${mc["mean_final"]:.2f}</div>
                <div class="metric-title">Retorno: {ret_expected:+.2f}%</div>
            </div>
            """, unsafe_allow_html=True)

        with mcol2:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-title">Mediana Final (P50)</div>
                <div class="metric-value metric-neutral">${mc["median_final"]:.2f}</div>
                <div class="metric-title">Desv. Est: ±${mc["std_final"]:.2f}</div>
            </div>
            """, unsafe_allow_html=True)

        with mcol3:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-title">Probabilidad de Ganancia</div>
                <div class="metric-value metric-gold">{mc["prob_profit"]:.1f}%</div>
                <div class="metric-title">P(S_T > S₀)</div>
            </div>
            """, unsafe_allow_html=True)

        with mcol4:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-title">Value at Risk 95% (VaR)</div>
                <div class="metric-value metric-bear">${mc["var_95_loss_dollar"]:.2f}</div>
                <div class="metric-title">Pérdida Máx: -{mc["var_95_loss_pct"]:.2f}%</div>
            </div>
            """, unsafe_allow_html=True)

        with mcol5:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-title">Conditional VaR (CVaR 95%)</div>
                <div class="metric-value metric-bear">${mc["cvar_loss_dollar"]:.2f}</div>
                <div class="metric-title">Expected Shortfall: -{mc["cvar_loss_pct"]:.2f}%</div>
            </div>
            """, unsafe_allow_html=True)

        # Gráficos de Monte Carlo
        col_mc_graph, col_dist_graph = st.columns([1.6, 1.2])

        with col_mc_graph:
            st.markdown("#### 🌌 Cono de Incertidumbre y Muestra de Trayectorias")
            st.caption("Visualizando abanicos percentiles (5%, 25%, 50%, 75%, 95%) sobre 10,000 trayectorias generadas.")
            fig_mc = create_monte_carlo_chart(mc)
            st.plotly_chart(fig_mc, use_container_width=True)

        with col_dist_graph:
            st.markdown("#### 🔔 Distribución de Precios en el Horizonte T")
            st.caption("Histograma log-normal empírico con corte de VaR al 95% de confianza.")
            fig_hist = create_distribution_histogram(mc)
            st.plotly_chart(fig_hist, use_container_width=True)


# ------------------------------------------------------------------------------
# TAB 3: EXPOSICIÓN ACADÉMICA Y FORMULACIÓN MATEMÁTICA
# ------------------------------------------------------------------------------
with tab_theory:
    st.subheader("🎓 Fundamentos Teóricos de Microestructura y Modelado Estocástico")
    
    col_t1, col_t2 = st.columns(2)

    with col_t1:
        st.markdown("""
        ### 1. Microestructura de Mercado y Formación de Precios
        
        * **Libro de Órdenes Centralizado (CLOB):** Registro electrónico continuo donde conviven órdenes pasivas (Órdenes Límite) que aportan liquidez y órdenes activas (Órdenes de Mercado) que la consumen.
        * **Creadores de Mercado (Market Makers):** Agentes que cotizan simultáneamente precios de compra (*Bids*) y venta (*Asks*). Su ganancia bruta es el *Spread Bid-Ask*, asumiendo el riesgo de inventario y de selección adversa (*Adverse Selection*).
        * **Bloques de Liquidez (Liquidity Walls):** Agrupaciones masivas de contratos u órdenes pendientes en niveles psicológicos o zonas de soporte/resistencia institucional. Actúan como barreras que frenan la volatilidad hasta que son completamente absorbidas por grandes órdenes de mercado.
        * **Impacto en el Precio (Slippage):** Cuando una orden de mercado supera el volumen disponible en el mejor nivel del libro, "barre" los niveles siguientes, encareciendo la ejecución.
        """)

    with col_t2:
        st.markdown("""
        ### 2. Movimiento Geométrico Browniano (MGB)
        
        El modelo clásico de Black-Scholes-Merton modela la dinámica de un activo financiero bajo la Ecuación Diferencial Estocástica (SDE):
        """)
        st.latex(r"dS_t = \mu S_t dt + \sigma S_t dW_t")
        st.markdown("""
        Donde:
        * $S_t$: Precio del activo en el instante $t$.
        * $\mu$: Parámetro de deriva (*Drift* o retorno esperado anualizado).
        * $\sigma$: Volatilidad instantánea del activo.
        * $W_t$: Proceso de Wiener estándar o Movimiento Browniano ($dW_t \sim \mathcal{N}(0, dt)$).

        Aplicando el **Lema de Itô** a la función de transformación $f(S_t) = \ln(S_t)$:
        """)
        st.latex(r"d(\ln S_t) = \left(\mu - \frac{1}{2}\sigma^2\right)dt + \sigma dW_t")
        st.markdown("""
        Integrando entre $0$ y $T$, obtenemos la solución cerrada exacta utilizada en nuestro motor NumPy:
        """)
        st.latex(r"S_T = S_0 \exp\left( \left(\mu - \frac{1}{2}\sigma^2\right)T + \sigma \sqrt{T} Z \right), \quad Z \sim \mathcal{N}(0, 1)")

    st.markdown("---")
    st.markdown("""
    ### 3. Métricas de Riesgo de Cola: VaR vs CVaR (Expected Shortfall)
    * **Value at Risk ($\text{VaR}_\alpha$):** Nivel de pérdida que no será superado con una probabilidad dada $\alpha = 95\%$. En términos matemáticos, corresponde al percentil 5 de la distribución de retornos/precios.
    * **Conditional VaR ($\text{CVaR}_\alpha$ / Expected Shortfall):** Métrica coherente de riesgo que mide el valor esperado de la pérdida en el caso de que se supere el umbral del VaR:
    """)
    st.latex(r"\text{CVaR}_\alpha = \mathbb{E}\left[ S_0 - S_T \mid S_T \le \text{VaR}_\alpha \right]")


# Pie de página
st.markdown("---")
st.caption("QuantMarket Terminal • Desarrollado para exposición académica de Finanzas Cuantitativas • Compatible con Streamlit Community Cloud")
