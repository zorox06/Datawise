'use client'

import { useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import Papa from 'papaparse'
import {
  BarChart3,
  Upload,
  Table,
  LineChart,
  PieChart,
  Download,
  Trash2,
  LogOut,
  FileSpreadsheet,
  TrendingUp,
  Calculator,
  Sparkles,
  ChevronDown,
  X,
  MoreVertical,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
} from 'recharts'

type DataRow = Record<string, string | number | null>
type ColumnType = 'numeric' | 'categorical' | 'date'

interface ColumnInfo {
  name: string
  type: ColumnType
  uniqueValues?: number
  nullCount: number
  min?: number
  max?: number
  mean?: number
}

interface ChartConfig {
  id: string
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'area'
  title: string
  xAxis?: string
  yAxis?: string
  colorBy?: string
}

const COLORS = ['#eca8d6', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F', '#FFBB28', '#FF8042']

export function DataAnalystDashboard({ user }: { user: User }) {
  const [data, setData] = useState<DataRow[]>([])
  const [columns, setColumns] = useState<ColumnInfo[]>([])
  const [fileName, setFileName] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('upload')
  const [charts, setCharts] = useState<ChartConfig[]>([])
  const [selectedChartType, setSelectedChartType] = useState<ChartConfig['type']>('bar')
  const [selectedXAxis, setSelectedXAxis] = useState<string>('')
  const [selectedYAxis, setSelectedYAxis] = useState<string>('')
  
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const detectColumnType = (values: (string | number | null)[]): ColumnType => {
    const nonNullValues = values.filter(v => v !== null && v !== '')
    if (nonNullValues.length === 0) return 'categorical'
    
    const numericCount = nonNullValues.filter(v => !isNaN(Number(v))).length
    if (numericCount / nonNullValues.length > 0.8) return 'numeric'
    
    // Check for dates
    const dateCount = nonNullValues.filter(v => {
      const d = new Date(String(v))
      return !isNaN(d.getTime())
    }).length
    if (dateCount / nonNullValues.length > 0.8) return 'date'
    
    return 'categorical'
  }

  const analyzeData = (rows: DataRow[]) => {
    if (rows.length === 0) return []
    
    const columnNames = Object.keys(rows[0])
    return columnNames.map(name => {
      const values = rows.map(r => r[name])
      const type = detectColumnType(values)
      const nullCount = values.filter(v => v === null || v === '').length
      const uniqueValues = new Set(values.filter(v => v !== null && v !== '')).size
      
      let min, max, mean
      if (type === 'numeric') {
        const nums = values.map(v => Number(v)).filter(n => !isNaN(n))
        min = Math.min(...nums)
        max = Math.max(...nums)
        mean = nums.reduce((a, b) => a + b, 0) / nums.length
      }
      
      return { name, type, uniqueValues, nullCount, min, max, mean }
    })
  }

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setFileName(file.name)

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as DataRow[]
        setData(rows)
        setColumns(analyzeData(rows))
        setIsLoading(false)
        setActiveTab('data')
      },
      error: () => {
        setIsLoading(false)
      }
    })
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return

    setIsLoading(true)
    setFileName(file.name)

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as DataRow[]
        setData(rows)
        setColumns(analyzeData(rows))
        setIsLoading(false)
        setActiveTab('data')
      },
      error: () => {
        setIsLoading(false)
      }
    })
  }, [])

  const loadDemoData = () => {
    setIsLoading(true)
    setFileName('sales_demo.csv')
    
    // Generate demo sales data
    const categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Sports']
    const regions = ['North', 'South', 'East', 'West']
    const demoData: DataRow[] = []
    
    for (let i = 0; i < 100; i++) {
      demoData.push({
        id: i + 1,
        date: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        category: categories[Math.floor(Math.random() * categories.length)],
        region: regions[Math.floor(Math.random() * regions.length)],
        sales: Math.floor(Math.random() * 10000) + 500,
        quantity: Math.floor(Math.random() * 100) + 1,
        profit: Math.floor(Math.random() * 3000) - 500,
      })
    }
    
    setData(demoData)
    setColumns(analyzeData(demoData))
    setIsLoading(false)
    setActiveTab('data')
  }

  const clearData = () => {
    setData([])
    setColumns([])
    setFileName('')
    setCharts([])
    setActiveTab('upload')
  }

  const numericColumns = useMemo(() => 
    columns.filter(c => c.type === 'numeric'), 
    [columns]
  )

  const categoricalColumns = useMemo(() => 
    columns.filter(c => c.type === 'categorical'), 
    [columns]
  )

  const addChart = () => {
    if (!selectedXAxis || !selectedYAxis) return
    
    const newChart: ChartConfig = {
      id: Date.now().toString(),
      type: selectedChartType,
      title: `${selectedYAxis} by ${selectedXAxis}`,
      xAxis: selectedXAxis,
      yAxis: selectedYAxis,
    }
    setCharts([...charts, newChart])
  }

  const removeChart = (id: string) => {
    setCharts(charts.filter(c => c.id !== id))
  }

  const getChartData = (chart: ChartConfig) => {
    if (!chart.xAxis || !chart.yAxis) return []
    
    // Group by x-axis and sum y-axis
    const grouped: Record<string, number> = {}
    data.forEach(row => {
      const key = String(row[chart.xAxis!] ?? 'Unknown')
      const value = Number(row[chart.yAxis!]) || 0
      grouped[key] = (grouped[key] || 0) + value
    })
    
    return Object.entries(grouped).map(([name, value]) => ({ name, value }))
  }

  const stats = useMemo(() => {
    if (data.length === 0) return null
    
    const totalRows = data.length
    const totalColumns = columns.length
    const numericCols = numericColumns.length
    const categoricalCols = categoricalColumns.length
    const nullCells = columns.reduce((acc, col) => acc + col.nullCount, 0)
    const dataHealth = Math.round((1 - nullCells / (totalRows * totalColumns)) * 100)
    
    return { totalRows, totalColumns, numericCols, categoricalCols, dataHealth }
  }, [data, columns, numericColumns, categoricalColumns])

  const renderChart = (chart: ChartConfig) => {
    const chartData = getChartData(chart)
    
    switch (chart.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" tick={{ fill: '#888' }} />
              <YAxis stroke="#888" tick={{ fill: '#888' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="value" fill="#eca8d6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" tick={{ fill: '#888' }} />
              <YAxis stroke="#888" tick={{ fill: '#888' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="value" stroke="#eca8d6" strokeWidth={2} dot={{ fill: '#eca8d6' }} />
            </RechartsLineChart>
          </ResponsiveContainer>
        )
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" tick={{ fill: '#888' }} />
              <YAxis stroke="#888" tick={{ fill: '#888' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                labelStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="value" stroke="#eca8d6" fill="#eca8d6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        )
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                labelStyle={{ color: '#fff' }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        )
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" type="category" stroke="#888" tick={{ fill: '#888' }} />
              <YAxis dataKey="value" stroke="#888" tick={{ fill: '#888' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                labelStyle={{ color: '#fff' }}
              />
              <Scatter data={chartData} fill="#eca8d6" />
            </ScatterChart>
          </ResponsiveContainer>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#eca8d6]/20 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-[#eca8d6]" />
                </div>
                <span className="text-lg font-display">DATAWISE</span>
                <span className="text-xs text-white/40 font-mono">AI</span>
              </div>
              
              {fileName && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full">
                  <FileSpreadsheet className="w-4 h-4 text-[#eca8d6]" />
                  <span className="text-sm text-white/80">{fileName}</span>
                  <button onClick={clearData} className="text-white/40 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {data.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/5"
                  onClick={() => {
                    const csv = Papa.unparse(data)
                    const blob = new Blob([csv], { type: 'text/csv' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'export.csv'
                    a.click()
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/5">
                    <span className="hidden sm:inline mr-2">{user.email}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                  <DropdownMenuItem className="text-white/60">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-400">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {data.length === 0 ? (
          /* Upload Section */
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-display mb-4">Upload your data</h1>
              <p className="text-white/60 max-w-md">
                Drag and drop a CSV file or click to browse. We&apos;ll automatically detect column types and generate insights.
              </p>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="w-full max-w-xl p-12 border-2 border-dashed border-white/20 rounded-2xl hover:border-[#eca8d6]/50 transition-colors cursor-pointer bg-white/[0.02]"
            >
              <input
                type="file"
                accept=".csv,.tsv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#eca8d6]/10 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-[#eca8d6]" />
                </div>
                <span className="text-lg font-medium mb-2">Drop your CSV file here</span>
                <span className="text-white/40 text-sm">or click to browse</span>
              </label>
            </div>

            <div className="mt-8">
              <span className="text-white/40 text-sm">or</span>
            </div>

            <Button 
              onClick={loadDemoData}
              variant="outline" 
              className="mt-4 border-white/20 text-white hover:bg-white/5"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Load demo data
            </Button>
          </div>
        ) : (
          /* Dashboard Tabs */
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="data" className="data-[state=active]:bg-[#eca8d6] data-[state=active]:text-black">
                <Table className="w-4 h-4 mr-2" />
                Data
              </TabsTrigger>
              <TabsTrigger value="stats" className="data-[state=active]:bg-[#eca8d6] data-[state=active]:text-black">
                <Calculator className="w-4 h-4 mr-2" />
                Statistics
              </TabsTrigger>
              <TabsTrigger value="visualize" className="data-[state=active]:bg-[#eca8d6] data-[state=active]:text-black">
                <LineChart className="w-4 h-4 mr-2" />
                Visualize
              </TabsTrigger>
            </TabsList>

            {/* Data Tab */}
            <TabsContent value="data" className="space-y-4">
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-3xl font-display">{stats.totalRows}</span>
                    <span className="block text-sm text-white/40 mt-1">Rows</span>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-3xl font-display">{stats.totalColumns}</span>
                    <span className="block text-sm text-white/40 mt-1">Columns</span>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-3xl font-display">{stats.numericCols}</span>
                    <span className="block text-sm text-white/40 mt-1">Numeric</span>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-3xl font-display">{stats.categoricalCols}</span>
                    <span className="block text-sm text-white/40 mt-1">Categorical</span>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <span className={`text-3xl font-display ${stats.dataHealth >= 90 ? 'text-green-400' : stats.dataHealth >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {stats.dataHealth}%
                    </span>
                    <span className="block text-sm text-white/40 mt-1">Data Health</span>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        {columns.map((col) => (
                          <th key={col.name} className="px-4 py-3 text-left text-sm font-medium text-white/60 border-b border-white/10">
                            <div className="flex items-center gap-2">
                              {col.name}
                              <span className={`px-1.5 py-0.5 text-[10px] rounded ${
                                col.type === 'numeric' ? 'bg-blue-500/20 text-blue-400' :
                                col.type === 'date' ? 'bg-green-500/20 text-green-400' :
                                'bg-purple-500/20 text-purple-400'
                              }`}>
                                {col.type}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.slice(0, 50).map((row, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                          {columns.map((col) => (
                            <td key={col.name} className="px-4 py-3 text-sm">
                              {row[col.name] === null || row[col.name] === '' ? (
                                <span className="text-white/20">null</span>
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
                {data.length > 50 && (
                  <div className="px-4 py-3 bg-white/5 text-sm text-white/40 text-center">
                    Showing 50 of {data.length} rows
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="stats" className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {columns.map((col) => (
                  <div key={col.name} className="p-6 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">{col.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded ${
                        col.type === 'numeric' ? 'bg-blue-500/20 text-blue-400' :
                        col.type === 'date' ? 'bg-green-500/20 text-green-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {col.type}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/40">Unique values</span>
                        <span>{col.uniqueValues}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">Null count</span>
                        <span className={col.nullCount > 0 ? 'text-yellow-400' : ''}>{col.nullCount}</span>
                      </div>
                      {col.type === 'numeric' && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-white/40">Min</span>
                            <span>{col.min?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/40">Max</span>
                            <span>{col.max?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/40">Mean</span>
                            <span>{col.mean?.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Visualize Tab */}
            <TabsContent value="visualize" className="space-y-6">
              {/* Chart Builder */}
              <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-lg font-medium mb-4">Create a chart</h3>
                <div className="grid sm:grid-cols-4 gap-4">
                  <Select value={selectedChartType} onValueChange={(v) => setSelectedChartType(v as ChartConfig['type'])}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Chart type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/10">
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="area">Area Chart</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                      <SelectItem value="scatter">Scatter Plot</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedXAxis} onValueChange={setSelectedXAxis}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="X-Axis (Group by)" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/10">
                      {columns.map((col) => (
                        <SelectItem key={col.name} value={col.name}>{col.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedYAxis} onValueChange={setSelectedYAxis}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Y-Axis (Value)" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/10">
                      {numericColumns.map((col) => (
                        <SelectItem key={col.name} value={col.name}>{col.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button 
                    onClick={addChart}
                    disabled={!selectedXAxis || !selectedYAxis}
                    className="bg-[#eca8d6] hover:bg-[#eca8d6]/90 text-black"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Chart
                  </Button>
                </div>
              </div>

              {/* Charts Grid */}
              {charts.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {charts.map((chart) => (
                    <div key={chart.id} className="p-6 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium">{chart.title}</h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-white/40 hover:text-white">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                            <DropdownMenuItem onClick={() => removeChart(chart.id)} className="text-red-400">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {renderChart(chart)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-white/40">
                  <LineChart className="w-12 h-12 mx-auto mb-4 opacity-40" />
                  <p>No charts yet. Create one using the builder above.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}
