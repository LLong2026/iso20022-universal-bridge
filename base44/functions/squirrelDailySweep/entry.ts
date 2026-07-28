import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const nowISO = now.toISOString();
    const twentyFourHrsAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneHrAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // 1. Scan SystemHeartbeat records from last 24 hours
    const heartbeats = await base44.asServiceRole.entities.SystemHeartbeat.filter({
      timestamp: { $gte: twentyFourHrsAgo.toISOString() }
    });

    // 2. Count anomalies by type
    const anomalies = await base44.asServiceRole.entities.AegisAnomaly.list();
    const anomalyCounts = {};
    let detectedStale = [];
    for (const a of anomalies) {
      anomalyCounts[a.anomaly_type] = (anomalyCounts[a.anomaly_type] || 0) + 1;
      // 3b. Escalate detected anomalies older than 1 hour
      if (a.status === 'detected' && a.detected_at) {
        const detected = new Date(a.detected_at);
        if (detected < oneHrAgo) {
          detectedStale.push(a);
        }
      }
    }

    // 4. Create RemediationSweep record
    const sweep = await base44.asServiceRole.entities.RemediationSweep.create({
      sweep_type: 'daily_health_audit',
      triggered_by: 'squirrel_os_daily_cron',
      started_at: nowISO,
      completed_at: nowISO,
      summary: `Daily sweep: ${heartbeats.length} heartbeats, ${anomalies.length} anomalies (${Object.keys(anomalyCounts).length} types), ${detectedStale.length} stale-detect escalated.`,
      anomalies_found: anomalies.length,
      anomalies_resolved: 0,
      healing_events_created: 0,
      nodes_refreshed: 0,
      orphans_purged: 0,
      agents_rebalanced: 0
    });

    // 5. Update Pattern records with anomaly type frequencies
    for (const [atype, count] of Object.entries(anomalyCounts)) {
      const existing = await base44.asServiceRole.entities.Pattern.filter({ type: atype });
      if (existing.length > 0) {
        const pat = existing[0];
        await base44.asServiceRole.entities.Pattern.update(pat.id, {
          occurrence_count: (pat.occurrence_count || 0) + count,
          last_seen: nowISO
        });
      } else {
        await base44.asServiceRole.entities.Pattern.create({
          name: `Pattern: ${atype}`,
          type: atype,
          anomaly_types: [atype],
          occurrence_count: count,
          first_seen: nowISO,
          last_seen: nowISO,
          detected_at: nowISO,
          confidence_score: 0.7,
          source_domain: 'squirrel_os',
          status: 'active',
          auto_heal_enabled: atype !== 'unknown',
          description: `Auto-detected pattern for ${atype} anomalies`
        });
      }
    }

    // 6. Create LearningMetric records comparing today vs yesterday
    const metricsToRecord = [
      { name: 'daily_heartbeat_count', value: heartbeats.length },
      { name: 'daily_anomaly_count', value: anomalies.length },
      { name: 'daily_anomaly_types', value: Object.keys(anomalyCounts).length },
      { name: 'daily_stale_escalations', value: detectedStale.length }
    ];

    for (const m of metricsToRecord) {
      // Find yesterday's metric for comparison
      const yestMetrics = await base44.asServiceRole.entities.LearningMetric.filter({
        metric_name: m.name
      });
      const yestVal = yestMetrics.length > 0 ? yestMetrics[0].value : 0;
      const diff = yestVal > 0 ? ((m.value - yestVal) / yestVal) : 0;
      const trend = m.value > yestVal ? 'up' : m.value < yestVal ? 'down' : 'stable';

      await base44.asServiceRole.entities.LearningMetric.create({
        metric_name: m.name,
        value: m.value,
        period: 'daily',
        recorded_at: nowISO,
        trend: trend,
        comparison_to_previous: diff
      });
    }

    // 7. Escalate stale "detected" anomalies to PredictiveAlert
    let alertsCreated = 0;
    for (const a of detectedStale) {
      await base44.asServiceRole.entities.PredictiveAlert.create({
        alert_type: 'unresolved_anomaly',
        severity: a.severity || 'Medium',
        status: 'Pending',
        predicted_issue: `Anomaly ${a.title} detected >1hr without resolution`,
        probability: 0.8,
        recommended_action: 'Review and manually resolve or assign healing playbook',
        affected_components: [a.component || a.anomaly_type],
        created_at: nowISO
      });
      alertsCreated++;
    }

    return Response.json({
      status: 'success',
      sweep_id: sweep.id,
      heartbeats_scanned: heartbeats.length,
      anomaly_types: Object.keys(anomalyCounts).length,
      patterns_updated: Object.keys(anomalyCounts).length,
      metrics_recorded: metricsToRecord.length,
      predictive_alerts_created: alertsCreated
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});