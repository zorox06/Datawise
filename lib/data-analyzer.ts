// Local statistical report generator — no API needed.
// Computes real statistics from the full dataset and produces a Medium-style markdown report.

export type DataRow = Record<string, string | number | null>

export interface ColumnAnalysis {
  name: string
  type: "numeric" | "categorical" | "date"
  uniqueValues: number
  nullCount: number
  min?: number
  max?: number
  mean?: number
  median?: number
  std?: number
  q1?: number
  q3?: number
  skewness?: number
  outliers?: number[]
  topValues?: { value: string; count: number; percentage: number }[]
}

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base])
  }
  return sorted[base]
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length)
  if (n < 2) return 0
  const meanX = x.reduce((a, b) => a + b, 0) / n
  const meanY = y.reduce((a, b) => a + b, 0) / n
  let num = 0
  let denX = 0
  let denY = 0
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX
    const dy = y[i] - meanY
    num += dx * dy
    denX += dx * dx
    denY += dy * dy
  }
  const denom = Math.sqrt(denX * denY)
  return denom === 0 ? 0 : num / denom
}

export function deepAnalyze(data: DataRow[]): ColumnAnalysis[] {
  if (!data.length) return []
  const columnNames = Object.keys(data[0])

  return columnNames.map((name) => {
    const rawValues = data.map((row) => row[name])
    const nonNull = rawValues.filter((v) => v !== null && v !== "" && v !== undefined)
    const nullCount = data.length - nonNull.length

    // Type detection
    const numericValues = nonNull
      .map((v) => Number(v))
      .filter((n) => !isNaN(n))
    const numericRatio = nonNull.length ? numericValues.length / nonNull.length : 0

    const dateRatio = nonNull.length
      ? nonNull.filter((v) => {
          const d = new Date(String(v))
          return !isNaN(d.getTime()) && String(v).length > 4
        }).length / nonNull.length
      : 0

    let type: ColumnAnalysis["type"] = "categorical"
    if (numericRatio > 0.8) type = "numeric"
    else if (dateRatio > 0.8) type = "date"

    const uniqueValues = new Set(nonNull.map((v) => String(v))).size
    const result: ColumnAnalysis = { name, type, uniqueValues, nullCount }

    if (type === "numeric" && numericValues.length > 0) {
      const sorted = [...numericValues].sort((a, b) => a - b)
      const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length
      const variance = numericValues.reduce((acc, n) => acc + Math.pow(n - mean, 2), 0) / numericValues.length
      const std = Math.sqrt(variance)
      const q1 = quantile(sorted, 0.25)
      const q3 = quantile(sorted, 0.75)
      const iqr = q3 - q1
      const lowerBound = q1 - 1.5 * iqr
      const upperBound = q3 + 1.5 * iqr
      const outliers = numericValues.filter((n) => n < lowerBound || n > upperBound)

      // Skewness (Fisher-Pearson)
      const skewness =
        std > 0
          ? numericValues.reduce((acc, n) => acc + Math.pow((n - mean) / std, 3), 0) / numericValues.length
          : 0

      result.min = sorted[0]
      result.max = sorted[sorted.length - 1]
      result.mean = mean
      result.median = quantile(sorted, 0.5)
      result.std = std
      result.q1 = q1
      result.q3 = q3
      result.skewness = skewness
      result.outliers = outliers.slice(0, 10)
    } else {
      // Top categorical values
      const counts = new Map<string, number>()
      for (const v of nonNull) {
        const key = String(v)
        counts.set(key, (counts.get(key) || 0) + 1)
      }
      const sortedCounts = [...counts.entries()].sort((a, b) => b[1] - a[1])
      result.topValues = sortedCounts.slice(0, 5).map(([value, count]) => ({
        value,
        count,
        percentage: (count / nonNull.length) * 100,
      }))
    }

    return result
  })
}

export function computeCorrelations(
  data: DataRow[],
  columns: ColumnAnalysis[]
): { col1: string; col2: string; correlation: number }[] {
  const numericCols = columns.filter((c) => c.type === "numeric")
  const correlations: { col1: string; col2: string; correlation: number }[] = []

  for (let i = 0; i < numericCols.length; i++) {
    for (let j = i + 1; j < numericCols.length; j++) {
      const x: number[] = []
      const y: number[] = []
      for (const row of data) {
        const xv = Number(row[numericCols[i].name])
        const yv = Number(row[numericCols[j].name])
        if (!isNaN(xv) && !isNaN(yv)) {
          x.push(xv)
          y.push(yv)
        }
      }
      const r = pearsonCorrelation(x, y)
      if (!isNaN(r)) {
        correlations.push({
          col1: numericCols[i].name,
          col2: numericCols[j].name,
          correlation: r,
        })
      }
    }
  }

  // Sort by absolute correlation strength
  return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
}

function fmt(n: number | undefined, digits = 2): string {
  if (n === undefined || isNaN(n)) return "—"
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M"
  if (Math.abs(n) >= 1_000) return n.toLocaleString(undefined, { maximumFractionDigits: 1 })
  return n.toFixed(digits)
}

function describeCorrelation(r: number): string {
  const abs = Math.abs(r)
  const dir = r > 0 ? "positive" : "negative"
  if (abs >= 0.8) return `very strong ${dir}`
  if (abs >= 0.6) return `strong ${dir}`
  if (abs >= 0.4) return `moderate ${dir}`
  if (abs >= 0.2) return `weak ${dir}`
  return "negligible"
}

function describeSkew(s: number | undefined): string {
  if (s === undefined) return ""
  if (Math.abs(s) < 0.5) return "approximately symmetric"
  if (s >= 0.5 && s < 1) return "moderately right-skewed"
  if (s >= 1) return "highly right-skewed"
  if (s <= -0.5 && s > -1) return "moderately left-skewed"
  return "highly left-skewed"
}

export function generateReport(
  data: DataRow[],
  columns: ColumnAnalysis[],
  fileName: string
): string {
  const correlations = computeCorrelations(data, columns)
  const numericCols = columns.filter((c) => c.type === "numeric")
  const categoricalCols = columns.filter((c) => c.type === "categorical")
  const dateCols = columns.filter((c) => c.type === "date")
  const totalCells = data.length * columns.length
  const totalNulls = columns.reduce((acc, c) => acc + c.nullCount, 0)
  const completeness = totalCells ? ((1 - totalNulls / totalCells) * 100).toFixed(1) : "100.0"

  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  let md = ""

  // Header
  md += `# Data Analysis Report\n\n`
  md += `*Generated on ${date} · ${fileName}*\n\n`
  md += `---\n\n`

  // Executive Summary
  md += `## Executive Summary\n\n`
  md += `This report presents a comprehensive analysis of **${fileName}**, a dataset containing `
  md += `**${data.length.toLocaleString()} rows** across **${columns.length} columns**. `
  md += `The data is organized into ${numericCols.length} numeric, ${categoricalCols.length} categorical`
  md += dateCols.length > 0 ? `, and ${dateCols.length} date column${dateCols.length > 1 ? "s" : ""}` : ""
  md += `. Overall data completeness is **${completeness}%**`
  md += totalNulls > 0 ? `, with ${totalNulls.toLocaleString()} missing values across the dataset.` : `.`
  md += `\n\n`

  // Key findings preview
  const findings: string[] = []
  if (correlations.length > 0 && Math.abs(correlations[0].correlation) > 0.5) {
    const c = correlations[0]
    findings.push(
      `A **${describeCorrelation(c.correlation)}** correlation (r = ${c.correlation.toFixed(2)}) exists between **${c.col1}** and **${c.col2}**.`
    )
  }
  const highOutlierCol = numericCols.find((c) => (c.outliers?.length || 0) > 0)
  if (highOutlierCol) {
    findings.push(
      `**${highOutlierCol.name}** contains ${highOutlierCol.outliers!.length} statistical outlier${highOutlierCol.outliers!.length > 1 ? "s" : ""} that may warrant further investigation.`
    )
  }
  const skewedCol = numericCols.find((c) => Math.abs(c.skewness || 0) > 1)
  if (skewedCol) {
    findings.push(
      `**${skewedCol.name}** shows a ${describeSkew(skewedCol.skewness)} distribution, suggesting a non-normal underlying pattern.`
    )
  }
  if (totalNulls > totalCells * 0.05) {
    findings.push(
      `The dataset has notable missing data (${((totalNulls / totalCells) * 100).toFixed(1)}%) — consider imputation strategies before modeling.`
    )
  }
  if (findings.length > 0) {
    md += `### Key Findings\n\n`
    findings.forEach((f) => (md += `- ${f}\n`))
    md += `\n`
  }

  // Dataset Overview
  md += `## Dataset Overview\n\n`
  md += `| Metric | Value |\n|--------|------:|\n`
  md += `| Total Rows | ${data.length.toLocaleString()} |\n`
  md += `| Total Columns | ${columns.length} |\n`
  md += `| Numeric Columns | ${numericCols.length} |\n`
  md += `| Categorical Columns | ${categoricalCols.length} |\n`
  md += `| Date Columns | ${dateCols.length} |\n`
  md += `| Total Cells | ${totalCells.toLocaleString()} |\n`
  md += `| Missing Values | ${totalNulls.toLocaleString()} (${((totalNulls / totalCells) * 100).toFixed(2)}%) |\n`
  md += `| Data Completeness | ${completeness}% |\n\n`

  // Numeric Analysis
  if (numericCols.length > 0) {
    md += `## Numeric Variables\n\n`
    md += `Statistical summary of all numeric columns. The interquartile range (IQR) is used to identify outliers, defined as values beyond 1.5×IQR from the first or third quartile.\n\n`
    md += `| Column | Min | Q1 | Median | Mean | Q3 | Max | Std Dev | Outliers |\n`
    md += `|--------|----:|---:|-------:|-----:|---:|----:|--------:|---------:|\n`
    for (const c of numericCols) {
      md += `| ${c.name} | ${fmt(c.min)} | ${fmt(c.q1)} | ${fmt(c.median)} | ${fmt(c.mean)} | ${fmt(c.q3)} | ${fmt(c.max)} | ${fmt(c.std)} | ${c.outliers?.length || 0} |\n`
    }
    md += `\n`

    // Distribution analysis per column
    md += `### Distribution Insights\n\n`
    for (const c of numericCols) {
      const skewDesc = describeSkew(c.skewness)
      const cv = c.mean && c.std ? (c.std / Math.abs(c.mean)) * 100 : 0
      md += `**${c.name}** ranges from ${fmt(c.min)} to ${fmt(c.max)}, with a mean of ${fmt(c.mean)} and standard deviation of ${fmt(c.std)}. `
      md += `The distribution is ${skewDesc}`
      if (cv > 0) {
        md += ` with a coefficient of variation of ${cv.toFixed(1)}%`
        if (cv > 50) md += ` indicating high relative variability`
        else if (cv < 15) md += ` indicating low relative variability`
      }
      md += `.`
      if ((c.outliers?.length || 0) > 0) {
        md += ` **${c.outliers!.length} outlier${c.outliers!.length > 1 ? "s were" : " was"} detected** beyond the typical range.`
      }
      md += `\n\n`
    }
  }

  // Categorical Analysis
  if (categoricalCols.length > 0) {
    md += `## Categorical Variables\n\n`
    md += `Distribution of unique values across categorical fields. Cardinality (the number of unique values) helps determine how to treat each variable in downstream analysis.\n\n`
    for (const c of categoricalCols) {
      md += `### ${c.name}\n\n`
      md += `Cardinality: **${c.uniqueValues}** unique value${c.uniqueValues > 1 ? "s" : ""}`
      if (c.nullCount > 0) md += ` · ${c.nullCount.toLocaleString()} missing`
      md += `\n\n`

      if (c.topValues && c.topValues.length > 0) {
        md += `| Value | Count | Frequency |\n|-------|------:|----------:|\n`
        for (const tv of c.topValues) {
          md += `| ${tv.value} | ${tv.count.toLocaleString()} | ${tv.percentage.toFixed(1)}% |\n`
        }
        md += `\n`

        const top = c.topValues[0]
        if (top.percentage > 50) {
          md += `> **${top.value}** dominates this column, representing ${top.percentage.toFixed(1)}% of all values. This concentration may indicate a class imbalance worth addressing.\n\n`
        } else if (c.uniqueValues > 50 && c.uniqueValues / data.length > 0.5) {
          md += `> This column has very high cardinality (${c.uniqueValues} unique values). It may behave more like an identifier than a true category.\n\n`
        }
      }
    }
  }

  // Correlation Analysis
  if (correlations.length > 0 && numericCols.length >= 2) {
    md += `## Correlation Analysis\n\n`
    md += `Pearson correlation measures the linear relationship between numeric variables. Values close to **+1** indicate strong positive correlation, **−1** strong negative correlation, and **0** no linear relationship.\n\n`
    md += `| Variable A | Variable B | Correlation | Strength |\n|-----------|-----------|------------:|----------|\n`
    for (const c of correlations.slice(0, 10)) {
      md += `| ${c.col1} | ${c.col2} | ${c.correlation.toFixed(3)} | ${describeCorrelation(c.correlation)} |\n`
    }
    md += `\n`

    const strongCorr = correlations.find((c) => Math.abs(c.correlation) >= 0.6)
    if (strongCorr) {
      md += `### Notable Relationships\n\n`
      md += `The strongest relationship in this dataset is between **${strongCorr.col1}** and **${strongCorr.col2}** `
      md += `with a Pearson coefficient of **${strongCorr.correlation.toFixed(3)}** — `
      md += `a ${describeCorrelation(strongCorr.correlation)} correlation. `
      if (strongCorr.correlation > 0) {
        md += `As ${strongCorr.col1} increases, ${strongCorr.col2} tends to increase proportionally. `
      } else {
        md += `As ${strongCorr.col1} increases, ${strongCorr.col2} tends to decrease. `
      }
      md += `This relationship explains approximately **${(strongCorr.correlation ** 2 * 100).toFixed(1)}%** of the variance between these variables (R²).\n\n`
    }
  }

  // Data Quality
  md += `## Data Quality Assessment\n\n`
  const qualityIssues: string[] = []
  if (totalNulls > 0) {
    const colsWithNulls = columns.filter((c) => c.nullCount > 0).sort((a, b) => b.nullCount - a.nullCount)
    qualityIssues.push(
      `**Missing data**: ${colsWithNulls.length} column${colsWithNulls.length > 1 ? "s contain" : " contains"} null values. The most affected: ${colsWithNulls
        .slice(0, 3)
        .map((c) => `${c.name} (${c.nullCount})`)
        .join(", ")}.`
    )
  }
  const totalOutliers = numericCols.reduce((acc, c) => acc + (c.outliers?.length || 0), 0)
  if (totalOutliers > 0) {
    qualityIssues.push(
      `**Outliers detected**: ${totalOutliers} value${totalOutliers > 1 ? "s" : ""} fall outside the typical statistical range across numeric columns.`
    )
  }
  const highCardCols = categoricalCols.filter((c) => c.uniqueValues / data.length > 0.9)
  if (highCardCols.length > 0) {
    qualityIssues.push(
      `**High-cardinality columns**: ${highCardCols.map((c) => `${c.name}`).join(", ")} ${highCardCols.length > 1 ? "have" : "has"} near-unique values per row, suggesting ${highCardCols.length > 1 ? "they are" : "it is"} likely an identifier rather than a true category.`
    )
  }
  if (qualityIssues.length === 0) {
    md += `The dataset is in excellent shape. No significant data quality issues were detected — completeness is high, distributions are reasonable, and no obvious anomalies were found.\n\n`
  } else {
    qualityIssues.forEach((q) => (md += `- ${q}\n`))
    md += `\n`
  }

  // Recommendations
  md += `## Recommendations\n\n`
  const recs: string[] = []
  if (totalNulls > totalCells * 0.05) {
    recs.push(
      `Consider imputation (mean/median for numeric, mode for categorical) or removal of incomplete rows before training predictive models.`
    )
  }
  if (totalOutliers > 0) {
    recs.push(
      `Investigate the ${totalOutliers} outlier${totalOutliers > 1 ? "s" : ""} — they may represent data entry errors, genuine extreme values, or interesting edge cases worth analyzing separately.`
    )
  }
  if (correlations.length > 0 && Math.abs(correlations[0].correlation) > 0.8) {
    recs.push(
      `**${correlations[0].col1}** and **${correlations[0].col2}** are highly correlated (|r| > 0.8). Consider whether both should be retained for modeling, as they likely encode similar information (multicollinearity).`
    )
  }
  const skewedCols = numericCols.filter((c) => Math.abs(c.skewness || 0) > 1)
  if (skewedCols.length > 0) {
    recs.push(
      `Apply a log or Box-Cox transformation to ${skewedCols.map((c) => `**${c.name}**`).join(", ")} to normalize ${skewedCols.length > 1 ? "their" : "its"} highly skewed distribution.`
    )
  }
  if (categoricalCols.some((c) => c.uniqueValues > 20)) {
    recs.push(
      `For categorical variables with many levels, consider grouping rare categories into an "Other" bucket or using target encoding.`
    )
  }
  if (recs.length === 0) {
    recs.push(`The dataset appears ready for further analysis or modeling without major preprocessing.`)
    recs.push(`Consider visualizing key relationships in the **Visualize** tab to uncover additional patterns.`)
  }
  recs.forEach((r) => (md += `- ${r}\n`))
  md += `\n`

  // Footer
  md += `---\n\n`
  md += `*Report generated by DATAWISE · All statistics computed locally in your browser. `
  md += `No data was transmitted externally.*\n`

  return md
}
