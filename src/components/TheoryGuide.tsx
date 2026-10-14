import React from 'react';
import { BookOpen, HelpCircle, Layers, Cpu, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const TheoryGuide: React.FC = () => {
  return (
    <div className="flex flex-col gap-5 text-slate-300 font-sans">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-slate-900 border border-purple-800/40 rounded-xl p-5">
        <div className="flex items-center gap-2.5 text-purple-300 font-mono font-bold text-base mb-1">
          <BookOpen className="w-5 h-5 text-purple-400" />
          <span>GUÍA ACADÉMICA Y MATERIAL DE APOYO PARA EXPOSITORES</span>
        </div>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Este módulo condensa los conceptos matemáticos, estadísticos y financieros necesarios para exponer con rigor académico 
          la Formación de Precios en Microestructura de Mercado y la Modelización Estocástica mediante Simulaciones de Monte Carlo.
        </p>
      </div>

      {/* Grid of 4 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pillar 1 */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-sm">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>1. Microestructura de Mercado & Formación de Precios</span>
          </div>
          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              El mercado financiero continuo opera bajo un <strong>Libro de Órdenes Límite Centralizado (CLOB)</strong>. 
              El precio no sube o baja por "magia", sino por el desequilibrio entre dos tipos de agentes:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>
                <strong className="text-slate-200">Creadores de Mercado (Market Makers / Órdenes Pasivas):</strong> 
                Colocan órdenes límite en el libro. Proveen liquidez cotizando simultáneamente un precio de compra (<em>Bid</em>) 
                y de venta (<em>Ask</em>). Su beneficio es el <em>Spread Bid-Ask</em>, pero asumen riesgo de selección adversa.
              </li>
              <li>
                <strong className="text-slate-200">Tomadores de Liquidez (Takers / Órdenes de Mercado):</strong> 
                Demandan inmediatez. Ejecutan contra las mejores órdenes límite disponibles, consumiendo volumen y causando 
                <strong>Impacto en el Precio (Price Slippage)</strong> cuando el tamaño de su orden supera el nivel disponible.
              </li>
            </ul>
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>2. Bloques de Liquidez (Muros Institucionales)</span>
          </div>
          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              En la operativa cuantitativa moderna (Order Flow / Level 2), los <strong>Bloques de Liquidez</strong> son 
              acumulaciones anómalas de volumen en un único nivel de precio (generalmente 5x a 10x el promedio del libro):
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>
                <strong className="text-slate-200">Soportes y Resistencias Reales:</strong> 
                A diferencia de los indicadores técnicos rezagados (medias móviles), un bloque institucional en el libro 
                constituye una barrera física de absorción de órdenes.
              </li>
              <li>
                <strong className="text-slate-200">Comportamiento en la Presentación:</strong> 
                Muestra a la audiencia cómo al enviar una orden pequeña el precio no cambia, pero si envías una orden de mercado 
                que supera el bloque de liquidez, el precio salta violentamente al siguiente nivel.
              </li>
            </ul>
          </div>
        </div>

        {/* Pillar 3 */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-sm">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>3. Movimiento Geométrico Browniano (MGB) & Lema de Itô</span>
          </div>
          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              La dinámica estocástica del precio $S_t$ se formaliza mediante la Ecuación Diferencial Estocástica (SDE):
            </p>
            <div className="p-2.5 rounded bg-slate-950 font-mono text-cyan-300 border border-slate-800 text-center text-xs">
              dS_t = &mu; S_t dt + &sigma; S_t dW_t
            </div>
            <p>
              Donde $W_t$ es un proceso estándar de Wiener ($dW_t \sim \mathcal&#123;N&#125;(0, dt)$). 
              Aplicando el <strong>Lema de Itô</strong> sobre la función convexa $f(S_t) = \ln(S_t)$:
            </p>
            <div className="p-2.5 rounded bg-slate-950 font-mono text-emerald-300 border border-slate-800 text-center text-xs">
              d(\ln S_t) = (&mu; - &frac12;&sigma;&sup2;) dt + &sigma; dW_t
            </div>
            <p className="text-[11px] text-slate-400">
              El término <strong>-&frac12;&sigma;&sup2;</strong> es la <em>corrección de convexidad de Jensen</em>, 
              que garantiza que el valor esperado del precio satisfaga $\mathbb&#123;E&#125;[S_t] = S_0 e^&#123;&mu; t&#125;$.
            </p>
          </div>
        </div>

        {/* Pillar 4 */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-rose-400 font-mono font-bold text-sm">
            <HelpCircle className="w-4 h-4 text-rose-400" />
            <span>4. Métricas de Riesgo: VaR al 95% vs CVaR (Expected Shortfall)</span>
          </div>
          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              Las 10,000 simulaciones permiten estimar cuantitativamente la distribución empírica sin depender de supuestos cerrados:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>
                <strong className="text-slate-200">Value at Risk (VaR 95%):</strong> 
                Representa el percentil 5 de los precios finales. Con un 95% de confianza, la pérdida no superará dicho umbral.
              </li>
              <li>
                <strong className="text-slate-200">Conditional VaR (CVaR / Expected Shortfall):</strong> 
                Supera la mayor limitación del VaR (su no sub-aditividad en colas pesadas) calculando el 
                <em>promedio esperado de las pérdidas cuando se supera el VaR</em>.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Presentation Roadmap / Speaker Notes */}
      <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-4">
        <h3 className="font-mono text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Estructura Recomendada para tu Exposición (10-15 Minutos)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase block mb-1">Minutos 0 a 4</span>
            <h4 className="font-bold text-slate-200 mb-1">Módulo 1: Mercado en Vivo</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Muestra el gráfico de velas en vivo. Pide a alguien de la audiencia enviar una orden de mercado 
              y observa en la pantalla cómo se absorbe la liquidez y se desplaza el precio.
            </p>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase block mb-1">Minutos 5 a 9</span>
            <h4 className="font-bold text-slate-200 mb-1">Módulo 2: Congelar S₀</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Presiona el botón de <strong>"Pausar Mercado"</strong>. Explica que en finanzas cuantitativas 
              el estado actual del mercado se fija como condición inicial $S_0$ para el cálculo de derivados y proyecciones.
            </p>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-purple-400 font-mono font-bold uppercase block mb-1">Minutos 10 a 15</span>
            <h4 className="font-bold text-slate-200 mb-1">Módulo 3: Monte Carlo</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Ejecuta las 10,000 simulaciones. Muestra cómo la dispersión del cono de incertidumbre crece con &radic;T 
              y cómo el histograma ilustra el VaR al 95% para gestionar el riesgo de un portafolio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
