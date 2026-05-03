"use client"

import { useState, useCallback, useMemo, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import Papa from "papaparse"
import {
  Upload,
  Download,
  LogOut,
  Sparkles,
  FileSpreadsheet,
  Loader2,
  BarChart3,
  LineChart as LineIcon,
  PieChart as PieIcon,
  ScatterChart as ScatterIcon,
  AreaChart as AreaIcon,
  ArrowLeft,
  FileText,
  TrendingUp,
  Database,
  Layers,
  Trash2,
  Copy,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  ReferenceLine,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { AmbientScene } from "./ambient-scene"

type DataRow = Record<string, string | number | null>
type ColumnType = "numeric" | "categorical" | "date"

interface ColumnInfo {
  name: string
  type: ColumnType
  uniqueValues: number
  nullCount: number
  min?: number
  max?: number
  mean?: number
  median?: number
  std?: number
}

interface ChartConfig {
  id: string
  type: "bar" | "line" | "pie" | "scatter" | "area" | "radar"
  title: string
  xAxis?: string
  yAxis?: string
}

const ACCENT = "#eca8d6"
const ACCENT_2 = "#a78bfa"
const CHART_COLORS = ["#eca8d6", "#a78bfa", "#60a5fa", "#34d399", "#fbbf24", "#fb7185", "#22d3ee", "#f472b6"]

const CHART_TYPES = [
  { value: "bar", label: "Bar", icon: BarChart3 },
  { value: "line", label: "Line", icon: LineIcon },
  { value: "area", label: "Area", icon: AreaIcon },
  { value: "pie", label: "Pie", icon: PieIcon },
  { value: "scatter", label: "Scatter", icon: ScatterIcon },
  { value: "radar", label: "Radar", icon: TrendingUp },
] as const

export function DataAnalystDashboard({ user }: { user: User }) {
  const [data, setData] = useState<DataRow[]>([])
  const [columns, setColumns] = useState<ColumnInfo[]>([])
  const [fileName, setFileName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeView, setActiveView] = useState<"data" | "stats" | "chart" | "report">("data")
  const [selectedChartType, setSelectedChartType] = useState<ChartConfig["type"]>("bar")
  const [selectedXAxis, setSelectedXAxis] = useState<string>("")
  const [selectedYAxis, setSelectedYAxis] = useState<string>("")

  // Report state
  const [report, setReport] = useState<string>("")
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [reportCopied, setReportCopied] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const detectColumnType = (values: (string | number | null)[]): ColumnType => {
    const nonNullValues = values.filter((v) => v !== null && v !== "")
    if (nonNullValues.length === 0) return "categorical"

    const numericCount = nonNullValues.filter((v) => !isNaN(Number(v))).length
    if (numericCount / nonNullValues.length > 0.8) return "numeric"

    const dateCount = nonNullValues.filter((v) => {
      const d = new Date(String(v))
      return !isNaN(d.getTime()) && String(v).length > 4
    }).length
    if (dateCount / nonNullValues.length > 0.8) return "date"

    return "categorical"
  }

  const analyzeColumns = (rows: DataRow[]): ColumnInfo[] => {
    if (rows.length === 0) return []
    const columnNames = Object.keys(rows[0])

    return columnNames.map((name) => {
      const values = rows.map((row) => row[name])
      const type = detectColumnType(values)
      const nonNullValues = values.filter((v) => v !== null && v !== "")
      const uniqueValues = new Set(nonNullValues).size
      const nullCount = values.length - nonNullValues.length

      const info: ColumnInfo = { name, type, uniqueValues, nullCount }

      if (type === "numeric") {
        const nums = nonNullValues.map((v) => Number(v)).filter((n) => !isNaN(n))
        if (nums.length > 0) {
          info.min = Math.min(...nums)
          info.max = Math.max(...nums)
          info.mean = nums.reduce((a, b) => a + b, 0) / nums.length
          const sorted = [...nums].sort((a, b) => a - b)
          info.median = sorted[Math.floor(sorted.length / 2)]
          const variance = nums.reduce((acc, n) => acc + Math.pow(n - info.mean!, 2), 0) / nums.length
          info.std = Math.sqrt(variance)
        }
      }
      return info
    })
  }

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setFileName(file.name)
    setReport("") // Clear previous report

    Papa.parse<DataRow>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const cleanData = results.data.filter((row) => Object.values(row).some((v) => v !== null && v !== ""))
        const cols = analyzeColumns(cleanData)
        setData(cleanData)
        setColumns(cols)
        // Auto-select sensible defaults for charts
        const firstNumeric = cols.find((c) => c.type === "numeric")
        const firstCategorical = cols.find((c) => c.type === "categorical" || c.type === "date")
        if (firstCategorical) setSelectedXAxis(firstCategorical.name)
        if (firstNumeric) setSelectedYAxis(firstNumeric.name)
        setActiveView("data")
        setIsLoading(false)
      },
      error: (error) => {
        console.error("[v0] CSV parse error:", error)
        setIsLoading(false)
      },
    })
  }, [])

  const loadDemoData = () => {
    setIsLoading(true)
    setReport("")
    const products = ["Widget Pro", "Gadget X", "Tool Kit", "Device Y", "Module Z"]
    const regions = ["North America", "Europe", "Asia", "South America", "Africa"]
    const categories = ["Electronics", "Hardware", "Software", "Accessories"]

    const demoData: DataRow[] = Array.from({ length: 200 }, (_, i) => {
      const product = products[i % products.length]
      const region = regions[Math.floor(i / 40)]
      const category = categories[i % categories.length]
      const baseRevenue = 1000 + (i % 5) * 500
      const seasonality = Math.sin((i / 200) * Math.PI * 2) * 300
      return {
        id: i + 1,
        date: new Date(2024, Math.floor(i / 17), (i % 28) + 1).toISOString().split("T")[0],
        product,
        region,
        category,
        units_sold: Math.floor(20 + (i % 40) + seasonality / 10),
        revenue: Math.round(baseRevenue + seasonality + ((i * 7) % 800)),
        cost: Math.round((baseRevenue + seasonality) * 0.6),
        customer_rating: Number((3.5 + (i % 15) / 10).toFixed(1)),
      }
    })

    setFileName("demo_sales_data.csv")
    const cols = analyzeColumns(demoData)
    setData(demoData)
    setColumns(cols)
    // Auto-select for instant chart visualization
    setSelectedXAxis("region")
    setSelectedYAxis("revenue")
    setActiveView("data")
    setIsLoading(false)
  }

  // Chart data processing
  const chartData = useMemo(() => {
    if (!selectedXAxis || !selectedYAxis || data.length === 0) return []
    if (selectedChartType === "scatter") {
      return data.slice(0, 200).map((row) => ({
        [selectedXAxis]: Number(row[selectedXAxis]) || 0,
        [selectedYAxis]: Number(row[selectedYAxis]) || 0,
      }))
    }
    const grouped = new Map<string, number[]>()
    data.forEach((row) => {
      const key = String(row[selectedXAxis] ?? "—")
      const value = Number(row[selectedYAxis]) || 0
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(value)
    })
    return Array.from(grouped.entries())
      .map(([key, values]) => ({
        [selectedXAxis]: key,
        [selectedYAxis]: values.reduce((a, b) => a + b, 0) / values.length,
      }))
      .slice(0, 30)
  }, [data, selectedXAxis, selectedYAxis, selectedChartType])

  const numericColumns = columns.filter((c) => c.type === "numeric")
  const categoricalColumns = columns.filter((c) => c.type === "categorical" || c.type === "date")

  // Health score
  const healthScore = useMemo(() => {
    if (columns.length === 0) return 0
    const totalCells = data.length * columns.length
    if (totalCells === 0) return 0
    const totalNulls = columns.reduce((sum, col) => sum + col.nullCount, 0)
    return Math.round((1 - totalNulls / totalCells) * 100)
  }, [data, columns])

  const exportCSV = () => {
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName || "export.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  // AI Report Generation via streaming
  const generateReport = async () => {
    if (data.length === 0) return
    setIsGeneratingReport(true)
    setReport("")
    setActiveView("report")

    try {
      const dataSummary = {
        rowCount: data.length,
        columnCount: columns.length,
        healthScore,
        numericStats: numericColumns.map((c) => ({
          column: c.name,
          min: c.min,
          max: c.max,
          mean: c.mean ? Number(c.mean.toFixed(2)) : null,
          median: c.median,
          std: c.std ? Number(c.std.toFixed(2)) : null,
        })),
        categoricalSummary: categoricalColumns.map((c) => ({
          column: c.name,
          uniqueValues: c.uniqueValues,
          nullCount: c.nullCount,
        })),
      }

      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataSummary,
          columns: columns.map((c) => ({
            name: c.name,
            type: c.type,
            stats:
              c.type === "numeric" && c.mean !== undefined
                ? `mean=${c.mean.toFixed(2)}, std=${c.std?.toFixed(2)}`
                : `unique=${c.uniqueValues}`,
          })),
          rowCount: data.length,
          sampleData: data.slice(0, 5),
          fileName,
        }),
      })

      if (!response.ok || !response.body) {
        throw new Error("Failed to generate report")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let accumulatedText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith("data:")) continue
          const dataStr = trimmed.slice(5).trim()
          if (!dataStr || dataStr === "[DONE]") continue
          try {
            const chunk = JSON.parse(dataStr)
            // Handle different chunk types from AI SDK 6 stream
            if (chunk.type === "text-delta" && typeof chunk.delta === "string") {
              accumulatedText += chunk.delta
              setReport(accumulatedText)
            } else if (chunk.type === "text" && typeof chunk.text === "string") {
              accumulatedText += chunk.text
              setReport(accumulatedText)
            } else if (chunk.type === "error") {
              throw new Error(chunk.errorText || "Stream error")
            }
          } catch (err) {
            // Skip invalid JSON chunks silently, but log unexpected errors
            if (err instanceof Error && err.message !== "Unexpected end of JSON input") {
              console.error("[v0] Chunk parse error:", err.message)
            }
          }
        }
      }

      if (!accumulatedText) {
        throw new Error("No content received from AI. Please try again.")
      }
    } catch (error) {
      console.error("[v0] Report generation error:", error)
      const message = error instanceof Error ? error.message : "Unknown error"
      setReport(`# Report Generation Failed\n\n${message}\n\nPlease try again or contact support.`)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const copyReport = async () => {
    await navigator.clipboard.writeText(report)
    setReportCopied(true)
    setTimeout(() => setReportCopied(false), 2000)
  }

  const downloadReport = () => {
    const blob = new Blob([report], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${fileName.replace(/\.[^/.]+$/, "")}_analysis_report.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const userInitials = (user.email || "U").substring(0, 2).toUpperCase()
  const hasData = data.length > 0

  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
      <AmbientScene />

      {/* Subtle grid backdrop */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
        aria-hidden="true"
      />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-xl bg-black/40">
        <div className="flex items-center justify-between px-6 lg:px-8 h-16">
          <div className="flex items-center gap-8">
            <a
              href="/"
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-mono"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </a>
            <div className="flex items-center gap-2">
              <span className="text-xl font-display tracking-tight">DATAWISE</span>
              <span className="text-[10px] font-mono text-white/40 mt-1">AI</span>
            </div>
            {fileName && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <FileSpreadsheet className="h-3.5 w-3.5 text-[#eca8d6]" />
                <span className="text-xs font-mono text-white/70">{fileName}</span>
                <span className="text-xs text-white/40">·</span>
                <span className="text-xs text-white/50">{data.length.toLocaleString()} rows</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {hasData && (
              <Button
                onClick={generateReport}
                disabled={isGeneratingReport}
                className="hidden sm:inline-flex bg-[#eca8d6] hover:bg-[#eca8d6]/90 text-black rounded-full text-xs font-medium h-8 px-4"
              >
                {isGeneratingReport ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-3 w-3" />
                    Generate Report
                  </>
                )}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-8 w-8 rounded-full bg-gradient-to-br from-[#eca8d6] to-[#a78bfa] flex items-center justify-center text-xs font-medium text-black hover:scale-105 transition-transform">
                  {userInitials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-zinc-950 border-white/10">
                <DropdownMenuLabel className="text-white/60 font-normal text-xs">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={handleSignOut} className="text-white/80 focus:text-white focus:bg-white/5">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {!hasData ? (
          /* Empty state - matches landing page hero aesthetic */
          <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
            <div className="max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center gap-4 text-sm font-mono text-white/50 mb-8">
                <span className="w-12 h-px bg-white/20" />
                Welcome back, {user.email?.split("@")[0]}
              </div>
              <h1 className="text-5xl md:text-7xl font-display tracking-tight leading-[0.95] mb-8">
                Upload your data
                <br />
                <span className="text-white/40">to begin.</span>
              </h1>
              <p className="text-lg text-white/60 mb-12 leading-relaxed">
                Drop a CSV file and instantly get statistical analysis, beautiful visualizations, and AI-powered
                insights. All processed locally in your browser.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <input
                  type="file"
                  accept=".csv,.tsv"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                <Button
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="bg-white hover:bg-white/90 text-black rounded-full h-14 px-8 text-base font-medium"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Upload CSV file
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={loadDemoData}
                  disabled={isLoading}
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10 rounded-full h-14 px-8 text-base"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Try with demo data
                </Button>
              </div>

              {/* Feature pills */}
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm font-mono text-white/40">
                <span>Statistical analysis</span>
                <span>·</span>
                <span>5 chart types</span>
                <span>·</span>
                <span>AI reports</span>
                <span>·</span>
                <span>100% browser-based</span>
              </div>
            </div>
          </div>
        ) : (
          /* Data analysis interface */
          <div className="px-6 lg:px-8 py-8">
            {/* Stats overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Rows" value={data.length.toLocaleString()} icon={Database} />
              <StatCard label="Columns" value={columns.length.toString()} icon={Layers} />
              <StatCard label="Data Health" value={`${healthScore}%`} icon={TrendingUp} accent={healthScore > 90} />
              <StatCard
                label="Numeric Cols"
                value={numericColumns.length.toString()}
                icon={BarChart3}
              />
            </div>

            {/* View tabs */}
            <div className="flex items-center gap-1 mb-8 border-b border-white/10 overflow-x-auto">
              {[
                { id: "data" as const, label: "Data Preview", icon: Database },
                { id: "stats" as const, label: "Statistics", icon: TrendingUp },
                { id: "chart" as const, label: "Visualize", icon: BarChart3 },
                { id: "report" as const, label: "AI Report", icon: Sparkles },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                    activeView === tab.id ? "text-white" : "text-white/50 hover:text-white/80"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {activeView === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-px bg-[#eca8d6]" />
                  )}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportCSV}
                  className="text-white/60 hover:text-white hover:bg-white/5 text-xs"
                >
                  <Download className="mr-2 h-3 w-3" />
                  Export
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setData([])
                    setColumns([])
                    setFileName("")
                    setReport("")
                  }}
                  className="text-white/60 hover:text-white hover:bg-white/5 text-xs"
                >
                  <Trash2 className="mr-2 h-3 w-3" />
                  Clear
                </Button>
              </div>
            </div>

            {/* View content */}
            {activeView === "data" && <DataPreview data={data} columns={columns} />}
            {activeView === "stats" && <StatsView columns={columns} />}
            {activeView === "chart" && (
              <ChartView
                columns={columns}
                numericColumns={numericColumns}
                categoricalColumns={categoricalColumns}
                chartData={chartData}
                selectedChartType={selectedChartType}
                setSelectedChartType={setSelectedChartType}
                selectedXAxis={selectedXAxis}
                setSelectedXAxis={setSelectedXAxis}
                selectedYAxis={selectedYAxis}
                setSelectedYAxis={setSelectedYAxis}
              />
            )}
            {activeView === "report" && (
              <ReportView
                report={report}
                isGenerating={isGeneratingReport}
                onGenerate={generateReport}
                onCopy={copyReport}
                onDownload={downloadReport}
                copied={reportCopied}
                hasData={hasData}
              />
            )}
          </div>
        )}
      </main>
    </div>
  )
}

/* -------------------- Subcomponents -------------------- */

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  icon: typeof Database
  accent?: boolean
}) {
  return (
    <div className="border border-white/10 bg-white/[0.02] backdrop-blur-sm p-5 rounded-lg hover:border-white/20 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono uppercase tracking-wider text-white/40">{label}</span>
        <Icon className={`h-4 w-4 ${accent ? "text-[#eca8d6]" : "text-white/30"}`} />
      </div>
      <div className={`text-3xl font-display ${accent ? "text-[#eca8d6]" : "text-white"}`}>{value}</div>
    </div>
  )
}

function DataPreview({ data, columns }: { data: DataRow[]; columns: ColumnInfo[] }) {
  const [page, setPage] = useState(0)
  const pageSize = 50
  const pageData = data.slice(page * pageSize, (page + 1) * pageSize)
  const totalPages = Math.ceil(data.length / pageSize)

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden bg-white/[0.02] backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] border-b border-white/10">
            <tr>
              <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-white/40">#</th>
              {columns.map((col) => (
                <th key={col.name} className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <span className="text-white/70">{col.name}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                        col.type === "numeric"
                          ? "bg-[#eca8d6]/10 text-[#eca8d6]"
                          : col.type === "date"
                            ? "bg-blue-400/10 text-blue-400"
                            : "bg-white/10 text-white/60"
                      }`}
                    >
                      {col.type}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, idx) => (
              <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                <td className="px-4 py-2.5 text-white/30 font-mono text-xs">{page * pageSize + idx + 1}</td>
                {columns.map((col) => (
                  <td key={col.name} className="px-4 py-2.5 text-white/80 font-mono text-xs whitespace-nowrap">
                    {row[col.name] === null || row[col.name] === "" ? (
                      <span className="text-white/20 italic">null</span>
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-white/[0.02]">
          <span className="text-xs font-mono text-white/50">
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, data.length)} of {data.length.toLocaleString()}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="text-white/70 hover:text-white hover:bg-white/5 h-7 text-xs"
            >
              Previous
            </Button>
            <span className="text-xs font-mono text-white/50 self-center px-2">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="text-white/70 hover:text-white hover:bg-white/5 h-7 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function StatsView({ columns }: { columns: ColumnInfo[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {columns.map((col) => (
        <div
          key={col.name}
          className="border border-white/10 bg-white/[0.02] backdrop-blur-sm rounded-lg p-5 hover:border-white/20 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-white truncate">{col.name}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider ${
                col.type === "numeric"
                  ? "bg-[#eca8d6]/10 text-[#eca8d6]"
                  : col.type === "date"
                    ? "bg-blue-400/10 text-blue-400"
                    : "bg-white/10 text-white/60"
              }`}
            >
              {col.type}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <Stat label="Unique" value={col.uniqueValues.toLocaleString()} />
            <Stat label="Nulls" value={col.nullCount.toLocaleString()} />
            {col.type === "numeric" && col.mean !== undefined && (
              <>
                <Stat label="Mean" value={col.mean.toFixed(2)} />
                <Stat label="Median" value={col.median?.toFixed(2) || "—"} />
                <Stat label="Min" value={col.min?.toFixed(2) || "—"} />
                <Stat label="Max" value={col.max?.toFixed(2) || "—"} />
                <Stat label="Std Dev" value={col.std?.toFixed(2) || "—"} />
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-white/40 uppercase text-[10px] tracking-wider mb-0.5">{label}</div>
      <div className="text-white/90">{value}</div>
    </div>
  )
}

/* Premium glass tooltip for charts */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-white/15 bg-black/85 backdrop-blur-xl px-3.5 py-2.5 shadow-2xl shadow-black/50">
      {label !== undefined && (
        <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-1.5">
          {String(label)}
        </div>
      )}
      <div className="space-y-1">
        {payload.map((entry: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 rounded-full ring-2 ring-white/10"
              style={{ backgroundColor: entry.color || entry.fill || ACCENT }}
            />
            <span className="text-white/60 font-mono">{entry.name}:</span>
            <span className="text-white font-mono font-medium">
              {typeof entry.value === "number" ? entry.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChartView({
  columns,
  numericColumns,
  categoricalColumns,
  chartData,
  selectedChartType,
  setSelectedChartType,
  selectedXAxis,
  setSelectedXAxis,
  selectedYAxis,
  setSelectedYAxis,
}: {
  columns: ColumnInfo[]
  numericColumns: ColumnInfo[]
  categoricalColumns: ColumnInfo[]
  chartData: any[]
  selectedChartType: ChartConfig["type"]
  setSelectedChartType: (t: ChartConfig["type"]) => void
  selectedXAxis: string
  setSelectedXAxis: (s: string) => void
  selectedYAxis: string
  setSelectedYAxis: (s: string) => void
}) {
  const xOptions = selectedChartType === "scatter" ? numericColumns : columns

  // Compute live insights from the chart data
  const insights = useMemo(() => {
    if (!chartData.length || !selectedYAxis) return null
    const values = chartData
      .map((d) => Number(d[selectedYAxis]))
      .filter((n) => !isNaN(n))
    if (!values.length) return null
    const sum = values.reduce((a, b) => a + b, 0)
    const avg = sum / values.length
    const max = Math.max(...values)
    const min = Math.min(...values)
    const sorted = [...values].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    const maxIdx = values.indexOf(max)
    const minIdx = values.indexOf(min)
    return {
      sum, avg, max, min, median,
      count: values.length,
      maxLabel: chartData[maxIdx]?.[selectedXAxis] ?? "—",
      minLabel: chartData[minIdx]?.[selectedXAxis] ?? "—",
    }
  }, [chartData, selectedXAxis, selectedYAxis])

  const formatNum = (n: number) =>
    n >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : n.toFixed(2)

  const axisStyle = { fontSize: 11, fontFamily: "var(--font-mono)", fill: "rgba(255,255,255,0.5)" }

  return (
    <div className="space-y-6">
      {/* Premium chart configuration bar */}
      <div className="relative overflow-hidden border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm rounded-2xl p-6">
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[#eca8d6]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-[#a78bfa]/10 blur-3xl pointer-events-none" />
        <div className="relative grid grid-cols-1 lg:grid-cols-[auto_1fr_1fr] gap-6 items-end">
          {/* Chart type selector */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-2 block">Visualization Type</label>
            <div className="flex flex-wrap gap-1.5">
              {CHART_TYPES.map((type) => {
                const isActive = selectedChartType === type.value
                return (
                  <button
                    key={type.value}
                    onClick={() => setSelectedChartType(type.value as ChartConfig["type"])}
                    className={`group flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      isActive
                        ? "border-[#eca8d6]/40 bg-gradient-to-br from-[#eca8d6]/15 to-[#a78bfa]/10 text-[#eca8d6] shadow-lg shadow-[#eca8d6]/10"
                        : "border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/25 hover:bg-white/5"
                    }`}
                    title={type.label}
                  >
                    <type.icon className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-2 block">X-Axis (categories)</label>
            <Select value={selectedXAxis} onValueChange={setSelectedXAxis}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 rounded-lg">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-white/10">
                {xOptions.map((col) => (
                  <SelectItem key={col.name} value={col.name} className="text-white/80 focus:bg-white/5">
                    {col.name} <span className="text-white/40 text-xs ml-2">({col.type})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-2 block">Y-Axis (values)</label>
            <Select value={selectedYAxis} onValueChange={setSelectedYAxis}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 rounded-lg">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-white/10">
                {numericColumns.map((col) => (
                  <SelectItem key={col.name} value={col.name} className="text-white/80 focus:bg-white/5">
                    {col.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Chart + Insights grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
        {/* Chart canvas */}
        <div className="relative border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-sm rounded-2xl p-6 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          {selectedXAxis && selectedYAxis ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-display tracking-tight">
                    {selectedYAxis} <span className="text-white/40 text-sm">by</span> {selectedXAxis}
                  </h3>
                  <p className="text-xs font-mono text-white/40 mt-0.5">
                    {chartData.length} {chartData.length === 1 ? "data point" : "data points"}
                    {selectedChartType !== "scatter" && " · aggregated by mean"}
                  </p>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#eca8d6] bg-[#eca8d6]/10 px-2 py-1 rounded-full border border-[#eca8d6]/20">
                  Live
                </span>
              </div>
              <div className="h-[480px] -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  {selectedChartType === "bar" ? (
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                      <defs>
                        {chartData.map((_, idx) => (
                          <linearGradient key={idx} id={`barGrad${idx}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0.95} />
                            <stop offset="100%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0.4} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey={selectedXAxis} stroke="rgba(255,255,255,0.2)" tick={axisStyle} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.2)" tick={axisStyle} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                      {insights && (
                        <ReferenceLine
                          y={insights.avg}
                          stroke="rgba(236,168,214,0.5)"
                          strokeDasharray="4 4"
                          label={{ value: "avg", fill: "#eca8d6", fontSize: 10, position: "right" }}
                        />
                      )}
                      <Bar dataKey={selectedYAxis} radius={[6, 6, 0, 0]} animationDuration={800}>
                        {chartData.map((_, idx) => (
                          <Cell key={idx} fill={`url(#barGrad${idx})`} />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : selectedChartType === "line" ? (
                    <RechartsLineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                      <defs>
                        <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor={ACCENT} />
                          <stop offset="100%" stopColor={ACCENT_2} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey={selectedXAxis} stroke="rgba(255,255,255,0.2)" tick={axisStyle} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.2)" tick={axisStyle} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(236,168,214,0.3)", strokeWidth: 1 }} />
                      {insights && (
                        <ReferenceLine y={insights.avg} stroke="rgba(236,168,214,0.4)" strokeDasharray="4 4" />
                      )}
                      <Line
                        type="monotone"
                        dataKey={selectedYAxis}
                        stroke="url(#lineStroke)"
                        strokeWidth={2.5}
                        dot={{ fill: ACCENT, r: 4, strokeWidth: 2, stroke: "rgba(0,0,0,0.5)" }}
                        activeDot={{ r: 6, fill: ACCENT, stroke: "white", strokeWidth: 2 }}
                        animationDuration={1000}
                      />
                    </RechartsLineChart>
                  ) : selectedChartType === "area" ? (
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                      <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={ACCENT} stopOpacity={0.5} />
                          <stop offset="50%" stopColor={ACCENT_2} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={ACCENT_2} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="areaStroke" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor={ACCENT} />
                          <stop offset="100%" stopColor={ACCENT_2} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey={selectedXAxis} stroke="rgba(255,255,255,0.2)" tick={axisStyle} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.2)" tick={axisStyle} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(236,168,214,0.3)", strokeWidth: 1 }} />
                      <Area
                        type="monotone"
                        dataKey={selectedYAxis}
                        stroke="url(#areaStroke)"
                        strokeWidth={2.5}
                        fill="url(#areaGradient)"
                        animationDuration={1000}
                      />
                    </AreaChart>
                  ) : selectedChartType === "pie" ? (
                    <RechartsPieChart>
                      <defs>
                        {CHART_COLORS.map((color, idx) => (
                          <radialGradient key={idx} id={`pieGrad${idx}`}>
                            <stop offset="0%" stopColor={color} stopOpacity={1} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                          </radialGradient>
                        ))}
                      </defs>
                      <Pie
                        data={chartData}
                        dataKey={selectedYAxis}
                        nameKey={selectedXAxis}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={160}
                        paddingAngle={2}
                        animationDuration={800}
                        label={(entry: any) => `${entry[selectedXAxis]}`}
                        labelLine={{ stroke: "rgba(255,255,255,0.2)" }}
                      >
                        {chartData.map((_, idx) => (
                          <Cell
                            key={idx}
                            fill={`url(#pieGrad${idx % CHART_COLORS.length})`}
                            stroke="rgba(0,0,0,0.4)"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </RechartsPieChart>
                  ) : selectedChartType === "scatter" ? (
                    <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                      <defs>
                        <radialGradient id="scatterGrad">
                          <stop offset="0%" stopColor={ACCENT} stopOpacity={1} />
                          <stop offset="100%" stopColor={ACCENT_2} stopOpacity={0.6} />
                        </radialGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        dataKey={selectedXAxis}
                        stroke="rgba(255,255,255,0.2)"
                        tick={axisStyle}
                        tickLine={false}
                        axisLine={false}
                        name={selectedXAxis}
                      />
                      <YAxis
                        type="number"
                        dataKey={selectedYAxis}
                        stroke="rgba(255,255,255,0.2)"
                        tick={axisStyle}
                        tickLine={false}
                        axisLine={false}
                        name={selectedYAxis}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "rgba(236,168,214,0.3)" }} />
                      <Scatter
                        data={chartData}
                        fill="url(#scatterGrad)"
                        animationDuration={800}
                        shape={(props: any) => (
                          <circle
                            cx={props.cx}
                            cy={props.cy}
                            r={5}
                            fill="url(#scatterGrad)"
                            stroke="rgba(255,255,255,0.3)"
                            strokeWidth={1}
                          />
                        )}
                      />
                    </ScatterChart>
                  ) : (
                    <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                      <defs>
                        <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={ACCENT} stopOpacity={0.5} />
                          <stop offset="100%" stopColor={ACCENT_2} stopOpacity={0.15} />
                        </linearGradient>
                      </defs>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey={selectedXAxis} tick={{ ...axisStyle, fill: "rgba(255,255,255,0.6)" }} />
                      <PolarRadiusAxis stroke="rgba(255,255,255,0.15)" tick={{ ...axisStyle, fill: "rgba(255,255,255,0.4)" }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Radar
                        dataKey={selectedYAxis}
                        stroke={ACCENT}
                        strokeWidth={2}
                        fill="url(#radarFill)"
                        animationDuration={1000}
                      />
                    </RadarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-white/40">
              <BarChart3 className="h-12 w-12 mb-4" />
              <p className="text-sm">Select X and Y axes to render the chart</p>
            </div>
          )}
        </div>

        {/* Insights sidebar */}
        <div className="space-y-3">
          <div className="border border-white/10 bg-gradient-to-br from-[#eca8d6]/10 to-transparent backdrop-blur-sm rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-[#eca8d6]" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#eca8d6]">Live Insights</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              Statistical breakdown of the visualized data.
            </p>
          </div>

          {insights ? (
            <>
              <InsightCard label="Total" value={formatNum(insights.sum)} accent />
              <InsightCard label="Average" value={formatNum(insights.avg)} />
              <InsightCard label="Median" value={formatNum(insights.median)} />
              <InsightCard
                label="Maximum"
                value={formatNum(insights.max)}
                sublabel={`from ${insights.maxLabel}`}
                trend="up"
              />
              <InsightCard
                label="Minimum"
                value={formatNum(insights.min)}
                sublabel={`from ${insights.minLabel}`}
                trend="down"
              />
              <InsightCard label="Data Points" value={insights.count.toLocaleString()} />
            </>
          ) : (
            <div className="border border-white/10 bg-white/[0.02] backdrop-blur-sm rounded-xl p-5 text-xs text-white/40">
              Configure axes to see live insights.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InsightCard({
  label,
  value,
  sublabel,
  accent,
  trend,
}: {
  label: string
  value: string
  sublabel?: string
  accent?: boolean
  trend?: "up" | "down"
}) {
  return (
    <div
      className={`relative overflow-hidden border rounded-xl p-4 backdrop-blur-sm transition-all hover:border-white/20 ${
        accent
          ? "border-[#eca8d6]/30 bg-gradient-to-br from-[#eca8d6]/10 to-[#a78bfa]/5"
          : "border-white/10 bg-white/[0.02]"
      }`}
    >
      {trend && (
        <div
          className={`absolute top-3 right-3 h-6 w-6 rounded-full flex items-center justify-center ${
            trend === "up" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
          }`}
        >
          <span className="text-[10px] font-bold">{trend === "up" ? "↑" : "↓"}</span>
        </div>
      )}
      <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-1.5">{label}</div>
      <div className={`text-2xl font-display tracking-tight ${accent ? "text-[#eca8d6]" : "text-white"}`}>
        {value}
      </div>
      {sublabel && <div className="text-[10px] font-mono text-white/40 mt-1 truncate">{sublabel}</div>}
    </div>
  )
}

function ReportView({
  report,
  isGenerating,
  onGenerate,
  onCopy,
  onDownload,
  copied,
  hasData,
}: {
  report: string
  isGenerating: boolean
  onGenerate: () => void
  onCopy: () => void
  onDownload: () => void
  copied: boolean
  hasData: boolean
}) {
  if (!report && !isGenerating) {
    return (
      <div className="border border-white/10 bg-white/[0.02] backdrop-blur-sm rounded-lg p-12 text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-[#eca8d6]/20 to-[#a78bfa]/20 mb-6">
          <Sparkles className="h-7 w-7 text-[#eca8d6]" />
        </div>
        <h3 className="text-2xl font-display tracking-tight mb-3">AI-Generated Analytics Report</h3>
        <p className="text-white/60 max-w-md mx-auto mb-8 leading-relaxed">
          Deploy our AI analyst agent to generate a comprehensive report on your dataset. Includes executive summary,
          key findings, statistical insights, and strategic recommendations.
        </p>
        <Button
          onClick={onGenerate}
          disabled={!hasData}
          size="lg"
          className="bg-[#eca8d6] hover:bg-[#eca8d6]/90 text-black rounded-full h-12 px-8 font-medium"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
        <div className="mt-8 flex items-center justify-center gap-x-6 gap-y-2 text-xs font-mono text-white/40 flex-wrap">
          <span>Executive Summary</span>
          <span>·</span>
          <span>Key Findings</span>
          <span>·</span>
          <span>Statistical Analysis</span>
          <span>·</span>
          <span>Recommendations</span>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-white/10 bg-white/[0.02] backdrop-blur-sm rounded-lg overflow-hidden">
      {/* Report header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#eca8d6] to-[#a78bfa] flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-black" />
          </div>
          <div>
            <div className="text-sm font-medium">AI Analytics Report</div>
            <div className="text-xs font-mono text-white/40">
              {isGenerating ? "Generating..." : "Generated by GPT-5 mini"}
            </div>
          </div>
          {isGenerating && <Loader2 className="h-4 w-4 animate-spin text-[#eca8d6]" />}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCopy}
            disabled={!report}
            className="text-white/60 hover:text-white hover:bg-white/5 text-xs"
          >
            {copied ? <Check className="mr-2 h-3 w-3" /> : <Copy className="mr-2 h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDownload}
            disabled={!report}
            className="text-white/60 hover:text-white hover:bg-white/5 text-xs"
          >
            <Download className="mr-2 h-3 w-3" />
            Markdown
          </Button>
          {!isGenerating && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onGenerate}
              className="text-white/60 hover:text-white hover:bg-white/5 text-xs"
            >
              <Sparkles className="mr-2 h-3 w-3" />
              Regenerate
            </Button>
          )}
        </div>
      </div>

      {/* Report body — Medium-style typography */}
      <div className="px-6 md:px-12 py-8 md:py-12 max-w-4xl mx-auto">
        {report ? (
          <article className="report-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
            {isGenerating && (
              <span className="inline-block w-2 h-5 bg-[#eca8d6] ml-1 animate-pulse align-middle" />
            )}
          </article>
        ) : (
          <div className="space-y-3">
            <div className="h-8 w-3/4 bg-white/5 rounded animate-pulse" />
            <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-white/5 rounded animate-pulse" />
          </div>
        )}
      </div>
    </div>
  )
}
