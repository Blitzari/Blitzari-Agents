;(async () => {
  const startedAt = Date.now()

  try {
    // 1) Analyze activity
    const activityAnalyzer = new TokenActivityAnalyzer("https://solana.rpc")
    const records = await activityAnalyzer.analyzeActivity("MintPubkeyHere", 20)

    // 2) Analyze depth
    const depthAnalyzer = new TokenDepthAnalyzer("https://dex.api", "MarketPubkeyHere")
    const depthMetrics = await depthAnalyzer.analyze(30)

    // 3) Detect patterns
    const volumes = records.map((r) => Number(r.amount) || 0)
    const patterns = volumes.length ? detectVolumePatterns(volumes, 5, 100) : []

    // 4) Execute a custom task
    const engine = new ExecutionEngine()
    engine.register("report", async (params: { records: unknown[] }) => ({
      recordCount: params.records.length,
    }))
    engine.enqueue("task_report", "report", { records })
    const taskResults = await engine.runAll()

    // 5) Sign the results (use async factory)
    const signer = await SigningEngine.create()
    const payload = JSON.stringify({ depthMetrics, patterns, taskResults })
    const signature = await signer.sign(payload)
    const ok = await signer.verify(payload, signature)

    const durationMs = Date.now() - startedAt
    console.log({ records, depthMetrics, patterns, taskResults, signatureValid: ok, durationMs })
  } catch (err) {
    console.error("Pipeline failed:", (err as Error).message)
  }
})()
