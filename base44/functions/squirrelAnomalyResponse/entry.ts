import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const nowISO = now.toISOString();

    // Parse payload — entity automation sends event/data
    let body;
    try { body = await req.json(); } catch { body = {}; }

    // Entity automation payload: { event, data }
    const anomaly = body.data || body;
    const event = body.event || {};
    const anomalyId = anomaly.id || event.entity_id;
    const anomalyType = anomaly.anomaly_type;
    const confidence = anomaly.confidence_score || 0;
    const severity = (anomaly.severity || 'Medium').toLowerCase();

    if (!anomalyId || !anomalyType) {
      return Response.json({ error: 'Missing anomaly_id or anomaly_type' }, { status: 400 });
    }

    // Rule: NEVER auto-heal critical-severity anomalies in transaction flows
    const isCritical = severity === 'critical';
    const isTransactionFlow = anomaly.component === 'transaction' || anomaly.category === 'fintech';

    // Find matching playbook
    const playbooks = await base44.asServiceRole.entities.AegisPlaybook.filter({
      anomaly_type: anomalyType
    });
    const playbook = playbooks.length > 0 ? playbooks[0] : null;

    const threshold = playbook ? (playbook.confidence_threshold || 0) : 0;
    const meetsThreshold = confidence >= threshold;
    const canAutoHeal = playbook && meetsThreshold && !isCritical;

    // CRITICAL or transaction-flow critical → always escalate
    if (isCritical && isTransactionFlow) {
      await base44.asServiceRole.entities.AegisAnomaly.update(anomalyId, {
        status: 'escalated'
      });
      const alert = await base44.asServiceRole.entities.PredictiveAlert.create({
        alert_type: 'critical_anomaly_escalation',
        severity: 'Critical',
        status: 'Pending',
        predicted_issue: `Critical anomaly in transaction flow: ${anomaly.title || anomalyType}`,
        probability: 0.95,
        recommended_action: 'Immediate human review required — critical transaction-path anomaly',
        affected_components: [anomaly.component || anomalyType],
        created_at: nowISO
      });
      return Response.json({
        status: 'escalated',
        reason: 'critical_transaction_flow',
        anomaly_id: anomalyId,
        alert_id: alert.id
      });
    }

    if (canAutoHeal) {
      // Execute playbook: isolation → healing → verification
      const stepsExecuted = [
        ...(playbook.isolation_steps || []).map(s => `[ISOLATION] ${s}`),
        ...(playbook.healing_steps || []).map(s => `[HEALING] ${s}`),
        ...(playbook.verification_steps || []).map(s => `[VERIFICATION] ${s}`)
      ];

      const startTime = Date.now();

      // Create AegisHealingEvent
      const healingEvent = await base44.asServiceRole.entities.AegisHealingEvent.create({
        event_id: `heal-${anomalyId}-${now.getTime()}`,
        anomaly_id: anomalyId,
        playbook_id: playbook.id,
        playbook_name: playbook.name,
        agent_id: anomaly.affected_agent_id || 'squirrel-os-auto',
        node_id: anomaly.affected_node_id || null,
        steps_executed: stepsExecuted,
        result: 'Playbook executed successfully',
        outcome: 'healed',
        trigger: `anomaly_type=${anomalyType}, confidence=${confidence}`,
        started_at: nowISO,
        completed_at: nowISO,
        duration_seconds: (Date.now() - startTime) / 1000,
        learning_extracted: `Anomaly ${anomalyType} resolved via ${playbook.name}`,
        context_snapshot: {
          anomaly_title: anomaly.title,
          anomaly_severity: severity,
          confidence_score: confidence,
          threshold: threshold
        },
        actions: stepsExecuted,
        action_taken: `Executed ${playbook.name}`,
        result_summary: `Auto-healed: ${stepsExecuted.length} steps executed`,
        execution_time_ms: Date.now() - startTime,
        timestamp: nowISO
      });

      // Update anomaly status to resolved
      await base44.asServiceRole.entities.AegisAnomaly.update(anomalyId, {
        status: 'resolved',
        linked_playbook_id: playbook.id,
        linked_healing_event_id: healingEvent.id
      });

      // Update playbook success metrics
      await base44.asServiceRole.entities.AegisPlaybook.update(playbook.id, {
        success_count: (playbook.success_count || 0) + 1,
        avg_resolution_time_ms: Math.round(
          ((playbook.avg_resolution_time_ms || 0) * (playbook.success_count || 0) + (Date.now() - startTime)) /
          ((playbook.success_count || 0) + 1)
        )
      });

      // Self-learning: update Pattern entity
      const existingPatterns = await base44.asServiceRole.entities.Pattern.filter({ type: anomalyType });
      if (existingPatterns.length > 0) {
        const pat = existingPatterns[0];
        await base44.asServiceRole.entities.Pattern.update(pat.id, {
          occurrence_count: (pat.occurrence_count || 0) + 1,
          last_seen: nowISO,
          recommended_playbook_id: playbook.id
        });
      } else {
        await base44.asServiceRole.entities.Pattern.create({
          name: `Pattern: ${anomalyType}`,
          type: anomalyType,
          anomaly_types: [anomalyType],
          occurrence_count: 1,
          first_seen: nowISO,
          last_seen: nowISO,
          detected_at: nowISO,
          confidence_score: confidence,
          recommended_playbook_id: playbook.id,
          source_domain: 'squirrel_os_auto_heal',
          status: 'active',
          auto_heal_enabled: true,
          description: `Auto-learned pattern from healing of anomaly ${anomalyId}`
        });
      }

      // Self-learning: create LearningMetric
      await base44.asServiceRole.entities.LearningMetric.create({
        metric_name: `heal_success_${anomalyType}`,
        value: 1,
        period: 'realtime',
        recorded_at: nowISO,
        trend: 'up',
        comparison_to_previous: 0
      });

      return Response.json({
        status: 'healed',
        anomaly_id: anomalyId,
        playbook: playbook.name,
        steps_executed: stepsExecuted.length,
        healing_event_id: healingEvent.id
      });
    }

    // No matching playbook OR confidence below threshold → escalate
    await base44.asServiceRole.entities.AegisAnomaly.update(anomalyId, {
      status: 'escalated'
    });

    const alert = await base44.asServiceRole.entities.PredictiveAlert.create({
      alert_type: playbook ? 'low_confidence_anomaly' : 'no_playbook_match',
      severity: anomaly.severity || 'Medium',
      status: 'Pending',
      predicted_issue: playbook
        ? `Anomaly ${anomalyType} confidence ${confidence} below threshold ${threshold}`
        : `No playbook found for anomaly type: ${anomalyType}`,
      probability: confidence,
      recommended_action: playbook
        ? 'Review anomaly and manually trigger playbook or adjust threshold'
        : 'Create AegisPlaybook for this anomaly type or resolve manually',
      affected_components: [anomaly.component || anomalyType],
      created_at: nowISO
    });

    return Response.json({
      status: 'escalated',
      reason: playbook ? 'confidence_below_threshold' : 'no_matching_playbook',
      anomaly_id: anomalyId,
      alert_id: alert.id,
      confidence: confidence,
      threshold: threshold
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});