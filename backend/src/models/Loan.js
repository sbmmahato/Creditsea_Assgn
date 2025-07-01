const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  applicantId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true, default: 'USD' },
  loanDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'error', 'processed'], default: 'pending' },
  enrichedData: { type: Object }
}, { timestamps: true });

const Loan = mongoose.model('Loan', loanSchema);

module.exports = Loan; 