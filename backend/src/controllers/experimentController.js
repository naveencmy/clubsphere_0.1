import { EXPERIMENT_REGISTRY, evaluateExperiment } from '../utils/experiments.js';
import { sendSuccess } from '../utils/response.js';
import { NotFoundError } from '../utils/errors.js';

export class ExperimentController {
  static listExperiments(req, res, next) {
    try {
      const experiments = Object.values(EXPERIMENT_REGISTRY);
      return sendSuccess(res, experiments, 'Active A/B experiments retrieved');
    } catch (err) {
      next(err);
    }
  }

  static getExperiment(req, res, next) {
    try {
      const { key } = req.params;
      const experiment = EXPERIMENT_REGISTRY[key];
      if (!experiment) throw new NotFoundError(`Experiment '${key}' not found.`);
      return sendSuccess(res, experiment, 'Experiment definition retrieved');
    } catch (err) {
      next(err);
    }
  }

  static evaluate(req, res, next) {
    try {
      const { key } = req.params;
      const participantId = req.user ? req.user.id : (req.query.participantId || req.ip);
      const assignment = evaluateExperiment(key, participantId);
      return sendSuccess(res, assignment, 'Variant evaluated for participant');
    } catch (err) {
      next(err);
    }
  }

  static trackConversion(req, res, next) {
    try {
      const { key } = req.params;
      const { metricName, value = 1 } = req.body;
      const participantId = req.user ? req.user.id : (req.body.participantId || req.ip);

      const assignment = evaluateExperiment(key, participantId);

      // In production, record to analytical warehouse or PostHog/Mixpanel
      const record = {
        experimentKey: key,
        participantId,
        variant: assignment.variant,
        metricName,
        value,
        timestamp: new Date().toISOString(),
      };

      return sendSuccess(res, record, 'Conversion event recorded for A/B experiment', 201);
    } catch (err) {
      next(err);
    }
  }
}
