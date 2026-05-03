import { streamText } from "ai"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { dataSummary, columns, rowCount, sampleData, fileName } = await req.json()

    const systemPrompt = `You are an elite data scientist and business analyst writing for a Fortune 500 executive audience.
Your reports are published in publications like Harvard Business Review and McKinsey Quarterly.
You write with the precision of a statistician, the clarity of a journalist, and the strategic insight of a McKinsey partner.

Your reports must:
- Use rich Markdown formatting with proper hierarchy (# ## ###)
- Include specific numbers, percentages, and statistical insights
- Make bold, evidence-based claims (not vague observations)
- Use bullet points, tables, and blockquotes for visual interest
- Identify non-obvious patterns and correlations
- Provide concrete, actionable recommendations
- Be 1500-2500 words of dense, valuable content
- Read like a premium consultant deliverable, not a generated report`

    const userPrompt = `Generate a comprehensive analytical report for the following dataset:

**Dataset:** ${fileName || "Untitled Dataset"}
**Rows:** ${rowCount.toLocaleString()}
**Columns:** ${columns.length}

**Column Schema:**
${columns.map((c: any) => `- \`${c.name}\` (${c.type})${c.stats ? ` — ${c.stats}` : ""}`).join("\n")}

**Statistical Summary:**
\`\`\`json
${JSON.stringify(dataSummary, null, 2)}
\`\`\`

**Sample Records (first 5 rows):**
\`\`\`json
${JSON.stringify(sampleData.slice(0, 5), null, 2)}
\`\`\`

Write a premium data analysis report with these sections:

# Executive Summary
A 2-3 paragraph powerful opening that captures the most striking findings. Lead with the single most important insight.

## Dataset Overview
Brief technical description with quality assessment.

## Key Findings
5-7 numbered findings with specific statistics, formatted as:
**Finding N: [Bold headline claim]**
[Detailed explanation with numbers, percentages, and implications]

## Statistical Deep Dive
Analysis of distributions, correlations, outliers, and anomalies. Use a table to compare key metrics.

## Patterns & Trends
Non-obvious patterns discovered in the data. What story does the data tell?

## Strategic Recommendations
4-6 numbered, actionable recommendations with expected impact.

## Risk Factors & Limitations
Honest assessment of data quality issues, biases, and limitations.

## Conclusion
Compelling close that ties findings to business value.

Write with confidence, specificity, and analytical rigor. No filler, no generic statements.`

    const result = streamText({
      model: "openai/gpt-5-mini",
      system: systemPrompt,
      prompt: userPrompt,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("[v0] Report generation error:", error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate report" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
