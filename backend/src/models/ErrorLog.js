const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema({
  applicantId: { type: String, index: true },
  errorType: { type: String, required: true },
  errorMessage: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  payload: { type: Object }
});

const ErrorLog = mongoose.model('ErrorLog', errorLogSchema);

module.exports = ErrorLog; 