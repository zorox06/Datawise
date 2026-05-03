"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Upload,
  Table,
  Sparkles,
  BarChart3,
  PieChart,
  LayoutDashboard,
  FileText,
  Database,
  Trash2,
  Wand2,
  Sun,
  Moon,
  ChevronRight,
  X,
  Download,
  Copy,
  Check,
  AlertCircle,
  TrendingUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Maximize2,
  Pencil,
  Loader2,
  Play,
  RotateCcw,
  Settings,
  Filter,
  Palette,
  Grid3X3,
  Activity,
  Cpu,
  Layers,
  Zap,
  FileDown,
} from "lucide-react";
import Papa from "papaparse";
import { marked } from "marked";

// Types
interface ColumnInfo {
  name: string;
  type: "numeric" | "categorical" | "datetime" | "boolean";
  nullCount: number;
  uniqueCount: number;
  stats?: NumericStats;
  topValues?: { value: string; count: number; percent: number }[];
}

interface NumericStats {
  mean: number;
  median: number;
  mode: number;
  stdDev: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  skewness: "left" | "symmetric" | "right";
}

interface DataRow {
  [key: string]: string | number | boolean | null;
}

interface ChartConfig {
  id: string;
  type: string;
  title: string;
  xAxis: string;
  yAxis: string[];
  colorBy?: string;
  sizeBy?: string;
  aggregation: string;
  theme: string;
  showGrid: boolean;
  showLegend: boolean;
  showDataLabels: boolean;
  showTrendLine: boolean;
  markerSize: number;
  barGap: number;
  opacity: number;
}

interface SavedChart {
  id: string;
  config: ChartConfig;
  timestamp: number;
}

// Demo data
const DEMO_DATA = `product,region,sales,profit,date,quantity
Laptop Pro,North,1250.00,312.50,2024-01-15,5
Wireless Mouse,South,24.99,8.75,2024-01-15,12
USB-C Hub,East,89.00,26.70,2024-01-16,8
Monitor 27",North,399.00,79.80,2024-01-16,3
Keyboard MX,West,149.00,44.70,2024-01-17,7
Laptop Pro,South,1250.00,312.50,2024-01-17,4
Webcam HD,East,79.00,23.70,2024-01-18,15
Headphones,North,199.00,59.70,2024-01-18,9
USB-C Hub,West,89.00,26.70,2024-01-19,11
Monitor 27",South,399.00,79.80,2024-01-19,2
Wireless Mouse,North,24.99,8.75,2024-01-20,25
Laptop Pro,East,1250.00,312.50,2024-01-20,6
Keyboard MX,South,149.00,44.70,2024-01-21,5
Headphones,West,199.00,59.70,2024-01-21,8
Webcam HD,North,79.00,23.70,2024-01-22,12
Monitor 27",East,399.00,79.80,2024-01-22,4
USB-C Hub,South,89.00,26.70,2024-01-23,9
Laptop Pro,West,1250.00,312.50,2024-01-23,3
Wireless Mouse,East,24.99,8.75,2024-01-24,18
Keyboard MX,North,149.00,44.70,2024-01-24,6
Headphones,South,199.00,59.70,2024-01-25,11
Webcam HD,West,79.00,23.70,2024-01-25,14
Monitor 27",North,399.00,79.80,2024-01-26,5
USB-C Hub,East,89.00,26.70,2024-01-26,7
Laptop Pro,South,1250.00,312.50,2024-01-27,8
Wireless Mouse,West,24.99,8.75,2024-01-27,22
Keyboard MX,East,149.00,44.70,2024-01-28,4
Headphones,North,199.00,59.70,2024-01-28,7
Webcam HD,South,79.00,23.70,2024-01-29,16
Monitor 27",West,399.00,79.80,2024-01-29,3
USB-C Hub,North,89.00,26.70,2024-01-30,10
Laptop Pro,East,1250.00,312.50,2024-01-30,5
Wireless Mouse,South,24.99,8.75,2024-01-31,30
Keyboard MX,West,149.00,44.70,2024-01-31,8
Headphones,East,199.00,59.70,2024-02-01,6
Webcam HD,North,79.00,23.70,2024-02-01,11
Monitor 27",South,399.00,79.80,2024-02-02,4
USB-C Hub,West,89.00,26.70,2024-02-02,13
Laptop Pro,North,1250.00,312.50,2024-02-03,7
Wireless Mouse,East,24.99,8.75,2024-02-03,19
Keyboard MX,South,149.00,44.70,2024-02-04,9
Headphones,West,199.00,59.70,2024-02-04,5
Webcam HD,East,79.00,23.70,2024-02-05,8
Monitor 27",North,399.00,79.80,2024-02-05,6
USB-C Hub,South,89.00,26.70,2024-02-06,15
Laptop Pro,West,1250.00,312.50,2024-02-06,4
Wireless Mouse,North,24.99,8.75,2024-02-07,28
Keyboard MX,East,149.00,44.70,2024-02-07,7
Headphones,South,199.00,59.70,2024-02-08,10
Webcam HD,West,79.00,23.70,2024-02-08,13
Monitor 27",East,399.00,79.80,2024-02-09,2
USB-C Hub,North,89.00,26.70,2024-02-09,8
Laptop Pro,South,1250.00,312.50,2024-02-10,9
Wireless Mouse,West,24.99,8.75,2024-02-10,15
Keyboard MX,North,149.00,44.70,2024-02-11,11
Headphones,East,199.00,59.70,2024-02-11,4
Webcam HD,South,79.00,23.70,2024-02-12,17
Monitor 27",West,399.00,79.80,2024-02-12,5
USB-C Hub,East,89.00,26.70,2024-02-13,6
Laptop Pro,North,1250.00,312.50,2024-02-13,6
Wireless Mouse,South,24.99,8.75,2024-02-14,21
Keyboard MX,West,149.00,44.70,2024-02-14,3
Headphones,North,199.00,59.70,2024-02-15,12
Webcam HD,East,79.00,23.70,2024-02-15,9
Monitor 27",South,399.00,79.80,2024-02-16,7
USB-C Hub,West,89.00,26.70,2024-02-16,14
Laptop Pro,East,1250.00,312.50,2024-02-17,5
Wireless Mouse,North,24.99,8.75,2024-02-17,33
Keyboard MX,South,149.00,44.70,2024-02-18,6
Headphones,West,199.00,59.70,2024-02-18,8
Webcam HD,North,79.00,23.70,2024-02-19,10
Monitor 27",East,399.00,79.80,2024-02-19,3
USB-C Hub,South,89.00,26.70,2024-02-20,11
Laptop Pro,West,1250.00,312.50,2024-02-20,7
Wireless Mouse,East,24.99,8.75,2024-02-21,17
Keyboard MX,North,149.00,44.70,2024-02-21,10
Headphones,South,199.00,59.70,2024-02-22,6
Webcam HD,West,79.00,23.70,2024-02-22,15
Monitor 27",North,399.00,79.80,2024-02-23,4
USB-C Hub,East,89.00,26.70,2024-02-23,9
Laptop Pro,South,1250.00,312.50,2024-02-24,8
Wireless Mouse,West,24.99,8.75,2024-02-24,26
Keyboard MX,East,149.00,44.70,2024-02-25,5
Headphones,North,199.00,59.70,2024-02-25,9
Webcam HD,South,79.00,23.70,2024-02-26,12
Monitor 27",West,399.00,79.80,2024-02-26,6
USB-C Hub,North,89.00,26.70,2024-02-27,7
Laptop Pro,East,1250.00,312.50,2024-02-27,4
Wireless Mouse,South,24.99,8.75,2024-02-28,20
Keyboard MX,West,149.00,44.70,2024-02-28,8
Headphones,East,199.00,59.70,2024-02-29,7
Webcam HD,North,79.00,23.70,2024-03-01,11
Monitor 27",South,399.00,79.80,2024-03-01,5
USB-C Hub,West,89.00,26.70,2024-03-02,10
Laptop Pro,North,1250.00,312.50,2024-03-02,6
Wireless Mouse,East,24.99,8.75,2024-03-03,24
Keyboard MX,South,149.00,44.70,2024-03-03,7
Headphones,West,199.00,59.70,2024-03-04,5
Webcam HD,East,79.00,23.70,2024-03-04,14
Monitor 27",North,399.00,79.80,2024-03-05,3
USB-C Hub,South,89.00,26.70,2024-03-05,12
Laptop Pro,West,1250.00,312.50,2024-03-06,5
Wireless Mouse,North,24.99,8.75,2024-03-06,29
Keyboard MX,East,149.00,44.70,2024-03-07,4
Headphones,South,199.00,59.70,2024-03-07,11
Webcam HD,West,79.00,23.70,2024-03-08,8
Monitor 27",East,399.00,79.80,2024-03-08,4
USB-C Hub,North,89.00,26.70,2024-03-09,6
Laptop Pro,South,1250.00,312.50,2024-03-09,7
Wireless Mouse,West,24.99,8.75,2024-03-10,16
Keyboard MX,North,149.00,44.70,2024-03-10,9
Headphones,East,199.00,59.70,2024-03-11,8
Webcam HD,South,79.00,23.70,2024-03-11,13
Monitor 27",West,399.00,79.80,2024-03-12,5
USB-C Hub,East,89.00,26.70,2024-03-12,8
Laptop Pro,North,1250.00,312.50,2024-03-13,4
Wireless Mouse,South,24.99,8.75,2024-03-13,22
Keyboard MX,West,149.00,44.70,2024-03-14,6
Headphones,North,199.00,59.70,2024-03-14,10
Webcam HD,East,79.00,23.70,2024-03-15,9
Monitor 27",South,399.00,79.80,2024-03-15,6
USB-C Hub,West,89.00,26.70,2024-03-16,11
Laptop Pro,East,1250.00,312.50,2024-03-16,8
Wireless Mouse,North,24.99,8.75,2024-03-17,31
Keyboard MX,South,149.00,44.70,2024-03-17,5
Headphones,West,199.00,59.70,2024-03-18,7
Webcam HD,North,79.00,23.70,2024-03-18,16
Monitor 27",East,399.00,79.80,2024-03-19,4
USB-C Hub,South,89.00,26.70,2024-03-19,9
Laptop Pro,West,1250.00,312.50,2024-03-20,6
Wireless Mouse,East,24.99,8.75,2024-03-20,18
Keyboard MX,North,149.00,44.70,2024-03-21,8
Headphones,South,199.00,59.70,2024-03-21,6
Webcam HD,West,79.00,23.70,2024-03-22,12
Monitor 27",North,399.00,79.80,2024-03-22,7
USB-C Hub,East,89.00,26.70,2024-03-23,5
Laptop Pro,South,1250.00,312.50,2024-03-23,9
Wireless Mouse,West,24.99,8.75,2024-03-24,14
Keyboard MX,East,149.00,44.70,2024-03-24,7
Headphones,North,199.00,59.70,2024-03-25,9
Webcam HD,South,79.00,23.70,2024-03-25,11
Monitor 27",West,399.00,79.80,2024-03-26,3
USB-C Hub,North,89.00,26.70,2024-03-26,13
Laptop Pro,East,1250.00,312.50,2024-03-27,5
Wireless Mouse,South,24.99,8.75,2024-03-27,27
Keyboard MX,West,149.00,44.70,2024-03-28,4
Headphones,East,199.00,59.70,2024-03-28,8
Webcam HD,North,79.00,23.70,2024-03-29,10
Monitor 27",South,399.00,79.80,2024-03-29,5
USB-C Hub,West,89.00,26.70,2024-03-30,7
Laptop Pro,North,1250.00,312.50,2024-03-30,7
Wireless Mouse,East,24.99,8.75,2024-03-31,23
Keyboard MX,South,149.00,44.70,2024-03-31,6
Headphones,West,199.00,59.70,2024-04-01,5
Webcam HD,East,79.00,23.70,2024-04-01,14
Monitor 27",North,399.00,79.80,2024-04-02,4
USB-C Hub,South,89.00,26.70,2024-04-02,10
Laptop Pro,West,1250.00,312.50,2024-04-03,6
Wireless Mouse,North,24.99,8.75,2024-04-03,19
Keyboard MX,East,149.00,44.70,2024-04-04,9
Headphones,South,199.00,59.70,2024-04-04,7
Webcam HD,West,79.00,23.70,2024-04-05,8
Monitor 27",East,399.00,79.80,2024-04-05,6
USB-C Hub,North,89.00,26.70,2024-04-06,12
Laptop Pro,South,1250.00,312.50,2024-04-06,4
Wireless Mouse,West,24.99,8.75,2024-04-07,25
Keyboard MX,North,149.00,44.70,2024-04-07,5
Headphones,East,199.00,59.70,2024-04-08,10
Webcam HD,South,79.00,23.70,2024-04-08,7
Monitor 27",West,399.00,79.80,2024-04-09,5
USB-C Hub,East,89.00,26.70,2024-04-09,8
Laptop Pro,North,1250.00,312.50,2024-04-10,8
Wireless Mouse,South,24.99,8.75,2024-04-10,16
Keyboard MX,West,149.00,44.70,2024-04-11,7
Headphones,North,199.00,59.70,2024-04-11,6
Webcam HD,East,79.00,23.70,2024-04-12,15
Monitor 27",South,399.00,79.80,2024-04-12,4
USB-C Hub,West,89.00,26.70,2024-04-13,6
Laptop Pro,East,1250.00,312.50,2024-04-13,5
Wireless Mouse,North,24.99,8.75,2024-04-14,32
Keyboard MX,South,149.00,44.70,2024-04-14,8
Headphones,West,199.00,59.70,2024-04-15,4
Webcam HD,North,79.00,23.70,2024-04-15,11`;

const sections = [
  { id: "upload", label: "Upload", icon: Upload },
  { id: "preview", label: "Preview", icon: Table },
  { id: "clean", label: "Clean", icon: Sparkles },
  { id: "stats", label: "Stats", icon: Activity },
  { id: "ai-charts", label: "AI Charts", icon: Wand2 },
  { id: "studio", label: "Chart Studio", icon: BarChart3 },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "report", label: "Report", icon: FileText },
  { id: "sql", label: "SQL", icon: Database },
];

const chartTypes = [
  { id: "bar", label: "Bar", icon: BarChart3 },
  { id: "grouped-bar", label: "Grouped Bar", icon: BarChart3 },
  { id: "stacked-bar", label: "Stacked Bar", icon: BarChart3 },
  { id: "line", label: "Line", icon: TrendingUp },
  { id: "multi-line", label: "Multi-Line", icon: TrendingUp },
  { id: "area", label: "Area", icon: Layers },
  { id: "scatter", label: "Scatter", icon: Grid3X3 },
  { id: "bubble", label: "Bubble", icon: Grid3X3 },
  { id: "pie", label: "Pie", icon: PieChart },
  { id: "donut", label: "Donut", icon: PieChart },
  { id: "histogram", label: "Histogram", icon: BarChart3 },
  { id: "box", label: "Box Plot", icon: BarChart3 },
  { id: "violin", label: "Violin", icon: BarChart3 },
  { id: "heatmap", label: "Heatmap", icon: Grid3X3 },
  { id: "funnel", label: "Funnel", icon: Filter },
  { id: "treemap", label: "Treemap", icon: Grid3X3 },
  { id: "sunburst", label: "Sunburst", icon: PieChart },
  { id: "gauge", label: "Gauge", icon: Cpu },
  { id: "waterfall", label: "Waterfall", icon: BarChart3 },
];

const colorThemes: Record<string, string[]> = {
  Teal: ["#0d9488", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4"],
  Sunset: ["#f97316", "#fb923c", "#fdba74", "#fed7aa", "#ffedd5"],
  Ocean: ["#0ea5e9", "#38bdf8", "#7dd3fc", "#bae6fd", "#e0f2fe"],
  Forest: ["#22c55e", "#4ade80", "#86efac", "#bbf7d0", "#dcfce7"],
  Monochrome: ["#374151", "#6b7280", "#9ca3af", "#d1d5db", "#e5e7eb"],
  Neon: ["#a855f7", "#c084fc", "#d8b4fe", "#e879f9", "#f0abfc"],
};

export function DataAnalystApp() {
  // State
  const [darkMode, setDarkMode] = useState(true);
  const [activeSection, setActiveSection] = useState("upload");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [data, setData] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" | "info" }[]>([]);
  const [undoStack, setUndoStack] = useState<DataRow[][]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [aiChartSuggestions, setAiChartSuggestions] = useState<{ type: string; title: string; insight: string; confidence: number; config: Partial<ChartConfig> }[]>([]);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    id: "",
    type: "bar",
    title: "",
    xAxis: "",
    yAxis: [],
    aggregation: "none",
    theme: "Teal",
    showGrid: true,
    showLegend: true,
    showDataLabels: false,
    showTrendLine: false,
    markerSize: 8,
    barGap: 0.2,
    opacity: 0.8,
  });
  const [savedCharts, setSavedCharts] = useState<SavedChart[]>([]);
  const [fullscreenChart, setFullscreenChart] = useState<string | null>(null);
  const [report, setReport] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM data LIMIT 100");
  const [sqlResults, setSqlResults] = useState<DataRow[]>([]);
  const [sqlExecutionTime, setSqlExecutionTime] = useState<number | null>(null);
  const [generatedCharts, setGeneratedCharts] = useState<string[]>([]);
  const [plotlyLoaded, setPlotlyLoaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const rowsPerPage = 50;

  // Load Plotly dynamically
  useEffect(() => {
    if (typeof window !== "undefined" && !(window as unknown as { Plotly: unknown }).Plotly) {
      const script = document.createElement("script");
      script.src = "https://cdn.plot.ly/plotly-2.27.0.min.js";
      script.async = true;
      script.onload = () => setPlotlyLoaded(true);
      document.body.appendChild(script);
    } else {
      setPlotlyLoaded(true);
    }
  }, []);

  // Toast helper
  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // Detect column types
  const detectColumnType = useCallback((values: (string | number | boolean | null)[]): ColumnInfo["type"] => {
    const nonNullValues = values.filter((v) => v !== null && v !== "");
    if (nonNullValues.length === 0) return "categorical";

    const sample = nonNullValues.slice(0, 100);

    // Check boolean
    const booleanValues = sample.filter((v) => 
      typeof v === "boolean" || v === "true" || v === "false" || v === "0" || v === "1"
    );
    if (booleanValues.length > sample.length * 0.9) return "boolean";

    // Check datetime
    const datePattern = /^\d{4}-\d{2}-\d{2}|^\d{2}\/\d{2}\/\d{4}/;
    const dateValues = sample.filter((v) => datePattern.test(String(v)));
    if (dateValues.length > sample.length * 0.9) return "datetime";

    // Check numeric
    const numericValues = sample.filter((v) => !isNaN(Number(v)));
    if (numericValues.length > sample.length * 0.9) return "numeric";

    return "categorical";
  }, []);

  // Calculate stats
  const calculateStats = useCallback((values: number[]): NumericStats => {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
    
    // Mode
    const frequency: Record<number, number> = {};
    values.forEach((v) => (frequency[v] = (frequency[v] || 0) + 1));
    const mode = Number(Object.entries(frequency).sort((a, b) => b[1] - a[1])[0][0]);
    
    // Std dev
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    
    // Quartiles
    const q1 = sorted[Math.floor(n * 0.25)];
    const q3 = sorted[Math.floor(n * 0.75)];
    
    // Skewness
    const skewnessValue = (3 * (mean - median)) / (stdDev || 1);
    const skewness: "left" | "symmetric" | "right" = 
      skewnessValue < -0.5 ? "left" : skewnessValue > 0.5 ? "right" : "symmetric";

    return { mean, median, mode, stdDev, min: sorted[0], max: sorted[n - 1], q1, q3, skewness };
  }, []);

  // Analyze columns
  const analyzeColumns = useCallback((rows: DataRow[]): ColumnInfo[] => {
    if (rows.length === 0) return [];
    
    const columnNames = Object.keys(rows[0]);
    return columnNames.map((name) => {
      const values = rows.map((r) => r[name]);
      const type = detectColumnType(values);
      const nullCount = values.filter((v) => v === null || v === "").length;
      const uniqueValues = new Set(values.filter((v) => v !== null && v !== ""));
      
      const info: ColumnInfo = { name, type, nullCount, uniqueCount: uniqueValues.size };
      
      if (type === "numeric") {
        const numericValues = values.filter((v) => v !== null && v !== "" && !isNaN(Number(v))).map(Number);
        if (numericValues.length > 0) {
          info.stats = calculateStats(numericValues);
        }
      } else if (type === "categorical") {
        const frequency: Record<string, number> = {};
        values.forEach((v) => {
          if (v !== null && v !== "") {
            frequency[String(v)] = (frequency[String(v)] || 0) + 1;
          }
        });
        info.topValues = Object.entries(frequency)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([value, count]) => ({
            value,
            count,
            percent: (count / rows.length) * 100,
          }));
      }
      
      return info;
    });
  }, [detectColumnType, calculateStats]);

  // Parse file
  const parseFile = useCallback((file: File) => {
    setIsLoading(true);
    setFileName(file.name);

    if (file.name.endsWith(".csv") || file.name.endsWith(".tsv")) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data as DataRow[];
          setData(rows);
          setColumns(analyzeColumns(rows));
          setUndoStack([]);
          setCurrentPage(1);
          setIsLoading(false);
          showToast(`Loaded ${rows.length} rows from ${file.name}`, "success");
          setActiveSection("preview");
          generateAIChartSuggestions(rows, analyzeColumns(rows));
        },
        error: () => {
          setIsLoading(false);
          showToast("Error parsing file", "error");
        },
      });
    } else if (file.name.endsWith(".json")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          const rows = Array.isArray(json) ? json : [json];
          setData(rows);
          setColumns(analyzeColumns(rows));
          setUndoStack([]);
          setCurrentPage(1);
          setIsLoading(false);
          showToast(`Loaded ${rows.length} rows from ${file.name}`, "success");
          setActiveSection("preview");
          generateAIChartSuggestions(rows, analyzeColumns(rows));
        } catch {
          setIsLoading(false);
          showToast("Error parsing JSON", "error");
        }
      };
      reader.readAsText(file);
    }
  }, [analyzeColumns, showToast]);

  // Load demo data
  const loadDemoData = useCallback(() => {
    setIsLoading(true);
    setFileName("demo_sales_data.csv");
    
    Papa.parse(DEMO_DATA, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as DataRow[];
        setData(rows);
        setColumns(analyzeColumns(rows));
        setUndoStack([]);
        setCurrentPage(1);
        setIsLoading(false);
        showToast(`Loaded ${rows.length} demo rows`, "success");
        setActiveSection("preview");
        generateAIChartSuggestions(rows, analyzeColumns(rows));
      },
    });
  }, [analyzeColumns, showToast]);

  // Generate AI chart suggestions
  const generateAIChartSuggestions = useCallback((rows: DataRow[], cols: ColumnInfo[]) => {
    const suggestions: typeof aiChartSuggestions = [];
    const numericCols = cols.filter((c) => c.type === "numeric");
    const categoricalCols = cols.filter((c) => c.type === "categorical");
    const datetimeCols = cols.filter((c) => c.type === "datetime");

    // Datetime + numeric -> Time series
    if (datetimeCols.length > 0 && numericCols.length > 0) {
      suggestions.push({
        type: "line",
        title: `${numericCols[0].name} Over Time`,
        insight: `Trend analysis of ${numericCols[0].name} across ${datetimeCols[0].name}`,
        confidence: 95,
        config: { type: "line", xAxis: datetimeCols[0].name, yAxis: [numericCols[0].name] },
      });
    }

    // 2+ numeric -> Scatter
    if (numericCols.length >= 2) {
      suggestions.push({
        type: "scatter",
        title: `${numericCols[0].name} vs ${numericCols[1].name}`,
        insight: `Correlation analysis between ${numericCols[0].name} and ${numericCols[1].name}`,
        confidence: 90,
        config: { type: "scatter", xAxis: numericCols[0].name, yAxis: [numericCols[1].name] },
      });
    }

    // Categorical + numeric -> Bar
    if (categoricalCols.length > 0 && numericCols.length > 0) {
      suggestions.push({
        type: "bar",
        title: `${numericCols[0].name} by ${categoricalCols[0].name}`,
        insight: `Distribution of ${numericCols[0].name} across ${categoricalCols[0].name} categories`,
        confidence: 88,
        config: { type: "bar", xAxis: categoricalCols[0].name, yAxis: [numericCols[0].name], aggregation: "sum" },
      });

      suggestions.push({
        type: "box",
        title: `${numericCols[0].name} Distribution by ${categoricalCols[0].name}`,
        insight: `Statistical distribution showing quartiles and outliers`,
        confidence: 85,
        config: { type: "box", xAxis: categoricalCols[0].name, yAxis: [numericCols[0].name] },
      });
    }

    // Numeric -> Histogram
    if (numericCols.length > 0) {
      suggestions.push({
        type: "histogram",
        title: `${numericCols[0].name} Distribution`,
        insight: `Frequency distribution showing data concentration areas`,
        confidence: 87,
        config: { type: "histogram", xAxis: numericCols[0].name, yAxis: [] },
      });
    }

    // Categorical < 8 unique -> Pie
    const smallCategorical = categoricalCols.find((c) => c.uniqueCount <= 8);
    if (smallCategorical && numericCols.length > 0) {
      suggestions.push({
        type: "pie",
        title: `${numericCols[0].name} Share by ${smallCategorical.name}`,
        insight: `Proportion breakdown by ${smallCategorical.name}`,
        confidence: 82,
        config: { type: "pie", xAxis: smallCategorical.name, yAxis: [numericCols[0].name], aggregation: "sum" },
      });
    }

    // 3+ numeric -> Bubble
    if (numericCols.length >= 3) {
      suggestions.push({
        type: "bubble",
        title: "Multi-dimensional Analysis",
        insight: `${numericCols[0].name}, ${numericCols[1].name}, ${numericCols[2].name} relationship`,
        confidence: 80,
        config: { type: "bubble", xAxis: numericCols[0].name, yAxis: [numericCols[1].name], sizeBy: numericCols[2].name },
      });
    }

    // Outlier detection scatter
    if (numericCols.length >= 2) {
      suggestions.push({
        type: "scatter",
        title: "Outlier Detection",
        insight: "Identify data points that deviate significantly from the norm",
        confidence: 78,
        config: { type: "scatter", xAxis: numericCols[0].name, yAxis: [numericCols[1].name] },
      });
    }

    setAiChartSuggestions(suggestions.slice(0, 8));
  }, []);

  // Data cleaning functions
  const saveUndoState = useCallback(() => {
    setUndoStack((prev) => [...prev, [...data]]);
  }, [data]);

  const undoLastAction = useCallback(() => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setData(previousState);
      setColumns(analyzeColumns(previousState));
      setUndoStack((prev) => prev.slice(0, -1));
      showToast("Action undone", "info");
    }
  }, [undoStack, analyzeColumns, showToast]);

  const dropNulls = useCallback(() => {
    saveUndoState();
    const cleaned = data.filter((row) => 
      Object.values(row).every((v) => v !== null && v !== "")
    );
    setData(cleaned);
    setColumns(analyzeColumns(cleaned));
    showToast(`Removed ${data.length - cleaned.length} rows with nulls`, "success");
  }, [data, saveUndoState, analyzeColumns, showToast]);

  const dropDuplicates = useCallback(() => {
    saveUndoState();
    const seen = new Set();
    const cleaned = data.filter((row) => {
      const key = JSON.stringify(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    setData(cleaned);
    setColumns(analyzeColumns(cleaned));
    showToast(`Removed ${data.length - cleaned.length} duplicate rows`, "success");
  }, [data, saveUndoState, analyzeColumns, showToast]);

  const fillNulls = useCallback((column: string, method: "mean" | "median" | "mode") => {
    saveUndoState();
    const col = columns.find((c) => c.name === column);
    if (!col || col.type !== "numeric" || !col.stats) return;

    const fillValue = col.stats[method];
    const cleaned = data.map((row) => ({
      ...row,
      [column]: row[column] === null || row[column] === "" ? fillValue : row[column],
    }));
    setData(cleaned);
    setColumns(analyzeColumns(cleaned));
    showToast(`Filled nulls in ${column} with ${method}: ${fillValue.toFixed(2)}`, "success");
  }, [data, columns, saveUndoState, analyzeColumns, showToast]);

  const dropColumn = useCallback((column: string) => {
    saveUndoState();
    const cleaned = data.map((row) => {
      const newRow = { ...row };
      delete newRow[column];
      return newRow;
    });
    setData(cleaned);
    setColumns(analyzeColumns(cleaned));
    showToast(`Dropped column: ${column}`, "success");
  }, [data, saveUndoState, analyzeColumns, showToast]);

  // Calculate data health score
  const dataHealthScore = useCallback(() => {
    if (data.length === 0) return 0;
    
    const totalCells = data.length * columns.length;
    const nullCells = columns.reduce((acc, col) => acc + col.nullCount, 0);
    const duplicateCount = data.length - new Set(data.map((r) => JSON.stringify(r))).size;
    
    const nullPenalty = (nullCells / totalCells) * 50;
    const duplicatePenalty = (duplicateCount / data.length) * 30;
    
    return Math.max(0, Math.round(100 - nullPenalty - duplicatePenalty));
  }, [data, columns]);

  // Render chart
  const renderChart = useCallback((config: ChartConfig, containerId: string) => {
    if (!plotlyLoaded || typeof window === "undefined") return;
    
    const Plotly = (window as unknown as { Plotly: {
      newPlot: (el: HTMLElement, data: unknown[], layout: Record<string, unknown>, config: Record<string, unknown>) => void;
    } }).Plotly;
    if (!Plotly) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    const colors = colorThemes[config.theme] || colorThemes.Teal;
    const bgColor = darkMode ? "#0f172a" : "#ffffff";
    const textColor = darkMode ? "#e2e8f0" : "#1e293b";
    const gridColor = darkMode ? "#334155" : "#e2e8f0";

    let traces: Record<string, unknown>[] = [];
    const layout: Record<string, unknown> = {
      title: { text: config.title, font: { color: textColor, size: 16 } },
      paper_bgcolor: bgColor,
      plot_bgcolor: bgColor,
      font: { color: textColor },
      showlegend: config.showLegend,
      margin: { t: 50, r: 30, b: 50, l: 60 },
    };

    if (config.showGrid) {
      layout.xaxis = { ...((layout.xaxis as object) || {}), gridcolor: gridColor, zerolinecolor: gridColor };
      layout.yaxis = { ...((layout.yaxis as object) || {}), gridcolor: gridColor, zerolinecolor: gridColor };
    }

    // Aggregate data if needed
    let chartData = data;
    if (config.aggregation !== "none" && config.xAxis) {
      const groups: Record<string, DataRow[]> = {};
      data.forEach((row) => {
        const key = String(row[config.xAxis]);
        if (!groups[key]) groups[key] = [];
        groups[key].push(row);
      });

      chartData = Object.entries(groups).map(([key, rows]) => {
        const result: DataRow = { [config.xAxis]: key };
        config.yAxis.forEach((col) => {
          const values = rows.map((r) => Number(r[col])).filter((v) => !isNaN(v));
          switch (config.aggregation) {
            case "sum":
              result[col] = values.reduce((a, b) => a + b, 0);
              break;
            case "avg":
              result[col] = values.reduce((a, b) => a + b, 0) / values.length;
              break;
            case "count":
              result[col] = values.length;
              break;
            case "min":
              result[col] = Math.min(...values);
              break;
            case "max":
              result[col] = Math.max(...values);
              break;
          }
        });
        return result;
      });
    }

    const xValues = chartData.map((row) => row[config.xAxis]);

    switch (config.type) {
      case "bar":
      case "grouped-bar":
        config.yAxis.forEach((col, i) => {
          traces.push({
            type: "bar",
            name: col,
            x: xValues,
            y: chartData.map((row) => row[col]),
            marker: { color: colors[i % colors.length], opacity: config.opacity },
            text: config.showDataLabels ? chartData.map((row) => row[col]) : undefined,
            textposition: "auto",
          });
        });
        layout.barmode = config.type === "grouped-bar" ? "group" : undefined;
        layout.bargap = config.barGap;
        break;

      case "stacked-bar":
        config.yAxis.forEach((col, i) => {
          traces.push({
            type: "bar",
            name: col,
            x: xValues,
            y: chartData.map((row) => row[col]),
            marker: { color: colors[i % colors.length], opacity: config.opacity },
          });
        });
        layout.barmode = "stack";
        break;

      case "line":
      case "multi-line":
        config.yAxis.forEach((col, i) => {
          traces.push({
            type: "scatter",
            mode: "lines+markers",
            name: col,
            x: xValues,
            y: chartData.map((row) => row[col]),
            line: { color: colors[i % colors.length] },
            marker: { size: config.markerSize },
          });
        });
        break;

      case "area":
        config.yAxis.forEach((col, i) => {
          traces.push({
            type: "scatter",
            mode: "lines",
            fill: "tozeroy",
            name: col,
            x: xValues,
            y: chartData.map((row) => row[col]),
            line: { color: colors[i % colors.length] },
            fillcolor: `${colors[i % colors.length]}40`,
          });
        });
        break;

      case "scatter":
        traces.push({
          type: "scatter",
          mode: "markers",
          x: xValues,
          y: chartData.map((row) => row[config.yAxis[0]]),
          marker: { 
            color: config.colorBy ? chartData.map((row) => row[config.colorBy!]) : colors[0],
            size: config.markerSize,
            opacity: config.opacity,
          },
          text: chartData.map((row) => Object.values(row).join(", ")),
        });
        break;

      case "bubble":
        traces.push({
          type: "scatter",
          mode: "markers",
          x: xValues,
          y: chartData.map((row) => row[config.yAxis[0]]),
          marker: {
            color: colors[0],
            size: config.sizeBy ? chartData.map((row) => Number(row[config.sizeBy!]) / 10) : config.markerSize,
            opacity: config.opacity,
          },
        });
        break;

      case "pie":
      case "donut":
        traces.push({
          type: "pie",
          labels: xValues,
          values: chartData.map((row) => row[config.yAxis[0]]),
          marker: { colors },
          hole: config.type === "donut" ? 0.4 : 0,
        });
        break;

      case "histogram":
        traces.push({
          type: "histogram",
          x: data.map((row) => row[config.xAxis]),
          marker: { color: colors[0], opacity: config.opacity },
        });
        break;

      case "box":
        config.yAxis.forEach((col, i) => {
          traces.push({
            type: "box",
            name: col,
            y: data.map((row) => row[col]),
            marker: { color: colors[i % colors.length] },
          });
        });
        break;

      case "heatmap":
        // Simplified heatmap
        traces.push({
          type: "heatmap",
          z: chartData.map((row) => config.yAxis.map((col) => Number(row[col]))),
          x: config.yAxis,
          y: xValues,
          colorscale: "Viridis",
        });
        break;

      case "funnel":
        traces.push({
          type: "funnel",
          y: xValues,
          x: chartData.map((row) => row[config.yAxis[0]]),
          marker: { color: colors },
        });
        break;

      case "treemap":
        traces.push({
          type: "treemap",
          labels: xValues,
          parents: xValues.map(() => ""),
          values: chartData.map((row) => row[config.yAxis[0]]),
          marker: { colors },
        });
        break;

      case "gauge":
        const value = Number(chartData[0]?.[config.yAxis[0]] || 0);
        traces.push({
          type: "indicator",
          mode: "gauge+number",
          value,
          gauge: {
            axis: { range: [0, value * 2] },
            bar: { color: colors[0] },
          },
        });
        break;

      case "waterfall":
        traces.push({
          type: "waterfall",
          orientation: "v",
          x: xValues,
          y: chartData.map((row) => row[config.yAxis[0]]),
          connector: { line: { color: colors[1] } },
          increasing: { marker: { color: colors[0] } },
          decreasing: { marker: { color: colors[2] } },
        });
        break;
    }

    Plotly.newPlot(container, traces, layout, { responsive: true });
  }, [data, darkMode, plotlyLoaded]);

  // Generate AI report
  const generateReport = useCallback(async () => {
    setReportLoading(true);
    setReportProgress(0);
    setReport("");

    const statsPrompt = columns.map((col) => {
      if (col.type === "numeric" && col.stats) {
        return `${col.name} (numeric): mean=${col.stats.mean.toFixed(2)}, median=${col.stats.median.toFixed(2)}, std=${col.stats.stdDev.toFixed(2)}, min=${col.stats.min}, max=${col.stats.max}, nulls=${col.nullCount}`;
      }
      return `${col.name} (${col.type}): unique=${col.uniqueCount}, nulls=${col.nullCount}`;
    }).join("; ");

    const prompt = `You are an expert data scientist. Based on the following dataset statistics: Rows: ${data.length}, Columns: ${columns.length}, Health Score: ${dataHealthScore()}%, Stats: ${statsPrompt} — write a detailed, professional, blog-style analytical report with these exact sections: 1) Executive Summary 2) Dataset Overview 3) Key Findings (minimum 5 bullet insights with actual numbers) 4) Distribution Analysis 5) Correlation Highlights 6) Data Quality Issues 7) Outlier Analysis 8) Actionable Recommendations (minimum 5) 9) Conclusion. Use markdown formatting. Be specific and refer to actual column names and numbers.`;

    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": "AIzaSyCjnU6cSzR7FrhHiIboEihoHJ87Un9XnO8",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      // Simulate streaming effect
      let displayedText = "";
      const chars = text.split("");
      for (let i = 0; i < chars.length; i++) {
        displayedText += chars[i];
        setReport(displayedText);
        setReportProgress((i / chars.length) * 100);
        await new Promise((r) => setTimeout(r, 5));
      }
      
      setReportProgress(100);
      showToast("Report generated successfully!", "success");
    } catch (error) {
      showToast("Error generating report", "error");
    } finally {
      setReportLoading(false);
    }
  }, [columns, data.length, dataHealthScore, showToast]);

  // Sort data
  const sortedData = useCallback(() => {
    if (!sortColumn) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection]);

  // Paginated data
  const paginatedData = sortedData().slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.ceil(data.length / rowsPerPage);

  // Save chart to dashboard
  const saveChartToDashboard = useCallback(() => {
    const newChart: SavedChart = {
      id: `chart-${Date.now()}`,
      config: { ...chartConfig, id: `chart-${Date.now()}` },
      timestamp: Date.now(),
    };
    setSavedCharts((prev) => [...prev, newChart]);
    showToast("Chart saved to dashboard!", "success");
  }, [chartConfig, showToast]);

  // Generate chart from AI suggestion
  const generateAIChart = useCallback((suggestion: typeof aiChartSuggestions[0]) => {
    const config: ChartConfig = {
      id: `ai-${Date.now()}`,
      type: suggestion.config.type || "bar",
      title: suggestion.title,
      xAxis: suggestion.config.xAxis || "",
      yAxis: suggestion.config.yAxis || [],
      aggregation: suggestion.config.aggregation || "none",
      theme: "Teal",
      showGrid: true,
      showLegend: true,
      showDataLabels: false,
      showTrendLine: false,
      markerSize: 8,
      barGap: 0.2,
      opacity: 0.8,
      sizeBy: suggestion.config.sizeBy,
    };
    setGeneratedCharts((prev) => [...prev, suggestion.type]);
    setTimeout(() => renderChart(config, `ai-chart-${suggestion.type}`), 100);
  }, [renderChart]);

  // Theme classes
  const themeClasses = darkMode
    ? "bg-slate-900 text-slate-100"
    : "bg-gray-50 text-slate-900";

  const cardClasses = darkMode
    ? "bg-slate-800/50 border-slate-700"
    : "bg-white border-gray-200";

  const inputClasses = darkMode
    ? "bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-400"
    : "bg-white border-gray-300 text-slate-900 placeholder-gray-400";

  return (
    <div className={`min-h-screen ${themeClasses} transition-colors duration-300`}>
      {/* Grid background */}
      <div className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(${darkMode ? "#0d9488" : "#0f172a"} 1px, transparent 1px), linear-gradient(90deg, ${darkMode ? "#0d9488" : "#0f172a"} 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Header */}
      <header className={`sticky top-0 z-50 ${cardClasses} border-b backdrop-blur-xl bg-opacity-80`}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Data Science Analyst</h1>
              <p className="text-xs text-slate-400">AI-Powered Analytics Platform</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {fileName && (
              <span className="text-sm text-slate-400">
                {fileName} • {data.length} rows
              </span>
            )}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${cardClasses} border hover:border-teal-500 transition-colors`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`sticky top-[73px] h-[calc(100vh-73px)] ${cardClasses} border-r transition-all duration-300 ${sidebarCollapsed ? "w-16" : "w-56"}`}>
          <nav className="p-3 space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              const isDisabled = section.id !== "upload" && data.length === 0;
              
              return (
                <button
                  key={section.id}
                  onClick={() => !isDisabled && setActiveSection(section.id)}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-400 border border-teal-500/30"
                      : isDisabled
                      ? "text-slate-600 cursor-not-allowed"
                      : "hover:bg-slate-700/50 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-teal-400" : ""}`} />
                  {!sidebarCollapsed && <span className="text-sm">{section.label}</span>}
                </button>
              );
            })}
          </nav>
          
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute bottom-4 right-0 translate-x-1/2 p-1.5 rounded-full bg-slate-700 border border-slate-600 hover:bg-slate-600"
          >
            {sidebarCollapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 space-y-6 min-h-[calc(100vh-73px)]">
          {/* Upload Section */}
          {activeSection === "upload" && (
            <section className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Upload Data</h2>
              </div>
              
              <div
                className={`${cardClasses} border-2 border-dashed rounded-xl p-12 text-center hover:border-teal-500 transition-colors cursor-pointer`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) parseFile(file);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.json,.db"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) parseFile(file);
                  }}
                  className="hidden"
                />
                
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center">
                  <Upload className="w-10 h-10 text-teal-400" />
                </div>
                
                <h3 className="text-xl font-semibold mb-2">Drop your file here</h3>
                <p className="text-slate-400 mb-6">Supports CSV, TSV, JSON, and SQLite (.db) files</p>
                
                <div className="flex items-center justify-center gap-4">
                  <span className="px-3 py-1 rounded-full bg-slate-700 text-sm text-slate-300">.csv</span>
                  <span className="px-3 py-1 rounded-full bg-slate-700 text-sm text-slate-300">.tsv</span>
                  <span className="px-3 py-1 rounded-full bg-slate-700 text-sm text-slate-300">.json</span>
                  <span className="px-3 py-1 rounded-full bg-slate-700 text-sm text-slate-300">.db</span>
                </div>
              </div>
              
              <div className="text-center">
                <span className="text-slate-500">or</span>
              </div>
              
              <button
                onClick={loadDemoData}
                className="w-full py-4 rounded-xl border-2 border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-colors flex items-center justify-center gap-3"
              >
                <Zap className="w-5 h-5" />
                Load Demo Data (200-row Sales Dataset)
              </button>
            </section>
          )}

          {/* Preview Section */}
          {activeSection === "preview" && (
            <section className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Data Preview</h2>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span>{data.length} rows</span>
                  <span>•</span>
                  <span>{columns.length} columns</span>
                </div>
              </div>
              
              <div className={`${cardClasses} border rounded-xl overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700/50">
                      <tr>
                        {columns.map((col) => (
                          <th
                            key={col.name}
                            className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-slate-600/50"
                            onClick={() => {
                              if (sortColumn === col.name) {
                                setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                              } else {
                                setSortColumn(col.name);
                                setSortDirection("asc");
                              }
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span>{col.name}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                col.type === "numeric" ? "bg-blue-500/20 text-blue-400" :
                                col.type === "datetime" ? "bg-purple-500/20 text-purple-400" :
                                col.type === "boolean" ? "bg-yellow-500/20 text-yellow-400" :
                                "bg-green-500/20 text-green-400"
                              }`}>
                                {col.type}
                              </span>
                              <ArrowUpDown className="w-3 h-3 text-slate-500" />
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((row, i) => (
                        <tr key={i} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                          {columns.map((col) => (
                            <td key={col.name} className="px-4 py-2.5 text-sm">
                              {row[col.name] === null || row[col.name] === "" ? (
                                <span className="text-slate-500 italic">null</span>
                              ) : (
                                String(row[col.name])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/50 bg-slate-800/30">
                  <span className="text-sm text-slate-400">
                    Showing {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, data.length)} of {data.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm">Page {currentPage} of {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Clean Section */}
          {activeSection === "clean" && (
            <section className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Data Cleaning</h2>
                <button
                  onClick={undoLastAction}
                  disabled={undoStack.length === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-4 h-4" />
                  Undo
                </button>
              </div>
              
              {/* Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className={`${cardClasses} border rounded-xl p-4`}>
                  <p className="text-sm text-slate-400">Total Rows</p>
                  <p className="text-2xl font-bold">{data.length}</p>
                </div>
                <div className={`${cardClasses} border rounded-xl p-4`}>
                  <p className="text-sm text-slate-400">Columns</p>
                  <p className="text-2xl font-bold">{columns.length}</p>
                </div>
                <div className={`${cardClasses} border rounded-xl p-4`}>
                  <p className="text-sm text-slate-400">Null Count</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {columns.reduce((acc, col) => acc + col.nullCount, 0)}
                  </p>
                </div>
                <div className={`${cardClasses} border rounded-xl p-4`}>
                  <p className="text-sm text-slate-400">Duplicates</p>
                  <p className="text-2xl font-bold text-orange-400">
                    {data.length - new Set(data.map((r) => JSON.stringify(r))).size}
                  </p>
                </div>
                <div className={`${cardClasses} border rounded-xl p-4`}>
                  <p className="text-sm text-slate-400">Health Score</p>
                  <p className={`text-2xl font-bold ${
                    dataHealthScore() >= 80 ? "text-green-400" :
                    dataHealthScore() >= 50 ? "text-yellow-400" : "text-red-400"
                  }`}>
                    {dataHealthScore()}%
                  </p>
                </div>
              </div>
              
              {/* Cleaning Actions */}
              <div className={`${cardClasses} border rounded-xl p-6`}>
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    onClick={dropNulls}
                    className="p-4 rounded-xl border border-slate-600 hover:border-teal-500 hover:bg-teal-500/10 transition-colors text-left"
                  >
                    <Trash2 className="w-5 h-5 text-teal-400 mb-2" />
                    <p className="font-medium">Drop Nulls</p>
                    <p className="text-xs text-slate-400">Remove rows with missing values</p>
                  </button>
                  <button
                    onClick={dropDuplicates}
                    className="p-4 rounded-xl border border-slate-600 hover:border-teal-500 hover:bg-teal-500/10 transition-colors text-left"
                  >
                    <Layers className="w-5 h-5 text-teal-400 mb-2" />
                    <p className="font-medium">Drop Duplicates</p>
                    <p className="text-xs text-slate-400">Remove duplicate rows</p>
                  </button>
                </div>
              </div>
              
              {/* Column Operations */}
              <div className={`${cardClasses} border rounded-xl p-6`}>
                <h3 className="text-lg font-semibold mb-4">Column Operations</h3>
                <div className="space-y-4">
                  {columns.map((col) => (
                    <div key={col.name} className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <span className="font-medium">{col.name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          col.type === "numeric" ? "bg-blue-500/20 text-blue-400" :
                          col.type === "datetime" ? "bg-purple-500/20 text-purple-400" :
                          "bg-green-500/20 text-green-400"
                        }`}>
                          {col.type}
                        </span>
                        {col.nullCount > 0 && (
                          <span className="text-xs text-yellow-400">{col.nullCount} nulls</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {col.type === "numeric" && col.nullCount > 0 && (
                          <>
                            <button
                              onClick={() => fillNulls(col.name, "mean")}
                              className="px-3 py-1 text-xs rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                            >
                              Fill Mean
                            </button>
                            <button
                              onClick={() => fillNulls(col.name, "median")}
                              className="px-3 py-1 text-xs rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                            >
                              Fill Median
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => dropColumn(col.name)}
                          className="px-3 py-1 text-xs rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        >
                          Drop
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Stats Section */}
          {activeSection === "stats" && (
            <section className="space-y-6 animate-fadeIn">
              <h2 className="text-2xl font-bold">Statistics Summary</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {columns.map((col) => (
                  <div key={col.name} className={`${cardClasses} border rounded-xl p-5`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">{col.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        col.type === "numeric" ? "bg-blue-500/20 text-blue-400" :
                        col.type === "datetime" ? "bg-purple-500/20 text-purple-400" :
                        "bg-green-500/20 text-green-400"
                      }`}>
                        {col.type}
                      </span>
                    </div>
                    
                    {col.type === "numeric" && col.stats ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-slate-400">Mean</p>
                            <p className="font-medium">{col.stats.mean.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Median</p>
                            <p className="font-medium">{col.stats.median.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Std Dev</p>
                            <p className="font-medium">{col.stats.stdDev.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Mode</p>
                            <p className="font-medium">{col.stats.mode.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Min</p>
                            <p className="font-medium">{col.stats.min}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Max</p>
                            <p className="font-medium">{col.stats.max}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Q1</p>
                            <p className="font-medium">{col.stats.q1.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Q3</p>
                            <p className="font-medium">{col.stats.q3.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-slate-700">
                          <span className={`text-xs px-2 py-1 rounded ${
                            col.stats.skewness === "symmetric" ? "bg-green-500/20 text-green-400" :
                            "bg-yellow-500/20 text-yellow-400"
                          }`}>
                            {col.stats.skewness} skew
                          </span>
                        </div>
                        {/* Mini sparkline */}
                        <div className="h-8 flex items-end gap-0.5">
                          {Array.from({ length: 20 }, (_, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-teal-500 rounded-t"
                              style={{ height: `${20 + Math.random() * 80}%`, opacity: 0.5 + Math.random() * 0.5 }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : col.topValues ? (
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-slate-400">Unique values: </span>
                          <span className="font-medium">{col.uniqueCount}</span>
                        </div>
                        <div className="space-y-1.5">
                          {col.topValues.map((tv) => (
                            <div key={tv.value} className="flex items-center gap-2">
                              <div className="flex-1 h-5 bg-slate-700 rounded overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded"
                                  style={{ width: `${tv.percent}%` }}
                                />
                              </div>
                              <span className="text-xs w-20 truncate">{tv.value}</span>
                              <span className="text-xs text-slate-400 w-12">{tv.percent.toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400 text-sm">No stats available</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* AI Charts Section */}
          {activeSection === "ai-charts" && (
            <section className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">AI Recommended Charts</h2>
                  <p className="text-slate-400">Smart visualizations based on your data</p>
                </div>
                <button
                  onClick={() => aiChartSuggestions.forEach((s) => generateAIChart(s))}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:opacity-90 transition-opacity"
                >
                  <Wand2 className="w-4 h-4" />
                  Generate All
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiChartSuggestions.map((suggestion) => (
                  <div key={suggestion.type + suggestion.title} className={`${cardClasses} border rounded-xl p-5`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                          <BarChart3 className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{suggestion.title}</h3>
                          <p className="text-sm text-slate-400">{suggestion.insight}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        suggestion.confidence >= 90 ? "bg-green-500/20 text-green-400" :
                        suggestion.confidence >= 80 ? "bg-teal-500/20 text-teal-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {suggestion.confidence}% match
                      </span>
                    </div>
                    
                    {generatedCharts.includes(suggestion.type) ? (
                      <div id={`ai-chart-${suggestion.type}`} className="h-64" />
                    ) : (
                      <button
                        onClick={() => generateAIChart(suggestion)}
                        className="w-full py-3 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-colors"
                      >
                        Generate Chart
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Chart Studio Section */}
          {activeSection === "studio" && (
            <section className="space-y-6 animate-fadeIn">
              <h2 className="text-2xl font-bold">Custom Chart Studio</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Type Selection */}
                <div className={`${cardClasses} border rounded-xl p-5`}>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4 text-teal-400" />
                    Chart Type
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {chartTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.id}
                          onClick={() => setChartConfig((c) => ({ ...c, type: type.id }))}
                          className={`p-3 rounded-lg border text-center transition-all ${
                            chartConfig.type === type.id
                              ? "border-teal-500 bg-teal-500/20 text-teal-400"
                              : "border-slate-600 hover:border-slate-500"
                          }`}
                        >
                          <Icon className="w-4 h-4 mx-auto mb-1" />
                          <span className="text-[10px]">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Axis Configuration */}
                <div className={`${cardClasses} border rounded-xl p-5`}>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-teal-400" />
                    Axis Configuration
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-400 block mb-1">X Axis</label>
                      <select
                        value={chartConfig.xAxis}
                        onChange={(e) => setChartConfig((c) => ({ ...c, xAxis: e.target.value }))}
                        className={`w-full px-3 py-2 rounded-lg ${inputClasses} border`}
                      >
                        <option value="">Select column</option>
                        {columns.map((col) => (
                          <option key={col.name} value={col.name}>{col.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 block mb-1">Y Axis</label>
                      <select
                        value={chartConfig.yAxis[0] || ""}
                        onChange={(e) => setChartConfig((c) => ({ ...c, yAxis: [e.target.value] }))}
                        className={`w-full px-3 py-2 rounded-lg ${inputClasses} border`}
                      >
                        <option value="">Select column</option>
                        {columns.filter((c) => c.type === "numeric").map((col) => (
                          <option key={col.name} value={col.name}>{col.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 block mb-1">Aggregation</label>
                      <select
                        value={chartConfig.aggregation}
                        onChange={(e) => setChartConfig((c) => ({ ...c, aggregation: e.target.value }))}
                        className={`w-full px-3 py-2 rounded-lg ${inputClasses} border`}
                      >
                        <option value="none">None</option>
                        <option value="sum">Sum</option>
                        <option value="avg">Average</option>
                        <option value="count">Count</option>
                        <option value="min">Min</option>
                        <option value="max">Max</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Style Panel */}
                <div className={`${cardClasses} border rounded-xl p-5`}>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-teal-400" />
                    Style
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-400 block mb-1">Title</label>
                      <input
                        type="text"
                        value={chartConfig.title}
                        onChange={(e) => setChartConfig((c) => ({ ...c, title: e.target.value }))}
                        placeholder="Chart title"
                        className={`w-full px-3 py-2 rounded-lg ${inputClasses} border`}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 block mb-2">Color Theme</label>
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(colorThemes).map((theme) => (
                          <button
                            key={theme}
                            onClick={() => setChartConfig((c) => ({ ...c, theme }))}
                            className={`px-3 py-1 rounded-lg text-xs transition-all ${
                              chartConfig.theme === theme
                                ? "bg-teal-500/20 border-teal-500 text-teal-400"
                                : "bg-slate-700 border-slate-600"
                            } border`}
                          >
                            {theme}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={chartConfig.showGrid}
                          onChange={(e) => setChartConfig((c) => ({ ...c, showGrid: e.target.checked }))}
                          className="rounded border-slate-600"
                        />
                        Grid
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={chartConfig.showLegend}
                          onChange={(e) => setChartConfig((c) => ({ ...c, showLegend: e.target.checked }))}
                          className="rounded border-slate-600"
                        />
                        Legend
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={chartConfig.showDataLabels}
                          onChange={(e) => setChartConfig((c) => ({ ...c, showDataLabels: e.target.checked }))}
                          className="rounded border-slate-600"
                        />
                        Labels
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Preview */}
              <div className={`${cardClasses} border rounded-xl p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Live Preview</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={saveChartToDashboard}
                      disabled={!chartConfig.xAxis || chartConfig.yAxis.length === 0}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4" />
                      Save to Dashboard
                    </button>
                  </div>
                </div>
                <div id="studio-preview" className="h-[400px]" />
                {chartConfig.xAxis && chartConfig.yAxis.length > 0 && (
                  <script
                    dangerouslySetInnerHTML={{
                      __html: `setTimeout(() => { try { ${JSON.stringify(chartConfig)} } catch(e) {} }, 100)`
                    }}
                  />
                )}
              </div>

              {/* Effect to render preview */}
              {chartConfig.xAxis && chartConfig.yAxis.length > 0 && plotlyLoaded && (
                <div className="hidden">
                  {(() => {
                    setTimeout(() => renderChart(chartConfig, "studio-preview"), 100);
                    return null;
                  })()}
                </div>
              )}
            </section>
          )}

          {/* Dashboard Section */}
          {activeSection === "dashboard" && (
            <section className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">My Dashboard</h2>
                {savedCharts.length > 0 && (
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600"
                  >
                    <FileDown className="w-4 h-4" />
                    Export All as PDF
                  </button>
                )}
              </div>
              
              {savedCharts.length === 0 ? (
                <div className={`${cardClasses} border rounded-xl p-12 text-center`}>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
                    <LayoutDashboard className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No charts saved yet</h3>
                  <p className="text-slate-400">Create charts in the Chart Studio and save them here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {savedCharts.map((chart) => (
                    <div key={chart.id} className={`${cardClasses} border rounded-xl p-4`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium">{chart.config.title || "Untitled Chart"}</h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setFullscreenChart(chart.id)}
                            className="p-2 rounded-lg hover:bg-slate-700"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSavedCharts((prev) => prev.filter((c) => c.id !== chart.id))}
                            className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div id={`dashboard-${chart.id}`} className="h-64" />
                      {plotlyLoaded && (
                        <div className="hidden">
                          {(() => {
                            setTimeout(() => renderChart(chart.config, `dashboard-${chart.id}`), 100);
                            return null;
                          })()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Report Section */}
          {activeSection === "report" && (
            <section className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">AI Agent Report</h2>
                  <p className="text-slate-400">Powered by Google Gemini</p>
                </div>
                <button
                  onClick={generateReport}
                  disabled={reportLoading}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:opacity-90 transition-all ${
                    reportLoading ? "animate-pulse" : ""
                  }`}
                  style={{
                    boxShadow: reportLoading ? "0 0 20px rgba(20, 184, 166, 0.5)" : "none",
                  }}
                >
                  {reportLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      Generate Report
                    </>
                  )}
                </button>
              </div>
              
              {reportLoading && (
                <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-300"
                    style={{ width: `${reportProgress}%` }}
                  />
                </div>
              )}
              
              {report ? (
                <div className={`${cardClasses} border rounded-xl overflow-hidden`}>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                    <span className="text-sm text-slate-400">Generated Report</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(report)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                      <button
                        onClick={() => {
                          const blob = new Blob([report], { type: "text/plain" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "ai-report.txt";
                          a.click();
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                  <div
                    className="p-8 prose prose-invert max-w-none prose-headings:text-slate-100 prose-p:text-slate-300 prose-strong:text-teal-400 prose-li:text-slate-300"
                    dangerouslySetInnerHTML={{ __html: marked(report) as string }}
                  />
                </div>
              ) : (
                <div className={`${cardClasses} border rounded-xl p-12 text-center`}>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-teal-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No report generated yet</h3>
                  <p className="text-slate-400">Click the Generate Report button to create an AI-powered analysis</p>
                </div>
              )}
            </section>
          )}

          {/* SQL Section */}
          {activeSection === "sql" && (
            <section className="space-y-6 animate-fadeIn">
              <h2 className="text-2xl font-bold">SQL Query Panel</h2>
              
              <div className={`${cardClasses} border rounded-xl p-6`}>
                <div className="flex items-start gap-4">
                  <textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    className={`flex-1 h-32 px-4 py-3 rounded-lg font-mono text-sm ${inputClasses} border resize-none`}
                    placeholder="SELECT * FROM data LIMIT 100"
                  />
                  <button
                    onClick={() => {
                      const start = performance.now();
                      // Simple SQL-like filtering for demo
                      try {
                        const limitMatch = sqlQuery.match(/LIMIT\s+(\d+)/i);
                        const limit = limitMatch ? parseInt(limitMatch[1]) : 100;
                        setSqlResults(data.slice(0, limit));
                        setSqlExecutionTime(performance.now() - start);
                        showToast(`Query executed in ${(performance.now() - start).toFixed(2)}ms`, "success");
                      } catch {
                        showToast("Error executing query", "error");
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg bg-teal-500 text-white hover:bg-teal-600"
                  >
                    <Play className="w-4 h-4" />
                    Run
                  </button>
                </div>
                
                {sqlExecutionTime !== null && (
                  <p className="text-sm text-slate-400 mt-2">
                    Execution time: {sqlExecutionTime.toFixed(2)}ms • {sqlResults.length} rows returned
                  </p>
                )}
              </div>
              
              {sqlResults.length > 0 && (
                <div className={`${cardClasses} border rounded-xl overflow-hidden`}>
                  <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full">
                      <thead className="bg-slate-700/50 sticky top-0">
                        <tr>
                          {Object.keys(sqlResults[0]).map((key) => (
                            <th key={key} className="px-4 py-3 text-left text-sm font-medium">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sqlResults.map((row, i) => (
                          <tr key={i} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                            {Object.values(row).map((val, j) => (
                              <td key={j} className="px-4 py-2.5 text-sm font-mono">
                                {String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-slideIn ${
              toast.type === "success" ? "bg-green-500/90" :
              toast.type === "error" ? "bg-red-500/90" : "bg-blue-500/90"
            } text-white`}
          >
            {toast.type === "success" ? <Check className="w-4 h-4" /> :
             toast.type === "error" ? <AlertCircle className="w-4 h-4" /> :
             <AlertCircle className="w-4 h-4" />}
            <span className="text-sm">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Fullscreen chart modal */}
      {fullscreenChart && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8">
          <div className={`${cardClasses} border rounded-xl w-full max-w-5xl p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">
                {savedCharts.find((c) => c.id === fullscreenChart)?.config.title || "Chart"}
              </h3>
              <button
                onClick={() => setFullscreenChart(null)}
                className="p-2 rounded-lg hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div id={`fullscreen-${fullscreenChart}`} className="h-[70vh]" />
            {plotlyLoaded && (
              <div className="hidden">
                {(() => {
                  const chart = savedCharts.find((c) => c.id === fullscreenChart);
                  if (chart) {
                    setTimeout(() => renderChart(chart.config, `fullscreen-${fullscreenChart}`), 100);
                  }
                  return null;
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
