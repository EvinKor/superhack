import { NextFunction, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { logger } from '../utils/logger';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined
    }));

    logger.warn('Validation errors:', errorMessages);
    
    res.status(400).json({
      error: 'Validation failed',
      details: errorMessages
    });
    return;
  }
  
  next();
};

// User validation rules
export const validateUser = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .isIn(['Admin', 'IT_Manager', 'Technician'])
    .withMessage('Role must be Admin, IT_Manager, or Technician'),
  body('company')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Company must be between 1 and 100 characters'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

export const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .optional()
    .isIn(['Admin', 'IT_Manager', 'Technician'])
    .withMessage('Role must be Admin, IT_Manager, or Technician'),
  body('company')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Company must be between 1 and 100 characters'),
  handleValidationErrors
];

// Client validation rules
export const validateClient = [
  body('clientName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Client name must be between 1 and 100 characters'),
  body('industry')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Industry must be between 1 and 50 characters'),
  body('contactPerson')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Contact person must be between 1 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Phone must be between 1 and 20 characters'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
  handleValidationErrors
];

export const validateClientUpdate = [
  body('clientName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Client name must be between 1 and 100 characters'),
  body('industry')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Industry must be between 1 and 50 characters'),
  body('contactPerson')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Contact person must be between 1 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Phone must be between 1 and 20 characters'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
  handleValidationErrors
];

// Financial Insight validation rules
export const validateFinancialInsight = [
  body('clientId')
    .isMongoId()
    .withMessage('Client ID must be a valid MongoDB ObjectId'),
  body('month')
    .matches(/^\d{4}-\d{2}$/)
    .withMessage('Month must be in YYYY-MM format'),
  body('revenue')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Revenue must be a non-negative number'),
  body('expenses')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Expenses must be a non-negative number'),
  body('profitMargin')
    .isNumeric()
    .isFloat({ min: -100, max: 100 })
    .withMessage('Profit margin must be between -100 and 100'),
  body('spendBreakdown.softwareLicenses')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Software licenses cost must be non-negative'),
  body('spendBreakdown.hardwareMaintenance')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Hardware maintenance cost must be non-negative'),
  body('spendBreakdown.cloudServices')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Cloud services cost must be non-negative'),
  body('spendBreakdown.laborCosts')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Labor costs must be non-negative'),
  body('aiRecommendations')
    .optional()
    .isArray()
    .withMessage('AI recommendations must be an array'),
  handleValidationErrors
];

// Service Efficiency validation rules
export const validateServiceEfficiency = [
  body('technicianId')
    .isMongoId()
    .withMessage('Technician ID must be a valid MongoDB ObjectId'),
  body('clientId')
    .isMongoId()
    .withMessage('Client ID must be a valid MongoDB ObjectId'),
  body('tasksCompleted')
    .isInt({ min: 0 })
    .withMessage('Tasks completed must be a non-negative integer'),
  body('avgResponseTime')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Average response time must be non-negative'),
  body('avgResolutionTime')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Average resolution time must be non-negative'),
  body('week')
    .matches(/^\d{4}-W\d{2}$/)
    .withMessage('Week must be in YYYY-WXX format'),
  body('aiSuggestions')
    .optional()
    .isArray()
    .withMessage('AI suggestions must be an array'),
  handleValidationErrors
];

// AI Report validation rules
export const validateAiReport = [
  body('reportType')
    .isIn(['Financial Forecast', 'Service Optimization'])
    .withMessage('Report type must be Financial Forecast or Service Optimization'),
  body('generatedForId')
    .isMongoId()
    .withMessage('Generated for ID must be a valid MongoDB ObjectId'),
  body('generatedForType')
    .isIn(['client', 'user'])
    .withMessage('Generated for type must be client or user'),
  body('summary')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Summary must be between 1 and 2000 characters'),
  body('recommendations')
    .isArray({ min: 1 })
    .withMessage('At least one recommendation is required'),
  body('recommendations.*')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Each recommendation must be between 1 and 500 characters'),
  body('confidenceScore')
    .isNumeric()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Confidence score must be between 0 and 1'),
  handleValidationErrors
];

// Activity Log validation rules
export const validateActivityLog = [
  body('userId')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),
  body('action')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Action must be between 1 and 100 characters'),
  body('details')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Details must be between 1 and 1000 characters'),
  body('ipAddress')
    .matches(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/)
    .withMessage('Please provide a valid IPv4 address'),
  handleValidationErrors
];

// Common parameter validation
export const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('ID must be a valid MongoDB ObjectId'),
  handleValidationErrors
];

// Query validation for pagination and filtering
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isString()
    .withMessage('Sort by must be a string'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  handleValidationErrors
];


