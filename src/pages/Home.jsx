import { useMemo, useRef } from 'react';
import {
  PlayCircle,
  Droplets,
  ClipboardList,
  FlaskConical,
  LineChart,
  Gauge,
  FileSpreadsheet,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import Header from '../components/Header';
import ExperimentForm from '../components/ExperimentForm';
import VanGenuchtenCard from '../components/VanGenuchtenCard';
import MeasurementTable from '../components/MeasurementTable';
import SummaryCards from '../components/SummaryCards';
import GraphPlot from '../components/GraphPlot';
import EquationCard from '../components/EquationCard';
import HydraulicCard from '../components/HydraulicCard';
import ExportButtons from '../components/ExportButtons';
import FormulaSection from '../components/FormulaSection';
import HistoryPanel from '../components/HistoryPanel';
import { fittedCurve } from '../utils/regression';

function SectionHeading({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-4">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
        <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        {title}
      </h2>
      {subtitle && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      )}
    </div>
  );
}

function Landing({ onStart }) {
  const features = [
    {
      icon: FlaskConical,
      title: 'Field Measurements',
      text: 'Record volume readings every 30 seconds and watch every derived value update live.',
    },
    {
      icon: Gauge,
      title: 'Zhang (1997) Method',
      text: 'Hydraulic conductivity K = C₁/A from the quadratic fit of cumulative infiltration vs √time.',
    },
    {
      icon: FileSpreadsheet,
      title: 'One-Click Reports',
      text: 'Export a formatted Excel workbook, a professional PDF report, or a PNG of the graph.',
    },
  ];

  const steps = [
    { n: '1', text: 'Fill in the experiment details and date.' },
    { n: '2', text: 'Pick a soil texture to auto-fill the Van Genuchten A parameter.' },
    { n: '3', text: 'Type the volume remaining in the disk at each time step.' },
    { n: '4', text: 'Read off infiltration, the polynomial equation, R² and K instantly.' },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="animate-fadeUp overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 shadow-xl">
        <div className="px-6 py-12 text-center text-white sm:px-12 sm:py-16">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <Droplets className="h-9 w-9" aria-hidden="true" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            Mini Disk Infiltrometer Calculator
          </h2>
          <p className="mt-2 text-lg font-semibold text-emerald-100">
            (2 cm Suction)
          </p>
          <blockquote className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-emerald-50 sm:text-base">
            This application calculates infiltration characteristics and hydraulic
            conductivity from Mini Disk Infiltrometer field measurements following the
            method used in Soil Physics laboratories.
          </blockquote>
          <button
            onClick={onStart}
            className="mt-8 inline-flex items-center gap-2.5 rounded-2xl bg-white px-8 py-4 text-base font-bold text-emerald-800 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <PlayCircle className="h-6 w-6" aria-hidden="true" />
            Start New Experiment
          </button>
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="card animate-fadeUp p-5"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="mb-1 font-bold text-slate-800 dark:text-slate-100">{title}</h3>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{text}</p>
          </div>
        ))}
      </div>

      <div className="card mt-6 p-6">
        <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
          <ClipboardList className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          How it works
        </h3>
        <ol className="grid gap-3 sm:grid-cols-2">
          {steps.map(({ n, text }) => (
            <li key={n} className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                {n}
              </span>
              <span className="pt-0.5 text-sm text-slate-600 dark:text-slate-300">{text}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="card mt-6 flex items-start gap-3 p-5">
        <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          The procedure follows the Soil Physics laboratory practical used in the
          <span className="font-semibold">
            {' '}Department of Soil Science and Land Resources Management, Obafemi Awolowo
            University (O.A.U.){' '}
          </span>
          and the unsaturated hydraulic conductivity method of Zhang (1997). All
          calculations run instantly in your browser — no data leaves this page.
        </p>
      </div>

      <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
        Developed by{' '}
        <span className="font-semibold text-slate-500 dark:text-slate-400">
          Bello Muhyideen (Webmyn)
        </span>
      </p>
    </main>
  );
}

function Workspace({ calc, toast, dark, graphRef }) {
  const { state, derived, formVersion } = calc;
  const { experiment, soilTexture, aParam, unit, scientific, volumeInputs } = state;
  const { rows, regression, k, totalInfiltrationCm3, finalCumulativeCm } = derived;

  const points = useMemo(
    () =>
      rows
        .filter((r) => r.cumulativeCm !== null)
        .map((r) => ({ sqrtTime: r.sqrtTime, cumCm: r.cumulativeCm })),
    [rows],
  );
  const maxSqrt = points.length
    ? Math.max(...points.map((p) => p.sqrtTime))
    : Math.sqrt(300);
  const curve = useMemo(
    () => fittedCurve(regression, 0, maxSqrt),
    [regression, maxSqrt],
  );

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <div className="no-print flex items-start gap-3 rounded-2xl bg-emerald-50 px-5 py-4 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:ring-emerald-900">
        <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-emerald-900 dark:text-emerald-200">
          The procedure follows the Soil Physics laboratory practical used in the{' '}
          <span className="font-semibold">
            Department of Soil Science and Land Resources Management, Obafemi Awolowo
            University (O.A.U.)
          </span>{' '}
          and the unsaturated hydraulic conductivity method of Zhang (1997). All calculations
          run instantly in your browser — no data leaves this page.
        </p>
      </div>

      <div className="print-only">
        <h1 className="text-xl font-extrabold text-emerald-800">
          MINI DISK INFILTROMETER CALCULATOR
        </h1>
        <p className="text-sm">2 cm Suction — Infiltration &amp; Hydraulic Conductivity Report</p>
        <p className="text-sm">
          {experiment.name ? `Experiment: ${experiment.name}` : ''}
          {experiment.researcher ? ` · Researcher: ${experiment.researcher}` : ''}
        </p>
        <hr className="my-2 border-slate-400" />
      </div>

      <section id="experiment">
        <div className="card p-5 sm:p-6">
          <SectionHeading
            icon={ClipboardList}
            title="Experiment Details"
            subtitle="Describe the field test. Only the experiment name is required."
          />
          <ExperimentForm
            experiment={experiment}
            onChange={calc.setExperimentField}
            formVersion={formVersion}
          />
        </div>
      </section>

      <section id="soil">
        <VanGenuchtenCard
          soilTexture={soilTexture}
          aParam={aParam}
          onSelectTexture={calc.setSoilTexture}
          onAParamChange={calc.setAParam}
        />
      </section>

      <section id="table">
        <MeasurementTable
          rows={rows}
          volumeInputs={volumeInputs}
          unit={unit}
          onUnitChange={calc.setUnit}
          scientific={scientific}
          onScientificChange={calc.setScientific}
          onVolumeChange={calc.setVolumeInput}
          onLoadSample={calc.loadSample}
          onUndo={calc.undo}
          canUndo={calc.canUndo}
        />
      </section>

      <section id="results">
        <div className="card p-5 sm:p-6">
          <SectionHeading
            icon={Gauge}
            title="Calculated Results"
            subtitle="All values update live as you type volume readings."
          />
          <SummaryCards
            totalInfiltrationCm3={totalInfiltrationCm3}
            finalCumulativeCm={finalCumulativeCm}
            regression={regression}
            k={k}
            unit={unit}
            scientific={scientific}
          />
        </div>
      </section>

      <section id="graph" className="no-print">
        <GraphPlot
          ref={graphRef}
          points={points}
          curve={curve}
          hasData={points.length > 0}
          isDark={dark}
        />
      </section>

      <section id="equation" className="grid gap-6 lg:grid-cols-2">
        <EquationCard regression={regression} scientific={scientific} />
        <HydraulicCard
          k={k}
          aCoef={regression ? regression.a : null}
          aParam={aParam}
          scientific={scientific}
        />
      </section>

      <section id="formulas" className="no-print">
        <FormulaSection />
      </section>

      <section id="download" className="no-print">
        <ExportButtons calc={calc} graphRef={graphRef} toast={toast} />
      </section>

      <section id="history" className="no-print">
        <HistoryPanel
          history={calc.history}
          onRestore={calc.restoreHistory}
          onRemove={calc.removeHistory}
          onClear={calc.clearHistory}
        />
      </section>

      <footer className="print:hidden pt-4 pb-8 text-center">
        <div className="mx-auto flex max-w-xl items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <GraduationCap className="h-4 w-4" aria-hidden="true" />
          <span>
            Built for the Department of Soil Science and Land Resources Management,
            Obafemi Awolowo University.
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-300 dark:text-slate-600">
          Generated using KunsatCalculator
        </p>
        <p className="mt-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
          Developed by Bello Muhyideen (Webmyn)
        </p>
      </footer>
    </main>
  );
}

export default function Home({ calc, started, onStart, dark, toggleDark, toast }) {
  const graphRef = useRef(null);

  return (
    <div className="min-h-screen bg-slate-100 font-sans dark:bg-slate-950">
      <Header
        onHome={() => onStart(false)}
        showHome={started}
        dark={dark}
        toggleDark={toggleDark}
      />
      {started ? (
        <Workspace calc={calc} toast={toast} dark={dark} graphRef={graphRef} />
      ) : (
        <Landing onStart={() => onStart(true)} />
      )}
    </div>
  );
}
