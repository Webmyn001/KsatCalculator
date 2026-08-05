import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MAX_UNDO_DEPTH, TIMES } from '../constants/times';
import { DEFAULT_SOIL, SOIL_MAP } from '../constants/soils';
import {
  buildRows,
  computeHydraulicConductivity,
} from '../utils/calculations';
import { fitPolynomial } from '../utils/regression';
import { formatEquation, todayISO } from '../utils/formatting';

const STORAGE_KEY = 'ksat-calculator-state-v1';

const EMPTY_INPUTS = () => Array(TIMES.length).fill('');

function defaultExperiment() {
  return {
    name: '',
    location: '',
    soilType: '',
    researcher: '',
    date: todayISO(),
  };
}

function makeDefaultState() {
  return {
    experiment: defaultExperiment(),
    soilTexture: DEFAULT_SOIL,
    aParam: SOIL_MAP[DEFAULT_SOIL],
    volumeInputs: EMPTY_INPUTS(),
    unit: 'cm³',
    scientific: false,
  };
}

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      ...makeDefaultState(),
      ...parsed,
      experiment: { ...defaultExperiment(), ...(parsed.experiment || {}) },
      volumeInputs: Array.isArray(parsed.volumeInputs)
        ? TIMES.map((_, i) => parsed.volumeInputs[i] ?? '')
        : EMPTY_INPUTS(),
    };
  } catch {
    return null;
  }
}

export const SAMPLE_VOLUMES = [
  '60', '58.9', '58.0', '57.2', '56.5',
  '55.9', '55.4', '55.0', '54.6', '54.3', '54.0',
];

export function useCalculations() {
  const [state, setState] = useState(
    () => loadPersistedState() ?? makeDefaultState(),
  );
  const [history, setHistory] = useState([]);
  const [formVersion, setFormVersion] = useState(0);
  const undoStack = useRef([]);
  const saveTimer = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        /* ignore quota errors */
      }
    }, 300);
    return () => clearTimeout(saveTimer.current);
  }, [state]);

  const derived = useMemo(() => {
    const { rows, volumes } = buildRows(state.volumeInputs);
    const regression = fitPolynomial(
      rows
        .filter((r) => r.cumulativeCm !== null)
        .map((r) => ({ x: r.sqrtTime, y: r.cumulativeCm })),
    );
    const k = computeHydraulicConductivity(regression?.a, state.aParam);
    const last = rows[rows.length - 1];
    return {
      rows,
      volumes,
      regression,
      k,
      totalInfiltrationCm3: last ? last.cumulative : null,
      finalCumulativeCm: last ? last.cumulativeCm : null,
    };
  }, [state.volumeInputs, state.aParam]);

  const pushUndo = useCallback(() => {
    const { volumeInputs, aParam, soilTexture, experiment } = stateRef.current;
    undoStack.current.push(
      JSON.parse(JSON.stringify({ volumeInputs, aParam, soilTexture, experiment })),
    );
    if (undoStack.current.length > MAX_UNDO_DEPTH) {
      undoStack.current.shift();
    }
  }, []);

  const setVolumeInput = useCallback(
    (index, value) => {
      pushUndo();
      setState((s) => {
        const volumeInputs = [...s.volumeInputs];
        volumeInputs[index] = value;
        return { ...s, volumeInputs };
      });
    },
    [pushUndo],
  );

  const setExperimentField = useCallback((field, value) => {
    setState((s) => ({
      ...s,
      experiment: { ...s.experiment, [field]: value },
    }));
  }, []);

  const setSoilTexture = useCallback(
    (texture) => {
      pushUndo();
      setState((s) => ({
        ...s,
        soilTexture: texture || null,
        aParam: texture ? SOIL_MAP[texture] : null,
      }));
    },
    [pushUndo],
  );

  const setAParam = useCallback(
    (raw) => {
      const num = raw === '' ? null : Number(raw);
      pushUndo();
      setState((s) => ({
        ...s,
        aParam: num !== null && Number.isFinite(num) && num > 0 ? num : null,
        soilTexture: null,
      }));
    },
    [pushUndo],
  );

  const setUnit = useCallback((unit) => {
    setState((s) => ({ ...s, unit }));
  }, []);

  const setScientific = useCallback((scientific) => {
    setState((s) => ({ ...s, scientific }));
  }, []);

  const undo = useCallback(() => {
    const snap = undoStack.current.pop();
    if (!snap) return false;
    setState((s) => ({ ...s, ...snap }));
    return true;
  }, []);

  const canUndo = undoStack.current.length > 0;

  const archiveCurrent = useCallback(() => {
    const { experiment, soilTexture, aParam, volumeInputs } = stateRef.current;
    const { regression, k, totalInfiltrationCm3, finalCumulativeCm } = derived;
    if (totalInfiltrationCm3 == null && k == null) return null;
    const item = {
      id: Date.now() + Math.random(),
      createdAt: new Date().toISOString(),
      experiment: { ...experiment },
      soilTexture,
      aParam,
      volumeInputs: [...volumeInputs],
      k,
      r2: regression ? regression.r2 : null,
      equation: regression ? formatEquation(regression) : null,
      totalInfiltrationCm3,
      finalCumulativeCm,
    };
    setHistory((h) => [item, ...h].slice(0, 20));
    return item;
  }, [derived]);

  const reset = useCallback(() => {
    const item = archiveCurrent();
    undoStack.current = [];
    setState((s) => ({
      ...makeDefaultState(),
      unit: s.unit,
      scientific: s.scientific,
    }));
    setFormVersion((v) => v + 1);
    return item;
  }, [archiveCurrent]);

  const loadSample = useCallback(() => {
    pushUndo();
    setState((s) => ({ ...s, volumeInputs: [...SAMPLE_VOLUMES] }));
  }, [pushUndo]);

  const restoreHistory = useCallback((item) => {
    setState((s) => ({
      ...s,
      experiment: { ...item.experiment },
      soilTexture: item.soilTexture,
      aParam: item.aParam,
      volumeInputs: [...item.volumeInputs],
    }));
    setHistory((h) => h.filter((x) => x.id !== item.id));
    setFormVersion((v) => v + 1);
  }, []);

  const removeHistory = useCallback((id) => {
    setHistory((h) => h.filter((x) => x.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    state,
    derived,
    history,
    formVersion,
    canUndo,
    setVolumeInput,
    setExperimentField,
    setSoilTexture,
    setAParam,
    setUnit,
    setScientific,
    undo,
    reset,
    loadSample,
    restoreHistory,
    removeHistory,
    clearHistory,
    archiveCurrent,
  };
}
